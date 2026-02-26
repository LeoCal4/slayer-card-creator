import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useProjectStore } from '@/store/projectStore'
import { CardRow } from './CardRow'
import { EmptyState } from '@/components/common/EmptyState'
import type { CardData, CardType, Rarity } from '@/types/card'

const CARD_TYPES: CardType[] = [
  'Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase',
]
const RARITIES: Rarity[] = ['common', 'rare', 'epic']

function isCellDisabled(field: 'cost' | 'power' | 'hp' | 'vp', type: CardType): boolean {
  switch (field) {
    case 'power':
    case 'hp': return type !== 'Slayer' && type !== 'Errant'
    case 'vp': return type !== 'Errant'
    case 'cost': return type === 'Dungeon' || type === 'Phase'
  }
}

function sortAriaLabel(sorted: false | 'asc' | 'desc'): 'ascending' | 'descending' | undefined {
  if (sorted === 'asc') return 'ascending'
  if (sorted === 'desc') return 'descending'
  return undefined
}

export function CardTable() {
  const project = useProjectStore((s) => s.project)
  const updateCard = useProjectStore((s) => s.updateCard)
  const deleteCard = useProjectStore((s) => s.deleteCard)
  const addCard = useProjectStore((s) => s.addCard)

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  const columns = useMemo<ColumnDef<CardData>[]>(
    () => [
      {
        id: 'delete',
        header: '',
        cell: ({ row }) => (
          <button
            aria-label="delete"
            onClick={() => {
              if (window.confirm('Delete this card?')) deleteCard(row.original.id)
            }}
            className="px-1 text-red-500 hover:text-red-400 text-xs"
          >
            ✕
          </button>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }) => (
          <input
            aria-label="name"
            className="bg-transparent w-full text-sm text-neutral-100 outline-none"
            value={row.original.name}
            onChange={(e) => updateCard(row.original.id, { name: e.target.value })}
          />
        ),
      },
      {
        accessorKey: 'class',
        header: 'Class',
        cell: ({ row }) => (
          <input
            aria-label="class"
            className="bg-transparent w-full text-sm text-neutral-100 outline-none"
            value={row.original.class}
            onChange={(e) => updateCard(row.original.id, { class: e.target.value })}
          />
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <select
            aria-label="type"
            className="bg-neutral-800 text-sm text-neutral-100 rounded"
            value={row.original.type}
            onChange={(e) => updateCard(row.original.id, { type: e.target.value as CardType })}
          >
            {CARD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        ),
      },
      {
        accessorKey: 'rarity',
        header: 'Rarity',
        cell: ({ row }) => (
          <select
            aria-label="rarity"
            className="bg-neutral-800 text-sm text-neutral-100 rounded"
            value={row.original.rarity}
            onChange={(e) => updateCard(row.original.id, { rarity: e.target.value as Rarity })}
          >
            {RARITIES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        ),
      },
      {
        accessorKey: 'cost',
        header: 'Cost',
        cell: ({ row }) => (
          <input
            aria-label="cost"
            type="number"
            min={0}
            className="bg-transparent w-12 text-sm text-neutral-100 outline-none disabled:opacity-30"
            value={row.original.cost ?? ''}
            disabled={isCellDisabled('cost', row.original.type)}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
              updateCard(row.original.id, { cost: val })
            }}
          />
        ),
      },
      {
        accessorKey: 'power',
        header: 'Power',
        cell: ({ row }) => (
          <input
            aria-label="power"
            type="number"
            min={0}
            className="bg-transparent w-12 text-sm text-neutral-100 outline-none disabled:opacity-30"
            value={row.original.power ?? ''}
            disabled={isCellDisabled('power', row.original.type)}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
              updateCard(row.original.id, { power: val })
            }}
          />
        ),
      },
      {
        accessorKey: 'hp',
        header: 'HP',
        cell: ({ row }) => (
          <input
            aria-label="hp"
            type="number"
            min={0}
            className="bg-transparent w-12 text-sm text-neutral-100 outline-none disabled:opacity-30"
            value={row.original.hp ?? ''}
            disabled={isCellDisabled('hp', row.original.type)}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
              updateCard(row.original.id, { hp: val })
            }}
          />
        ),
      },
      {
        accessorKey: 'vp',
        header: 'VP',
        cell: ({ row }) => (
          <input
            aria-label="vp"
            type="number"
            min={0}
            className="bg-transparent w-12 text-sm text-neutral-100 outline-none disabled:opacity-30"
            value={row.original.vp ?? ''}
            disabled={isCellDisabled('vp', row.original.type)}
            onChange={(e) => {
              const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
              updateCard(row.original.id, { vp: val })
            }}
          />
        ),
      },
      {
        accessorKey: 'effect',
        header: 'Effect',
        cell: ({ row }) => (
          <input
            aria-label="effect"
            className="bg-transparent w-full text-sm text-neutral-100 outline-none"
            value={row.original.effect}
            onChange={(e) => updateCard(row.original.id, { effect: e.target.value })}
          />
        ),
      },
    ],
    [updateCard, deleteCard],
  )

  const table = useReactTable({
    data: project?.cards ?? [],
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue: string) => {
      const search = filterValue.toLowerCase()
      return (
        row.original.name.toLowerCase().includes(search) ||
        row.original.effect.toLowerCase().includes(search)
      )
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  if (!project) {
    return <p className="p-6 text-neutral-400">No project loaded.</p>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-2 border-b border-neutral-800">
        <input
          role="searchbox"
          type="search"
          placeholder="Filter by name or effect…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="flex-1 bg-neutral-800 text-sm text-neutral-100 rounded px-3 py-1 outline-none placeholder:text-neutral-500"
        />
        <button
          onClick={() =>
            addCard({
              id: crypto.randomUUID(),
              name: '',
              class: '',
              type: 'Action',
              rarity: 'common',
              effect: '',
            })
          }
          className="px-3 py-1 text-sm rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
        >
          Add Card
        </button>
      </div>

      {project.cards.length === 0 ? (
        <EmptyState message="No cards yet. Import a CSV or add cards manually." />
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="sticky top-0 bg-neutral-950 border-b border-neutral-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        aria-sort={sortAriaLabel(sorted)}
                        className="px-2 py-2 text-neutral-400 font-medium text-xs uppercase tracking-wide"
                      >
                        {header.column.getCanSort() ? (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 hover:text-neutral-100 transition-colors"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' && ' ↑'}
                            {sorted === 'desc' && ' ↓'}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <CardRow key={row.id} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
