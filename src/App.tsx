import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'

export function App() {
  const saveProject = useProjectStore((s) => s.saveProject)
  const [showUndoToast, setShowUndoToast] = useState(false)

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 2500)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveProject])

  return (
    <>
      <AppShell />
      {showUndoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 text-neutral-100 text-sm px-4 py-2 rounded shadow-lg">
          Undo not yet available
        </div>
      )}
    </>
  )
}
