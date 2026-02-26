import { describe, it, expect } from 'vitest'
import { serialize, deserialize } from './projectFile'
import type { ProjectFile } from '@/types/project'

const MINIMAL: ProjectFile = {
  version: 1,
  set: { name: 'Test Set', code: 'TST', type: 'Custom', releaseDate: '' },
  classColors: {},
  phaseAbbreviations: {},
  phaseMap: {},
  templates: [],
  cards: [],
  artFolderPath: '',
  frameImages: {},
}

describe('serialize', () => {
  it('returns a parseable JSON string', () => {
    expect(() => JSON.parse(serialize(MINIMAL))).not.toThrow()
  })

  it('uses 2-space indentation', () => {
    expect(serialize(MINIMAL)).toContain('  "version"')
  })

  it('round-trips the data', () => {
    const result = JSON.parse(serialize(MINIMAL)) as ProjectFile
    expect(result.version).toBe(1)
    expect(result.set.name).toBe('Test Set')
  })
})

describe('deserialize', () => {
  it('returns a valid project for correct input', () => {
    const result = deserialize(serialize(MINIMAL))
    expect(result.version).toBe(1)
    expect(result.set.code).toBe('TST')
  })

  it('throws for invalid JSON', () => {
    expect(() => deserialize('not json')).toThrow()
  })

  it('throws when input is not an object', () => {
    expect(() => deserialize('"a string"')).toThrow('not an object')
  })

  it('throws when version is missing', () => {
    const { version: _v, ...rest } = MINIMAL
    expect(() => deserialize(JSON.stringify(rest))).toThrow('version')
  })

  it('throws when a required key is missing', () => {
    const { templates: _t, ...rest } = MINIMAL
    expect(() => deserialize(JSON.stringify(rest))).toThrow('templates')
  })
})
