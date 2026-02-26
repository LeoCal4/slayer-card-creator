import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EmptyState } from './EmptyState'

describe('EmptyState', () => {
  it('renders the message', () => {
    render(<EmptyState message="No cards yet." />)
    expect(screen.getByText('No cards yet.')).toBeInTheDocument()
  })

  it('renders an optional action', () => {
    render(<EmptyState message="No cards." action={<button>Add Card</button>} />)
    expect(screen.getByRole('button', { name: 'Add Card' })).toBeInTheDocument()
  })

  it('renders without action when not provided', () => {
    const { container } = render(<EmptyState message="Empty." />)
    expect(container.querySelector('button')).toBeNull()
  })
})
