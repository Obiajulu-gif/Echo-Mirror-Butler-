import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { GlobalErrorHandler } from './global-error-handler'

vi.mock('../lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}))

describe('GlobalErrorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows a non-blocking toast for unhandled promise rejections', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <GlobalErrorHandler />
      </MemoryRouter>,
    )

    const event = new Event('unhandledrejection') as PromiseRejectionEvent
    Object.defineProperty(event, 'reason', {
      value: new Error('async failure'),
    })
    fireEvent(window, event)

    expect(screen.getByRole('alert')).toHaveTextContent(
      /Something went wrong. Reference: [A-F0-9]{8}/,
    )
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('async failure'),
      expect.objectContaining({
        routePath: '/analytics',
        userId: 'user-123',
      }),
    )
  })
})
