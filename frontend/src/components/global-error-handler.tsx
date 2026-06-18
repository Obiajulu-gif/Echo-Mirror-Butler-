import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../lib/auth-context'
import {
  createReferenceCode,
  ERROR_TOAST_EVENT,
  getErrorMessage,
  logError,
  showErrorToast,
  type ErrorToast,
} from '../lib/error-reporting'

const TOAST_DURATION_MS = 6000

export function GlobalErrorHandler() {
  const { user } = useAuth()
  const location = useLocation()
  const [toasts, setToasts] = useState<ErrorToast[]>([])

  useEffect(() => {
    const handleToast = (event: Event) => {
      const toast = (event as CustomEvent<ErrorToast>).detail
      setToasts((current) => [...current, toast])

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id))
      }, TOAST_DURATION_MS)
    }

    window.addEventListener(ERROR_TOAST_EVENT, handleToast)
    return () => window.removeEventListener(ERROR_TOAST_EVENT, handleToast)
  }, [])

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const message = getErrorMessage(event.reason)
      const referenceCode = createReferenceCode()

      logError(
        {
          referenceCode,
          message,
          userId: user?.id,
          timestamp: new Date().toISOString(),
          routePath: location.pathname,
        },
        event.reason,
      )
      showErrorToast(`Something went wrong. Reference: ${referenceCode}`)
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [location.pathname, user?.id])

  return (
    <div className="error-toast-region" role="region" aria-label="Notifications">
      {toasts.map((toast) => (
        <div className="error-toast" role="alert" key={toast.id}>
          {toast.message}
          <button
            type="button"
            aria-label="Dismiss notification"
            onClick={() =>
              setToasts((current) => current.filter((item) => item.id !== toast.id))
            }
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
