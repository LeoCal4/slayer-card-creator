import { describe, it, expect } from 'vitest'
import { computeEffectiveTemplate } from './cardOverrides'
import type { Template } from '@/types/template'
import type { CardTemplateOverride } from '@/types/project'

const BASE_TEMPLATE: Template = {
  id: 'tmpl-1',
  name: 'Test',
  cardTypes: ['Action'],
  canvas: { width: 375, height: 523 },
  layers: [
    { id: 'l1', type: 'text', x: 0, y: 0, width: 100, height: 20, fontSize: 16, field: 'name' },
    { id: 'l2', type: 'text', x: 0, y: 30, width: 200, height: 60, fontSize: 12, field: 'effect' },
    { id: 'l3', type: 'rect', x: 0, y: 0, width: 375, height: 523 },
  ],
}

describe('computeEffectiveTemplate', () => {
  it('returns template layers unchanged when no override is provided', () => {
    const result = computeEffectiveTemplate(BASE_TEMPLATE, undefined)
    expect(result.layers).toHaveLength(3)
    expect(result.layers[0]).toEqual(BASE_TEMPLATE.layers[0])
  })

  it('returns template layers unchanged when override has no entries', () => {
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: {},
      extraLayers: [],
    }
    const result = computeEffectiveTemplate(BASE_TEMPLATE, override)
    expect(result.layers).toHaveLength(3)
  })

  it('merges props override into the matching base layer', () => {
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: { l2: { props: { fontSize: 9 } } },
      extraLayers: [],
    }
    const result = computeEffectiveTemplate(BASE_TEMPLATE, override)
    const l2 = result.layers.find((l) => l.id === 'l2')!
    expect((l2 as any).fontSize).toBe(9)
  })

  it('preserves non-overridden props on a partially overridden layer', () => {
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: { l2: { props: { fontSize: 9 } } },
      extraLayers: [],
    }
    const result = computeEffectiveTemplate(BASE_TEMPLATE, override)
    const l2 = result.layers.find((l) => l.id === 'l2')!
    expect((l2 as any).field).toBe('effect')
  })

  it('filters out layers marked as hidden', () => {
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: { l1: { hidden: true } },
      extraLayers: [],
    }
    const result = computeEffectiveTemplate(BASE_TEMPLATE, override)
    expect(result.layers.find((l) => l.id === 'l1')).toBeUndefined()
    expect(result.layers).toHaveLength(2)
  })

  it('does not filter a layer whose hidden flag is false', () => {
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: { l1: { hidden: false } },
      extraLayers: [],
    }
    const result = computeEffectiveTemplate(BASE_TEMPLATE, override)
    expect(result.layers.find((l) => l.id === 'l1')).toBeDefined()
  })

  it('appends extra layers after the base layers', () => {
    const extra = { id: 'extra-1', type: 'rect' as const, x: 0, y: 0, width: 10, height: 10 }
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: {},
      extraLayers: [extra],
    }
    const result = computeEffectiveTemplate(BASE_TEMPLATE, override)
    expect(result.layers).toHaveLength(4)
    expect(result.layers[3].id).toBe('extra-1')
  })

  it('does not mutate the original template', () => {
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: { l2: { props: { fontSize: 9 } } },
      extraLayers: [],
    }
    computeEffectiveTemplate(BASE_TEMPLATE, override)
    expect((BASE_TEMPLATE.layers[1] as any).fontSize).toBe(12)
  })

  it('returns a new template object (not the same reference)', () => {
    const result = computeEffectiveTemplate(BASE_TEMPLATE, undefined)
    expect(result).not.toBe(BASE_TEMPLATE)
  })

  it('preserves template metadata (id, name, canvas, cardTypes)', () => {
    const result = computeEffectiveTemplate(BASE_TEMPLATE, undefined)
    expect(result.id).toBe('tmpl-1')
    expect(result.name).toBe('Test')
    expect(result.canvas).toEqual({ width: 375, height: 523 })
    expect(result.cardTypes).toEqual(['Action'])
  })

  it('can both hide a layer and apply props to another layer in the same override', () => {
    const override: CardTemplateOverride = {
      templateId: 'tmpl-1',
      layerOverrides: {
        l1: { hidden: true },
        l2: { props: { fontSize: 8 } },
      },
      extraLayers: [],
    }
    const result = computeEffectiveTemplate(BASE_TEMPLATE, override)
    expect(result.layers.find((l) => l.id === 'l1')).toBeUndefined()
    expect((result.layers.find((l) => l.id === 'l2') as any).fontSize).toBe(8)
  })
})
