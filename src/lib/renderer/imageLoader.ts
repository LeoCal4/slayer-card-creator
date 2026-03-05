import type { ProjectFile } from '@/types/project'

export async function preloadArtImages(
  project: ProjectFile,
): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>()
  if (!project.artFolderPath) return map

  const availableFiles = await window.electronAPI?.listArtFiles(project.artFolderPath) ?? []
  const fileByBaseName = new Map<string, string>()
  for (const file of availableFiles) {
    const base = file.includes('.') ? file.slice(0, file.lastIndexOf('.')) : file
    fileByBaseName.set(base.toLowerCase(), file)
  }

  for (const card of project.cards) {
    const filename = fileByBaseName.get(card.name.toLowerCase())
    if (!filename) continue
    const base64 = await window.electronAPI?.readArtFile(project.artFolderPath, filename)
    if (base64) {
      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.src = base64
      })
      map.set(card.name, img)
    }
  }
  return map
}

export async function preloadFrameImages(
  project: ProjectFile,
): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>()
  for (const [templateId, base64] of Object.entries(project.frameImages)) {
    const img = new Image()
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.src = base64
    })
    map.set(templateId, img)
  }
  return map
}
