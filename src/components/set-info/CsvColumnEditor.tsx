import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import type { CsvColumnDef, CsvColumnType } from '@/types/project'

function SelectChoicesEditor({
  colId,
  colName,
  choices,
}: {
  colId: string
  colName: string
  choices: string[]
}) {
  const updateCsvColumn = useProjectStore((s) => s.updateCsvColumn)
  const [input, setInput] = useState('')

  function commit() {
    const trimmed = input.trim()
    if (trimmed && !choices.includes(trimmed)) {
      updateCsvColumn(colId, { choices: [...choices, trimmed] })
    }
    setInput('')
  }

  function removeChoice(choice: string) {
    updateCsvColumn(colId, { choices: choices.filter((c) => c !== choice) })
  }

  return (
    <div className="mt-1.5 ml-4 flex flex-col gap-1.5">
      <div className="flex flex-wrap gap-1">
        {choices.map((choice) => (
          <span
            key={choice}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-neutral-700 text-neutral-100"
          >
            {choice}
            <button
              type="button"
              aria-label={`Remove "${choice}"`}
              onClick={() => removeChoice(choice)}
              className="opacity-60 hover:opacity-100 leading-none"
            >
              ×
            </button>
          </span>
        ))}
        {choices.length === 0 && (
          <span className="text-xs text-neutral-600 italic">No choices yet</span>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          aria-label={`${colName} choice input`}
          placeholder="Add choice…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit() }
          }}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 flex-1 min-w-0"
        />
        <button
          type="button"
          aria-label="Add choice"
          onClick={commit}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors shrink-0"
        >
          Add choice
        </button>
      </div>
    </div>
  )
}

function CsvColumnRow({ col }: { col: CsvColumnDef }) {
  const updateCsvColumn = useProjectStore((s) => s.updateCsvColumn)
  const deleteCsvColumn = useProjectStore((s) => s.deleteCsvColumn)
  const [localName, setLocalName] = useState(col.name)

  useEffect(() => { setLocalName(col.name) }, [col.name])

  function commitName() {
    const trimmed = localName.trim()
    if (trimmed && trimmed !== col.name) {
      updateCsvColumn(col.id, { name: trimmed })
    } else {
      setLocalName(col.name)
    }
  }

  function handleTypeChange(newType: CsvColumnType) {
    updateCsvColumn(col.id, {
      type: newType,
      choices: newType === 'select' ? (col.choices ?? []) : undefined,
    })
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <input
          type="text"
          aria-label={`${col.name} column name`}
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={commitName}
          className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-36 outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <select
          aria-label="column type"
          value={col.type}
          onChange={(e) => handleTypeChange(e.target.value as CsvColumnType)}
          className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="text">text</option>
          <option value="number">number</option>
          <option value="select">select</option>
        </select>
        <button
          type="button"
          aria-label={`Delete ${col.name} column`}
          onClick={() => deleteCsvColumn(col.id)}
          className="text-neutral-500 hover:text-red-400 text-sm px-1 transition-colors"
        >
          ✕
        </button>
      </div>
      {col.type === 'select' && (
        <SelectChoicesEditor
          colId={col.id}
          colName={col.name}
          choices={col.choices ?? []}
        />
      )}
    </div>
  )
}

export function CsvColumnEditor() {
  const project = useProjectStore((s) => s.project)
  const addCsvColumn = useProjectStore((s) => s.addCsvColumn)

  if (!project) return null

  const csvColumns = project.csvColumns ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
          CSV Columns
        </h3>
        <button
          type="button"
          aria-label="Add Column"
          onClick={addCsvColumn}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
        >
          Add Column
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {csvColumns.map((col) => (
          <CsvColumnRow key={col.id} col={col} />
        ))}
      </div>
    </div>
  )
}
