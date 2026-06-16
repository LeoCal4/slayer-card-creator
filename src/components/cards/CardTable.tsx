import { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnSizingState,
} from '@tanstack/react-table'
import { useProjectStore, DEFAULT_CSV_COLUMNS } from '@/store/projectStore'
import { CardRow } from './CardRow'
import { EmptyState } from '@/components/common/EmptyState'
import type { CardData, Rarity } from '@/types/card'
import { isCoreField } from '@/types/card'
import type { CardTypeColumnMap, CsvColumnDef } from '@/types/project'

function getCellValue(card: CardData, key: string): string | number | undefined {
  if (isCoreField(key)) return card[key]
  return card.extras?.[key]
}

function computeAnomalies(
  card: CardData,
  csvColumns: CsvColumnDef[],
  cardTypes: string[],
  rarities: string[],
  classes: string[],
  csvColumnRequirements?: CardTypeColumnMap,
): Set<string> {
  const anomalous = new Set<string>()
  const requiredCols = csvColumnRequirements?.[card.type]
  for (const col of csvColumns) {
    const key = col.name.toLowerCase()
    if (requiredCols !== undefined && !requiredCols.includes(col.name)) continue
    const val = getCellValue(card, key)
    if (col.type === 'number') {
      if (typeof val !== 'number') anomalous.add(key)
    } else if (col.type === 'select' && col.choices?.length) {
      if (!col.choices.includes(String(val ?? ''))) anomalous.add(key)
    } else if (col.type === 'select-type' && cardTypes.length) {
      if (!cardTypes.includes(String(val ?? ''))) anomalous.add(key)
    } else if (col.type === 'select-rarity' && rarities.length) {
      if (!rarities.includes(String(val ?? ''))) anomalous.add(key)
    } else if (col.type === 'select-class' && classes.length) {
      if (!classes.includes(String(val ?? ''))) anomalous.add(key)
    }
  }
  return anomalous
}

function sortAriaLabel(sorted: false | 'asc' | 'desc'): 'ascending' | 'descending' | undefined {
  if (sorted === 'asc') return 'ascending'
  if (sorted === 'desc') return 'descending'
  return undefined
}

