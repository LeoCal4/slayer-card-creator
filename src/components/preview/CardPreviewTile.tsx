import { useEffect, useRef, useState } from 'react'
import { renderCard } from '@/lib/renderer/cardRenderer'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'
import type { ProjectFile } from '@/types/project'

interface Props {
  card: CardData
  template: Template | undefined
  project: ProjectFile
  artImages: Map<string, HTMLImageElement>
  frameImages: Map<string, HTMLImageElement>
}

export function CardPreviewTile({ card, template, project, artImages, frameImages }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!template) return
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !dataUrl && !loading) {
          setLoading(true)
          renderCard({ card, template, project, artImages, frameImages })
            .then((blob) => {
              setDataUrl(URL.createObjectURL(blob))
              setLoading(false)
            })
            .catch(() => setLoading(false))
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [card, template, project, artImages, frameImages])

  return (
    <div>
      <div
        ref={ref}
        style={{ aspectRatio: '375/523' }}
        className="relative w-full bg-neutral-800 rounded overflow-hidden"
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          </div>
        )}
        {dataUrl && (
          <img src={dataUrl} alt={card.name} className="w-full h-full object-cover" />
        )}
        {!template && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-neutral-500">
            No template
          </div>
        )}
      </div>
      <p className="text-xs text-neutral-300 mt-1 truncate">{card.name}</p>
      <p className="text-xs text-neutral-500">{card.type}</p>
    </div>
  )
}
