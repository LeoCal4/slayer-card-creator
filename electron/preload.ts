import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, OpenDialogOptions, SaveDialogOptions, RecentProject } from '../src/types/electronApi'

const api: ElectronAPI = {
  showOpenDialog: (options: OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:showOpenDialog', options),

  showSaveDialog: (options: SaveDialogOptions) =>
    ipcRenderer.invoke('dialog:showSaveDialog', options),

  readFile: (filePath: string) =>
    ipcRenderer.invoke('fs:readFile', filePath),

  writeFile: (filePath: string, data: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, data),

  readArtFile: (artFolderPath: string, filename: string) =>
    ipcRenderer.invoke('art:readArtFile', artFolderPath, filename),

  listArtFiles: (artFolderPath: string) =>
    ipcRenderer.invoke('art:listArtFiles', artFolderPath),

  getRecentProjects: () =>
    ipcRenderer.invoke('recent:getRecentProjects'),

  addRecentProject: (entry: RecentProject) =>
    ipcRenderer.invoke('recent:addRecentProject', entry),
}

contextBridge.exposeInMainWorld('electronAPI', api)
