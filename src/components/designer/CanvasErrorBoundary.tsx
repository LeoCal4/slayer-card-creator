import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <p className="text-sm text-neutral-400">Canvas error — please reload the template</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-3 py-1 text-sm bg-neutral-700 hover:bg-neutral-600 text-neutral-100 rounded"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
