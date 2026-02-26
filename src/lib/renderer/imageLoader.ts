import type { ProjectFile } from '@/types/project'

export async function preloadArtImages(
  project: ProjectFile,
): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>()
  if (!project.artFolderPath) return map

  for (const card of project.cards) {
    const base64 = await window.electronAPI?.readArtFile(project.artFolderPath, card.name)
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
