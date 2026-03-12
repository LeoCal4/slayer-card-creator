import { describe, it, expect } from 'vitest'
import { parseEffectText } from './richTextParser'
import type { TextSpan } from './richTextParser'

// ─── helpers ─────────────────────────────────────────────────────────────────

function plain(text: string): TextSpan {
  return { text, bold: false, italic: false }
}
function bold(text: string): TextSpan {
  return { text, bold: true, italic: false }
}
function italic(text: string): TextSpan {
  return { text, bold: false, italic: true }
}
function red(text: string): TextSpan {
  return { text, bold: true, italic: false, color: '#ff2222' }
}

// ─── empty / trivial input ────────────────────────────────────────────────────

describe('parseEffectText – empty input', () => {
  it('returns [] for empty string', () => {
    expect(parseEffectText('', [], [])).toEqual([])
  })

  it('returns a single plain span when no terms match', () => {
    expect(parseEffectText('Deal damage.', [], [])).toEqual([plain('Deal damage.')])
  })

  it('returns a single plain span when term lists are non-empty but nothing matches', () => {
    expect(parseEffectText('Draw a card.', ['Strike'], ['Retreat'])).toEqual([
      plain('Draw a card.'),
    ])
  })
})

// ─── bold terms ───────────────────────────────────────────────────────────────

describe('parseEffectText – bold terms', () => {
  it('wraps a bold term in a bold span', () => {
    expect(parseEffectText('Strike and run.', ['Strike'], [])).toEqual([
      bold('Strike'),
      plain(' and run.'),
    ])
  })

  it('wraps all occurrences of a bold term', () => {
    expect(parseEffectText('Strike, then Strike again.', ['Strike'], [])).toEqual([
      bold('Strike'),
      plain(', then '),
      bold('Strike'),
      plain(' again.'),
    ])
  })

  it('is case-sensitive — does not match different casing', () => {
    const spans = parseEffectText('strike.', ['Strike'], [])
    expect(spans).toEqual([plain('strike.')])
  })

  it('handles a bold term at the very end', () => {
    expect(parseEffectText('Do the Strike', ['Strike'], [])).toEqual([
      plain('Do the '),
      bold('Strike'),
    ])
  })

  it('handles multiple distinct bold terms', () => {
    expect(parseEffectText('Strike then Parry.', ['Strike', 'Parry'], [])).toEqual([
      bold('Strike'),
      plain(' then '),
      bold('Parry'),
      plain('.'),
    ])
  })

  it('prefers longer bold term when one is a prefix of another', () => {
    // "Attack" should win over "Att" since longest wins
    expect(parseEffectText('Attack!', ['Att', 'Attack'], [])).toEqual([
      bold('Attack'),
      plain('!'),
    ])
  })
})

// ─── italic terms ─────────────────────────────────────────────────────────────

describe('parseEffectText – italic terms', () => {
  it('wraps an italic term in an italic span', () => {
    expect(parseEffectText('Gain Stealth.', [], ['Stealth'])).toEqual([
      plain('Gain '),
      italic('Stealth'),
      plain('.'),
    ])
  })

  it('wraps multiple occurrences of an italic term', () => {
    expect(parseEffectText('Stealth and Stealth.', [], ['Stealth'])).toEqual([
      italic('Stealth'),
      plain(' and '),
      italic('Stealth'),
      plain('.'),
    ])
  })

  it('handles multiple distinct italic terms', () => {
    expect(parseEffectText('Use Stealth or Haste.', [], ['Stealth', 'Haste'])).toEqual([
      plain('Use '),
      italic('Stealth'),
      plain(' or '),
      italic('Haste'),
      plain('.'),
    ])
  })

  it('prefers longer italic term when one is a prefix of another', () => {
    expect(parseEffectText('Hasten up.', [], ['Has', 'Hasten'])).toEqual([
      italic('Hasten'),
      plain(' up.'),
    ])
  })
})

// ─── red numbers (@-suffix) ───────────────────────────────────────────────────

