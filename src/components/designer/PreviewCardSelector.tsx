import { useState, useEffect } from 'react'
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
  const [search, setSearch] = useState('')

  const sorted = [...(cards ?? [])]
    .filter((c) => cardTypes.includes(c.type))
    .sort((a, b) => a.name.localeCompare(b.name))

  const filtered = search
    ? sorted.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : sorted

  // Default to first sorted card when none selected or selection no longer matches
  useEffect(() => {
    if (sorted.length > 0 && !sorted.find((c) => c.id === previewCardId)) {
      setPreviewCard(sorted[0].id)
    }
    if (sorted.length === 0 && previewCardId !== null) {
      setPreviewCard(null)
    }
  }, [sorted.map((c) => c.id).join(','), cardTypes.join(',')])

  const value = sorted.find((c) => c.id === previewCardId)?.id ?? ''

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="preview-card" className="text-xs text-neutral-500 whitespace-nowrap">
        Preview as
      </label>
      <input
        type="text"
        aria-label="Search cards"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search…"
        className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 outline-none border border-neutral-700 w-20"
      />
      <select
        id="preview-card"
        aria-label="Preview as"
        value={value}
        onChange={(e) => { setPreviewCard(e.target.value || null); setSearch('') }}
        className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 outline-none border border-neutral-700"
      >
        {filtered.length === 0 ? (
          <option value="">(none)</option>
        ) : (
          filtered.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))
        )}
      </select>
    </div>
  )
}
