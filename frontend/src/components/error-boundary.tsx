import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import { createReferenceCode, logError } from '../lib/error-reporting'

interface Props {
  children: ReactNode
  routeName: string
  routePath: string
  userId?: string
}

interface State {
  hasError: boolean
  message: string
  referenceCode: string
}

export class PageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '', referenceCode: '' }

  static getDerivedStateFromError(error: Error) {
    return {
      hasError: true,
      message: error.message,
      referenceCode: createReferenceCode(),
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logError(
      {
        referenceCode: this.state.referenceCode,
        message: error.message,
        componentStack: info.componentStack ?? undefined,
        userId: this.props.userId,
        timestamp: new Date().toISOString(),
        routePath: this.props.routePath,
      },
      error,
    )
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="card empty-state page-error">
          <h2>This page ran into a problem</h2>
          <p>
            The {this.props.routeName} page could not be displayed. You can navigate away
            using the sidebar or try reloading the page.
          </p>
          <p className="page-error-reference">
            Reference code: <strong>{this.state.referenceCode}</strong>
          </p>
          <div className="page-error-actions">
            <button type="button" onClick={() => window.location.reload()}>
              Reload page
            </button>
            <Link to="/dashboard">Go to Dashboard</Link>
          </div>
        </section>
      )
    }

    return this.props.children
  }
}

export function ErrorBoundary({
  children,
  routeName,
}: {
  children: ReactNode
  routeName: string
}) {
  const { user } = useAuth()
  const location = useLocation()

  return (
    <PageErrorBoundary
      routeName={routeName}
      routePath={location.pathname}
      userId={user?.id}
    >
      {children}
    </PageErrorBoundary>
  )
}
