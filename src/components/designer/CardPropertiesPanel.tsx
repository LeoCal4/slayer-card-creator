import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { ColorPicker } from '@/components/common/ColorPicker'
import { pushCardSnapshot } from '@/lib/undoRedo'
import type { CardData } from '@/types/card'
import type { RectLayer, TextLayer, BadgeLayer, PhaseIconsLayer, RarityDiamondLayer, TemplateLayer } from '@/types/template'

const SHOW_IF_OPTIONS: (keyof CardData | '')[] = ['', 'cost', 'power', 'hp', 'vp', 'speed', 'effect']
const TEXT_FIELDS: (keyof CardData | 'stats' | 'statsVP' | '')[] = [
  '', 'name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'vp', 'speed', 'effect', 'stats', 'statsVP',
]
const FONT_STYLES = ['normal', 'bold', 'italic', 'bold italic'] as const
const ALIGN_OPTIONS = ['left', 'center', 'right'] as const


interface PanelProps {
  templateId: string
  cardId: string
}

interface RowProps {
  label: string
  overridden: boolean
  onReset: () => void
  children: React.ReactNode
}

function OverrideRow({ label, overridden, onReset, children }: RowProps) {
  // Convert "Font Size" → "fontSize" for data-testid
  const camelKey = label
    .replace(/\s+(.)/g, (_, c: string) => c.toUpperCase())
    .replace(/^(.)/, (c: string) => c.toLowerCase())
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 shrink-0 flex items-center gap-1">
        {overridden && (
          <>
            <span
              data-testid={`override-dot-${camelKey}`}
              className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"
              aria-hidden="true"
            />
            <button
              type="button"
              aria-label={`Reset ${label}`}
              onClick={onReset}
              className="text-neutral-600 hover:text-red-400 text-xs leading-none"
            >
              ×
            </button>
          </>
        )}
        <label className="text-xs text-neutral-500 truncate">{label}</label>
      </div>
      {children}
    </div>
  )
}

function NumInput({
  label, value, onChange, onFocus, min, max, step, overridden, onReset,
}: {
  label: string; value: number | undefined; onChange: (v: number) => void
  onFocus?: () => void; min?: number; max?: number; step?: number; overridden: boolean; onReset: () => void
}) {
  return (
    <OverrideRow label={label} overridden={overridden} onReset={onReset}>
      <input
        type="number"
        aria-label={label}
        value={value ?? ''}
        min={min} max={max} step={step}
        onFocus={onFocus}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 w-20 outline-none focus:ring-1 focus:ring-indigo-500"
      />
    </OverrideRow>
  )
}

function ColorRow({ label, value, onChange, onSnap, overridden, onReset }: {
  label: string; value: string | undefined; onChange: (v: string) => void
  onSnap?: () => void; overridden: boolean; onReset: () => void
}) {
  return (
    <OverrideRow label={label} overridden={overridden} onReset={onReset}>
      <ColorPicker label={label} value={value ?? '#000000'} onChange={onChange} onPickerOpen={onSnap} />
    </OverrideRow>
  )
}

function useCardLayerEditor(cardId: string, templateId: string, layerId: string) {
  const updateCardLayerProps = useProjectStore((s) => s.updateCardLayerProps)
  const resetCardLayerProp = useProjectStore((s) => s.resetCardLayerProp)
  const overrideProps = useProjectStore((s) =>
    s.project?.cardOverrides?.[cardId]?.layerOverrides?.[layerId]?.props
  ) ?? {}

  const up = (partial: Partial<TemplateLayer>) => updateCardLayerProps(cardId, templateId, layerId, partial)
  const snap = () => pushCardSnapshot(cardId)
  const isOverridden = (key: string) => key in overrideProps
  const reset = (key: string) => resetCardLayerProp(cardId, layerId, key)

  return { up, snap, isOverridden, reset }
}

