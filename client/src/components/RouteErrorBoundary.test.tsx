import { fireEvent, render, screen } from '@testing-library/react'
import { lazy, Suspense } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import RouteErrorBoundary from './RouteErrorBoundary'

afterEach(() => vi.restoreAllMocks())

it('offers an actionable Spanish reload control when a lazy route rejects', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  const onReload = vi.fn()
  const RejectedRoute = lazy(() =>
    Promise.reject(new Error('route chunk unavailable'))
  )

  render(
    <RouteErrorBoundary onReload={onReload}>
      <Suspense fallback={<p>Cargando…</p>}>
        <RejectedRoute />
      </Suspense>
    </RouteErrorBoundary>
  )

  const alert = await screen.findByRole('alert')
  expect(alert).toHaveTextContent('No pudimos cargar esta página')
  expect(alert).toHaveTextContent('Intenta recargar para continuar')

  fireEvent.click(screen.getByRole('button', { name: 'Recargar página' }))

  expect(onReload).toHaveBeenCalledTimes(1)
})
