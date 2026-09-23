import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import AsyncState from './AsyncState'

vi.mock('react-loader-spinner', () => ({
  ProgressBar: () => <span />,
}))

describe('AsyncState', () => {
  it('shows loading while its own query is pending, even when another query has already supplied data', () => {
    render(
      <AsyncState
        data={undefined}
        error={null}
        isLoading
        empty="No hay proyectos"
      >
        {() => <p>Contenido</p>}
      </AsyncState>
    )

    expect(screen.getByRole('status')).toHaveTextContent('Cargando contenido')
    expect(screen.queryByText('Contenido')).not.toBeInTheDocument()
  })

  it('offers retry for a network failure', async () => {
    const onRetry = vi.fn()
    render(
      <AsyncState
        data={undefined}
        error={new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Sin conexión' })}
        isLoading={false}
        empty="No hay proyectos"
        onRetry={onRetry}
      >
        {() => <p>Contenido</p>}
      </AsyncState>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Sin conexión')).toBeInTheDocument()
  })

  it('shows an explicit empty state when a completed query has no records', () => {
    render(
      <AsyncState data={[]} error={null} isLoading={false} empty="No hay proyectos">
        {() => <p>Contenido</p>}
      </AsyncState>
    )

    expect(screen.getByText('No hay proyectos')).toBeInTheDocument()
  })
})
