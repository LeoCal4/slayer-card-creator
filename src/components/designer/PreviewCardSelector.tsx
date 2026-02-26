import { useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { CardType } from '@/types/card'

interface Props {
  cardTypes: CardType[]
}

export function PreviewCardSelector({ cardTypes }: Props) {
  const cards = useProjectStore((s) => s.project?.cards)
  const previewCardId = useUiStore((s) => s.previewCardId)
  const setPreviewCard = useUiStore((s) => s.setPreviewCard)

  const matching = (cards ?? []).filter((c) => cardTypes.includes(c.type))

  // Default to first matching card when none is selected or selected card no longer matches
  useEffect(() => {
    if (matching.length > 0 && !matching.find((c) => c.id === previewCardId)) {
      setPreviewCard(matching[0].id)
    }
    if (matching.length === 0 && previewCardId !== null) {
      setPreviewCard(null)
    }
  }, [matching.map((c) => c.id).join(','), cardTypes.join(',')])

  const value = matching.find((c) => c.id === previewCardId)?.id ?? ''

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="preview-card" className="text-xs text-neutral-500 whitespace-nowrap">
        Preview as
      </label>
      <select
        id="preview-card"
        aria-label="Preview as"
        value={value}
        onChange={(e) => setPreviewCard(e.target.value || null)}
        className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 outline-none border border-neutral-700"
      >
        {matching.length === 0 ? (
          <option value="">(none)</option>
        ) : (
          matching.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))
        )}
      </select>
    </div>
  )
}
