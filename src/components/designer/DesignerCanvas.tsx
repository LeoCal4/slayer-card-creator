import { useEffect, useRef, useState, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Image, Circle, Group, Line, RegularPolygon } from 'react-konva'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { shouldShowLayer, resolveRectFill, resolveFieldText } from '@/lib/layerHelpers'
import { pushSnapshot } from '@/lib/undoRedo'
import type { RectLayer, TextLayer, ImageLayer, BadgeLayer, PhaseIconsLayer, RarityDiamondLayer, TemplateLayer } from '@/types/template'
import type { CardData } from '@/types/card'
import type { ClassConfig, RarityConfig } from '@/types/project'

interface Props {
  templateId: string
}

function snapToGrid(v: number, size: number) {
  return Math.round(v / size) * size
}

function useShiftKey() {
  const ref = useRef(false)
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === 'Shift') ref.current = true }
    const up = (e: KeyboardEvent) => { if (e.key === 'Shift') ref.current = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])
  return ref
}

function useDragBound() {
  const snap = useUiStore((s) => s.snapGridEnabled)
  const size = useUiStore((s) => s.snapGridSize)
  const shiftRef = useShiftKey()
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const bound = useCallback((pos: { x: number; y: number }) => {
    let { x, y } = pos
    if (shiftRef.current && dragStartRef.current) {
      const dx = Math.abs(x - dragStartRef.current.x)
      const dy = Math.abs(y - dragStartRef.current.y)
      if (dx >= dy) y = dragStartRef.current.y
      else x = dragStartRef.current.x
    }
    if (snap) {
      x = snapToGrid(x, size)
      y = snapToGrid(y, size)
    }
    return { x, y }
  }, [shiftRef, snap, size])

  const saveDragStart = useCallback((e: any) => {
    dragStartRef.current = { x: e.target.x(), y: e.target.y() }
  }, [])

  return { bound, saveDragStart }
}

