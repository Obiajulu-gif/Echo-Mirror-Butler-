export type ErrorReport = {
  referenceCode: string
  message: string
  componentStack?: string
  userId?: string
  timestamp: string
  routePath: string
}

export type ErrorToast = {
  id: string
  message: string
}

export const ERROR_TOAST_EVENT = 'echo-mirror:error-toast'

export function createReferenceCode() {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  return uuid.replace(/-/g, '').slice(0, 8).toUpperCase()
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return 'An unexpected error occurred'
}

export function logError(report: ErrorReport, error: unknown) {
  console.error(`[${report.referenceCode}] ${report.message}`, {
    error,
    componentStack: report.componentStack,
    userId: report.userId ?? null,
    timestamp: report.timestamp,
    routePath: report.routePath,
  })
}

export function showErrorToast(message: string) {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(
    new CustomEvent<ErrorToast>(ERROR_TOAST_EVENT, {
      detail: {
        id: createReferenceCode(),
        message,
      },
    }),
  )
}
