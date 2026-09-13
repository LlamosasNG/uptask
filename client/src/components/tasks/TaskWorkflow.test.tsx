import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AxiosAdapter } from 'axios'
import api from '@/lib/axios'
import { queryKeys } from '@/api/queryKeys'
import type { Project, Task, TaskProject } from '@/types/index'
import TaskList from './TaskList'
import AddTaskModal from './AddTaskModal'
import EditTaskModal from './EditTaskModal'
import NoteDetail from '../notes/NoteDetail'
import TaskModalDetails from './TaskModalDetails'
import AppLayout from '@/layouts/AppLayout'
import ProjectDetailsView from '@/views/projects/ProjectDetailsView'
import LoginView from '@/views/auth/LoginView'
import ProjectTeamView from '@/views/projects/ProjectTeamView'
import { useTaskStatus } from '@/hooks/useTaskStatus'
import {
  AUTH_TOKEN_KEY,
  bindAuthCache,
  endAuthSession,
} from '@/lib/authSession'

// The spinner package's styled-components export cannot load in jsdom; no loading behavior is replaced.
vi.mock('react-loader-spinner', () => ({ ProgressBar: () => <span /> }))

const manager = { _id: 'manager', name: 'Ana', email: 'ana@example.com' }
const member = { _id: 'member', name: 'Luis', email: 'luis@example.com' }
const tasks: TaskProject[] = [
  {
    _id: 'one',
    name: 'Diseño',
    description: 'Revisar PORTADA',
    status: 'pending',
    assignee: member,
    priority: 'high',
    dueDate: '2000-01-01T00:00:00.000Z',
  },
  {
    _id: 'two',
    name: 'Portada móvil',
    description: 'Prototipo',
    status: 'inProgress',
    assignee: null,
    priority: 'high',
    dueDate: '2999-01-01T00:00:00.000Z',
  },
  {
    _id: 'three',
    name: 'Publicar',
    description: 'Portada final',
    status: 'completed',
    assignee: member,
    priority: 'low',
    dueDate: '2000-01-01T00:00:00.000Z',
  },
  { _id: 'four', name: 'Documentar', description: 'Guía', status: 'pending' },
]
const project: Project = {
  _id: 'project',
  projectName: 'Sitio',
  description: 'Web',
  clientName: 'Cliente',
  manager: manager._id,
  team: [member._id],
  tasks,
}
const task: Task = {
  ...tasks[0],
  project: 'project',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  completedBy: [],
  notes: [],
}
const originalAdapter = api.defaults.adapter
let requests: { method?: string; url?: string; data: unknown }[]
let statusRequest: (() => Promise<unknown>) | undefined
let client: QueryClient

beforeEach(() => {
  // jsdom has no layout observer; menu tests exercise permissions and focus, not geometry.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  requests = []
  statusRequest = undefined
  client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity },
      mutations: { retry: false },
    },
  })
  client.setQueryData(queryKeys.auth.user(), manager)
  client.setQueryData(queryKeys.projects.team('project'), [member])
  client.setQueryData(
    queryKeys.projects.detail('project'),
    structuredClone(project),
  )
  api.defaults.adapter = (async (config) => {
    const data =
      typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    requests.push({ method: config.method, url: config.url, data })
    let response: unknown = 'Guardado'
    if (config.url?.endsWith('/status') && statusRequest)
      response = await statusRequest()
    if (config.method === 'get') {
      if (config.url === '/projects/project/team') response = [member]
      else if (config.url === '/projects/project/tasks/one') response = task
      else throw new Error(`Unexpected uncached request: ${config.url}`)
    }
    return {
      config,
      data: response,
      status: 200,
      statusText: 'OK',
      headers: {},
    }
  }) satisfies AxiosAdapter
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  api.defaults.adapter = originalAdapter
  localStorage.clear()
  client.clear()
})