function RectNode({
  layer, onSelect, fill, onDragMove, onDragEnd, onHover, onHoverEnd,
}: {
  layer: RectLayer
  onSelect: () => void
  fill: string
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const { bound, saveDragStart } = useDragBound()
  return (
    <Rect
      id={layer.id}
      x={layer.x} y={layer.y} width={layer.width} height={layer.height}
      fill={fill}
      cornerRadius={layer.cornerRadius}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth}
      opacity={layer.opacity ?? 1}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={bound}
      onDragStart={(e: any) => { saveDragStart(e); onSelect() }}
      onDragMove={(e: any) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    />
  )
}

function TextNode({
  layer, onSelect, previewCard, onDragMove, onDragEnd, onHover, onHoverEnd,
}: {
  layer: TextLayer
  onSelect: () => void
  previewCard: CardData | null
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const { bound, saveDragStart } = useDragBound()
  return (
    <Text
      id={layer.id}
      x={layer.x} y={layer.y} width={layer.width} height={layer.height}
      text={resolveFieldText(layer.field, previewCard)}
      fontSize={layer.fontSize}
      fontFamily={layer.fontFamily ?? 'sans-serif'}
      fontStyle={layer.fontStyle ?? 'normal'}
      fill={layer.fill ?? '#ffffff'}
      align={layer.align ?? 'left'}
      lineHeight={layer.lineHeight ?? 1}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={bound}
      onDragStart={(e: any) => { saveDragStart(e); onSelect() }}
      onDragMove={(e: any) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    />
  )
}

function ImageNode({
  layer, onSelect, frameBase64, onDragMove, onDragEnd, onHover, onHoverEnd,
}: {
  layer: ImageLayer
  onSelect: () => void
  frameBase64?: string
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const { bound, saveDragStart } = useDragBound()
  useEffect(() => {
    if (!frameBase64) { setImg(null); return }
    const el = new window.Image()
    el.onload = () => setImg(el)
    el.src = frameBase64
  }, [frameBase64])

  return (
    <Image
      id={layer.id}
      x={layer.x} y={layer.y} width={layer.width} height={layer.height}
      image={img ?? undefined}
      opacity={layer.opacity ?? 1}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={bound}
      onDragStart={(e: any) => { saveDragStart(e); onSelect() }}
      onDragMove={(e: any) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    />
  )
}

function BadgeNode({
  layer, onSelect, previewCard, onDragMove, onDragEnd, onHover, onHoverEnd,
}: {
  layer: BadgeLayer
  onSelect: () => void
  previewCard: CardData | null
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const r = Math.min(layer.width, layer.height) / 2
  const { bound, saveDragStart } = useDragBound()
  return (
    <Group
      id={layer.id}
      name="badge"
      x={layer.x}
      y={layer.y}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={bound}
      onDragStart={(e: any) => { saveDragStart(e); onSelect() }}
      onDragMove={(e: any) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <Circle x={layer.width / 2} y={layer.height / 2} radius={r} fill={layer.fill ?? '#000000'} stroke={layer.stroke} strokeWidth={layer.strokeWidth} />
      <Text
        x={0} y={0} width={layer.width} height={layer.height}
        text={resolveFieldText(layer.field, previewCard)}
        fontSize={layer.fontSize ?? 18}
        fill={layer.textFill ?? '#ffffff'}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  )
}

function PhaseIconsNode({
  layer, onSelect, phases, abbreviations, onDragMove, onDragEnd, onHover, onHoverEnd,
}: {
  layer: PhaseIconsLayer
  onSelect: () => void
  phases: string[]
  abbreviations: Record<string, string>
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const { iconSize, gap } = layer
  const { bound, saveDragStart } = useDragBound()
  return (
    <Group
      id={layer.id}
      name="phase-icons"
      x={layer.x}
      y={layer.y}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={bound}
      onDragStart={(e: any) => { saveDragStart(e); onSelect() }}
      onDragMove={(e: any) => onDragMove(e.target.x(), e.target.y())}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      {phases.map((phase, i) => {
        const offset = i * (iconSize + gap)
        const px = layer.orientation === 'horizontal' ? offset : 0
        const py = layer.orientation === 'vertical' ? offset : 0
        return (
          <Group key={phase} x={px} y={py}>
            <Rect
              width={iconSize} height={iconSize}
              fill={layer.fill ?? '#333333'}
              cornerRadius={layer.cornerRadius ?? 0}
            />
            <Text
              width={iconSize} height={iconSize}
              text={abbreviations[phase] ?? phase[0]}
              fontSize={layer.fontSize ?? Math.floor(iconSize * 0.6)}
              fontFamily="'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif"
              fill={layer.textFill ?? '#ffffff'}
              align="center"
              verticalAlign="middle"
            />
          </Group>
        )
      })}
    </Group>
  )
}

function RarityDiamondNode({
  layer, onSelect, rarityConfig, previewCard, onDragMove, onDragEnd, onHover, onHoverEnd,
}: {
  layer: RarityDiamondLayer
  onSelect: () => void
  rarityConfig: Record<string, RarityConfig>
  previewCard: CardData | null
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const { bound, saveDragStart } = useDragBound()
  const color = previewCard ? (rarityConfig[previewCard.rarity]?.color ?? '#888888') : '#888888'
  return (
    <RegularPolygon
      id={layer.id}
      x={layer.x + layer.width / 2}
      y={layer.y + layer.height / 2}
      sides={4}
      radius={Math.min(layer.width, layer.height) / 2}
      fill={color}
      stroke={layer.stroke}
      strokeWidth={layer.strokeWidth}
      opacity={layer.opacity ?? 1}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={bound}
      onDragStart={(e: any) => { saveDragStart(e); onSelect() }}
      onDragMove={(e: any) => onDragMove(e.target.x() - layer.width / 2, e.target.y() - layer.height / 2)}
      onDragEnd={(e: any) => onDragEnd(
        e.target.x() - layer.width / 2,
        e.target.y() - layer.height / 2,
      )}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    />
  )
}

function LayerNode({
  layer, onSelect, previewCard, classColors, rarityConfig, frameBase64, phases, abbreviations, onDragMove, onDragEnd, onHover, onHoverEnd,
}: {
  layer: TemplateLayer
  onSelect: () => void
  previewCard: CardData | null
  classColors: Record<string, ClassConfig>
  rarityConfig: Record<string, RarityConfig>
  frameBase64?: string
  phases: string[]
  abbreviations: Record<string, string>
  onDragMove: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  if (!shouldShowLayer(layer, previewCard)) return null
  if (layer.type === 'rect') {
    return (
      <RectNode
        layer={layer}
        onSelect={onSelect}
        fill={resolveRectFill(layer, classColors, previewCard)}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
      />
    )
  }
  if (layer.type === 'text') {
    return (
      <TextNode
        layer={layer}
        onSelect={onSelect}
        previewCard={previewCard}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
      />
    )
  }
  if (layer.type === 'image') {
    return (
      <ImageNode
        layer={layer}
        onSelect={onSelect}
        frameBase64={frameBase64}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
      />
    )
  }
  if (layer.type === 'badge') {
    return (
      <BadgeNode
        layer={layer}
        onSelect={onSelect}
        previewCard={previewCard}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
      />
    )
  }
  if (layer.type === 'phase-icons') {
    return (
      <PhaseIconsNode
        layer={layer}
        onSelect={onSelect}
        phases={phases}
        abbreviations={abbreviations}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
      />
    )
  }
  if (layer.type === 'rarity-diamond') {
    return (
      <RarityDiamondNode
        layer={layer}
        onSelect={onSelect}
        rarityConfig={rarityConfig}
        previewCard={previewCard}
        onDragMove={onDragMove}
        onDragEnd={onDragEnd}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
      />
    )
  }
  return null
}

export function DesignerCanvas({ templateId }: Props) {
  const project = useProjectStore((s) => s.project)
  const updateLayer = useProjectStore((s) => s.updateLayer)
  const setSelectedLayer = useUiStore((s) => s.setSelectedLayer)
  const selectedLayerId = useUiStore((s) => s.selectedLayerId)
  const previewCardId = useUiStore((s) => s.previewCardId)
  const snapGridEnabled = useUiStore((s) => s.snapGridEnabled)
  const snapGridSize = useUiStore((s) => s.snapGridSize)
  const stageRef = useRef<any>(null)
  const [hoveredLayerId, setHoveredLayerId] = useState<string | null>(null)
  const [dragPos, setDragPos] = useState<{ layerId: string; x: number; y: number } | null>(null)

  if (!project) return null
  const template = project.templates.find((t) => t.id === templateId)
  if (!template) return null

  const previewCard = project.cards.find((c) => c.id === previewCardId) ?? null
  const classColors = project.classColors
  const rarityConfig = project.rarityConfig
  const frameBase64 = project.frameImages[templateId]
  const phases = previewCard ? (project.phaseMap[previewCard.type] ?? []) : []
  const abbreviations = project.phaseAbbreviations
  const visibleLayers = template.layers.filter((l) => l.visible !== false)
  const { width, height } = template.canvas

  const gridLines: { x?: number; y?: number }[] = []
  if (snapGridEnabled) {
    for (let x = 0; x <= width; x += snapGridSize) gridLines.push({ x })
    for (let y = 0; y <= height; y += snapGridSize) gridLines.push({ y })
  }

  // For phase-icons, the rendered bounding box depends on orientation × phase count,
  // not the stored layer.width/height. Compute actual overlay dimensions here.
  function getOverlayDims(layer: TemplateLayer): { width: number; height: number } {
    if (layer.type === 'phase-icons' && phases.length > 0) {
      const { iconSize, gap, orientation } = layer
      const total = phases.length * iconSize + (phases.length - 1) * gap
      return orientation === 'horizontal'
        ? { width: total, height: iconSize }
        : { width: iconSize, height: total }
    }
    return { width: layer.width, height: layer.height }
  }

  // Overlay layers — only shown if the layer passes shouldShowLayer
  const hoveredLayer =
    hoveredLayerId && hoveredLayerId !== selectedLayerId
      ? visibleLayers.find((l) => l.id === hoveredLayerId)
      : null
  const hoveredVisible = hoveredLayer && shouldShowLayer(hoveredLayer, previewCard) ? hoveredLayer : null

  const selectedLayer = selectedLayerId ? visibleLayers.find((l) => l.id === selectedLayerId) : null
  const selectedVisible = selectedLayer && shouldShowLayer(selectedLayer, previewCard) ? selectedLayer : null

  const hoveredDims = hoveredVisible ? getOverlayDims(hoveredVisible) : null
  const selectedDims = selectedVisible ? getOverlayDims(selectedVisible) : null

  // Use live drag position when dragging the selected layer
  const overlayX = dragPos?.layerId === selectedLayerId ? dragPos.x : selectedVisible?.x
  const overlayY = dragPos?.layerId === selectedLayerId ? dragPos.y : selectedVisible?.y

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onClick={() => setSelectedLayer(null)}
    >
      <Layer>
        {visibleLayers.map((layer) => (
          <LayerNode
            key={layer.id}
            layer={layer}
            onSelect={() => setSelectedLayer(layer.id)}
            previewCard={previewCard}
            classColors={classColors}
            rarityConfig={rarityConfig}
            frameBase64={frameBase64}
            phases={phases}
            abbreviations={abbreviations}
            onDragMove={(x, y) => setDragPos({ layerId: layer.id, x, y })}
            onDragEnd={(x, y) => { pushSnapshot(template.layers); updateLayer(templateId, layer.id, { x, y }); setDragPos(null) }}
            onHover={() => setHoveredLayerId(layer.id)}
            onHoverEnd={() => setHoveredLayerId(null)}
          />
        ))}

        {/* Hover overlay — white outline */}
        {hoveredVisible && hoveredDims && (
          <Rect
            x={hoveredVisible.x} y={hoveredVisible.y}
            width={hoveredDims.width} height={hoveredDims.height}
            stroke="#ffffff" strokeWidth={2} opacity={0.6}
            fill="transparent" listening={false}
          />
        )}

        {/* Selection overlay — dashed indigo outline, follows drag */}
        {selectedVisible && selectedDims && overlayX !== undefined && overlayY !== undefined && (
          <Rect
            x={overlayX} y={overlayY}
            width={selectedDims.width} height={selectedDims.height}
            stroke="#6366f1" strokeWidth={2} dash={[4, 4]}
            fill="transparent" listening={false}
          />
        )}
      </Layer>
      {snapGridEnabled && (
        <Layer listening={false}>
          {gridLines.map((gl, i) =>
            gl.x !== undefined ? (
              <Line key={`gx${i}`} points={[gl.x, 0, gl.x, height]} stroke="#ffffff" strokeWidth={0.5} opacity={0.25} />
            ) : (
              <Line key={`gy${i}`} points={[0, gl.y!, width, gl.y!]} stroke="#ffffff" strokeWidth={0.5} opacity={0.25} />
            )
          )}
        </Layer>
      )}
    </Stage>
  )
}
