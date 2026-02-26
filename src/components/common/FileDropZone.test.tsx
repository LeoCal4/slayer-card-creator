import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileDropZone } from './FileDropZone'

describe('FileDropZone', () => {
  it('renders the label', () => {
    render(<FileDropZone label="Drop CSV here" onFile={vi.fn()} />)
    expect(screen.getByText('Drop CSV here')).toBeInTheDocument()
  })

  it('calls onFile with the file name and text content when a file is dropped', async () => {
    const onFile = vi.fn()
    render(<FileDropZone label="Drop here" onFile={onFile} />)
    const zone = screen.getByText('Drop here').closest('div')!
    const file = new File(['hello,world'], 'test.csv', { type: 'text/csv' })
    Object.defineProperty(file, 'text', { value: vi.fn().mockResolvedValue('hello,world') })
    fireEvent.drop(zone, { dataTransfer: { files: [file] } })
    await vi.waitFor(() => {
      expect(onFile).toHaveBeenCalledWith('test.csv', 'hello,world')
    })
  })

  it('adds a highlighted class while dragging over', () => {
    render(<FileDropZone label="Drop here" onFile={vi.fn()} />)
    const zone = screen.getByText('Drop here').closest('div')!
    fireEvent.dragOver(zone)
    expect(zone.className).toContain('border-indigo-500')
  })

  it('removes the highlight on drag leave', () => {
    render(<FileDropZone label="Drop here" onFile={vi.fn()} />)
    const zone = screen.getByText('Drop here').closest('div')!
    fireEvent.dragOver(zone)
    fireEvent.dragLeave(zone)
    expect(zone.className).not.toContain('border-indigo-500')
  })
})
