import type { Template, TemplateLayer } from '@/types/template'
import type { CardTemplateOverride } from '@/types/project'

/**
 * Returns a new Template with card-specific overrides applied:
 * - Layers marked hidden are removed
 * - Layer props are merged (sparse override)
 * - Extra card-only layers are appended
 *
 * Never mutates the original template.
 */
export function computeEffectiveTemplate(
  template: Template,
  override: CardTemplateOverride | undefined,
): Template {
  if (!override) return { ...template, layers: [...template.layers] }

  const { layerOverrides, extraLayers } = override

  function mergeLayer(l: TemplateLayer): TemplateLayer {
    const overrideProps = layerOverrides[l.id]?.props
    return (overrideProps ? { ...l, ...overrideProps } : { ...l }) as TemplateLayer
  }

  const effectiveLayers = template.layers
    .filter((l) => !layerOverrides[l.id]?.hidden)
    .map(mergeLayer)

  const mergedExtras = (extraLayers ?? []).map(mergeLayer)

  return {
    ...template,
    layers: [...effectiveLayers, ...mergedExtras],
  }
}
