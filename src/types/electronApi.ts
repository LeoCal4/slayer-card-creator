export interface OpenDialogOptions {
  title?: string
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
  properties?: ('openFile' | 'openDirectory' | 'multiSelections' | 'showHiddenFiles')[]
}

export interface SaveDialogOptions {
  title?: string
  defaultPath?: string
  filters?: { name: string; extensions: string[] }[]
}

export interface RecentProject {
  path: string
  name: string
  timestamp: number
}

export interface ElectronAPI {
  showOpenDialog: (options: OpenDialogOptions) => Promise<string | null>
  showSaveDialog: (options: SaveDialogOptions) => Promise<string | null>
  readFile: (filePath: string) => Promise<string>
  writeFile: (filePath: string, data: string) => Promise<void>
  readArtFile: (artFolderPath: string, filename: string) => Promise<string | null>
  listArtFiles: (artFolderPath: string) => Promise<string[]>
  getRecentProjects: () => Promise<RecentProject[]>
  addRecentProject: (entry: RecentProject) => Promise<void>
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
