import { getFullProject } from '@/api/ProjectAPI'
import LoadingApp from '@/components/LoadingApp'
import AsyncState from '@/components/AsyncState'
import AddTaskModal from '@/components/tasks/AddTaskModal'
import EditTaskData from '@/components/tasks/EditTaskData'
import TaskList from '@/components/tasks/TaskList'
import TaskModalDetails from '@/components/tasks/TaskModalDetails'
import { useAuth } from '@/hooks/useAuth'
import { isManager } from '@/utils/policies'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { normalizeApiError } from '@/api/errors'
import { queryKeys } from '@/api/queryKeys'

export default function ProjectDetailsView() {
  const navigate = useNavigate()
  const params = useParams()
  const projectId = params.projectId!
  const { data: user, isLoading: authLoading } = useAuth()

  const { data, error, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getFullProject(projectId),
    retry: false,
  })
  const canEdit = useMemo(() => data?.manager === user?._id, [data, user])

  if (isLoading || authLoading) return <LoadingApp />
  if (isError && normalizeApiError(error).status === 404)
    return <Navigate to={'/404'} />
  if (isError)
    return (
      <AsyncState
        data={data}
        error={error}
        isLoading={false}
        empty={null}
        onRetry={() => void refetch()}
      >
        {() => null}
      </AsyncState>
    )
  if (data && user)
    return (
      <>
        <h1 className="text-5xl font-black">{data.projectName}</h1>
        <p className="text-2xl font-light text-gray-500 mt-5">
          {data.description}
        </p>
        {isManager(data.manager, user._id) && (
          <nav className="my-5 flex gap-3">
            <button
              type="button"
              className="bg-purple-400 hover:bg-purple-500 px-10 py-3 text-white text-xl font-bold cursor-pointer transition-colors"
              onClick={() => navigate(location.pathname + '?newTask=true')}
            >
              Agregar tarea
            </button>
            <Link
              to={'team'}
              className="bg-fuchsia-600 hover:bg-fuchsia-700 px-10 py-3 text-white text-xl font-bold cursor-pointer transition-colors"
            >
              Colaboradores
            </Link>
          </nav>
        )}
        <TaskList tasks={data.tasks} canEdit={canEdit} />
        <AddTaskModal />
        <EditTaskData />
        <TaskModalDetails />
      </>
    )
}
