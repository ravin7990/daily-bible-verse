import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="max-w-md mx-auto my-16 px-4 text-center">
          <div className="card p-8">
            <span className="text-5xl block mb-4" aria-hidden="true">✝️</span>
            <h1 className="font-serif text-2xl font-bold text-gray-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-600 mb-6">
              We encountered a temporary issue while loading this page.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="btn-primary text-sm py-2 px-4"
              >
                Reload Page
              </button>
              <Link to="/" className="btn-secondary text-sm py-2 px-4">
                Back to Home
              </Link>
            </div>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}
