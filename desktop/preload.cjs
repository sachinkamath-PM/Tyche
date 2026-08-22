const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("tycheDesktop", Object.freeze({
  getInfo: () => ipcRenderer.invoke("tyche:get-info"),
  listResumes: () => ipcRenderer.invoke("tyche:list-resumes"),
  saveUpload: (input) => ipcRenderer.invoke("tyche:save-upload", input),
  saveResumes: (resumes) => ipcRenderer.invoke("tyche:save-resumes", resumes),
  openDataFolder: () => ipcRenderer.invoke("tyche:open-data-folder"),
}));
