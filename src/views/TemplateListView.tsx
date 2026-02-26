import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { Template } from '@/types/template'

function createBlankTemplate(): Template {
  return {
    id: crypto.randomUUID(),
    name: 'New Template',
    cardTypes: [],
    canvas: { width: 375, height: 523 },
    layers: [],
  }
}

export function TemplateListView() {
  const templates = useProjectStore((s) => s.project?.templates)
  const addTemplate = useProjectStore((s) => s.addTemplate)
  const deleteTemplate = useProjectStore((s) => s.deleteTemplate)
  const setActiveTemplate = useUiStore((s) => s.setActiveTemplate)
  const setActiveView = useUiStore((s) => s.setActiveView)

  async function handleExport(tmpl: Template) {
    const path = await window.electronAPI.showSaveDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
      defaultPath: `${tmpl.name}.json`,
    })
    if (!path) return
    await window.electronAPI.writeFile(path, JSON.stringify(tmpl, null, 2))
  }

  async function handleImport() {
    const path = await window.electronAPI.showOpenDialog({
      filters: [{ name: 'JSON', extensions: ['json'] }],
    })
    if (!path) return
    const raw = await window.electronAPI.readFile(path)
    const parsed: Template = JSON.parse(raw)
    addTemplate({ ...parsed, id: crypto.randomUUID() })
  }

  if (!templates) return null

  function handleNew() {
    const tmpl = createBlankTemplate()
    addTemplate(tmpl)
    setActiveTemplate(tmpl.id)
    setActiveView('designer')
  }

  function handleEdit(id: string) {
    setActiveTemplate(id)
    setActiveView('designer')
  }

  function handleDelete(id: string, name: string) {
    if (!window.confirm(`Delete template "${name}"?`)) return
    deleteTemplate(id)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-neutral-100">Templates</h1>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="px-3 py-1.5 text-sm rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
          >
            Import Template
          </button>
          <button
            onClick={handleNew}
            className="px-3 py-1.5 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            New Template
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <p className="text-neutral-400 text-sm">
          No templates yet. Click "New Template" to create one.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((tmpl) => (
            <div
              key={tmpl.id}
              className="bg-neutral-900 rounded-lg p-4 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-sm font-semibold text-neutral-100">{tmpl.name}</h2>
              </div>

              <div className="flex flex-wrap gap-1">
                {tmpl.cardTypes.map((ct) => (
                  <span
                    key={ct}
                    className="text-xs px-2 py-0.5 rounded-full bg-neutral-700 text-neutral-300"
                  >
                    {ct}
                  </span>
                ))}
              </div>

              <div className="flex gap-2 mt-auto">
                <button
                  aria-label={`Edit ${tmpl.name}`}
                  onClick={() => handleEdit(tmpl.id)}
                  className="flex-1 px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
                >
                  Edit
                </button>
                <button
                  aria-label={`Export ${tmpl.name}`}
                  onClick={() => handleExport(tmpl)}
                  className="px-2 py-1 text-xs rounded text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700 transition-colors"
                >
                  Export
                </button>
                <button
                  aria-label={`Delete ${tmpl.name}`}
                  onClick={() => handleDelete(tmpl.id, tmpl.name)}
                  className="px-2 py-1 text-xs rounded text-red-400 hover:text-red-300 hover:bg-neutral-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
