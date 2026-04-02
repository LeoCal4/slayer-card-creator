import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { PreviewGrid } from '@/components/preview/PreviewGrid'
import { preloadArtImages, preloadCustomImages } from '@/lib/renderer/imageLoader'
import type { CardType } from '@/types/card'

type Filter = CardType | 'all'

export function PreviewView() {
  const project = useProjectStore((s) => s.project)
  const [artImages, setArtImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [customImages, setCustomImages] = useState<Map<string, HTMLImageElement>>(new Map())
  const [typeFilter, setTypeFilter] = useState<Filter>('all')

  useEffect(() => {
    if (!project) return
    preloadArtImages(project).then(setArtImages)
    preloadCustomImages(project).then(setCustomImages)
  }, [project?.artFolderPath, JSON.stringify(project?.customImages)])

  if (!project) return null

  const cardTypes = Array.from(new Set(project.cards.map((c) => c.type))) as CardType[]
  const filtered =
    typeFilter === 'all' ? project.cards : project.cards.filter((c) => c.type === typeFilter)

  return (
    <div className="p-6 flex flex-col gap-4 h-full overflow-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Preview</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-400">Filter:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as Filter)}
            className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 outline-none"
          >
            <option value="all">All types</option>
            {cardTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <PreviewGrid
        cards={filtered}
        templates={project.templates}
        project={project}
        artImages={artImages}
        customImages={customImages}
      />
    </div>
  )
}
