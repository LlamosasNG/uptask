import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'

const queryState = vi.hoisted(() => ({
  result: {} as Record<string, unknown>,
  refetch: vi.fn(),
}))

vi.mock('react-loader-spinner', () => ({ ProgressBar: () => <span /> }))
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQuery: () => queryState.result,
    useQueryClient: () => ({ invalidateQueries: vi.fn() }),
    useMutation: () => ({ mutate: vi.fn() }),
  }
})

import EditProjectView from './EditProjectView'
import ProjectTeamView from './ProjectTeamView'

const error = (status: number, code: string, message: string) =>
  new ApiError({ status, code, message })

function renderProjectRoute(component: React.ReactNode) {
  render(
    <MemoryRouter initialEntries={['/projects/project-1/edit']}>
      <Routes>
        <Route path="/projects/:projectId/edit" element={component} />
        <Route path="/projects/:projectId/team" element={component} />
        <Route path="/404" element={<p>Página no encontrada</p>} />
      </Routes>
    </MemoryRouter>
  )
}

describe.each([
  ['EditProjectView', <EditProjectView />],
  ['ProjectTeamView', <ProjectTeamView />],
])('%s route errors', (_name, component) => {
  beforeEach(() => {
    queryState.refetch.mockReset()
  })

  it('shows forbidden errors inline', () => {
    queryState.result = { data: undefined, error: error(403, 'FORBIDDEN', 'No tienes permiso'), isLoading: false, isError: true, refetch: queryState.refetch }

    renderProjectRoute(component)

    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso')
    expect(screen.queryByText('Página no encontrada')).not.toBeInTheDocument()
  })

  it('navigates to the not-found route for an actual missing project', () => {
    queryState.result = { data: undefined, error: error(404, 'NOT_FOUND', 'Proyecto no encontrado'), isLoading: false, isError: true, refetch: queryState.refetch }

    renderProjectRoute(component)

    expect(screen.getByText('Página no encontrada')).toBeInTheDocument()
  })
})
