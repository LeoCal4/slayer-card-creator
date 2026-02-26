import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AppShell } from './AppShell'
import { useUiStore } from '@/store/uiStore'

describe('AppShell', () => {
  it('renders sidebar nav links', () => {
    render(<AppShell />)
    expect(screen.getByRole('link', { name: /set info/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /templates/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cards/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /preview/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /export/i })).toBeInTheDocument()
  })

  it('clicking a nav link changes the active view', async () => {
    useUiStore.setState({ activeView: 'set-info' })
    render(<AppShell />)
    await userEvent.click(screen.getByRole('link', { name: /cards/i }))
    expect(useUiStore.getState().activeView).toBe('cards')
  })

  it('renders the active view label in the main area', () => {
    useUiStore.setState({ activeView: 'cards' })
    render(<AppShell />)
    expect(screen.getByTestId('active-view')).toHaveTextContent('cards')
  })
})
