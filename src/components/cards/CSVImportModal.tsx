import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { parseCSV, mergeByName } from '@/lib/csvParser'
import type { CardData } from '@/types/card'

type ModalStep =
  | { type: 'errors'; errors: string[]; cards: CardData[] }
  | { type: 'merge'; cards: CardData[] }

export function CSVImportModal() {
  const setCards = useProjectStore((s) => s.setCards)
  const existingCards = useProjectStore((s) => s.project?.cards) ?? []

  const [step, setStep] = useState<ModalStep | null>(null)
  const [delimiter, setDelimiter] = useState(',')

  async function handleImportClick() {
    const filePath = await window.electronAPI.showOpenDialog({
      title: 'Import CSV',
      filters: [{ name: 'CSV', extensions: ['csv'] }],
      properties: ['openFile'],
    })
    if (!filePath) return

    const raw = await window.electronAPI.readFile(filePath)
    const result = parseCSV(raw, { delimiter })

    if (result.errors.length > 0) {
      setStep({ type: 'errors', errors: result.errors, cards: result.cards })
      return
    }

    if (existingCards.length > 0) {
      setStep({ type: 'merge', cards: result.cards })
      return
    }

    setCards(result.cards)
  }

  function applyCards(cards: CardData[]) {
    setCards(cards)
    setStep(null)
  }

  function handleProceedErrors() {
    if (!step || step.type !== 'errors') return
    const incoming = step.cards
    if (existingCards.length > 0) {
      setStep({ type: 'merge', cards: incoming })
    } else {
      setCards(incoming)
      setStep(null)
    }
  }

  function handleReplaceAll() {
    if (!step || step.type !== 'merge') return
    applyCards(step.cards)
  }

  function handleMergeByName() {
    if (!step || step.type !== 'merge') return
    applyCards(mergeByName(existingCards, step.cards))
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <label htmlFor="csv-delimiter" className="text-xs text-neutral-400 uppercase tracking-wide">
          Delimiter
        </label>
        <select
          id="csv-delimiter"
          aria-label="delimiter"
          value={delimiter}
          onChange={(e) => setDelimiter(e.target.value)}
          className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 outline-none"
        >
          <option value=",">Comma (,)</option>
          <option value={'\t'}>Tab</option>
        </select>
        <button
          onClick={() => void handleImportClick()}
          className="px-3 py-1 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
        >
          Import CSV
        </button>
      </div>

      {step && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
        >
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-8 w-[480px] max-h-[70vh] flex flex-col gap-5 shadow-2xl">
            {step.type === 'errors' && (
              <>
                <h2 className="text-lg font-semibold text-neutral-100">Parse Warnings</h2>
                <p className="text-sm text-neutral-400">
                  The following rows were skipped. You can still proceed with the valid rows.
                </p>
                <ul className="flex-1 overflow-auto space-y-1 text-sm text-red-400 font-mono">
                  {step.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setStep(null)}
                    className="px-4 py-2 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedErrors}
                    className="px-4 py-2 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white"
                  >
                    Proceed ({step.cards.length} valid rows)
                  </button>
                </div>
              </>
            )}

            {step.type === 'merge' && (
              <>
                <h2 className="text-lg font-semibold text-neutral-100">Import Conflict</h2>
                <p className="text-sm text-neutral-400">
                  You have {existingCards.length} existing card{existingCards.length !== 1 ? 's' : ''}.
                  How would you like to handle the import?
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setStep(null)}
                    className="px-4 py-2 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMergeByName}
                    className="px-4 py-2 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-white"
                  >
                    Merge by Name
                  </button>
                  <button
                    onClick={handleReplaceAll}
                    className="px-4 py-2 text-sm rounded bg-red-700 hover:bg-red-600 text-white"
                  >
                    Replace All
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
