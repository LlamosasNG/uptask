import { getProjectTeam, removeMemberToProject } from '@/api/TeamAPI'
import AddMemberModal from '@/components/team/AddMemberModal'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Fragment, useState } from 'react'
import {
  Link,
  Navigate,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { toast } from 'react-toastify'
import AsyncState from '@/components/AsyncState'
import { queryKeys } from '@/api/queryKeys'
import { normalizeApiError } from '@/api/errors'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'
import Button from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { getFullProject } from '@/api/ProjectAPI'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import type { TeamMember } from '@/types/index'

export default function ProjectTeamView() {
  const navigate = useNavigate()
  const location = useLocation()
  const params = useParams()
  const projectId = params.projectId!
  const queryClient = useQueryClient()
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const { data: user } = useAuth()
  const { data: project, error: projectError, isLoading: projectLoading, refetch: refetchProject } = useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => getFullProject(projectId),
    retry: false,
  })
  const canManage = !!user && project?.manager === user._id

  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.projects.team(projectId),
    queryFn: () => getProjectTeam(projectId),
    retry: false,
  })

  const { mutate, isPending } = useMutation({
    mutationFn: removeMemberToProject,
    onError: (error) => {
      toast.error(error.message)
    },
    onSuccess: async (data) => {
      toast.success(data)
      setMemberToRemove(null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.projects.all() })
    },
  })

  if (projectError && normalizeApiError(projectError).status === 404)
    return <Navigate to="/404" />
  if (projectError)
    return (
      <AsyncState data={project} error={projectError} isLoading={false} empty={null} onRetry={() => void refetchProject()}>
        {() => null}
      </AsyncState>
    )
  if (isLoading || projectLoading)
    return (
      <AsyncState data={data} error={null} isLoading empty={null}>
        {() => null}
      </AsyncState>
    )
  if (error && normalizeApiError(error).status === 404)
    return <Navigate to="/404" />
  if (error)
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
        <PageHeader
          title={canManage ? 'Administrar Equipo' : 'Equipo del proyecto'}
          description={
            canManage
              ? 'Administra el equipo de trabajo de este proyecto'
              : 'Consulta los colaboradores de este proyecto'
          }
          actions={
            <>
              {canManage && (
                <Button
                  onClick={() =>
                    navigate(location.pathname + '?addMember=true')
                  }
                >
                  Agregar colaboradores
                </Button>
              )}
              <Link to={`/projects/${projectId}`} className="btn btn-secondary">
                Volver al proyecto
              </Link>
            </>
          }
        />
        <h2 className="my-6 text-2xl font-bold text-slate-900">
          Miembros actuales
        </h2>
        {data.length ? (
          <ul
            role="list"
            className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white shadow-sm"
          >
            {data?.map((member) => (
              <li
                key={member._id}
                className="flex justify-between gap-4 p-5 sm:p-6"
              >
                <div className="flex min-w-0 gap-x-4">
                  <div className="min-w-0 flex-auto space-y-2">
                    <p className="break-words text-lg font-semibold text-slate-900">
                      {member.name}
                    </p>
                    <p className="break-words text-sm text-slate-600">
                      {member.email}
                    </p>
                  </div>
                </div>
                {canManage && (
                  <div className="flex shrink-0 items-center gap-x-6">
                    <Menu as="div" className="relative flex-none">
                      <MenuButton className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900">
                        <span className="sr-only">
                          Opciones de {member.name}
                        </span>
                        <EllipsisVerticalIcon
                          className="h-9 w-9 cursor-pointer"
                          aria-hidden="true"
                        />
                      </MenuButton>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <MenuItems className="absolute right-0 z-10 mt-2 w-56 origin-top-right rounded-md bg-white py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none">
                          <MenuItem>
                            <button
                              type="button"
                              className="block px-3 py-1 text-sm leading-6 text-red-500 cursor-pointer"
                              onClick={() => {
                                setMemberToRemove(member)
                              }}
                            >
                              Eliminar del Proyecto
                            </button>
                          </MenuItem>
                        </MenuItems>
                      </Transition>
                    </Menu>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No hay miembros en este equipo"
            description={
              canManage
                ? 'Agrega colaboradores para compartir el trabajo del proyecto.'
                : 'Aún no se han agregado colaboradores.'
            }
          />
        )}
        {canManage && <AddMemberModal />}
        <ConfirmDialog
          open={!!memberToRemove}
          title="Eliminar colaborador"
          description={`${memberToRemove?.name ?? 'El colaborador'} perderá acceso al proyecto y se eliminarán sus asignaciones de tareas.`}
          pending={isPending}
          onCancel={() => setMemberToRemove(null)}
          onConfirm={() => {
            if (memberToRemove && canManage) mutate({ projectId, id: memberToRemove._id })
          }}
        />
      </>
    )
}
