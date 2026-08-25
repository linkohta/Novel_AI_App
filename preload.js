const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  generateImage: (params) => ipcRenderer.invoke('generate-image', params),
  openOutputFolder: () => ipcRenderer.invoke('open-output-folder'),
  loadChunks: () => ipcRenderer.invoke('load-chunks'),
  saveChunk: (chunk) => ipcRenderer.invoke('save-chunk', chunk),
  updateChunk: (chunk) => ipcRenderer.invoke('update-chunk', chunk),
  deleteChunk: (id) => ipcRenderer.invoke('delete-chunk', id),
  loadTemplates: () => ipcRenderer.invoke('load-templates'),
  saveTemplate: (template) => ipcRenderer.invoke('save-template', template),
  updateTemplate: (template) => ipcRenderer.invoke('update-template', template),
  deleteTemplate: (id) => ipcRenderer.invoke('delete-template', id),
  loadFavorites: (kind) => ipcRenderer.invoke('load-favorites', kind),
  saveFavorite: (kind, item) => ipcRenderer.invoke('save-favorite', { kind, item }),
  updateFavorite: (kind, item) => ipcRenderer.invoke('update-favorite', { kind, item }),
  deleteFavorite: (kind, id) => ipcRenderer.invoke('delete-favorite', { kind, id }),
});