function RectProps({ layer, cardId, templateId }: { layer: RectLayer; cardId: string; templateId: string }) {
  const { up, snap, isOverridden, reset } = useCardLayerEditor(cardId, templateId, layer.id)
  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Rect</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} onFocus={snap} overridden={isOverridden('x')} onReset={() => reset('x')} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} onFocus={snap} overridden={isOverridden('y')} onReset={() => reset('y')} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} onFocus={snap} min={1} overridden={isOverridden('width')} onReset={() => reset('width')} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} onFocus={snap} min={1} overridden={isOverridden('height')} onReset={() => reset('height')} />
      <ColorRow label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} onSnap={snap} overridden={isOverridden('fill')} onReset={() => reset('fill')} />
      <NumInput label="Corner Radius" value={layer.cornerRadius} onChange={(v) => up({ cornerRadius: v })} onFocus={snap} min={0} overridden={isOverridden('cornerRadius')} onReset={() => reset('cornerRadius')} />
      <ColorRow label="Stroke" value={layer.stroke} onChange={(v) => up({ stroke: v })} onSnap={snap} overridden={isOverridden('stroke')} onReset={() => reset('stroke')} />
      <NumInput label="Stroke Width" value={layer.strokeWidth} onChange={(v) => up({ strokeWidth: v })} onFocus={snap} min={0} overridden={isOverridden('strokeWidth')} onReset={() => reset('strokeWidth')} />
      <NumInput label="Opacity" value={layer.opacity} onChange={(v) => up({ opacity: v })} onFocus={snap} min={0} max={1} step={0.1} overridden={isOverridden('opacity')} onReset={() => reset('opacity')} />
    </div>
  )
}

function TextProps({ layer, cardId, templateId }: { layer: TextLayer; cardId: string; templateId: string }) {
  const { up, snap, isOverridden, reset } = useCardLayerEditor(cardId, templateId, layer.id)
  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Text</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} onFocus={snap} overridden={isOverridden('x')} onReset={() => reset('x')} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} onFocus={snap} overridden={isOverridden('y')} onReset={() => reset('y')} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} onFocus={snap} min={1} overridden={isOverridden('width')} onReset={() => reset('width')} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} onFocus={snap} min={1} overridden={isOverridden('height')} onReset={() => reset('height')} />
      <OverrideRow label="Text Source" overridden={isOverridden('staticText') || isOverridden('field')} onReset={() => { reset('staticText'); reset('field') }}>
        <select
          aria-label="Text Source"
          value={layer.staticText !== undefined ? 'static' : 'field'}
          onChange={(e) => {
            snap()
            if (e.target.value === 'static') {
              up({ staticText: '' })
            } else {
              up({ staticText: undefined })
            }
          }}
          className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="field">From field</option>
          <option value="static">Static text</option>
        </select>
      </OverrideRow>
      {layer.staticText !== undefined ? (
        <OverrideRow label="Static Text" overridden={isOverridden('staticText')} onReset={() => reset('staticText')}>
          <input
            type="text"
            aria-label="Static Text"
            value={layer.staticText}
            onChange={(e) => up({ staticText: e.target.value })}
            onFocus={snap}
            className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 flex-1 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </OverrideRow>
      ) : (
        <OverrideRow label="Field" overridden={isOverridden('field')} onReset={() => reset('field')}>
          <select
            aria-label="Field"
            value={layer.field ?? ''}
            onChange={(e) => { snap(); up({ field: (e.target.value as TextLayer['field']) || undefined }) }}
            className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {TEXT_FIELDS.map((f) => (
              <option key={f} value={f}>{f || '(none)'}</option>
            ))}
          </select>
        </OverrideRow>
      )}
      <NumInput label="Font Size" value={layer.fontSize} onChange={(v) => up({ fontSize: v })} onFocus={snap} min={6} overridden={isOverridden('fontSize')} onReset={() => reset('fontSize')} />
      <div className="flex items-center gap-2">
        <OverrideRow label="Font Style" overridden={isOverridden('fontStyle')} onReset={() => reset('fontStyle')}>
          <select
            aria-label="Font Style"
            value={layer.fontStyle ?? 'normal'}
            onChange={(e) => up({ fontStyle: e.target.value as TextLayer['fontStyle'] })}
            className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {FONT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </OverrideRow>
      </div>
      <ColorRow label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} onSnap={snap} overridden={isOverridden('fill')} onReset={() => reset('fill')} />
      <div className="flex items-center gap-2">
        <OverrideRow label="Align" overridden={isOverridden('align')} onReset={() => reset('align')}>
          <select
            aria-label="Align"
            value={layer.align ?? 'left'}
            onFocus={snap}
            onChange={(e) => up({ align: e.target.value as TextLayer['align'] })}
            className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {ALIGN_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </OverrideRow>
      </div>
      <NumInput label="Line Height" value={layer.lineHeight} onChange={(v) => up({ lineHeight: v })} onFocus={snap} min={0.5} max={5} step={0.1} overridden={isOverridden('lineHeight')} onReset={() => reset('lineHeight')} />
      <div className="flex items-center gap-2">
        <OverrideRow label="Show If Field" overridden={isOverridden('showIfField')} onReset={() => reset('showIfField')}>
          <select
            aria-label="Show If Field"
            value={layer.showIfField ?? ''}
            onChange={(e) => up({ showIfField: (e.target.value as keyof CardData) || undefined })}
            className="bg-neutral-800 text-neutral-100 text-xs rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {SHOW_IF_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt || '(always)'}</option>)}
          </select>
        </OverrideRow>
      </div>
    </div>
  )
}

