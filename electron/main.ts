import { app, BrowserWindow, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerHandlers } from './ipc/index'

// WSL2 has no real GPU — disable GPU acceleration to prevent renderer crashes
// caused by Konva's canvas using the GPU process.
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Use async dialog to avoid blocking the main-process event loop.
  // Not calling event.preventDefault() keeps the close cancelled by default;
  // if the user confirms, win.destroy() force-closes bypassing beforeunload.
  win.webContents.on('will-prevent-unload', () => {
    dialog.showMessageBox(win!, {
      type: 'question',
      buttons: ['Close anyway', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      title: 'Unsaved changes',
      message: 'You have unsaved changes. Close without saving?',
    }).then(({ response }) => {
      if (response === 0) {
        win?.destroy()
      }
    })
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
      win = null
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.whenReady().then(() => {
    registerHandlers()
    createWindow()
  })
}
