import { useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'
import { performUndo, performRedo, pushSnapshot } from '@/lib/undoRedo'

export function App() {
  const saveProject = useProjectStore((s) => s.saveProject)

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (useUiStore.getState().isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        void saveProject()
      }

      const { activeView, activeTemplateId, selectedLayerId } = useUiStore.getState()
      if (activeView === 'designer' && activeTemplateId !== null) {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
          e.preventDefault()
          performRedo(activeTemplateId)
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
          e.preventDefault()
          performUndo(activeTemplateId)
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
          e.preventDefault()
          performRedo(activeTemplateId)
        } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId !== null) {
          const target = e.target as HTMLElement
          if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && target.tagName !== 'SELECT') {
            e.preventDefault()
            const layers = useProjectStore.getState().project?.templates.find((t) => t.id === activeTemplateId)?.layers ?? []
            pushSnapshot(layers)
            useProjectStore.getState().deleteLayer(activeTemplateId, selectedLayerId)
            useUiStore.getState().setSelectedLayer(null)
          }
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveProject])

  return <AppShell />
}
