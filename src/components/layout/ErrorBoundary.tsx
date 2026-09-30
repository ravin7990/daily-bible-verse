import { Component, type ReactNode, type ErrorInfo } from 'react'
import { Link } from 'react-router-dom'
import Icon from '@/components/ui/Icon'

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
        <main className="shell-narrow my-16">
          <div className="card p-8 sm:p-10 text-center">
            <span
              aria-hidden="true"
              className="grid place-items-center w-14 h-14 rounded-2xl bg-ink-800
                         text-gold-300 mx-auto mb-4"
            >
              <Icon name="book" className="w-7 h-7" />
            </span>
            <h1 className="font-serif text-2xl font-bold text-ink-900 mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-ink-600 mb-6 max-w-sm mx-auto">
              We encountered a temporary issue while loading this page.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
                className="btn-primary text-sm"
              >
                Reload Page
              </button>
              <Link to="/" className="btn-secondary text-sm">
                <Icon name="home" className="w-4 h-4" />
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
