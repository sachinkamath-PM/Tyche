const { createServer } = require("node:http");
const { existsSync, readFileSync, statSync } = require("node:fs");
const path = require("node:path");
const { app, BrowserWindow, ipcMain, session, shell } = require("electron");
const { createStorage } = require("./storage.cjs");

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
};

let storage;
let localServer;
let localOrigin;

function desktopDataDirectory() {
  const base = process.env.LOCALAPPDATA || app.getPath("userData");
  return path.join(base, "BuildQuick", "Tyche");
}

function resolveStaticFile(root, pathname) {
  const decoded = decodeURIComponent(pathname).replaceAll("\\", "/");
  const relative = decoded.replace(/^\/+/, "");
  const candidates = relative
    ? [path.join(root, relative), path.join(root, relative, "index.html"), path.join(root, `${relative}.html`)]
    : [path.join(root, "index.html")];
  for (const candidate of candidates) {
    const resolved = path.resolve(candidate);
    if (resolved.startsWith(`${path.resolve(root)}${path.sep}`) && existsSync(resolved) && statSync(resolved).isFile()) return resolved;
  }
  return null;
}

async function startStaticServer() {
  const root = path.join(app.getAppPath(), "out");
  if (!existsSync(path.join(root, "index.html"))) throw new Error("Desktop UI is missing. Run pnpm desktop:build-ui first.");
  localServer = createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const file = resolveStaticFile(root, requestUrl.pathname);
    if (!file) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }
    response.writeHead(200, {
      "Cache-Control": "no-store",
      "Content-Type": MIME_TYPES[path.extname(file).toLowerCase()] || "application/octet-stream",
      "Cross-Origin-Opener-Policy": "same-origin",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(readFileSync(file));
  });
  await new Promise((resolve, reject) => {
    localServer.once("error", reject);
    localServer.listen(0, "127.0.0.1", resolve);
  });
  const address = localServer.address();
  localOrigin = `http://127.0.0.1:${address.port}`;
}

function registerIpc(dataDirectory) {
  ipcMain.handle("tyche:get-info", () => ({ dataDirectory, runtime: "desktop", networkPolicy: "local-only" }));
  ipcMain.handle("tyche:list-resumes", () => storage.listResumes());
  ipcMain.handle("tyche:save-upload", (_event, input) => storage.saveUpload(input));
  ipcMain.handle("tyche:save-resumes", (_event, resumes) => storage.saveResumes(resumes));
  ipcMain.handle("tyche:open-data-folder", () => shell.openPath(dataDirectory));
}

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: "#f7f4ee",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
      sandbox: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith(localOrigin)) event.preventDefault();
  });
  window.once("ready-to-show", () => window.show());
  await window.loadURL(localOrigin);
}

app.whenReady().then(async () => {
  const dataDirectory = desktopDataDirectory();
  storage = createStorage(dataDirectory);
  registerIpc(dataDirectory);
  await startStaticServer();
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const allowed = details.url.startsWith(localOrigin) || details.url.startsWith("devtools:");
    callback({ cancel: !allowed });
  });
  await createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
}).catch((error) => {
  console.error(error);
  app.quit();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  localServer?.close();
  storage?.close();
});
