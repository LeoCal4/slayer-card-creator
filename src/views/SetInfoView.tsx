import { useProjectStore } from '@/store/projectStore'
import { ClassPaletteEditor } from '@/components/set-info/ClassPaletteEditor'
import { PhaseMapTable } from '@/components/set-info/PhaseMapTable'

export function SetInfoView() {
  const project = useProjectStore((s) => s.project)
  const updateSetInfo = useProjectStore((s) => s.updateSetInfo)
  const setArtFolderPath = useProjectStore((s) => s.setArtFolderPath)

  async function handleSelectArtFolder() {
    const path = await window.electronAPI.showOpenDialog({
      properties: ['openDirectory'],
    })
    if (path) setArtFolderPath(path)
  }

  if (!project) {
    return <p className="p-6 text-neutral-400">No project loaded.</p>
  }

  return (
    <div className="p-6 max-w-3xl space-y-10">
      <section>
        <h2 className="text-base font-semibold text-neutral-100 mb-4">Set Metadata</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="set-name" className="text-xs text-neutral-400 uppercase tracking-wide">
              Set Name
            </label>
            <input
              id="set-name"
              type="text"
              value={project.set.name}
              onChange={(e) => updateSetInfo({ name: e.target.value })}
              className="bg-neutral-800 text-neutral-100 text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="set-code" className="text-xs text-neutral-400 uppercase tracking-wide">
              Code
            </label>
            <input
              id="set-code"
              type="text"
              maxLength={8}
              value={project.set.code}
              onChange={(e) => updateSetInfo({ code: e.target.value.toUpperCase().slice(0, 8) })}
              className="bg-neutral-800 text-neutral-100 text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 font-mono uppercase"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="set-type" className="text-xs text-neutral-400 uppercase tracking-wide">
              Type
            </label>
            <input
              id="set-type"
              type="text"
              value={project.set.type}
              onChange={(e) => updateSetInfo({ type: e.target.value })}
              className="bg-neutral-800 text-neutral-100 text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="set-release" className="text-xs text-neutral-400 uppercase tracking-wide">
              Release Date
            </label>
            <input
              id="set-release"
              type="date"
              value={project.set.releaseDate}
              onChange={(e) => updateSetInfo({ releaseDate: e.target.value })}
              className="bg-neutral-800 text-neutral-100 text-sm rounded px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-neutral-100 mb-4">Art Folder</h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Select Art Folder"
            onClick={handleSelectArtFolder}
            className="px-3 py-1.5 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
          >
            Select Art Folder
          </button>
          <span className="text-sm text-neutral-400 truncate">
            {project.artFolderPath || '(none)'}
          </span>
        </div>
      </section>

      <section>
        <h2 className="text-base font-semibold text-neutral-100 mb-4">Class Colours</h2>
        <ClassPaletteEditor />
      </section>

      <section>
        <h2 className="text-base font-semibold text-neutral-100 mb-4">Phase Configuration</h2>
        <PhaseMapTable />
      </section>
    </div>
  )
}