function CoreFieldCell({
  card,
  field,
  updateCard,
  cardTypes,
  rarities,
}: {
  card: CardData
  field: 'name' | 'class' | 'type' | 'rarity' | 'effect'
  updateCard: (id: string, partial: Partial<CardData>) => void
  cardTypes: string[]
  rarities: string[]
}) {
  if (field === 'type') {
    const isUnknown = !cardTypes.includes(card.type)
    return (
      <select
        aria-label="type"
        className="bg-neutral-800 text-sm text-neutral-100 rounded"
        value={card.type}
        onChange={(e) => updateCard(card.id, { type: e.target.value })}
      >
        {isUnknown && <option value={card.type}>{card.type}</option>}
        {cardTypes.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
    )
  }
  if (field === 'rarity') {
    const options = rarities.length > 0 ? rarities : ['common', 'rare', 'epic']
    return (
      <select
        aria-label="rarity"
        className="bg-neutral-800 text-sm text-neutral-100 rounded"
        value={card.rarity}
        onChange={(e) => updateCard(card.id, { rarity: e.target.value as Rarity })}
      >
        {options.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
    )
  }
  return (
    <input
      aria-label={field}
      className="bg-transparent w-full text-sm text-neutral-100 outline-none"
      value={card[field]}
      onChange={(e) => updateCard(card.id, { [field]: e.target.value })}
    />
  )
}

function ExtraFieldCell({
  card,
  col,
  updateCard,
  cardTypes,
  rarities,
}: {
  card: CardData
  col: CsvColumnDef
  updateCard: (id: string, partial: Partial<CardData>) => void
  cardTypes: string[]
  rarities: string[]
}) {
  const key = col.name.toLowerCase()
  const val = card.extras?.[key]

  function setVal(next: string | number | undefined) {
    const nextExtras = { ...(card.extras ?? {}) }
    if (next === undefined || next === '') {
      delete nextExtras[key]
    } else {
      nextExtras[key] = next
    }
    updateCard(card.id, { extras: nextExtras })
  }

  if (col.type === 'number') {
    return (
      <input
        aria-label={key}
        type="number"
        className="bg-transparent w-16 text-sm text-neutral-100 outline-none"
        value={typeof val === 'number' ? val : ''}
        onChange={(e) => setVal(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
      />
    )
  }

  if (col.type === 'select' || col.type === 'select-type' || col.type === 'select-rarity') {
    const choices =
      col.type === 'select' ? (col.choices ?? []) :
      col.type === 'select-type' ? cardTypes :
      rarities
    const current = val !== undefined ? String(val) : ''
    return (
      <select
        aria-label={key}
        className="bg-neutral-800 text-sm text-neutral-100 rounded"
        value={current}
        onChange={(e) => setVal(e.target.value || undefined)}
      >
        <option value="">(none)</option>
        {!choices.includes(current) && current && <option value={current}>{current}</option>}
        {choices.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
    )
  }

  return (
    <input
      aria-label={key}
      className="bg-transparent w-full text-sm text-neutral-100 outline-none"
      value={val !== undefined ? String(val) : ''}
      onChange={(e) => setVal(e.target.value || undefined)}
    />
  )
}

const DEFAULT_SIZE_BY_TYPE: Record<string, number> = {
  text: 150,
  number: 70,
  select: 100,
  'select-type': 100,
  'select-rarity': 80,
  'select-class': 100,
}

const CORE_SIZE_OVERRIDES: Record<string, number> = {
  name: 150,
  class: 100,
  type: 100,
  rarity: 80,
  effect: 280,
}

export function CardTable() {
  const project = useProjectStore((s) => s.project)
  const csvColumns = project?.csvColumns ?? DEFAULT_CSV_COLUMNS
  const cardTypes = project?.cardTypes ?? []
  const rarityConfig = project?.rarityConfig
  const classColors = project?.classColors
  const rarities = useMemo(() => rarityConfig ? Object.keys(rarityConfig) : [], [rarityConfig])
  const classes = useMemo(() => classColors ? Object.keys(classColors) : [], [classColors])
  const csvColumnRequirements = project?.csvColumnRequirements
  const updateCard = useProjectStore((s) => s.updateCard)
  const deleteCard = useProjectStore((s) => s.deleteCard)
  const addCard = useProjectStore((s) => s.addCard)

  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnSizing, setColumnSizing] = useState<ColumnSizingState>({})

  const columns = useMemo<ColumnDef<CardData>[]>(() => {
    const cols: ColumnDef<CardData>[] = [
      {
        id: 'delete',
        header: '',
        size: 36,
        minSize: 36,
        enableResizing: false,
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
    ]

    for (const col of csvColumns) {
      const key = col.name.toLowerCase()
      const size = CORE_SIZE_OVERRIDES[key] ?? DEFAULT_SIZE_BY_TYPE[col.type] ?? 100
      cols.push({
        id: key,
        accessorFn: (card) => getCellValue(card, key),
        header: col.name,
        size,
        minSize: 50,
        cell: ({ row }) => {
          const card = row.original
          if (isCoreField(key)) {
            return (
              <CoreFieldCell
                card={card}
                field={key}
                updateCard={updateCard}
                cardTypes={cardTypes}
                rarities={rarities}
              />
            )
          }
          return (
            <ExtraFieldCell
              card={card}
              col={col}
              updateCard={updateCard}
              cardTypes={cardTypes}
              rarities={rarities}
            />
          )
        },
      })
    }

    return cols
  }, [csvColumns, cardTypes, rarities, updateCard, deleteCard])

  const table = useReactTable({
    data: project?.cards ?? [],
    columns,
    columnResizeMode: 'onChange',
    state: { sorting, globalFilter, columnSizing },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnSizingChange: setColumnSizing,
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
              type: project.cardTypes[0] ?? '',
              rarity: 'common',
              effect: '',
              extras: {},
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
          <table
            className="text-left text-sm border-collapse table-fixed"
            style={{ width: table.getTotalSize() }}
          >
            <thead className="sticky top-0 bg-neutral-950 border-b border-neutral-700">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted()
                    return (
                      <th
                        key={header.id}
                        aria-sort={sortAriaLabel(sorted)}
                        className="relative px-2 py-2 text-neutral-400 font-medium text-xs uppercase tracking-wide overflow-hidden"
                        style={{ width: header.getSize() }}
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
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className={`absolute top-0 right-0 w-1 h-full cursor-col-resize select-none touch-none transition-colors ${
                              header.column.getIsResizing()
                                ? 'bg-indigo-400'
                                : 'hover:bg-neutral-500'
                            }`}
                          />
                        )}
                      </th>
                    )
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <CardRow
                  key={row.id}
                  row={row}
                  anomalous={computeAnomalies(row.original, csvColumns, cardTypes, rarities, classes, csvColumnRequirements)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
