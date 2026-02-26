import { useEffect } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

export function Header() {
  const project = useProjectStore((s) => s.project)
  const newProject = useProjectStore((s) => s.newProject)
  const openProject = useProjectStore((s) => s.openProject)
  const saveProject = useProjectStore((s) => s.saveProject)
  const isDirty = useUiStore((s) => s.isDirty)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        void saveProject()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveProject])

  return (
    <header className="flex items-center gap-3 h-10 px-4 border-b border-neutral-800 bg-neutral-900 shrink-0">
      <span className="text-sm font-semibold text-neutral-100 select-none">
        Slayer
      </span>

      {project && (
        <span className="text-sm text-neutral-400 truncate max-w-xs">
          {project.set.name}
        </span>
      )}

      {isDirty && (
        <span
          data-testid="dirty-indicator"
          className="text-amber-400 text-xs select-none"
          title="Unsaved changes"
        >
          ●
        </span>
      )}

      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={newProject}
          className="px-2 py-1 text-xs rounded text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          New
        </button>
        <button
          onClick={() => void openProject()}
          className="px-2 py-1 text-xs rounded text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          Open
        </button>
        <button
          onClick={() => void saveProject()}
          className="px-2 py-1 text-xs rounded text-neutral-300 hover:bg-neutral-700 transition-colors"
        >
          Save
        </button>
      </div>
    </header>
  )
}
