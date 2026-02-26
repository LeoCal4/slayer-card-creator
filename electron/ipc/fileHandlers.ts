import { ipcMain, dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { RecentProject } from '../../src/types/electronApi'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const MAX_RECENT = 5

let recentProjects: RecentProject[] = []

export function registerFileHandlers(): void {
  ipcMain.handle('dialog:showOpenDialog', async (_event, options) => {
    const result = await dialog.showOpenDialog(options)
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle('dialog:showSaveDialog', async (_event, options) => {
    const result = await dialog.showSaveDialog(options)
    return result.canceled ? null : (result.filePath ?? null)
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return fs.readFile(filePath, 'utf-8')
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: string) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    if (data.startsWith('data:')) {
      const base64 = data.split(',')[1] ?? ''
      await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
    } else {
      await fs.writeFile(filePath, data, 'utf-8')
    }
  })

  ipcMain.handle('art:readArtFile', async (_event, artFolderPath: string, filename: string) => {
    const fullPath = path.join(artFolderPath, filename)
    try {
      const buf = await fs.readFile(fullPath)
      const ext = path.extname(filename).toLowerCase().slice(1)
      return `data:image/${ext};base64,${buf.toString('base64')}`
    } catch {
      return null
    }
  })

  ipcMain.handle('art:listArtFiles', async (_event, artFolderPath: string) => {
    try {
      const entries = await fs.readdir(artFolderPath)
      return entries.filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    } catch {
      return []
    }
  })

  ipcMain.handle('recent:getRecentProjects', () => recentProjects)

  ipcMain.handle('recent:addRecentProject', (_event, entry: RecentProject) => {
    recentProjects = [
      entry,
      ...recentProjects.filter((r) => r.path !== entry.path),
    ].slice(0, MAX_RECENT)
  })
}
