import { flexRender, type Row } from '@tanstack/react-table'
import type { CardData } from '@/types/card'
import { getMissingFields } from '@/lib/cardValidation'

interface Props {
  row: Row<CardData>
}

export function CardRow({ row }: Props) {
  const missing = new Set<string>(getMissingFields(row.original))
  return (
    <tr className="border-b border-neutral-800 hover:bg-neutral-900/50">
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          className={`px-2 py-1${missing.has(cell.column.id) ? ' outline outline-1 outline-red-500/60 rounded' : ''}`}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  )
}
