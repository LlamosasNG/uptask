import { getFullProject } from '@/api/ProjectAPI'
import LoadingApp from '@/components/LoadingApp'
import AsyncState from '@/components/AsyncState'
import AddTaskModal from '@/components/tasks/AddTaskModal'
import EditTaskData from '@/components/tasks/EditTaskData'
import TaskList from '@/components/tasks/TaskList'
import TaskModalDetails from '@/components/tasks/TaskModalDetails'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { normalizeApiError } from '@/api/errors'
import { queryKeys } from '@/api/queryKeys'
import PageHeader from '@/components/ui/PageHeader'
import Button from '@/components/ui/Button'

export default function ProjectDetailsView() {
  const navigate = useNavigate()
  const location = useLocation()
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
        <PageHeader
          title={data.projectName}
          description={data.description}
          actions={
            <>
              <Link to="/" className="btn btn-secondary">
                Mis proyectos
              </Link>
              {canEdit && (
                <>
                  <Button
                    onClick={() =>
                      navigate(location.pathname + '?newTask=true')
                    }
                  >
                    Agregar tarea
                  </Button>
                  <Link to={'team'} className="btn btn-secondary">
                    Colaboradores
                  </Link>
                </>
              )}
            </>
          }
        />
        <TaskList tasks={data.tasks} canEdit={canEdit} />
        {canEdit && (
          <>
            <AddTaskModal />
            <EditTaskData />
          </>
        )}
        <TaskModalDetails />
      </>
    )
}
