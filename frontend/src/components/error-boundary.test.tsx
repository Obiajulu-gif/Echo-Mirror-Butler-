import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PageErrorBoundary } from './error-boundary'

vi.mock('../lib/auth-context', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}))

function CrashingPage(): never {
  throw new Error('analytics exploded')
}

describe('PageErrorBoundary', () => {
  it('shows route recovery actions and logs a visible reference code', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    render(
      <MemoryRouter>
        <PageErrorBoundary
          routeName="Analytics"
          routePath="/analytics"
          userId="user-123"
        >
          <CrashingPage />
        </PageErrorBoundary>
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'This page ran into a problem' })).toBeVisible()
    expect(screen.getByText(/Analytics page could not be displayed/)).toBeVisible()
    expect(screen.getByRole('button', { name: 'Reload page' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'Go to Dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    )

    const reference = screen.getByText(/Reference code:/).textContent?.split(': ')[1]
    expect(reference).toMatch(/^[A-F0-9]{8}$/)
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining(`[${reference}] analytics exploded`),
      expect.objectContaining({
        componentStack: expect.any(String),
        routePath: '/analytics',
        userId: 'user-123',
      }),
    )

    consoleError.mockRestore()
  })
})
