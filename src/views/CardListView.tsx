import { CardTable } from '@/components/cards/CardTable'
import { CSVImportModal } from '@/components/cards/CSVImportModal'

export function CardListView() {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-800">
        <h1 className="text-base font-semibold text-neutral-100">Cards</h1>
        <div className="ml-auto">
          <CSVImportModal />
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <CardTable />
      </div>
    </div>
  )
}
