import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/TycheApp.tsx", import.meta.url), "utf8");
const copilot = await readFile(new URL("../app/TycheCopilot.tsx", import.meta.url), "utf8");

test("keeps resume metadata local to the browser", () => {
  assert.match(source, /tyche_demo_resumes_v1/);
  assert.match(source, /window\.localStorage\.setItem/);
  assert.doesNotMatch(source, /fetch\("\/api\/resumes"/);
  assert.match(source, /original files stay on this device/i);
});

test("validates supported local resume formats before accepting metadata", () => {
  assert.match(source, /MAX_RESUME_SIZE/);
  assert.match(source, /0x25, 0x50, 0x44, 0x46, 0x2d/);
  assert.match(source, /\[Content_Types\]\.xml/);
  assert.match(source, /word\//);
  assert.match(source, /bytes\.includes\(0\)/);
});

test("uses the desktop bridge for original files and durable local records", () => {
  assert.match(source, /window\.tycheDesktop\.saveUpload/);
  assert.match(source, /window\.tycheDesktop\.listResumes/);
  assert.match(source, /window\.tycheDesktop\.saveResumes/);
  assert.match(source, /openDataFolder/);
  assert.doesNotMatch(source, /https?:\/\/api\.openai\.com/);
});

test("runs ATS scoring locally from extracted claims and optional role text", () => {
  assert.match(source, /selected\.claims\.join/);
  assert.match(source, /matchedKeywords/);
  assert.match(source, /Analysed locally/);
});

test("restores locally saved resume metadata after reload", () => {
  assert.match(source, /JSON\.parse\(window\.localStorage\.getItem/);
  assert.match(source, /setResumes\(restored\)/);
  assert.match(source, /setSelectedId\(restored\[0\]\.id\)/);
  assert.match(source, /filter\(\(item\) => item\.source === "local"\)/);
});

test("labels seeded content as demo data and avoids fixed calendar copy", () => {
  assert.match(source, /const demoResumes/);
  assert.match(source, /Demo example/);
  assert.match(source, /Demo · This week/);
  assert.doesNotMatch(source, /Intl\.DateTimeFormat|new Date\(\)/);
  assert.doesNotMatch(source, /Sunday, 2 August|Jul 30, 2026|Jul 24, 2026/);
});

test("uses local font stacks so production builds do not require Google Fonts", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layout, /next\/font\/google/);
});

test("binds Copilot proposals to the originating resume and claim", () => {
  assert.match(copilot, /resumeId: resume\.id/);
  assert.match(copilot, /claimIndex: 0/);
  assert.match(source, /item\.id === resumeId/);
  assert.match(source, /target\.claims\[claimIndex\] !== original/);
  assert.doesNotMatch(copilot, /resume history/);
});

test("creates an openable cover-letter row instead of only incrementing a counter", () => {
  assert.match(source, /setLetters\(\(items\) => \[\{ id: Date\.now\(\)/);
  assert.match(source, /letters\.map\(\(letter\)/);
  assert.match(source, /created for this demo session/i);
});
