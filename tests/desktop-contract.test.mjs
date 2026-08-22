import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const main = await readFile(new URL("../desktop/main.cjs", import.meta.url), "utf8");
const storage = await readFile(new URL("../desktop/storage.cjs", import.meta.url), "utf8");
const preload = await readFile(new URL("../desktop/preload.cjs", import.meta.url), "utf8");

test("desktop runtime is isolated from arbitrary network access", () => {
  assert.match(main, /127\.0\.0\.1/);
  assert.match(main, /onBeforeRequest/);
  assert.match(main, /cancel: !allowed/);
  assert.match(main, /setWindowOpenHandler/);
  assert.match(main, /nodeIntegration: false/);
  assert.match(main, /contextIsolation: true/);
});

test("desktop persistence uses Windows local app data and SQLite", () => {
  assert.match(main, /process\.env\.LOCALAPPDATA/);
  assert.match(main, /"BuildQuick", "Tyche"/);
  assert.match(storage, /DatabaseSync/);
  assert.match(storage, /tyche\.db/);
  assert.match(storage, /journal_mode=WAL/);
  assert.match(storage, /sha256/);
});

test("original uploads are validated, hashed, and written atomically", () => {
  assert.match(storage, /validateBytes/);
  assert.match(storage, /\.partial/);
  assert.match(storage, /renameSync/);
  assert.match(storage, /createHash\("sha256"\)/);
  assert.match(storage, /extractRawText/);
  assert.match(storage, /pdfjs-dist/);
});

test("renderer receives only a narrow IPC bridge", () => {
  assert.match(preload, /contextBridge\.exposeInMainWorld/);
  assert.match(preload, /ipcRenderer\.invoke/);
  assert.doesNotMatch(preload, /require\("node:fs/);
});