function BadgeProps({ layer, cardId, templateId }: { layer: BadgeLayer; cardId: string; templateId: string }) {
  const { up, snap, isOverridden, reset } = useCardLayerEditor(cardId, templateId, layer.id)
  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Badge</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} onFocus={snap} overridden={isOverridden('x')} onReset={() => reset('x')} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} onFocus={snap} overridden={isOverridden('y')} onReset={() => reset('y')} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} onFocus={snap} min={1} overridden={isOverridden('width')} onReset={() => reset('width')} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} onFocus={snap} min={1} overridden={isOverridden('height')} onReset={() => reset('height')} />
      <ColorRow label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} onSnap={snap} overridden={isOverridden('fill')} onReset={() => reset('fill')} />
      <ColorRow label="Text Fill" value={layer.textFill} onChange={(v) => up({ textFill: v })} onSnap={snap} overridden={isOverridden('textFill')} onReset={() => reset('textFill')} />
      <NumInput label="Font Size" value={layer.fontSize} onChange={(v) => up({ fontSize: v })} onFocus={snap} min={6} overridden={isOverridden('fontSize')} onReset={() => reset('fontSize')} />
    </div>
  )
}

function PhaseIconsProps({ layer, cardId, templateId }: { layer: PhaseIconsLayer; cardId: string; templateId: string }) {
  const { up, snap, isOverridden, reset } = useCardLayerEditor(cardId, templateId, layer.id)
  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Phase Icons</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} onFocus={snap} overridden={isOverridden('x')} onReset={() => reset('x')} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} onFocus={snap} overridden={isOverridden('y')} onReset={() => reset('y')} />
      <NumInput label="Icon Size" value={layer.iconSize} onChange={(v) => up({ iconSize: v })} onFocus={snap} min={8} overridden={isOverridden('iconSize')} onReset={() => reset('iconSize')} />
      <NumInput label="Gap" value={layer.gap} onChange={(v) => up({ gap: v })} onFocus={snap} min={0} overridden={isOverridden('gap')} onReset={() => reset('gap')} />
      <NumInput label="Font Size" value={layer.fontSize} onChange={(v) => up({ fontSize: v })} onFocus={snap} min={6} overridden={isOverridden('fontSize')} onReset={() => reset('fontSize')} />
      <ColorRow label="Fill" value={layer.fill} onChange={(v) => up({ fill: v })} onSnap={snap} overridden={isOverridden('fill')} onReset={() => reset('fill')} />
      <ColorRow label="Text Fill" value={layer.textFill} onChange={(v) => up({ textFill: v })} onSnap={snap} overridden={isOverridden('textFill')} onReset={() => reset('textFill')} />
    </div>
  )
}

