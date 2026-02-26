import type { ReactNode } from 'react'

interface Props {
  title: string
  children: ReactNode
  onClose: () => void
}

export function Modal({ title, children, onClose }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 border border-neutral-700 rounded-xl p-6 shadow-2xl w-96 max-h-[80vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-neutral-100">{title}</h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-100 text-lg leading-none"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
