import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredResume = {
  id: string;
  title: string;
  filename: string;
  storageKey: string;
  contentType: string;
  fileSize: number;
  focus: string;
  atsScore: number | null;
  createdAt: string;
  updatedAt: string;
};

const dataRoot = path.join(process.cwd(), ".data");
const uploadsRoot = path.join(dataRoot, "uploads");
const indexPath = path.join(dataRoot, "resumes.json");

async function ensureStorage() {
  await mkdir(uploadsRoot, { recursive: true });
}

async function readIndex(): Promise<StoredResume[]> {
  await ensureStorage();
  try {
    return JSON.parse(await readFile(indexPath, "utf8")) as StoredResume[];
  } catch (error) {
    const code = error instanceof Error && "code" in error ? (error as NodeJS.ErrnoException).code : undefined;
    if (code === "ENOENT") return [];
    throw error;
  }
}

async function writeIndex(records: StoredResume[]) {
  const temporaryPath = `${indexPath}.${randomUUID()}.tmp`;
  await writeFile(temporaryPath, JSON.stringify(records, null, 2), "utf8");
  await rename(temporaryPath, indexPath);
}

export async function listResumes() {
  const records = await readIndex();
  return records.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function saveResume({ file, title }: { file: File; title: string }) {
  const id = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const storageKey = `${id}-${safeName}`;
  const now = new Date().toISOString();
  const record: StoredResume = {
    id,
    title: title.trim() || file.name,
    filename: file.name,
    storageKey,
    contentType: file.type,
    fileSize: file.size,
    focus: "Unsorted",
    atsScore: null,
    createdAt: now,
    updatedAt: now,
  };

  await ensureStorage();
  await writeFile(path.join(uploadsRoot, storageKey), Buffer.from(await file.arrayBuffer()));
  const records = await readIndex();
  await writeIndex([record, ...records]);
  return record;
}