function RarityDiamondProps({ layer, cardId, templateId }: { layer: RarityDiamondLayer; cardId: string; templateId: string }) {
  const { up, snap, isOverridden, reset } = useCardLayerEditor(cardId, templateId, layer.id)
  return (
    <div className="space-y-2 p-3">
      <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-2">Rarity Diamond</p>
      <NumInput label="X" value={layer.x} onChange={(v) => up({ x: v })} onFocus={snap} overridden={isOverridden('x')} onReset={() => reset('x')} />
      <NumInput label="Y" value={layer.y} onChange={(v) => up({ y: v })} onFocus={snap} overridden={isOverridden('y')} onReset={() => reset('y')} />
      <NumInput label="Width" value={layer.width} onChange={(v) => up({ width: v })} onFocus={snap} min={1} overridden={isOverridden('width')} onReset={() => reset('width')} />
      <NumInput label="Height" value={layer.height} onChange={(v) => up({ height: v })} onFocus={snap} min={1} overridden={isOverridden('height')} onReset={() => reset('height')} />
      <ColorRow label="Stroke" value={layer.stroke} onChange={(v) => up({ stroke: v })} onSnap={snap} overridden={isOverridden('stroke')} onReset={() => reset('stroke')} />
      <NumInput label="Stroke Width" value={layer.strokeWidth} onChange={(v) => up({ strokeWidth: v })} onFocus={snap} min={0} overridden={isOverridden('strokeWidth')} onReset={() => reset('strokeWidth')} />
      <NumInput label="Opacity" value={layer.opacity} onChange={(v) => up({ opacity: v })} onFocus={snap} min={0} max={1} step={0.1} overridden={isOverridden('opacity')} onReset={() => reset('opacity')} />
    </div>
  )
}

export function CardPropertiesPanel({ templateId, cardId }: PanelProps) {
  const selectedLayerId = useUiStore((s) => s.selectedLayerId)
  const project = useProjectStore((s) => s.project)

  if (!selectedLayerId || !project) return null

  const template = project.templates.find((t) => t.id === templateId)
  if (!template) return null

  // Look in base layers first, then extra card layers
  const override = project.cardOverrides?.[cardId]
  const baseLayer = template.layers.find((l) => l.id === selectedLayerId)
  const extraLayer = override?.extraLayers.find((l) => l.id === selectedLayerId)
  const rawLayer = baseLayer ?? extraLayer
  if (!rawLayer) return null

  // Merge override props for display
  const overrideProps = override?.layerOverrides?.[selectedLayerId]?.props ?? {}
  const layer = { ...rawLayer, ...overrideProps } as TemplateLayer

  return (
    <>
      {layer.type === 'rect'          && <RectProps         layer={layer as RectLayer}         cardId={cardId} templateId={templateId} />}
      {layer.type === 'text'          && <TextProps         layer={layer as TextLayer}         cardId={cardId} templateId={templateId} />}
      {layer.type === 'badge'         && <BadgeProps        layer={layer as BadgeLayer}        cardId={cardId} templateId={templateId} />}
      {layer.type === 'phase-icons'   && <PhaseIconsProps   layer={layer as PhaseIconsLayer}   cardId={cardId} templateId={templateId} />}
      {layer.type === 'rarity-diamond'&& <RarityDiamondProps layer={layer as RarityDiamondLayer} cardId={cardId} templateId={templateId} />}
    </>
  )
}
