import { useState } from 'react'

interface Props {
  label: string
  onFile: (name: string, content: string) => void
}

export function FileDropZone({ label, onFile }: Props) {
  const [isDragging, setIsDragging] = useState(false)

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (!file) return
    file.text().then((content) => onFile(file.name, content))
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded p-8 text-center transition-colors ${
        isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-neutral-700'
      }`}
    >
      <p className="text-sm text-neutral-400">{label}</p>
    </div>
  )
}
