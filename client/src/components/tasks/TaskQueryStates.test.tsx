import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'

const queryState = vi.hoisted(() => ({
  result: {} as Record<string, unknown>,
  refetch: vi.fn(),
}))

vi.mock('react-loader-spinner', () => ({ ProgressBar: () => <span /> }))
vi.mock('react-toastify', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQuery: () => queryState.result,
    useMutation: () => ({ mutate: vi.fn() }),
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
  }
})

import EditTaskData from './EditTaskData'
import TaskModalDetails from './TaskModalDetails'

const error = (status: number, code: string, message: string) =>
  new ApiError({ status, code, message })

function LocationDisplay() {
  const location = useLocation()
  return <p>{location.pathname}</p>
}

function renderTaskRoute(component: React.ReactNode, search: string) {
  render(
    <MemoryRouter initialEntries={[`/projects/project-1/detail${search}`]}>
      <Routes>
        <Route
          path="/projects/:projectId/detail"
          element={
            <>
              <LocationDisplay />
              {component}
            </>
          }
        />
        <Route path="/projects/:projectId" element={<LocationDisplay />} />
        <Route path="/404" element={<LocationDisplay />} />
      </Routes>
    </MemoryRouter>
  )
}

describe.each([
  ['EditTaskData', <EditTaskData />, '?editTask=task-1', '/404'],
  ['TaskModalDetails', <TaskModalDetails />, '?viewTask=task-1', '/projects/project-1'],
])('%s query state', (_name, component, search, notFoundTarget) => {
  beforeEach(() => {
    queryState.refetch.mockReset()
  })

  it('renders a visible loading state while the task is pending', () => {
    queryState.result = { data: undefined, error: null, isLoading: true, isError: false, refetch: queryState.refetch }

    renderTaskRoute(component, search)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando contenido')
  })

  it('keeps a forbidden task error in place instead of navigating away', () => {
    queryState.result = { data: undefined, error: error(403, 'FORBIDDEN', 'No tienes permiso'), isLoading: false, isError: true, refetch: queryState.refetch }

    renderTaskRoute(component, search)

    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso')
    expect(screen.getByText('/projects/project-1/detail')).toBeInTheDocument()
  })

  it('offers retry after a network task error', () => {
    queryState.result = { data: undefined, error: error(0, 'NETWORK_ERROR', 'Sin conexión'), isLoading: false, isError: true, refetch: queryState.refetch }

    renderTaskRoute(component, search)

    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })

  it('navigates only when the task does not exist', () => {
    queryState.result = { data: undefined, error: error(404, 'NOT_FOUND', 'Tarea no encontrada'), isLoading: false, isError: true, refetch: queryState.refetch }

    renderTaskRoute(component, search)

    expect(screen.getByText(notFoundTarget)).toBeInTheDocument()
  })
})
