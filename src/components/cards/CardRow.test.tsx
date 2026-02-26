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
  { accessorKey: 'power',  header: 'Power',  cell: ({ row }) => <input aria-label="power"  value={row.original.power  ?? ''} readOnly /> },
  { accessorKey: 'effect', header: 'Effect', cell: ({ row }) => <input aria-label="effect" value={row.original.effect} readOnly /> },
]

function TableWrapper({ card }: { card: CardData }) {
  const table = useReactTable({ data: [card], columns: COLS, getCoreRowModel: getCoreRowModel() })
  const row = table.getRowModel().rows[0]
  return (
    <table>
      <tbody>
        <CardRow row={row} />
      </tbody>
    </table>
  )
}

describe('CardRow', () => {
  it('renders cell values', () => {
    const card: CardData = {
      id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer',
      rarity: 'common', cost: 3, power: 4, hp: 5, effect: 'Strike.',
    }
    render(<TableWrapper card={card} />)
    expect(screen.getByDisplayValue('Axehand')).toBeInTheDocument()
  })

  it('highlights cells for missing required fields on a Slayer card', () => {
    const card: CardData = {
      id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer',
      rarity: 'common', cost: 3, power: undefined, hp: 5, effect: 'Strike.',
    }
    const { container } = render(<TableWrapper card={card} />)
    const cells = container.querySelectorAll('td')
    // power is index 1 (name=0, power=1, effect=2)
    expect(cells[1].className).toContain('outline')
  })

  it('does not highlight a fully complete card', () => {
    const card: CardData = {
      id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer',
      rarity: 'common', cost: 3, power: 4, hp: 5, effect: 'Strike.',
    }
    const { container } = render(<TableWrapper card={card} />)
    const cells = container.querySelectorAll('td')
    cells.forEach((cell) => {
      expect(cell.className).not.toContain('outline')
    })
  })
})
