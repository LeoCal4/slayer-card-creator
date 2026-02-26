import { useState } from 'react'
import { renderCard } from '@/lib/renderer/cardRenderer'
import { CardPreviewTile } from './CardPreviewTile'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'
import type { ProjectFile } from '@/types/project'

interface Props {
  cards: CardData[]
  templates: Template[]
  project: ProjectFile
  artImages: Map<string, HTMLImageElement>
  frameImages: Map<string, HTMLImageElement>
}

export function PreviewGrid({ cards, templates, project, artImages, frameImages }: Props) {
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)

  function findTemplate(card: CardData): Template | undefined {
    return templates.find((t) => t.cardTypes.includes(card.type))
  }

  async function handleRenderAll() {
    setProgress({ current: 0, total: cards.length })
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      const tmpl = findTemplate(card)
      if (!tmpl) { setProgress({ current: i + 1, total: cards.length }); continue }
      await renderCard({ card, template: tmpl, project, artImages, frameImages })
      setProgress({ current: i + 1, total: cards.length })
    }
    setProgress(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Render All"
          onClick={handleRenderAll}
          disabled={!!progress}
          className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded"
        >
          {progress
            ? `Rendering… ${progress.current}/${progress.total}`
            : 'Render All'}
        </button>
      </div>

      {cards.length === 0 ? (
        <p className="text-sm text-neutral-500">No cards to preview.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cards.map((card) => (
            <CardPreviewTile
              key={card.id}
              card={card}
              template={findTemplate(card)}
              project={project}
              artImages={artImages}
              frameImages={frameImages}
            />
          ))}
        </div>
      )}
    </div>
  )
}
