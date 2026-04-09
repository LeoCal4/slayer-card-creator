import { flexRender, type Row } from '@tanstack/react-table'
import type { CardData } from '@/types/card'

interface Props {
  row: Row<CardData>
  anomalous: Set<string>
}

export function CardRow({ row, anomalous }: Props) {
  return (
    <tr className="border-b border-neutral-800 hover:bg-neutral-900/50">
      {row.getVisibleCells().map((cell) => (
        <td
          key={cell.id}
          style={{ width: cell.column.getSize() }}
          className={`px-2 py-1 overflow-hidden${anomalous.has(cell.column.id) ? ' outline outline-1 outline-yellow-500/60 rounded' : ''}`}
        >
          {flexRender(cell.column.columnDef.cell, cell.getContext())}
        </td>
      ))}
    </tr>
  )
}
