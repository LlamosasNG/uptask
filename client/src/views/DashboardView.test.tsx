import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-loader-spinner', () => ({ ProgressBar: () => <span /> }))
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ data: { _id: 'user-1', name: 'Ana' }, isLoading: false }),
}))
vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined, error: null, isLoading: true, refetch: vi.fn() }),
}))

import { MemoryRouter } from 'react-router-dom'
import DashboardView from './DashboardView'

describe('DashboardView', () => {
  it('keeps showing loading while projects load after authentication has settled', () => {
    render(
      <MemoryRouter>
        <DashboardView />
      </MemoryRouter>
    )

    expect(screen.getByRole('status')).toHaveTextContent('Cargando contenido')
  })
})
