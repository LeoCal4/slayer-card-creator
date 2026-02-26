import { useProjectStore } from '@/store/projectStore'
import { ColorPicker } from '@/components/common/ColorPicker'
import type { Rarity } from '@/types/card'

const RARITIES: Rarity[] = ['common', 'rare', 'epic']

export function RarityConfigTable() {
  const project = useProjectStore((s) => s.project)
  const updateRarityConfig = useProjectStore((s) => s.updateRarityConfig)

  if (!project) return null

  return (
    <div className="space-y-3">
      <table className="text-sm border-collapse w-full max-w-lg">
        <thead>
          <tr>
            <th className="text-left text-neutral-500 text-xs font-normal pb-2 pr-4 w-20">Rarity</th>
            <th className="text-left text-neutral-500 text-xs font-normal pb-2 pr-4">Aliases (comma-separated)</th>
            <th className="text-left text-neutral-500 text-xs font-normal pb-2">Color</th>
          </tr>
        </thead>
        <tbody>
          {RARITIES.map((rarity) => {
            const cfg = project.rarityConfig[rarity]
            return (
              <tr key={rarity}>
                <td className="text-neutral-300 text-xs pr-4 py-1 capitalize">{rarity}</td>
                <td className="pr-4 py-1">
                  <input
                    aria-label={`${rarity} aliases`}
                    type="text"
                    value={cfg.aliases.join(',')}
                    onChange={(e) =>
                      updateRarityConfig(rarity, {
                        aliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </td>
                <td className="py-1">
                  <ColorPicker
                    value={cfg.color}
                    onChange={(hex) => updateRarityConfig(rarity, { color: hex })}
                  />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
