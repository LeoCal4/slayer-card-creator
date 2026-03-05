import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'

function uniqueNewName(existing: string[]): string {
  let n = 1
  while (existing.includes(`New Type ${n}`)) n++
  return `New Type ${n}`
}

function CardTypeNameInput({ name }: { name: string }) {
  const renameCardType = useProjectStore((s) => s.renameCardType)
  const [localName, setLocalName] = useState(name)

  useEffect(() => { setLocalName(name) }, [name])

  return (
    <input
      type="text"
      aria-label={`${name} name`}
      value={localName}
      onChange={(e) => setLocalName(e.target.value)}
      onBlur={() => {
        const trimmed = localName.trim()
        if (trimmed && trimmed !== name) renameCardType(name, trimmed)
        else setLocalName(name)
      }}
      className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-48 outline-none focus:ring-1 focus:ring-indigo-500"
    />
  )
}

export function CardTypeTable() {
  const project = useProjectStore((s) => s.project)
  const addCardType = useProjectStore((s) => s.addCardType)
  const deleteCardType = useProjectStore((s) => s.deleteCardType)

  if (!project) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
          Card Types
        </h3>
        <button
          type="button"
          aria-label="Add Card Type"
          onClick={() => addCardType(uniqueNewName(project.cardTypes))}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
        >
          Add Type
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {project.cardTypes.map((name) => (
          <div key={name} className="flex items-center gap-2">
            <CardTypeNameInput name={name} />
            <button
              type="button"
              aria-label={`Delete ${name}`}
              onClick={() => deleteCardType(name)}
              className="text-neutral-500 hover:text-red-400 text-sm px-1 transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
