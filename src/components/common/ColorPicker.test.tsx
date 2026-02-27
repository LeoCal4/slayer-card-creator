import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColorPicker } from './ColorPicker'

describe('ColorPicker', () => {
  it('renders a swatch button with the given background color', () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    const swatch = screen.getByRole('button', { name: /color/i })
    expect(swatch).toHaveStyle({ backgroundColor: '#ff0000' })
  })

  it('hex text input shows the current color value', () => {
    render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('#ff0000')
  })

  it('calls onChange when a valid 7-char hex is typed', async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#000000" onChange={onChange} />)
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '#00ff00')
    expect(onChange).toHaveBeenCalledWith('#00ff00')
  })

  it('does not call onChange while hex is incomplete or invalid', async () => {
    const onChange = vi.fn()
    render(<ColorPicker value="#000000" onChange={onChange} />)
    const input = screen.getByRole('textbox')
    await userEvent.clear(input)
    await userEvent.type(input, '#00f')
    expect(onChange).not.toHaveBeenCalled()
  })

  it('native color input change calls onChange directly', () => {
    const onChange = vi.fn()
    const { container } = render(<ColorPicker value="#ff0000" onChange={onChange} />)
    const colorInput = container.querySelector('input[type="color"]')!
    fireEvent.change(colorInput, { target: { value: '#00ff00' } })
    expect(onChange).toHaveBeenCalledWith('#00ff00')
  })

  it('hex text input syncs when value prop changes', () => {
    const { rerender } = render(<ColorPicker value="#ff0000" onChange={() => {}} />)
    rerender(<ColorPicker value="#0000ff" onChange={() => {}} />)
    expect(screen.getByRole('textbox')).toHaveValue('#0000ff')
  })
})

describe('ColorPicker onPickerOpen', () => {
  it('calls onPickerOpen when the swatch button is clicked', async () => {
    const onPickerOpen = vi.fn()
    render(<ColorPicker value="#ff0000" onChange={() => {}} onPickerOpen={onPickerOpen} />)
    const swatch = screen.getByRole('button', { name: /color/i })
    await userEvent.click(swatch)
    expect(onPickerOpen).toHaveBeenCalledTimes(1)
  })
})
