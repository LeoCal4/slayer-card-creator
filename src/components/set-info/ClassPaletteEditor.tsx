import { useProjectStore } from '@/store/projectStore'
import { ColorPicker } from '@/components/common/ColorPicker'

const DEFAULT_CONFIG = { primary: '#888888', secondary: '#555555', cockatriceColor: '' }

function uniqueNewName(existing: string[]): string {
  let n = 1
  while (existing.includes(`New Class ${n}`)) n++
  return `New Class ${n}`
}

export function ClassPaletteEditor() {
  const classColors = useProjectStore((s) => s.project?.classColors)
  const updateClassColor = useProjectStore((s) => s.updateClassColor)
  const addClassColor = useProjectStore((s) => s.addClassColor)
  const deleteClassColor = useProjectStore((s) => s.deleteClassColor)

  if (!classColors) return null

  const entries = Object.entries(classColors)

  function handleAdd() {
    const name = uniqueNewName(Object.keys(classColors!))
    addClassColor(name, { ...DEFAULT_CONFIG })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
          Class Colours
        </h3>
        <button
          onClick={handleAdd}
          className="px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
        >
          Add Class
        </button>
      </div>

      <div className="space-y-2">
        {entries.map(([className, config]) => (
          <div
            key={className}
            className="flex items-center gap-3 bg-neutral-900 rounded-lg px-3 py-2"
          >
            <input
              type="text"
              aria-label={`${className} name`}
              value={className}
              onChange={(e) => {
                const newName = e.target.value
                addClassColor(newName, config)
                deleteClassColor(className)
              }}
              className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-28 outline-none"
            />

            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-500 w-12">Primary</span>
              <ColorPicker
                value={config.primary}
                onChange={(hex) => updateClassColor(className, { primary: hex })}
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs text-neutral-500 w-16">Secondary</span>
              <ColorPicker
                value={config.secondary}
                onChange={(hex) => updateClassColor(className, { secondary: hex })}
              />
            </div>

            <div className="flex items-center gap-1">
              <label
                htmlFor={`cockatrice-${className}`}
                className="text-xs text-neutral-500 w-20 shrink-0"
              >
                Cockatrice
              </label>
              <input
                id={`cockatrice-${className}`}
                type="text"
                aria-label={`${className} cockatrice color`}
                value={config.cockatriceColor}
                onChange={(e) => updateClassColor(className, { cockatriceColor: e.target.value })}
                className="bg-neutral-800 text-neutral-100 text-sm font-mono rounded px-2 py-1 w-16 outline-none"
              />
            </div>

            <button
              aria-label={`delete ${className}`}
              onClick={() => deleteClassColor(className)}
              className="ml-auto text-red-500 hover:text-red-400 text-xs px-1"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