function Board({ canEdit = true }: { canEdit?: boolean }) {
  const { data } = useQuery<Project>({
    queryKey: queryKeys.projects.detail('project'),
    queryFn: () => Promise.resolve(project),
    enabled: false,
  })
  return <TaskList tasks={data!.tasks} canEdit={canEdit} />
}
function mount(element: React.ReactNode, search = '') {
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/projects/project${search}`]}>
        <Routes>
          <Route path="/projects/:projectId" element={element} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}
function change(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } })
}

describe('task board workflow', () => {
  // Catches OR-combined filters, case-sensitive text search, and ignored planning fields.
  it('combines text, status, assignee, priority and overdue filters', () => {
    mount(<Board />)
    change('Buscar tareas', 'pOrTaDa')
    change('Filtrar por estado', 'pending')
    change('Filtrar por responsable', 'member')
    change('Filtrar por prioridad', 'high')
    fireEvent.click(screen.getByLabelText('Solo vencidas'))
    expect(
      screen.getByRole('button', { name: 'Ver tarea Diseño' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Ver tarea Portada móvil' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Ver tarea Publicar' }),
    ).not.toBeInTheDocument()
    change('Filtrar por prioridad', 'low')
    expect(
      screen.getByText('No hay tareas con estos filtros'),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))
    expect(
      screen.getByRole('button', { name: 'Ver tarea Documentar' }),
    ).toBeInTheDocument()
  })

  it('matches unassigned legacy tasks and treats missing priority as medium', () => {
    mount(<Board />)
    change('Filtrar por responsable', 'unassigned')
    change('Filtrar por prioridad', 'medium')
    expect(
      screen.getByRole('button', { name: 'Ver tarea Documentar' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Ver tarea Diseño' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Ver tarea Portada móvil' }),
    ).not.toBeInTheDocument()
  })

  it('summarizes all tasks and excludes completed or due-today tasks from overdue', () => {
    const now = new Date()
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    client.setQueryData(queryKeys.projects.detail('project'), {
      ...project,
      tasks: [
        ...tasks,
        {
          ...tasks[3],
          _id: 'today',
          name: 'Hoy',
          dueDate: `${today}T00:00:00.000Z`,
        },
      ],
    })
    mount(<Board />)
    expect(screen.getByLabelText('Total de tareas')).toHaveTextContent('5')
    expect(screen.getByLabelText('Pendientes o en progreso')).toHaveTextContent(
      '4',
    )
    expect(screen.getByLabelText('Tareas completadas')).toHaveTextContent('1')
    expect(screen.getByLabelText('Tareas vencidas')).toHaveTextContent('1')
    fireEvent.click(screen.getByLabelText('Solo vencidas'))
    expect(
      screen.queryByRole('button', { name: 'Ver tarea Hoy' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Ver tarea Publicar' }),
    ).not.toBeInTheDocument()
  })

  // Catches manager-only status controls and missing non-drag interaction on narrow screens.
  it('allows members to change status with a focusable labeled control', async () => {
    mount(<Board canEdit={false} />)
    const select = screen.getByRole('combobox', { name: 'Estado de Diseño' })
    select.focus()
    expect(select).toHaveFocus()
    fireEvent.change(select, { target: { value: 'inProgress' } })
    await waitFor(() =>
      expect(requests).toContainEqual({
        method: 'post',
        url: '/projects/project/tasks/one/status',
        data: { status: 'inProgress' },
      }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('combobox', { name: 'Estado de Diseño' }),
      ).toHaveFocus(),
    )
    expect(
      screen.queryByRole('button', { name: 'Eliminar tarea Diseño' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Editar tarea Diseño' }),
    ).not.toBeInTheDocument()
  })

  it('starts and cancels a drag using the keyboard handle', async () => {
    mount(<Board />)
    const handle = screen.getByRole('button', { name: 'Mover tarea Diseño' })
    handle.focus()
    fireEvent.keyDown(handle, { key: ' ', code: 'Space' })
    await waitFor(() => expect(handle).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Has tomado la tarea Diseño',
    )
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    await waitFor(() =>
      expect(handle).not.toHaveAttribute('aria-pressed', 'true'),
    )
    expect(screen.getByRole('status')).toHaveTextContent(
      'Movimiento de Diseño cancelado',
    )
    expect(requests).toHaveLength(0)
  })

  it('stacks full-width workflow groups on small screens and switches to desktop columns', () => {
    mount(<Board />)
    const board = screen.getByRole('region', { name: 'Tablero por estado' })
    // Tailwind breakpoint contract: jsdom cannot compute media-query layout.
    expect(board).toHaveClass('flex-col', 'lg:flex-row', 'lg:overflow-x-auto')
    for (const name of [
      'Pendiente',
      'En espera',
      'En progreso',
      'En revisión',
      'Completado',
    ]) {
      const column = within(board).getByRole('region', { name })
      expect(column).toHaveClass(
        'w-full',
        'min-w-0',
        'lg:w-72',
        'lg:min-w-64',
      )
      expect(column).not.toHaveClass('min-w-72')
    }
  })

  // Catches mutation-before-snapshot, missing optimistic cache update, rollback, or settle invalidation.
  it('updates immediately, restores the complete project on failure, and invalidates on settle', async () => {
    let reject!: (error: Error) => void
    statusRequest = () =>
      new Promise((_, rejectRequest) => {
        reject = rejectRequest
      })
    mount(<Board />)
    change('Estado de Diseño', 'completed')
    await waitFor(() =>
      expect(screen.getByLabelText('Estado de Diseño')).toHaveValue(
        'completed',
      ),
    )
    expect(
      client.getQueryData<Project>(queryKeys.projects.detail('project'))!
        .tasks[0].status,
    ).toBe('completed')
    await waitFor(() => expect(reject).toBeDefined())
    await act(async () => reject(new Error('Sin conexión')))
    await waitFor(() =>
      expect(screen.getByLabelText('Estado de Diseño')).toHaveValue('pending'),
    )
    expect(client.getQueryData(queryKeys.projects.detail('project'))).toEqual(
      project,
    )
    expect(
      client.getQueryState(queryKeys.projects.detail('project'))?.isInvalidated,
    ).toBe(true)
  })

  it('requires confirmation before deleting a task and supports cancel', async () => {
    mount(<Board />)
    const trigger = screen.getByRole('button', {
      name: 'Eliminar tarea Diseño',
    })
    trigger.focus()
    fireEvent.click(trigger)
    const dialog = screen.getByRole('dialog', { name: 'Eliminar tarea' })
    expect(dialog).toHaveTextContent('Diseño')
    expect(requests).toHaveLength(0)
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }))
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(requests).toHaveLength(0)
    fireEvent.click(
      screen.getByRole('button', { name: 'Eliminar tarea Diseño' }),
    )
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Eliminar',
      }),
    )
    await waitFor(() =>
      expect(requests).toContainEqual({
        method: 'delete',
        url: '/projects/project/tasks/one',
        data: undefined,
      }),
    )
  })
})

describe('task planning forms', () => {
  it('creates a task with manager/team choices, assignee, date and priority', async () => {
    mount(<AddTaskModal />, '?newTask=true')
    change('Nombre de la tarea', 'Planificar')
    change('Descripción de la tarea', 'Preparar entrega')
    expect(
      within(screen.getByLabelText('Responsable')).getByRole('option', {
        name: 'Ana',
      }),
    ).toHaveValue('manager')
    expect(
      within(screen.getByLabelText('Responsable')).getByRole('option', {
        name: 'Luis',
      }),
    ).toHaveValue('member')
    change('Responsable', 'member')
    change('Fecha límite', '2026-10-12')
    change('Prioridad', 'high')
    fireEvent.click(screen.getByRole('button', { name: /Guardar tarea/i }))
    await waitFor(() =>
      expect(requests).toContainEqual({
        method: 'post',
        url: '/projects/project/tasks',
        data: {
          name: 'Planificar',
          description: 'Preparar entrega',
          assignee: 'member',
          dueDate: '2026-10-12',
          priority: 'high',
        },
      }),
    )
  })

  it('blocks whitespace-only required text and connects validation to its field', async () => {
    mount(<AddTaskModal />, '?newTask=true')
    change('Nombre de la tarea', '   ')
    change('Descripción de la tarea', '  ')
    fireEvent.click(screen.getByRole('button', { name: /Guardar tarea/i }))
    await waitFor(() =>
      expect(screen.getByLabelText('Nombre de la tarea')).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    )
    expect(
      screen.getByLabelText('Nombre de la tarea'),
    ).toHaveAccessibleDescription('El nombre de la tarea es obligatorio')
    expect(screen.getByLabelText('Descripción de la tarea')).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    expect(requests).toHaveLength(0)
  })

  it('preserves planning defaults in edit and sends explicit nulls when cleared', async () => {
    mount(<EditTaskModal data={task} projectId="project" taskId="one" />)
    expect(screen.getByLabelText('Responsable')).toHaveValue('member')
    expect(screen.getByLabelText('Fecha límite')).toHaveValue('2000-01-01')
    expect(screen.getByLabelText('Prioridad')).toHaveValue('high')
    change('Responsable', '')
    change('Fecha límite', '')
    fireEvent.click(screen.getByRole('button', { name: /Guardar tarea/i }))
    await waitFor(() =>
      expect(requests).toContainEqual({
        method: 'put',
        url: '/projects/project/tasks/one',
        data: {
          name: 'Diseño',
          description: 'Revisar PORTADA',
          assignee: null,
          dueDate: null,
          priority: 'high',
        },
      }),
    )
  })

  it('defaults new tasks to medium priority with null planning fields', async () => {
    mount(<AddTaskModal />, '?newTask=true')
    change('Nombre de la tarea', 'Plan')
    change('Descripción de la tarea', 'Entrega')
    fireEvent.click(screen.getByRole('button', { name: /Guardar tarea/i }))
    await waitFor(() =>
      expect(requests).toContainEqual({
        method: 'post',
        url: '/projects/project/tasks',
        data: {
          name: 'Plan',
          description: 'Entrega',
          assignee: null,
          dueDate: null,
          priority: 'medium',
        },
      }),
    )
  })

  it('loads team choices from the project query when the form opens', async () => {
    client.removeQueries({ queryKey: queryKeys.projects.team('project') })
    mount(<EditTaskModal data={task} projectId="project" taskId="one" />)
    expect(await screen.findByRole('option', { name: 'Luis' })).toHaveValue(
      'member',
    )
    expect(screen.getByLabelText('Responsable')).toHaveValue('member')
  })
})

it('labels the details status selector and displays planning information', async () => {
  client.setQueryData(queryKeys.tasks.detail('project', 'one'), task)
  mount(<TaskModalDetails />, '?viewTask=one')
  const dialog = screen.getByRole('dialog', { name: 'Diseño' })
  expect(
    within(dialog).getByRole('combobox', { name: 'Estado de Diseño' }),
  ).toHaveValue('pending')
  expect(within(dialog).getByText('Luis')).toBeInTheDocument()
  expect(within(dialog).getByText('2000-01-01')).toBeInTheDocument()
  expect(within(dialog).getByText('Alta')).toBeInTheDocument()
  expect(
    within(dialog).getByRole('button', { name: 'Cerrar' }),
  ).toBeInTheDocument()
})

it('exposes a named navigation control and a skip link to the main content', () => {
  mount(<AppLayout />)
  const skip = screen.getByRole('link', { name: 'Saltar al contenido' })
  expect(skip).toHaveAttribute('href', '#main-content')
  expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
  expect(
    screen.getByRole('button', { name: 'Abrir menú de usuario' }),
  ).toBeInTheDocument()
})

it('does not expose edit forms to members opening an edit-task URL', async () => {
  client.setQueryData(queryKeys.auth.user(), member)
  client.setQueryData(queryKeys.tasks.detail('project', 'one'), task)
  mount(<ProjectDetailsView />, '?editTask=one')
  expect(
    screen.queryByRole('dialog', { name: 'Editar Tarea' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('combobox', { name: 'Estado de Diseño' }),
  ).toBeInTheDocument()
})

it('labels login fields and associates invalid email feedback', async () => {
  mount(<LoginView />)
  change('Email', 'invalid')
  change('Password', 'password')
  fireEvent.click(screen.getByRole('button', { name: 'Iniciar Sesión' }))
  await waitFor(() =>
    expect(screen.getByLabelText('Email')).toHaveAttribute(
      'aria-invalid',
      'true',
    ),
  )
  expect(screen.getByLabelText('Email')).toHaveAccessibleDescription(
    'E-mail no válido',
  )
  expect(requests).toHaveLength(0)
})

it('confirms note deletion and does not send a request on cancel', async () => {
  mount(
    <NoteDetail
      note={{
        _id: 'note',
        content: 'Revisar mañana',
        createdBy: manager,
        task: 'one',
        createdAt: '2026-01-01T00:00:00.000Z',
      }}
    />,
    '?viewTask=one',
  )
  const trigger = screen.getByRole('button', { name: 'Eliminar' })
  trigger.focus()
  fireEvent.click(trigger)
  expect(
    screen.getByRole('dialog', { name: 'Eliminar nota' }),
  ).toHaveTextContent('Revisar mañana')
  expect(requests).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
  await waitFor(() => expect(trigger).toHaveFocus())
  expect(requests).toHaveLength(0)
  fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }))
  fireEvent.click(
    within(await screen.findByRole('dialog')).getByRole('button', {
      name: 'Eliminar',
    }),
  )
  await waitFor(() =>
    expect(requests).toContainEqual({
      method: 'delete',
      url: '/projects/project/tasks/one/notes/note',
      data: undefined,
    }),
  )
})

it('serializes independent status writers and restores both caches after board then detail failures', async () => {
  const rejects: ((error: Error) => void)[] = []
  statusRequest = () =>
    new Promise((_, reject) => {
      rejects.push(reject)
    })
  client.setQueryData(
    queryKeys.tasks.detail('project', 'one'),
    structuredClone(task),
  )
  const { result } = renderHook(
    () => ({
      board: useTaskStatus('project'),
      details: useTaskStatus('project'),
    }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )

  act(() =>
    result.current.board.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'inProgress',
    }),
  )
  await waitFor(() => expect(rejects).toHaveLength(1))
  expect(
    client.getQueryData<Project>(queryKeys.projects.detail('project'))!
      .tasks[0].status,
  ).toBe('inProgress')
  expect(
    client.getQueryData<Task>(queryKeys.tasks.detail('project', 'one'))!
      .status,
  ).toBe('inProgress')
  act(() =>
    result.current.details.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'completed',
    }),
  )
  await act(async () => {
    await Promise.resolve()
  })
  const requestsBeforeFirstFailure = requests.length
  await act(async () => rejects[0](new Error('Board failed')))
  await waitFor(() => expect(rejects).toHaveLength(2))
  const secondOptimisticProjectStatus = client.getQueryData<Project>(
    queryKeys.projects.detail('project'),
  )!.tasks[0].status
  const secondOptimisticDetailStatus = client.getQueryData<Task>(
    queryKeys.tasks.detail('project', 'one'),
  )!.status
  await act(async () => rejects[1](new Error('Details failed')))
  await waitFor(() =>
    expect(
      result.current.board.isPending || result.current.details.isPending,
    ).toBe(false),
  )
  expect(
    client.getQueryData(queryKeys.projects.detail('project')),
  ).toEqual(project)
  expect(
    client.getQueryData(queryKeys.tasks.detail('project', 'one')),
  ).toEqual(task)
  expect(secondOptimisticProjectStatus).toBe('completed')
  expect(secondOptimisticDetailStatus).toBe('completed')
  expect(requestsBeforeFirstFailure).toBe(1)
})

it('starts the next serialized status writer without waiting for cache refetches', async () => {
  let statusCalls = 0
  statusRequest = async () => {
    statusCalls += 1
    return 'Guardado'
  }
  const pendingInvalidations: (() => void)[] = []
  const invalidate = vi
    .spyOn(client, 'invalidateQueries')
    .mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          pendingInvalidations.push(resolve)
        }),
    )
  const { result } = renderHook(
    () => ({
      board: useTaskStatus('project'),
      details: useTaskStatus('project'),
    }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )

  act(() =>
    result.current.board.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'inProgress',
    }),
  )
  await waitFor(() => expect(pendingInvalidations).toHaveLength(2))
  act(() =>
    result.current.details.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'completed',
    }),
  )
  await act(async () => {
    await Promise.resolve()
  })
  const callsBeforeRefetchCompletion = statusCalls

  invalidate.mockResolvedValue(undefined)
  await act(async () => {
    pendingInvalidations.forEach((resolve) => resolve())
  })

  expect(callsBeforeRefetchCompletion).toBe(2)
})

it('does not roll back a later status when an earlier successful invalidation rejects', async () => {
  let statusCalls = 0
  let resolveSecondStatus!: () => void
  statusRequest = () => {
    statusCalls += 1
    if (statusCalls === 1) return Promise.resolve('Primer cambio guardado')
    return new Promise<string>((resolve) => {
      resolveSecondStatus = () => resolve('Segundo cambio guardado')
    })
  }
  const rejectFirstInvalidation: ((error: Error) => void)[] = []
  let invalidationCalls = 0
  vi.spyOn(client, 'invalidateQueries').mockImplementation(() => {
    invalidationCalls += 1
    if (invalidationCalls <= 2)
      return new Promise<void>((_, reject) => {
        rejectFirstInvalidation.push(reject)
      })
    return Promise.resolve()
  })
  client.setQueryData(
    queryKeys.tasks.detail('project', 'one'),
    structuredClone(task),
  )
  const { result } = renderHook(
    () => ({
      board: useTaskStatus('project'),
      details: useTaskStatus('project'),
    }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )

  act(() =>
    result.current.board.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'inProgress',
    }),
  )
  await waitFor(() => expect(rejectFirstInvalidation).toHaveLength(2))
  act(() =>
    result.current.details.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'completed',
    }),
  )
  await waitFor(() => expect(statusCalls).toBe(2))
  expect(
    client.getQueryData<Project>(queryKeys.projects.detail('project'))!
      .tasks[0].status,
  ).toBe('completed')
  expect(
    client.getQueryData<Task>(queryKeys.tasks.detail('project', 'one'))!
      .status,
  ).toBe('completed')

  await act(async () => {
    rejectFirstInvalidation.forEach((reject) =>
      reject(new Error('First refetch failed')),
    )
  })
  await waitFor(() => expect(result.current.board.isPending).toBe(false))
  await act(async () => resolveSecondStatus())
  await waitFor(() => expect(result.current.details.isPending).toBe(false))

  expect(
    client.getQueryData<Project>(queryKeys.projects.detail('project'))!
      .tasks[0].status,
  ).toBe('completed')
  expect(
    client.getQueryData<Task>(queryKeys.tasks.detail('project', 'one'))!
      .status,
  ).toBe('completed')
})

it('does not restore account A task caches when its delayed status mutation fails after account B signs in', async () => {
  let rejectStatus!: (error: Error) => void
  statusRequest = () =>
    new Promise((_, reject) => {
      rejectStatus = reject
    })
  client.setQueryData(
    queryKeys.tasks.detail('project', 'one'),
    structuredClone(task),
  )
  const unbind = bindAuthCache(client)
  localStorage.setItem(AUTH_TOKEN_KEY, 'A-token')
  const { result } = renderHook(() => useTaskStatus('project'), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  })

  act(() =>
    result.current.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'inProgress',
    }),
  )
  await waitFor(() => expect(rejectStatus).toBeTypeOf('function'))

  await act(async () => {
    await endAuthSession()
    localStorage.setItem(AUTH_TOKEN_KEY, 'B-token')
    client.setQueryData(queryKeys.auth.user(), {
      _id: 'B',
      name: 'Bea',
      email: 'bea@example.com',
    })
    rejectStatus(new Error('A status request failed'))
  })
  await waitFor(() => expect(result.current.isPending).toBe(false))

  expect(client.getQueryData(queryKeys.auth.user())).toMatchObject({ _id: 'B' })
  expect(client.getQueryData(queryKeys.projects.detail('project'))).toBeUndefined()
  expect(
    client.getQueryData(queryKeys.tasks.detail('project', 'one')),
  ).toBeUndefined()
  unbind()
})

it('does not run a queued account A status change after account B signs in', async () => {
  let statusCalls = 0
  let rejectFirst!: (error: Error) => void
  statusRequest = () => {
    statusCalls += 1
    if (statusCalls === 1)
      return new Promise((_, reject) => {
        rejectFirst = reject
      })
    return Promise.resolve('Guardado')
  }
  const unbind = bindAuthCache(client)
  localStorage.setItem(AUTH_TOKEN_KEY, 'A-token')
  const { result } = renderHook(
    () => ({
      first: useTaskStatus('project'),
      queued: useTaskStatus('project'),
    }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )

  act(() =>
    result.current.first.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'inProgress',
    }),
  )
  await waitFor(() => expect(rejectFirst).toBeTypeOf('function'))
  act(() =>
    result.current.queued.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'completed',
    }),
  )

  await act(async () => {
    await endAuthSession()
    localStorage.setItem(AUTH_TOKEN_KEY, 'B-token')
    client.setQueryData(queryKeys.auth.user(), {
      _id: 'B',
      name: 'Bea',
      email: 'bea@example.com',
    })
    client.setQueryData(queryKeys.projects.detail('project'), {
      ...project,
      projectName: 'Proyecto de B',
    })
    rejectFirst(new Error('A status request failed'))
  })
  await waitFor(() =>
    expect(
      result.current.first.isPending || result.current.queued.isPending,
    ).toBe(false),
  )

  expect(statusCalls).toBe(1)
  expect(
    client.getQueryData<Project>(queryKeys.projects.detail('project'))
      ?.projectName,
  ).toBe('Proyecto de B')
  unbind()
})

it('releases the status writer when optimistic setup fails', async () => {
  const cancelQueries = vi.spyOn(client, 'cancelQueries')
  cancelQueries.mockRejectedValueOnce(new Error('Cancel failed'))
  statusRequest = async () => 'Guardado'
  const { result } = renderHook(
    () => ({
      board: useTaskStatus('project'),
      details: useTaskStatus('project'),
    }),
    {
      wrapper: ({ children }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  )

  act(() =>
    result.current.board.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'inProgress',
    }),
  )
  act(() =>
    result.current.details.mutate({
      projectId: 'project',
      taskId: 'one',
      status: 'completed',
    }),
  )

  await waitFor(() =>
    expect(requests).toContainEqual({
      method: 'post',
      url: '/projects/project/tasks/one/status',
      data: { status: 'completed' },
    }),
  )
})

it('allows managers to open the team management modal and removal menu', async () => {
  mount(<ProjectTeamView />)
  fireEvent.click(screen.getByRole('button', { name: 'Opciones de Luis' }))
  expect(
    await screen.findByRole('menuitem', { name: 'Eliminar del Proyecto' }),
  ).toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape', code: 'Escape' })
  fireEvent.click(screen.getByRole('button', { name: 'Agregar colaboradores' }))
  expect(
    await screen.findByRole('dialog', {
      name: 'Agregar Integrante al equipo',
    }),
  ).toBeInTheDocument()
})

it('retains read-only team access for members and ignores direct add-member URLs', () => {
  client.setQueryData(queryKeys.auth.user(), member)
  mount(<ProjectTeamView />, '?addMember=true')
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(screen.getByText('Luis')).toBeInTheDocument()
  expect(screen.getByText('luis@example.com')).toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Agregar colaboradores' }),
  ).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Opciones de Luis' }),
  ).not.toBeInTheDocument()
  expect(
    screen.getByRole('link', { name: 'Volver al proyecto' }),
  ).toBeInTheDocument()
})
