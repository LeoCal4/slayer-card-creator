import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { buildZip } from '@/lib/zipBuilder'
import type { ZipProgress } from '@/lib/zipBuilder'

export function ExportView() {
  const project = useProjectStore((s) => s.project)
  const [artFound, setArtFound] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState<ZipProgress | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [savedPath, setSavedPath] = useState<string | null>(null)

  useEffect(() => {
    if (!project?.artFolderPath) { setArtFound(null); return }
    window.electronAPI?.listArtFiles(project.artFolderPath).then((files) => {
      const cardNames = new Set(project.cards.map((c) => {
        const base = c.name
        return [base + '.png', base + '.jpg', base + '.jpeg', base + '.webp', base + '.gif']
      }).flat())
      setArtFound(files.filter((f) => cardNames.has(f)).length)
    })
  }, [project?.artFolderPath, project?.cards])

  if (!project) return null

  const cardCount     = project.cards.length
  const templateCount = project.templates.length
  const missingArt    = artFound !== null ? cardCount - artFound : null

  async function handleExport() {
    setExporting(true)
    setSavedPath(null)
    setWarnings([])
    setProgress(null)

    try {
      const { blob, warnings: w } = await buildZip(project!, (p) => setProgress(p))
      setWarnings(w)

      const savePath = await window.electronAPI?.showSaveDialog({
        filters: [{ name: 'ZIP', extensions: ['zip'] }],
      })

      if (savePath) {
        const arrayBuffer = await blob.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        const binary = Array.from(bytes).map((b) => String.fromCharCode(b)).join('')
        const base64 = btoa(binary)
        await window.electronAPI?.writeFile(savePath, `data:application/zip;base64,${base64}`)
        setSavedPath(savePath)
      }
    } finally {
      setExporting(false)
      setProgress(null)
    }
  }

  const progressLabel = progress
    ? progress.phase === 'rendering'
      ? `Rendering cards… ${progress.current}/${progress.total}`
      : `Packing ZIP… ${progress.current}/${progress.total}`
    : null

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-auto">
      <h1 className="text-xl font-semibold">Export</h1>

      {/* Setup warnings */}
      {cardCount === 0 && (
        <p className="text-sm text-amber-400 bg-amber-400/10 px-3 py-2 rounded">
          No cards — add or import cards before exporting.
        </p>
      )}
      {templateCount === 0 && (
        <p className="text-sm text-amber-400 bg-amber-400/10 px-3 py-2 rounded">
          No templates — create templates before exporting.
        </p>
      )}

      {/* Summary */}
      <section className="flex flex-col gap-2 text-sm">
        <p><span className="text-neutral-300 font-medium">{cardCount}</span> cards</p>
        <p><span className="text-neutral-300 font-medium">{templateCount}</span> templates</p>
        {project.artFolderPath ? (
          artFound !== null ? (
            <p>
              <span className="text-neutral-300 font-medium">{artFound} found</span>
              {missingArt! > 0 && (
                <span className="text-amber-400 ml-2">({missingArt} missing)</span>
              )}
              {' '}art files
            </p>
          ) : (
            <p className="text-neutral-500">Checking art files…</p>
          )
        ) : (
          <p className="text-neutral-500">No art folder selected</p>
        )}
      </section>

      {/* Export button */}
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting}
        className="self-start px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded"
      >
        {exporting ? progressLabel ?? 'Exporting…' : 'Export ZIP'}
      </button>

      {/* Success */}
      {savedPath && (
        <p className="text-sm text-green-400">
          Export complete — <span className="font-mono">{savedPath.split('/').pop()}</span>
        </p>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-1 max-h-48 overflow-y-auto text-xs text-amber-400 bg-neutral-800 p-3 rounded">
          {warnings.map((w, i) => <p key={i}>{w}</p>)}
        </div>
      )}
    </div>
  )
}
