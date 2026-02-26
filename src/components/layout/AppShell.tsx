import { useUiStore, type ViewId } from '@/store/uiStore'
import { SetInfoView } from '@/views/SetInfoView'
import { TemplateListView } from '@/views/TemplateListView'
import { TemplateDesignerView } from '@/views/TemplateDesignerView'
import { CardListView } from '@/views/CardListView'
import { PreviewView } from '@/views/PreviewView'
import { ExportView } from '@/views/ExportView'
import { Header } from './Header'
import { WelcomeModal } from './WelcomeModal'

const NAV_LINKS: { id: ViewId; label: string }[] = [
  { id: 'set-info',   label: 'Set Info' },
  { id: 'templates',  label: 'Templates' },
  { id: 'designer',   label: 'Designer' },
  { id: 'cards',      label: 'Cards' },
  { id: 'preview',    label: 'Preview' },
  { id: 'export',     label: 'Export' },
]

function ActiveView() {
  const activeView = useUiStore((s) => s.activeView)
  switch (activeView) {
    case 'set-info':   return <SetInfoView />
    case 'templates':  return <TemplateListView />
    case 'designer':   return <TemplateDesignerView />
    case 'cards':      return <CardListView />
    case 'preview':    return <PreviewView />
    case 'export':     return <ExportView />
  }
}

export function AppShell() {
  const activeView = useUiStore((s) => s.activeView)
  const setActiveView = useUiStore((s) => s.setActiveView)

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100">
      <Header />
      <WelcomeModal />
      <div className="flex flex-1 overflow-hidden">
      <nav className="w-48 shrink-0 border-r border-neutral-800 flex flex-col gap-1 p-3">
        {NAV_LINKS.map(({ id, label }) => (
          <a
            key={id}
            role="link"
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(id) }}
            className={[
              'rounded px-3 py-2 text-sm transition-colors',
              activeView === id
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white',
            ].join(' ')}
          >
            {label}
          </a>
        ))}
      </nav>

      <main className="flex-1 overflow-auto">
        <div data-testid="active-view" className="sr-only">{activeView}</div>
        <ActiveView />
      </main>
      </div>
    </div>
  )
}
