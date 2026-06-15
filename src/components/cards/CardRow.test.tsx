import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  useReactTable,
  getCoreRowModel,
  type ColumnDef,
} from '@tanstack/react-table'
import { CardRow } from './CardRow'
import type { CardData } from '@/types/card'

const COLS: ColumnDef<CardData>[] = [
  { accessorKey: 'name',   header: 'Name',   cell: ({ row }) => <input aria-label="name"   value={row.original.name}   readOnly /> },
  { accessorKey: 'power',  header: 'Power',  cell: ({ row }) => <input aria-label="power"  value={row.original.extras?.power  ?? ''} readOnly /> },
  { accessorKey: 'effect', header: 'Effect', cell: ({ row }) => <input aria-label="effect" value={row.original.effect} readOnly /> },
]

function TableWrapper({
  card,
  anomalous = new Set<string>(),
}: {
  card: CardData
  anomalous?: Set<string>
}) {
  const table = useReactTable({ data: [card], columns: COLS, getCoreRowModel: getCoreRowModel() })
  const row = table.getRowModel().rows[0]
  return (
    <table>
      <tbody>
        <CardRow row={row} anomalous={anomalous} />
      </tbody>
    </table>
  )
}

const BASE_CARD: CardData = {
  id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer',
  rarity: 'common', effect: 'Strike.', extras: { cost: 3, power: 4, hp: 5 },
}

describe('CardRow', () => {
  it('renders cell values', () => {
    render(<TableWrapper card={BASE_CARD} />)
    expect(screen.getByDisplayValue('Axehand')).toBeInTheDocument()
  })

  it('applies no outline when anomalous set is empty', () => {
    const { container } = render(<TableWrapper card={BASE_CARD} anomalous={new Set()} />)
    const cells = container.querySelectorAll('td')
    cells.forEach((cell) => expect(cell.className).not.toContain('outline'))
  })

  it('applies yellow outline to a cell whose column id is in the anomalous set', () => {
    const { container } = render(<TableWrapper card={BASE_CARD} anomalous={new Set(['power'])} />)
    const cells = container.querySelectorAll('td')
    // power is index 1 (name=0, power=1, effect=2)
    expect(cells[1].className).toContain('outline')
    expect(cells[1].className).toContain('yellow')
  })

  it('does not apply outline to cells not in the anomalous set', () => {
    const { container } = render(<TableWrapper card={BASE_CARD} anomalous={new Set(['power'])} />)
    const cells = container.querySelectorAll('td')
    expect(cells[0].className).not.toContain('outline') // name
    expect(cells[2].className).not.toContain('outline') // effect
  })

  it('can mark multiple cells as anomalous', () => {
    const { container } = render(
      <TableWrapper card={BASE_CARD} anomalous={new Set(['name', 'effect'])} />,
    )
    const cells = container.querySelectorAll('td')
    expect(cells[0].className).toContain('outline') // name
    expect(cells[1].className).not.toContain('outline') // power
    expect(cells[2].className).toContain('outline') // effect
  })
})
