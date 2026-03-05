import { useState, useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import type { CardType } from '@/types/card'

const CARD_TYPES: CardType[] = [
  'Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase', 'Status',
]

function uniqueNewName(existing: string[]): string {
  let n = 1
  while (existing.includes(`New Phase ${n}`)) n++
  return `New Phase ${n}`
}

function PhaseNameInput({ phase }: { phase: string }) {
  const renamePhase = useProjectStore((s) => s.renamePhase)
  const [localName, setLocalName] = useState(phase)

  useEffect(() => { setLocalName(phase) }, [phase])

  return (
    <input
      type="text"
      aria-label={`${phase} name`}
      value={localName}
      onChange={(e) => setLocalName(e.target.value)}
      onBlur={() => {
        const trimmed = localName.trim()
        if (trimmed && trimmed !== phase) renamePhase(phase, trimmed)
        else setLocalName(phase)
      }}
      className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-32 outline-none focus:ring-1 focus:ring-indigo-500"
    />
  )
}

export function PhaseMapTable() {
  const project = useProjectStore((s) => s.project)
  const addPhase = useProjectStore((s) => s.addPhase)
  const deletePhase = useProjectStore((s) => s.deletePhase)
  const updatePhaseAbbreviation = useProjectStore((s) => s.updatePhaseAbbreviation)
  const updatePhaseMap = useProjectStore((s) => s.updatePhaseMap)

  if (!project) return null

  const phases = Object.keys(project.phaseAbbreviations)

  function handleCheckbox(phase: string, type: CardType, checked: boolean) {
    const current = project!.phaseMap[type] ?? []
    if (checked) {
      updatePhaseMap(type, [...current, phase])
    } else {
      updatePhaseMap(type, current.filter((p) => p !== phase))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
            Phase Configuration
          </h3>
          <button
            type="button"
            aria-label="Add Phase"
            onClick={() => addPhase(uniqueNewName(phases))}
            className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
          >
            Add Phase
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {phases.map((phase) => (
            <div key={phase} className="flex items-center gap-2">
              <PhaseNameInput phase={phase} />
              <input
                type="text"
                aria-label={`${phase} abbreviation`}
                value={project.phaseAbbreviations[phase]}
                onChange={(e) => updatePhaseAbbreviation(phase, e.target.value)}
                className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-16 outline-none text-center focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                aria-label={`Delete ${phase}`}
                onClick={() => deletePhase(phase)}
                className="text-neutral-500 hover:text-red-400 text-sm px-1 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          Phase Assignment
        </h3>
        <div className="overflow-auto">
          <table className="text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-neutral-500 text-xs pr-4 pb-2 font-normal">
                  Phase
                </th>
                {CARD_TYPES.map((type) => (
                  <th
                    key={type}
                    scope="col"
                    className="text-neutral-400 text-xs font-medium pb-2 px-2 text-center"
                  >
                    {type}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {phases.map((phase) => (
                <tr key={phase}>
                  <td className="text-neutral-300 text-xs pr-4 py-1 whitespace-nowrap">
                    {phase}
                  </td>
                  {CARD_TYPES.map((type) => {
                    const checked = project.phaseMap[type]?.includes(phase) ?? false
                    return (
                      <td key={type} className="text-center px-2 py-1">
                        <input
                          type="checkbox"
                          aria-label={`${phase} ${type}`}
                          checked={checked}
                          onChange={(e) => handleCheckbox(phase, type, e.target.checked)}
                          className="accent-indigo-500 w-4 h-4"
                        />
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
