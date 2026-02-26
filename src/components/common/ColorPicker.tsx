import { useRef, useState, useEffect } from 'react'

const HEX_RE = /^#[0-9a-fA-F]{6}$/

interface Props {
  value: string
  onChange: (hex: string) => void
}

export function ColorPicker({ value, onChange }: Props) {
  const colorInputRef = useRef<HTMLInputElement>(null)
  const [localHex, setLocalHex] = useState(value)

  useEffect(() => {
    setLocalHex(value)
  }, [value])

  function handleTextChange(raw: string) {
    setLocalHex(raw)
    if (HEX_RE.test(raw)) onChange(raw)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Open color picker"
        onClick={() => colorInputRef.current?.click()}
        style={{ backgroundColor: value }}
        className="w-7 h-7 rounded border border-neutral-600 shrink-0"
      />
      <input
        ref={colorInputRef}
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="sr-only"
        tabIndex={-1}
      />
      <input
        type="text"
        value={localHex}
        onChange={(e) => handleTextChange(e.target.value)}
        maxLength={7}
        className="bg-neutral-800 text-neutral-100 text-xs font-mono rounded px-2 py-1 w-24 outline-none focus:ring-1 focus:ring-indigo-500"
        spellCheck={false}
      />
    </div>
  )
}
