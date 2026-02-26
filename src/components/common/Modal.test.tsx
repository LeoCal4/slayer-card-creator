import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders the title and children', () => {
    render(<Modal title="My Dialog" onClose={vi.fn()}><p>Content here</p></Modal>)
    expect(screen.getByText('My Dialog')).toBeInTheDocument()
    expect(screen.getByText('Content here')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    render(<Modal title="Test" onClose={onClose}><span /></Modal>)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<Modal title="Test" onClose={onClose}><span /></Modal>)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when the inner panel is clicked', () => {
    const onClose = vi.fn()
    render(<Modal title="Test" onClose={onClose}><p>Inner</p></Modal>)
    fireEvent.click(screen.getByText('Inner'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
