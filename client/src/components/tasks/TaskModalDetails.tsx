import { getTaskById } from '@/api/TaskAPI'
import { statusTranslations } from '@/locales/es'
import { formatDate } from '@/utils/utils'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { useQuery } from '@tanstack/react-query'
import { Fragment } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import NotesPanel from '../notes/NotesPanel'
import { queryKeys } from '@/api/queryKeys'
import AsyncState from '@/components/AsyncState'
import { normalizeApiError } from '@/api/errors'
import { useTaskStatus } from '@/hooks/useTaskStatus'
import TaskStatusControl from './TaskStatusControl'
import Button from '../ui/Button'

export default function TaskModalDetails() {
  const params = useParams()
  const projectId = params.projectId!
  const navigate = useNavigate()
  const location = useLocation()
  const queryParams = new URLSearchParams(location.search)
  const taskId = queryParams.get('viewTask')!
  const show = taskId ? true : false

  const { data, isError, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.tasks.detail(projectId, taskId),
    queryFn: () => getTaskById({ projectId, taskId }),
    enabled: !!taskId,
    retry: false,
  })

  const { mutate, isPending, error: statusError } = useTaskStatus(projectId)

  if (isLoading)
    return (
      <AsyncState data={data} error={null} isLoading empty={null}>
        {() => null}
      </AsyncState>
    )

  if (isError && normalizeApiError(error).status === 404)
    return <Navigate to={`/projects/${projectId}`} />

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

  if (data)
    return (
      <>
        <Transition appear show={show} as={Fragment}>
          <Dialog
            as="div"
            className="relative z-10"
            onClose={() => {
              navigate(location.pathname, { replace: true })
            }}
          >
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black/60" />
            </TransitionChild>

            <div className="fixed inset-0 overflow-y-auto">
              <div className="flex min-h-full items-center justify-center p-4 text-center">
                <TransitionChild
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 scale-95"
                  enterTo="opacity-100 scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 scale-100"
                  leaveTo="opacity-0 scale-95"
                >
                  <DialogPanel className="w-full max-w-2xl transform rounded-2xl bg-white p-5 text-left shadow-xl transition-all sm:p-8">
                    <div className="mb-4 flex justify-end">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          navigate(location.pathname, { replace: true })
                        }
                      >
                        Cerrar
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">
                      Agregada el: {formatDate(data.createdAt)}{' '}
                    </p>
                    <p className="text-xs text-slate-500">
                      Última actualización: {formatDate(data.updatedAt)}
                    </p>
                    <DialogTitle
                      as="h3"
                      className="my-5 break-words text-2xl font-bold text-slate-900"
                    >
                      {data.name}
                    </DialogTitle>
                    <p className="mb-4 break-words text-slate-600">
                      Descripción: {data.description}
                    </p>
                    <dl className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
                      <div>
                        <dt className="text-slate-500">Responsable</dt>
                        <dd className="mt-1 font-medium">
                          {data.assignee?.name ?? 'Sin asignar'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Prioridad</dt>
                        <dd className="mt-1 font-medium">
                          {
                            { low: 'Baja', medium: 'Media', high: 'Alta' }[
                              data.priority ?? 'medium'
                            ]
                          }
                        </dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Fecha límite</dt>
                        <dd className="mt-1 font-medium">
                          {data.dueDate?.slice(0, 10) ?? 'Sin fecha límite'}
                        </dd>
                      </div>
                    </dl>
                    {data.completedBy.length ? (
                      <>
                        <p className="my-5 text-lg font-semibold text-slate-800">
                          Historial de Cambios
                        </p>
                        <ul className="list-decimal space-y-2 pl-5 text-sm">
                          {data.completedBy.map((activityLog) => (
                            <li key={activityLog._id}>
                              <span className="font-bold text-slate-600">
                                {statusTranslations[activityLog.status]}
                              </span>{' '}
                              por: {activityLog.user.name}
                              {activityLog.createdAt && (
                                <time
                                  dateTime={activityLog.createdAt}
                                  className="ml-2 text-slate-500"
                                >
                                  {formatDate(activityLog.createdAt)}
                                </time>
                              )}
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <div className="my-5 space-y-3">
                      <TaskStatusControl
                        taskId={taskId}
                        name={data.name}
                        status={data.status}
                        disabled={isPending}
                        onChange={(status) =>
                          mutate({ projectId, taskId, status })
                        }
                      />
                      {statusError && (
                        <p role="alert" className="text-sm text-red-700">
                          No se pudo cambiar el estado: {statusError.message}
                        </p>
                      )}
                    </div>
                    <NotesPanel notes={data.notes} />
                  </DialogPanel>
                </TransitionChild>
              </div>
            </div>
          </Dialog>
        </Transition>
      </>
    )
}