describe('parseEffectText – red numbers', () => {
  it('renders a @-suffixed number as red and strips the @', () => {
    expect(parseEffectText('Deal 3@ damage.', [], [])).toEqual([
      plain('Deal '),
      red('3'),
      plain(' damage.'),
    ])
  })

  it('strips the @ from multi-digit numbers', () => {
    expect(parseEffectText('Gain 10@ HP.', [], [])).toEqual([
      plain('Gain '),
      red('10'),
      plain(' HP.'),
    ])
  })

  it('handles multiple @-numbers in one text', () => {
    expect(parseEffectText('Deal 2@ and 5@ damage.', [], [])).toEqual([
      plain('Deal '),
      red('2'),
      plain(' and '),
      red('5'),
      plain(' damage.'),
    ])
  })

  it('does not mark a plain number as red', () => {
    const spans = parseEffectText('Deal 3 damage.', [], [])
    expect(spans).toEqual([plain('Deal 3 damage.')])
  })

  it('@-number at the start of the text', () => {
    expect(parseEffectText('3@ arrows.', [], [])).toEqual([
      red('3'),
      plain(' arrows.'),
    ])
  })

  it('@-number at the very end of the text', () => {
    expect(parseEffectText('Roll d20@', [], [])).toEqual([
      plain('Roll d'),
      red('20'),
    ])
  })
})

// ─── priority: red > bold > italic ───────────────────────────────────────────

describe('parseEffectText – priority order', () => {
  it('red number wins over a bold term that overlaps it', () => {
    // "3@" sits inside a potential bold term "3@" — red always wins
    expect(parseEffectText('Deal 3@ damage.', ['3@'], [])).toEqual([
      plain('Deal '),
      red('3'),
      plain(' damage.'),
    ])
  })

  it('bold term wins over italic term at the same position', () => {
    // "Strike" in both lists — bold has higher priority
    expect(parseEffectText('Strike hard.', ['Strike'], ['Strike'])).toEqual([
      bold('Strike'),
      plain(' hard.'),
    ])
  })

  it('non-overlapping bold and italic terms coexist', () => {
    expect(parseEffectText('Strike with Haste.', ['Strike'], ['Haste'])).toEqual([
      bold('Strike'),
      plain(' with '),
      italic('Haste'),
      plain('.'),
    ])
  })

  it('@-number adjacent to a bold term are both highlighted', () => {
    expect(parseEffectText('Deal 4@ Strike damage.', ['Strike'], [])).toEqual([
      plain('Deal '),
      red('4'),
      plain(' '),
      bold('Strike'),
      plain(' damage.'),
    ])
  })
})

// ─── edge cases ───────────────────────────────────────────────────────────────

describe('parseEffectText – edge cases', () => {
  it('does not produce empty spans', () => {
    const spans = parseEffectText('Strike', ['Strike'], [])
    expect(spans.every((s) => s.text !== '')).toBe(true)
  })

  it('handles text that is entirely a bold term', () => {
    expect(parseEffectText('Strike', ['Strike'], [])).toEqual([bold('Strike')])
  })

  it('handles text that is entirely a @-number', () => {
    expect(parseEffectText('42@', [], [])).toEqual([red('42')])
  })

  it('ignores empty string entries in boldTerms', () => {
    expect(parseEffectText('Hello world.', ['', 'world'], [])).toEqual([
      plain('Hello '),
      bold('world'),
      plain('.'),
    ])
  })

  it('ignores empty string entries in italicTerms', () => {
    expect(parseEffectText('Hello world.', [], ['', 'world'])).toEqual([
      plain('Hello '),
      italic('world'),
      plain('.'),
    ])
  })

  it('handles regex special characters in bold terms', () => {
    // The term "(Attack)" contains parens — must be escaped
    expect(parseEffectText('Use (Attack) now.', ['(Attack)'], [])).toEqual([
      plain('Use '),
      bold('(Attack)'),
      plain(' now.'),
    ])
  })

  it('handles regex special characters in italic terms', () => {
    expect(parseEffectText('Roll d6+2 damage.', [], ['d6+2'])).toEqual([
      plain('Roll '),
      italic('d6+2'),
      plain(' damage.'),
    ])
  })

  it('preserves newline characters in plain spans', () => {
    const spans = parseEffectText('Line one\nLine two.', [], [])
    expect(spans).toEqual([plain('Line one\nLine two.')])
  })

  it('handles bold term split by a newline (no match expected)', () => {
    // "Strike\nHard" should not match bold term "StrikeHard"
    const spans = parseEffectText('Strike\nHard.', ['StrikeHard'], [])
    expect(spans).toEqual([plain('Strike\nHard.')])
  })
})
