export interface TextSpan {
  text: string
  bold: boolean
  italic: boolean
  /** Explicit color override. When undefined the layer's default fill is used. */
  color?: string
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Parses raw effect text into an array of styled spans.
 *
 * Rules applied in priority order (first match wins for any character range):
 *  1. Numbers suffixed with `@` (e.g. `3@`) → red number (@ stripped from display)
 *  2. Bold terms  (exact substring match, case-sensitive)
 *  3. Italic terms (exact substring match, case-sensitive)
 *  4. Everything else → plain span
 *
 * Newline escape sequences (`\n`) are preserved as-is; they are converted to
 * real newlines by `resolveFieldText` before this function is called.
 */
export function parseEffectText(
  rawText: string,
  boldTerms: string[],
  italicTerms: string[],
): TextSpan[] {
  if (!rawText) return []

  // Build match descriptors sorted from longest to shortest to prefer longer
  // terms over shorter ones (avoids "Attack" being swallowed by "Att").
  interface MatchDesc {
    pattern: RegExp
    bold: boolean
    italic: boolean
    red: boolean
  }

  const descs: MatchDesc[] = []

  // Red numbers — highest priority
  descs.push({ pattern: /\d+@/g, bold: false, italic: false, red: true })

  // Bold terms (longest first)
  const sortedBold = [...boldTerms].sort((a, b) => b.length - a.length)
  for (const term of sortedBold) {
    if (term) descs.push({ pattern: new RegExp(escapeRegex(term), 'g'), bold: true, italic: false, red: false })
  }

  // Italic terms (longest first)
  const sortedItalic = [...italicTerms].sort((a, b) => b.length - a.length)
  for (const term of sortedItalic) {
    if (term) descs.push({ pattern: new RegExp(escapeRegex(term), 'g'), bold: false, italic: true, red: false })
  }

  if (descs.length === 0) {
    return [{ text: rawText, bold: false, italic: false }]
  }

  // Collect all non-overlapping matches across the text.
  // We scan left-to-right; for each position we try each pattern in priority order.
  interface Interval {
    start: number
    end: number
    bold: boolean
    italic: boolean
    color?: string
    displayText: string
  }

  const intervals: Interval[] = []

  // Reset all patterns
  for (const d of descs) d.pattern.lastIndex = 0

  // Gather every raw match
  const rawMatches: Array<{ start: number; end: number; bold: boolean; italic: boolean; color?: string; displayText: string }> = []
  for (const d of descs) {
    d.pattern.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = d.pattern.exec(rawText)) !== null) {
      const displayText = d.red ? m[0].replace(/@$/, '') : m[0]
      rawMatches.push({
        start: m.index,
        end: m.index + m[0].length,
        bold: d.bold,
        italic: d.italic,
        color: d.red ? '#ff2222' : undefined,
        displayText,
      })
    }
  }

  // Sort by start position; ties broken by longer match (desc end)
  rawMatches.sort((a, b) => a.start - b.start || b.end - a.end)

  // Remove overlapping matches (keep the first / longest)
  let lastEnd = 0
  for (const m of rawMatches) {
    if (m.start >= lastEnd) {
      intervals.push(m)
      lastEnd = m.end
    }
  }

  // Build span array from intervals
  const spans: TextSpan[] = []
  let pos = 0
  for (const iv of intervals) {
    if (iv.start > pos) {
      spans.push({ text: rawText.slice(pos, iv.start), bold: false, italic: false })
    }
    spans.push({ text: iv.displayText, bold: iv.bold, italic: iv.italic, color: iv.color })
    pos = iv.end
  }
  if (pos < rawText.length) {
    spans.push({ text: rawText.slice(pos), bold: false, italic: false })
  }

  return spans.filter((s) => s.text !== '')
}
