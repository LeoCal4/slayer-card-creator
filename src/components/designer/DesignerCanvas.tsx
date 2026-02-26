import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Image, Circle, Group, Line } from 'react-konva'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { shouldShowLayer, resolveRectFill, resolveFieldText } from '@/lib/layerHelpers'
import type { RectLayer, TextLayer, ImageLayer, BadgeLayer, PhaseIconsLayer, TemplateLayer } from '@/types/template'
import type { CardData } from '@/types/card'
import type { ClassConfig } from '@/types/project'

interface Props {
  templateId: string
}

function snapToGrid(v: number, size: number) {
  return Math.round(v / size) * size
}

function useSnapBound() {
  const snap = useUiStore((s) => s.snapGridEnabled)
  const size = useUiStore((s) => s.snapGridSize)
  return snap
    ? (pos: any) => ({ x: snapToGrid(pos.x, size), y: snapToGrid(pos.y, size) })
    : undefined
}

function RectNode({
  layer, onSelect, fill, onDragEnd, onHover, onHoverEnd,
}: {
  layer: RectLayer
  onSelect: () => void
  fill: string
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const snapBound = useSnapBound()
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
      dragBoundFunc={snapBound}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    />
  )
}

function TextNode({
  layer, onSelect, previewCard, onDragEnd, onHover, onHoverEnd,
}: {
  layer: TextLayer
  onSelect: () => void
  previewCard: CardData | null
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const snapBound = useSnapBound()
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
      dragBoundFunc={snapBound}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    />
  )
}

function ImageNode({
  layer, onSelect, frameBase64, onDragEnd, onHover, onHoverEnd,
}: {
  layer: ImageLayer
  onSelect: () => void
  frameBase64?: string
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const [img, setImg] = useState<HTMLImageElement | null>(null)
  const snapBound = useSnapBound()
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
      dragBoundFunc={snapBound}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    />
  )
}

function BadgeNode({
  layer, onSelect, previewCard, onDragEnd, onHover, onHoverEnd,
}: {
  layer: BadgeLayer
  onSelect: () => void
  previewCard: CardData | null
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const r = Math.min(layer.width, layer.height) / 2
  const snapBound = useSnapBound()
  return (
    <Group
      id={layer.id}
      name="badge"
      x={layer.x}
      y={layer.y}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={snapBound}
      onDragEnd={(e: any) => onDragEnd(e.target.x(), e.target.y())}
      onMouseEnter={onHover}
      onMouseLeave={onHoverEnd}
    >
      <Circle x={layer.width / 2} y={layer.height / 2} radius={r} fill={layer.fill ?? '#000000'} />
      <Text
        x={0} y={0} width={layer.width} height={layer.height}
        text={resolveFieldText(layer.field, previewCard)}
        fontSize={layer.fontSize ?? 18}
        fill={layer.textFill ?? '#ffffff'}
        align="center"
      />
    </Group>
  )
}

function PhaseIconsNode({
  layer, onSelect, phases, abbreviations, onDragEnd, onHover, onHoverEnd,
}: {
  layer: PhaseIconsLayer
  onSelect: () => void
  phases: string[]
  abbreviations: Record<string, string>
  onDragEnd: (x: number, y: number) => void
  onHover: () => void
  onHoverEnd: () => void
}) {
  const { iconSize, gap } = layer
  const snapBound = useSnapBound()
  return (
    <Group
      id={layer.id}
      name="phase-icons"
      x={layer.x}
      y={layer.y}
      onClick={(e: any) => { e.cancelBubble = true; onSelect() }}
      draggable={!layer.locked}
      dragBoundFunc={snapBound}
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
              fontSize={Math.floor(iconSize * 0.6)}
              fill={layer.textFill ?? '#ffffff'}
              align="center"
            />
          </Group>
        )
      })}
    </Group>
  )
}

function LayerNode({
  layer, onSelect, previewCard, classColors, frameBase64, phases, abbreviations, onDragEnd, onHover, onHoverEnd,
}: {
  layer: TemplateLayer
  onSelect: () => void
  previewCard: CardData | null
  classColors: Record<string, ClassConfig>
  frameBase64?: string
  phases: string[]
  abbreviations: Record<string, string>
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

  if (!project) return null
  const template = project.templates.find((t) => t.id === templateId)
  if (!template) return null

  const previewCard = project.cards.find((c) => c.id === previewCardId) ?? null
  const classColors = project.classColors
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

  // Overlay layers — only shown if the layer passes shouldShowLayer
  const hoveredLayer =
    hoveredLayerId && hoveredLayerId !== selectedLayerId
      ? visibleLayers.find((l) => l.id === hoveredLayerId)
      : null
  const hoveredVisible = hoveredLayer && shouldShowLayer(hoveredLayer, previewCard) ? hoveredLayer : null

  const selectedLayer = selectedLayerId ? visibleLayers.find((l) => l.id === selectedLayerId) : null
  const selectedVisible = selectedLayer && shouldShowLayer(selectedLayer, previewCard) ? selectedLayer : null

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      onClick={() => setSelectedLayer(null)}
    >
      <Layer>
        {snapGridEnabled && gridLines.map((gl, i) =>
          gl.x !== undefined ? (
            <Line key={`gx${i}`} points={[gl.x, 0, gl.x, height]} stroke="#ffffff" strokeWidth={0.3} opacity={0.15} />
          ) : (
            <Line key={`gy${i}`} points={[0, gl.y!, width, gl.y!]} stroke="#ffffff" strokeWidth={0.3} opacity={0.15} />
          )
        )}
        {visibleLayers.map((layer) => (
          <LayerNode
            key={layer.id}
            layer={layer}
            onSelect={() => setSelectedLayer(layer.id)}
            previewCard={previewCard}
            classColors={classColors}
            frameBase64={frameBase64}
            phases={phases}
            abbreviations={abbreviations}
            onDragEnd={(x, y) => updateLayer(templateId, layer.id, { x, y })}
            onHover={() => setHoveredLayerId(layer.id)}
            onHoverEnd={() => setHoveredLayerId(null)}
          />
        ))}

        {/* Hover overlay — subtle white outline */}
        {hoveredVisible && (
          <Rect
            x={hoveredVisible.x} y={hoveredVisible.y}
            width={hoveredVisible.width} height={hoveredVisible.height}
            stroke="#ffffff" strokeWidth={1} opacity={0.35}
            fill="transparent" listening={false}
          />
        )}

        {/* Selection overlay — dashed indigo outline */}
        {selectedVisible && (
          <Rect
            x={selectedVisible.x} y={selectedVisible.y}
            width={selectedVisible.width} height={selectedVisible.height}
            stroke="#6366f1" strokeWidth={2} dash={[4, 4]}
            fill="transparent" listening={false}
          />
        )}
      </Layer>
    </Stage>
  )
}
