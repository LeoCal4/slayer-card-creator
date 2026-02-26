import JSZip from 'jszip'
import { preloadArtImages, preloadFrameImages } from './renderer/imageLoader'
import { renderCard } from './renderer/cardRenderer'
import { generateXML } from './xmlGenerator'
import type { ProjectFile } from '@/types/project'

export interface ZipProgress {
  phase: 'rendering' | 'packing'
  current: number
  total: number
}

export interface ZipResult {
  blob: Blob
  warnings: string[]
}

export async function buildZip(
  project: ProjectFile,
  onProgress: (progress: ZipProgress) => void,
): Promise<ZipResult> {
  const warnings: string[] = []

  // Step 1: pre-load images
  const artImages  = await preloadArtImages(project)
  const frameImages = await preloadFrameImages(project)

  // Step 2: generate XML
  const xml = generateXML(project)

  const zip = new JSZip()

  // Steps 3+4: render each card
  const total = project.cards.length
  let current = 0

  for (const card of project.cards) {
    const template = project.templates.find((t) => t.cardTypes.includes(card.type))
    if (!template) {
      warnings.push(`Skipped "${card.name}": no template for type "${card.type}"`)
      current++
      onProgress({ phase: 'rendering', current, total })
      continue
    }

    const blob = await renderCard({ card, template, project, artImages, frameImages })
    zip.file(`pics/CUSTOM/${card.name}.png`, blob)
    current++
    onProgress({ phase: 'rendering', current, total })
  }

  // Step 5: add XML
  zip.file(`${project.set.code}.xml`, xml)

  // Step 6: pack
  onProgress({ phase: 'packing', current: 0, total: 1 })
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  onProgress({ phase: 'packing', current: 1, total: 1 })

  return { blob: zipBlob, warnings }
}
