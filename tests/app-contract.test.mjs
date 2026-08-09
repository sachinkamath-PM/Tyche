import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../app/TycheApp.tsx", import.meta.url), "utf8");

test("keeps resume metadata local to the browser", () => {
  assert.match(source, /tyche_demo_resumes_v1/);
  assert.match(source, /window\.localStorage\.setItem/);
  assert.doesNotMatch(source, /fetch\("\/api\/resumes"/);
  assert.match(source, /original files stay on this device/i);
});

test("validates supported resume signatures before accepting metadata", () => {
  assert.match(source, /MAX_RESUME_SIZE/);
  assert.match(source, /0x25, 0x50, 0x44, 0x46, 0x2d/);
  assert.match(source, /0xd0, 0xcf, 0x11, 0xe0/);
  assert.match(source, /\[Content_Types\]\.xml/);
  assert.match(source, /word\//);
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
  assert.match(source, /Intl\.DateTimeFormat/);
  assert.doesNotMatch(source, /Sunday, 2 August|Jul 30, 2026|Jul 24, 2026/);
});

test("uses local font stacks so production builds do not require Google Fonts", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(layout, /next\/font\/google/);
});
