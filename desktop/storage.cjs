const { createHash } = require("node:crypto");
const { mkdirSync, renameSync, rmSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt"]);

function cleanFilename(value) {
  const basename = path.basename(String(value || "resume"));
  const cleaned = basename.replace(/[^a-zA-Z0-9._ -]/g, "-").slice(0, 180);
  if (!cleaned || cleaned === "." || cleaned === "..") throw new Error("A valid filename is required.");
  return cleaned;
}

function validateBytes(filename, bytes) {
  if (!Buffer.isBuffer(bytes) || !bytes.length || bytes.length > MAX_UPLOAD_BYTES) {
    throw new Error("Choose a PDF, DOCX, or TXT file up to 10 MB.");
  }
  const extension = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) throw new Error("Choose a PDF, DOCX, or TXT file.");
  const startsWith = (signature) => signature.every((value, index) => bytes[index] === value);
  if (extension === ".pdf" && !startsWith([0x25, 0x50, 0x44, 0x46, 0x2d])) throw new Error("Invalid PDF signature.");
  if (extension === ".docx") {
    const zip = startsWith([0x50, 0x4b, 0x03, 0x04]) || startsWith([0x50, 0x4b, 0x05, 0x06]) || startsWith([0x50, 0x4b, 0x07, 0x08]);
    const archiveText = bytes.toString("latin1");
    if (!zip || !archiveText.includes("[Content_Types].xml") || !archiveText.includes("word/")) throw new Error("Invalid DOCX structure.");
  }
  if (extension === ".txt" && bytes.includes(0)) throw new Error("TXT files must contain plain text.");
}

async function extractText(filename, bytes) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".txt") return bytes.toString("utf8");
  if (extension === ".docx") {
    const mammoth = require("mammoth");
    const result = await mammoth.extractRawText({ buffer: bytes });
    return result.value;
  }
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await pdfjs.getDocument({ data: new Uint8Array(bytes), isEvalSupported: false, useWorkerFetch: false }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= Math.min(document.numPages, 20); pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    let text = "";
    for (const item of content.items) {
      if (!("str" in item)) continue;
      text += `${item.str}${item.hasEOL ? "\n" : " "}`;
    }
    pages.push(text);
  }
  return pages.join("\n");
}

function extractClaims(text) {
  const normalized = String(text || "").replace(/\r/g, "\n").replace(/[ \t]+/g, " ");
  const lines = normalized.split(/\n+|(?<=[.!?])\s+(?=[A-Z])/).map((line) => line.replace(/^[•●▪◦‣⁃*–—-]+\s*/, "").trim());
  return lines.filter((line) => line.length >= 24 && line.length <= 2_000 && line.split(/\s+/).length >= 5).slice(0, 120);
}

function validateResume(value) {
  if (!value || typeof value !== "object" || !Number.isSafeInteger(value.id) || value.id < 1) throw new Error("Invalid resume id.");
  if (typeof value.title !== "string" || !value.title.trim() || value.title.length > 160) throw new Error("Invalid resume title.");
  if (value.source !== "local") throw new Error("Only local resume records can be persisted by the desktop app.");
  const claims = Array.isArray(value.claims) ? value.claims : [];
  if (claims.some((claim) => typeof claim !== "string" || claim.length > 2_000) || claims.length > 200) throw new Error("Invalid resume claims.");
  return {
    id: value.id,
    title: value.title.trim(),
    type: String(value.type || "Local upload").slice(0, 120),
    updated: String(value.updated || "Saved locally").slice(0, 120),
    score: Math.max(0, Math.min(100, Number(value.score) || 0)),
    tag: String(value.tag || "Unsorted").slice(0, 80),
    tone: String(value.tone || "mint").slice(0, 32),
    source: "local",
    claims,
  };
}

function createStorage(dataDirectory) {
  const uploadsDirectory = path.join(dataDirectory, "uploads");
  mkdirSync(uploadsDirectory, { recursive: true });
  const database = new DatabaseSync(path.join(dataDirectory, "tyche.db"));
  database.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  database.exec(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY,
      payload TEXT NOT NULL,
      original_filename TEXT,
      original_path TEXT,
      sha256 TEXT,
      byte_size INTEGER,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_resumes_updated_at ON resumes(updated_at DESC);
  `);

  const listStatement = database.prepare("SELECT payload FROM resumes ORDER BY updated_at DESC");
  const upsertMetadata = database.prepare(`
    INSERT INTO resumes(id, payload, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at
  `);
  const insertUpload = database.prepare(`
    INSERT INTO resumes(id, payload, original_filename, original_path, sha256, byte_size, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  return {
    listResumes() {
      return listStatement.all().map((row) => JSON.parse(row.payload));
    },
    saveResumes(values) {
      if (!Array.isArray(values) || values.length > 1_000) throw new Error("Invalid resume collection.");
      database.exec("BEGIN IMMEDIATE");
      try {
        for (const value of values) {
          if (value?.source !== "local") continue;
          const resume = validateResume(value);
          upsertMetadata.run(resume.id, JSON.stringify(resume), new Date().toISOString());
        }
        database.exec("COMMIT");
      } catch (error) {
        database.exec("ROLLBACK");
        throw error;
      }
    },
    async saveUpload(input) {
      const resume = validateResume(input?.resume);
      const filename = cleanFilename(input?.filename);
      const bytes = Buffer.from(input?.bytes || []);
      validateBytes(filename, bytes);
      const claims = extractClaims(await extractText(filename, bytes));
      if (!claims.length) throw new Error("Tyche could not find readable resume text in this file.");
      resume.claims = claims;
      const extension = path.extname(filename).toLowerCase();
      const finalPath = path.join(uploadsDirectory, `${resume.id}${extension}`);
      const temporaryPath = `${finalPath}.partial`;
      writeFileSync(temporaryPath, bytes, { flag: "wx" });
      try {
        renameSync(temporaryPath, finalPath);
        insertUpload.run(
          resume.id,
          JSON.stringify(resume),
          filename,
          finalPath,
          createHash("sha256").update(bytes).digest("hex"),
          bytes.length,
          new Date().toISOString(),
        );
      } catch (error) {
        rmSync(temporaryPath, { force: true });
        rmSync(finalPath, { force: true });
        throw error;
      }
      return resume;
    },
    close() {
      database.close();
    },
  };
}

module.exports = { createStorage };
