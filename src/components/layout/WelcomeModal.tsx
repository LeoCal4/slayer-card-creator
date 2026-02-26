import { useEffect, useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { deserialize } from '@/lib/projectFile'
import type { RecentProject } from '@/types/electronApi'

export function WelcomeModal() {
  const project = useProjectStore((s) => s.project)
  const newProject = useProjectStore((s) => s.newProject)
  const openProject = useProjectStore((s) => s.openProject)
  const loadProject = useProjectStore((s) => s.loadProject)

  const [recents, setRecents] = useState<RecentProject[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    window.electronAPI?.getRecentProjects().then(setRecents)
  }, [])

  if (project !== null) return null

  async function handleOpenRecent(entry: RecentProject) {
    setLoadError(null)
    try {
      const raw = await window.electronAPI.readFile(entry.path)
      const p = deserialize(raw)
      loadProject(p)
    } catch {
      setLoadError(`Could not load: ${entry.path.split(/[\\/]/).pop()}`)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome"
    >
      <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-10 flex flex-col items-center gap-6 shadow-2xl w-96">
        <h1 className="text-2xl font-bold text-neutral-100">Slayer Card Creator</h1>
        <p className="text-sm text-neutral-400 text-center">
          Create and manage your card game sets with custom templates and exports.
        </p>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={newProject}
            className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            New Project
          </button>
          <button
            onClick={() => void openProject()}
            className="w-full py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-neutral-100 text-sm font-medium transition-colors"
          >
            Open Project
          </button>
        </div>

        {recents.length > 0 && (
          <div className="w-full flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">Recent</p>
              <button
                onClick={() => setRecents([])}
                className="text-xs text-neutral-500 hover:text-neutral-300"
                aria-label="Clear recent projects"
              >
                Clear
              </button>
            </div>
            <ul className="flex flex-col gap-1">
              {recents.map((r) => (
                <li key={r.path}>
                  <button
                    onClick={() => void handleOpenRecent(r)}
                    className="w-full text-left text-sm text-neutral-300 hover:text-white px-2 py-1 rounded hover:bg-neutral-800 transition-colors truncate"
                  >
                    {r.name}
                    <span className="text-xs text-neutral-500 ml-2">
                      {r.path.split(/[\\/]/).pop()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {loadError && (
          <p className="text-xs text-red-400">{loadError}</p>
        )}
      </div>
    </div>
  )
}
