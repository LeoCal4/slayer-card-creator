import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CanvasErrorBoundary } from './CanvasErrorBoundary'

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('Canvas exploded')
  return <div>Canvas OK</div>
}

describe('CanvasErrorBoundary', () => {
  // Suppress React's error logging in tests
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders children normally when no error', () => {
    render(
      <CanvasErrorBoundary>
        <Bomb shouldThrow={false} />
      </CanvasErrorBoundary>,
    )
    expect(screen.getByText('Canvas OK')).toBeInTheDocument()
  })

  it('renders the error message when a child throws', () => {
    render(
      <CanvasErrorBoundary>
        <Bomb shouldThrow={true} />
      </CanvasErrorBoundary>,
    )
    expect(screen.getByText(/canvas error — please reload/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument()
  })

  it('clicking Reload resets the error state and shows children again', () => {
    // Start with a throwing child — error boundary catches it
    const { rerender } = render(
      <CanvasErrorBoundary>
        <Bomb shouldThrow={true} />
      </CanvasErrorBoundary>,
    )
    // Update children to not throw before clicking Reload
    rerender(
      <CanvasErrorBoundary>
        <Bomb shouldThrow={false} />
      </CanvasErrorBoundary>,
    )
    // Reload clears hasError; children now render without throwing
    fireEvent.click(screen.getByRole('button', { name: /reload/i }))
    expect(screen.getByText('Canvas OK')).toBeInTheDocument()
  })
})
