import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'

function TermList({
  label,
  terms,
  onAdd,
  onRemove,
  tagClassName,
}: {
  label: string
  terms: string[]
  onAdd: (term: string) => void
  onRemove: (term: string) => void
  tagClassName: string
}) {
  const [input, setInput] = useState('')

  function commit() {
    const trimmed = input.trim()
    if (trimmed && !terms.includes(trimmed)) {
      onAdd(trimmed)
    }
    setInput('')
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-neutral-400 uppercase tracking-wide">{label}</span>
      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {terms.map((term) => (
          <span
            key={term}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${tagClassName}`}
          >
            {term}
            <button
              type="button"
              aria-label={`Remove "${term}"`}
              onClick={() => onRemove(term)}
              className="opacity-60 hover:opacity-100 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {terms.length === 0 && (
          <span className="text-xs text-neutral-600 italic">No terms yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          placeholder="Add term…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
          }}
          className="bg-neutral-800 text-neutral-100 text-sm rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-indigo-500 flex-1 min-w-0"
        />
        <button
          type="button"
          onClick={commit}
          className="px-3 py-1.5 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors shrink-0"
        >
          Add
        </button>
      </div>
    </div>
  )
}

export function EffectFormattingEditor() {
  const project = useProjectStore((s) => s.project)
  const updateSetInfo = useProjectStore((s) => s.updateSetInfo)

  if (!project) return null

  const fmt = project.set.effectFormatting ?? { boldTerms: [], italicTerms: [] }

  function addBold(term: string) {
    updateSetInfo({ effectFormatting: { ...fmt, boldTerms: [...fmt.boldTerms, term] } })
  }
  function removeBold(term: string) {
    updateSetInfo({ effectFormatting: { ...fmt, boldTerms: fmt.boldTerms.filter((t) => t !== term) } })
  }
  function addItalic(term: string) {
    updateSetInfo({ effectFormatting: { ...fmt, italicTerms: [...fmt.italicTerms, term] } })
  }
  function removeItalic(term: string) {
    updateSetInfo({ effectFormatting: { ...fmt, italicTerms: fmt.italicTerms.filter((t) => t !== term) } })
  }

  return (
    <div className="space-y-5">
      <TermList
        label="Always Bold"
        terms={fmt.boldTerms}
        onAdd={addBold}
        onRemove={removeBold}
        tagClassName="bg-neutral-700 text-neutral-100 font-bold"
      />
      <TermList
        label="Always Italic"
        terms={fmt.italicTerms}
        onAdd={addItalic}
        onRemove={removeItalic}
        tagClassName="bg-neutral-700 text-neutral-100 italic"
      />
      <p className="text-xs text-neutral-500 leading-relaxed">
        Numbers written as <code className="bg-neutral-800 px-1 rounded">3@</code> in an effect
        (e.g. <code className="bg-neutral-800 px-1 rounded">Deal 3@ damage</code>) are always
        rendered in red — the <code className="bg-neutral-800 px-1 rounded">@</code> is stripped
        from the card.
      </p>
    </div>
  )
}
