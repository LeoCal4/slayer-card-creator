import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { CardData } from '@/types/card'
import type { RectLayer, TextLayer, ImageLayer, BadgeLayer, PhaseIconsLayer, TemplateLayer } from '@/types/template'

const SHOW_IF_OPTIONS: (keyof CardData | '')[] = ['', 'cost', 'power', 'hp', 'vp', 'effect']

const TEXT_FIELDS: (keyof CardData | 'stats' | 'statsVP')[] = [
  'name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'vp', 'effect', 'stats', 'statsVP',
]

const FONT_STYLES = ['normal', 'bold', 'italic', 'bold italic'] as const
const ALIGN_OPTIONS = ['left', 'center', 'right'] as const

interface Props {
  templateId: string
}

function NumInput({
  label, value, onChange, min, max, step,
}: {
  label: string
  value: number | undefined
  onChange: (v: number) => void
  min?: number
  max?: number
  step?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-neutral-500 w-24 shrink-0">{label}</label>
      <input
        type="number"
        aria-label={label}
        value={value ?? ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 w-20 outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  )
}

function TextInput({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-neutral-500 w-24 shrink-0">{label}</label>
      <input
        type="text"
        aria-label={label}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="bg-neutral-800 text-neutral-100 text-xs font-mono rounded px-2 py-1 w-28 outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  )
}

function RectProps({ layer, templateId }: { layer: RectLayer; templateId: string }) {
  const updateLayer = useProjectStore((s) => s.updateLayer)
  const up = (partial: Partial<RectLayer>) => updateLayer(templateId, layer.id, partial)

  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Rect</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} min={1} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} min={1} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Fill Source</label>
        <select
          aria-label="Fill Source"
          value={layer.fillSource ?? ''}
          onChange={(e) => up({ fillSource: (e.target.value as RectLayer['fillSource']) || undefined })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">(manual)</option>
          <option value="class.primary">class.primary</option>
          <option value="class.secondary">class.secondary</option>
          <option value="class.gradient">class.gradient</option>
        </select>
      </div>
      <TextInput label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} />
      <NumInput label="Corner Radius" value={layer.cornerRadius} onChange={(v) => up({ cornerRadius: v })} min={0} />
      <TextInput label="Stroke" value={layer.stroke} onChange={(v) => up({ stroke: v })} />
      <NumInput label="Stroke Width" value={layer.strokeWidth} onChange={(v) => up({ strokeWidth: v })} min={0} />
      <NumInput label="Opacity" value={layer.opacity} onChange={(v) => up({ opacity: v })} min={0} max={1} step={0.1} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Show If Field</label>
        <select
          aria-label="Show If Field"
          value={layer.showIfField ?? ''}
          onChange={(e) => up({ showIfField: (e.target.value as keyof CardData) || undefined })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {SHOW_IF_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt || '(always)'}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

function TextProps({ layer, templateId }: { layer: TextLayer; templateId: string }) {
  const updateLayer = useProjectStore((s) => s.updateLayer)
  const up = (partial: Partial<TextLayer>) => updateLayer(templateId, layer.id, partial)

  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Text</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} min={1} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} min={1} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Field</label>
        <select
          aria-label="Field"
          value={layer.field}
          onChange={(e) => up({ field: e.target.value as TextLayer['field'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {TEXT_FIELDS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <NumInput label="Font Size" value={layer.fontSize} onChange={(v) => up({ fontSize: v })} min={6} />
      <TextInput label="Font Family" value={layer.fontFamily} onChange={(v) => up({ fontFamily: v })} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Font Style</label>
        <select
          aria-label="Font Style"
          value={layer.fontStyle ?? 'normal'}
          onChange={(e) => up({ fontStyle: e.target.value as TextLayer['fontStyle'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {FONT_STYLES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>
      <TextInput label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Align</label>
        <select
          aria-label="Align"
          value={layer.align ?? 'left'}
          onChange={(e) => up({ align: e.target.value as TextLayer['align'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {ALIGN_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <NumInput label="Line Height" value={layer.lineHeight} onChange={(v) => up({ lineHeight: v })} min={0.5} max={5} step={0.1} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Show If Field</label>
        <select
          aria-label="Show If Field"
          value={layer.showIfField ?? ''}
          onChange={(e) => up({ showIfField: (e.target.value as keyof CardData) || undefined })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {SHOW_IF_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt || '(always)'}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

const BADGE_FIELDS: (keyof CardData)[] = ['cost', 'power', 'hp', 'vp']

function ImageProps({ layer, templateId }: { layer: ImageLayer; templateId: string }) {
  const updateLayer = useProjectStore((s) => s.updateLayer)
  const setFrameImage = useProjectStore((s) => s.setFrameImage)
  const up = (partial: Partial<ImageLayer>) => updateLayer(templateId, layer.id, partial)

  async function handleUpload() {
    const path = await window.electronAPI.showOpenDialog({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }],
    })
    if (!path) return
    const raw = await window.electronAPI.readFile(path)
    const ext = path.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : `image/${ext}`
    setFrameImage(templateId, `data:${mime};base64,${raw}`)
  }

  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Image</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} min={1} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} min={1} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Image Source</label>
        <select
          aria-label="Image Source"
          value={layer.imageSource}
          onChange={(e) => up({ imageSource: e.target.value as ImageLayer['imageSource'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="frame">frame</option>
          <option value="art">art</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Image Fit</label>
        <select
          aria-label="Image Fit"
          value={layer.imageFit}
          onChange={(e) => up({ imageFit: e.target.value as ImageLayer['imageFit'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {(['cover', 'contain', 'fill', 'stretch'] as const).map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <NumInput label="Opacity" value={layer.opacity} onChange={(v) => up({ opacity: v })} min={0} max={1} step={0.1} />
      {layer.imageSource === 'frame' && (
        <button
          type="button"
          aria-label="Upload Frame"
          onClick={handleUpload}
          className="mt-1 px-2 py-1 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
        >
          Upload Frame
        </button>
      )}
    </div>
  )
}

function BadgeProps({ layer, templateId }: { layer: BadgeLayer; templateId: string }) {
  const updateLayer = useProjectStore((s) => s.updateLayer)
  const up = (partial: Partial<BadgeLayer>) => updateLayer(templateId, layer.id, partial)

  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Badge</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} min={1} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} min={1} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Field</label>
        <select
          aria-label="Field"
          value={layer.field}
          onChange={(e) => up({ field: e.target.value as BadgeLayer['field'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          {BADGE_FIELDS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
      </div>
      <TextInput label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} />
      <TextInput label="Text Fill" value={layer.textFill} onChange={(v) => up({ textFill: v })} />
      <NumInput label="Font Size" value={layer.fontSize} onChange={(v) => up({ fontSize: v })} min={6} />
    </div>
  )
}

function PhaseIconsProps({ layer, templateId }: { layer: PhaseIconsLayer; templateId: string }) {
  const updateLayer = useProjectStore((s) => s.updateLayer)
  const up = (partial: Partial<PhaseIconsLayer>) => updateLayer(templateId, layer.id, partial)

  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Phase Icons</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} min={1} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} min={1} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Orientation</label>
        <select
          aria-label="Orientation"
          value={layer.orientation}
          onChange={(e) => up({ orientation: e.target.value as PhaseIconsLayer['orientation'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="horizontal">horizontal</option>
          <option value="vertical">vertical</option>
        </select>
      </div>
      <NumInput label="Icon Size" value={layer.iconSize} onChange={(v) => up({ iconSize: v })} min={8} />
      <NumInput label="Gap" value={layer.gap} onChange={(v) => up({ gap: v })} min={0} />
      <div className="flex items-center gap-2">
        <label className="text-xs text-neutral-500 w-24 shrink-0">Align</label>
        <select
          aria-label="Align"
          value={layer.align}
          onChange={(e) => up({ align: e.target.value as PhaseIconsLayer['align'] })}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="left">left</option>
          <option value="right">right</option>
        </select>
      </div>
      <TextInput label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} />
      <TextInput label="Text Fill" value={layer.textFill} onChange={(v) => up({ textFill: v })} />
      <NumInput label="Corner Radius" value={layer.cornerRadius} onChange={(v) => up({ cornerRadius: v })} min={0} />
    </div>
  )
}

function LayerLabelInput({ layer, templateId }: { layer: TemplateLayer; templateId: string }) {
  const updateLayer = useProjectStore((s) => s.updateLayer)
  return (
    <div className="flex items-center gap-2 px-3 pt-3 pb-1 border-b border-neutral-800">
      <label htmlFor="layer-label" className="text-xs text-neutral-500 w-24 shrink-0">
        Layer Label
      </label>
      <input
        id="layer-label"
        type="text"
        aria-label="Layer Label"
        value={layer.label ?? ''}
        onChange={(e) => updateLayer(templateId, layer.id, { label: e.target.value || undefined })}
        placeholder={layer.type}
        className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 w-28 outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </div>
  )
}

export function PropertiesPanel({ templateId }: Props) {
  const selectedLayerId = useUiStore((s) => s.selectedLayerId)
  const templates = useProjectStore((s) => s.project?.templates)

  if (!selectedLayerId || !templates) return null

  const template = templates.find((t) => t.id === templateId)
  if (!template) return null

  const layer = template.layers.find((l) => l.id === selectedLayerId)
  if (!layer) return null

  return (
    <>
      <LayerLabelInput layer={layer} templateId={templateId} />
      {layer.type === 'rect' && <RectProps layer={layer} templateId={templateId} />}
      {layer.type === 'text' && <TextProps layer={layer} templateId={templateId} />}
      {layer.type === 'image' && <ImageProps layer={layer} templateId={templateId} />}
      {layer.type === 'badge' && <BadgeProps layer={layer} templateId={templateId} />}
      {layer.type === 'phase-icons' && <PhaseIconsProps layer={layer} templateId={templateId} />}
    </>
  )
}
