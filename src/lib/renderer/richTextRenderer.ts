import Konva from 'konva'
import type { TextSpan } from '@/lib/richTextParser'

// Singleton off-screen canvas used only for text measurement.
let _measureCtx: CanvasRenderingContext2D | null = null
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!_measureCtx) {
    _measureCtx = document.createElement('canvas').getContext('2d')!
  }
  return _measureCtx
}

function fontString(bold: boolean, italic: boolean, fontSize: number, fontFamily: string): string {
  const style = bold && italic ? 'bold italic' : bold ? 'bold' : italic ? 'italic' : 'normal'
  return `${style} ${fontSize}px ${fontFamily}`
}

function measureWord(
  text: string,
  bold: boolean,
  italic: boolean,
  fontSize: number,
  fontFamily: string,
): number {
  const ctx = getMeasureCtx()
  ctx.font = fontString(bold, italic, fontSize, fontFamily)
  return ctx.measureText(text).width
}

// ---- Layout types --------------------------------------------------------

interface LayoutWord {
  text: string
  bold: boolean
  italic: boolean
  color?: string
  width: number
}

type LayoutLine = LayoutWord[]

// ---- Layout algorithm ----------------------------------------------------

/**
 * Splits spans into lines respecting `maxWidth` with greedy word-wrapping.
 * Explicit `\n` characters force a new line.
 */
function layoutSpans(
  spans: TextSpan[],
  maxWidth: number,
  fontSize: number,
  fontFamily: string,
): LayoutLine[] {
  const lines: LayoutLine[] = [[]]
  let currentWidth = 0

  const spaceWidth = measureWord(' ', false, false, fontSize, fontFamily)

  function pushWord(word: LayoutWord) {
    const currentLine = lines[lines.length - 1]
    const needSpace = currentLine.length > 0
    const totalWidth = currentWidth + (needSpace ? spaceWidth : 0) + word.width

    if (needSpace && totalWidth > maxWidth) {
      // Start a new line
      lines.push([word])
      currentWidth = word.width
    } else {
      currentLine.push(word)
      currentWidth = needSpace ? currentWidth + spaceWidth + word.width : word.width
    }
  }

  for (const span of spans) {
    // Split span text at explicit newlines first
    const paragraphs = span.text.split('\n')
    for (let pi = 0; pi < paragraphs.length; pi++) {
      if (pi > 0) {
        // Explicit line break
        lines.push([])
        currentWidth = 0
      }
      const para = paragraphs[pi]
      if (!para) continue

      // Split paragraph into words (split on spaces, discard empty tokens)
      const words = para.split(' ').filter((w) => w !== '')
      for (const wordText of words) {
        const w: LayoutWord = {
          text: wordText,
          bold: span.bold,
          italic: span.italic,
          color: span.color,
          width: measureWord(wordText, span.bold, span.italic, fontSize, fontFamily),
        }
        pushWord(w)
      }
    }
  }

  return lines
}

// ---- Scene function factory ----------------------------------------------

export interface RichTextOptions {
  spans: TextSpan[]
  width: number
  height: number
  fontSize: number
  fontFamily: string
  defaultColor: string
  lineHeight: number
  align: 'left' | 'center' | 'right'
}

type KonvaContext = { _context: CanvasRenderingContext2D }

export function makeRichTextSceneFunc(
  opts: RichTextOptions,
): (ctx: KonvaContext, shape: Konva.Shape) => void {
  return (ctx) => {
    const native = ctx._context
    const { spans, width, fontSize, fontFamily, defaultColor, lineHeight, align } = opts

    const lines = layoutSpans(spans, width, fontSize, fontFamily)
    const lineHeightPx = fontSize * lineHeight
    const spaceWidth = measureWord(' ', false, false, fontSize, fontFamily)

    native.save()
    native.textBaseline = 'top'

    lines.forEach((line, li) => {
      if (line.length === 0) return
      const y = li * lineHeightPx

      // Compute total line width for alignment
      const lineWidth = line.reduce((sum, w, wi) => sum + (wi > 0 ? spaceWidth : 0) + w.width, 0)

      let startX = 0
      if (align === 'center') startX = (width - lineWidth) / 2
      else if (align === 'right') startX = width - lineWidth

      let x = startX
      line.forEach((word, wi) => {
        if (wi > 0) x += spaceWidth
        native.font = fontString(word.bold, word.italic, fontSize, fontFamily)
        native.fillStyle = word.color ?? defaultColor
        native.fillText(word.text, x, y)
        x += word.width
      })
    })

    native.restore()
  }
}

// ---- Konva.Shape factory -------------------------------------------------

export function createRichTextShape(
  layerX: number,
  layerY: number,
  opts: RichTextOptions,
): Konva.Shape {
  return new (Konva.Shape as any)({
    x: layerX,
    y: layerY,
    width: opts.width,
    height: opts.height,
    sceneFunc: makeRichTextSceneFunc(opts),
  })
}
