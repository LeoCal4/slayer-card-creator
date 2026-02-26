import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'

function freshStore() {
  useProjectStore.setState({ project: null })
}

describe('newProject — starter templates', () => {
  beforeEach(freshStore)

  it('creates a project with 4 starter templates', () => {
    useProjectStore.getState().newProject()
    expect(useProjectStore.getState().project?.templates).toHaveLength(4)
  })

  it('includes a Slayer/Errant template', () => {
    useProjectStore.getState().newProject()
    const templates = useProjectStore.getState().project?.templates ?? []
    const t = templates.find((t) => t.cardTypes.includes('Slayer'))
    expect(t).toBeDefined()
    expect(t?.cardTypes).toContain('Errant')
  })

  it('includes an Action/Ploy template', () => {
    useProjectStore.getState().newProject()
    const templates = useProjectStore.getState().project?.templates ?? []
    const t = templates.find((t) => t.cardTypes.includes('Action'))
    expect(t).toBeDefined()
    expect(t?.cardTypes).toContain('Ploy')
  })

  it('includes a Chamber/Relic template', () => {
    useProjectStore.getState().newProject()
    const templates = useProjectStore.getState().project?.templates ?? []
    const t = templates.find((t) => t.cardTypes.includes('Chamber'))
    expect(t).toBeDefined()
    expect(t?.cardTypes).toContain('Relic')
  })

  it('includes a Dungeon/Phase template', () => {
    useProjectStore.getState().newProject()
    const templates = useProjectStore.getState().project?.templates ?? []
    const t = templates.find((t) => t.cardTypes.includes('Dungeon'))
    expect(t).toBeDefined()
    expect(t?.cardTypes).toContain('Phase')
  })

  it('each starter template has at least one layer', () => {
    useProjectStore.getState().newProject()
    const templates = useProjectStore.getState().project?.templates ?? []
    for (const t of templates) {
      expect(t.layers.length).toBeGreaterThan(0)
    }
  })
})
