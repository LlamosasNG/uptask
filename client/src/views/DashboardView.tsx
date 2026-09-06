import { getProjects } from '@/api/ProjectAPI'
import LoadingApp from '@/components/LoadingApp'
import AsyncState from '@/components/AsyncState'
import DeleteProjectModal from '@/components/projects/DeleteProjectModal'
import { useAuth } from '@/hooks/useAuth'
import { isManager } from '@/utils/policies'
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from '@headlessui/react'
import { EllipsisVerticalIcon } from '@heroicons/react/20/solid'
import { useQuery } from '@tanstack/react-query'
import { Fragment } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { queryKeys } from '@/api/queryKeys'
import PageHeader from '@/components/ui/PageHeader'
import EmptyState from '@/components/ui/EmptyState'

export default function DashboardView() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: user, isLoading: authLoading } = useAuth()
  const { data, error, isLoading, refetch } = useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: getProjects,
  })

  if (isLoading || authLoading) return <LoadingApp />
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
  if (data && user)
    return (
      <>
        <PageHeader
          title="Mis proyectos"
          description="Maneja y administra tus proyectos"
          actions={
            <Link className="btn btn-primary" to={'/projects/create'}>
              Nuevo proyecto
            </Link>
          }
        />
        {data.length ? (
          <ul role="list" className="grid gap-4 lg:grid-cols-2">
            {data.map((project) => (
              <li
                key={project._id}
                className="flex justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
              >
                <div className="flex min-w-0 gap-x-4">
                  <div className="min-w-0 flex-auto space-y-2">
                    <div className="mb-2">
                      {isManager(project.manager, user._id) ? (
                        <p className="inline-block rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
                          Responsable
                        </p>
                      ) : (
                        <p className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          Colaborador
                        </p>
                      )}
                    </div>
                    <Link
                      to={`projects/${project._id}`}
                      className="break-words text-xl font-bold text-slate-900 hover:text-violet-700 hover:underline"
                    >
                      {project.projectName}
                    </Link>
                    <p className="mt-2 break-words text-sm text-slate-600">
                      Cliente: {project.clientName}
                    </p>
                    <p className="break-words text-sm text-slate-600">
                      {project.description}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-x-6">
                  <Menu as="div" className="relative flex-none">
                    <MenuButton className="-m-2.5 block p-2.5 text-gray-500 hover:text-gray-900 cursor-pointer">
                      <span className="sr-only">
                        Opciones de {project.projectName}
                      </span>
                      <EllipsisVerticalIcon
                        className="h-7 w-7"
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
                          <Link
                            to={`/projects/${project._id}`}
                            className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-100 w-full text-left rounded-sm"
                          >
                            Ver Proyecto
                          </Link>
                        </MenuItem>
                        {isManager(project.manager, user._id) && (
                          <>
                            <MenuItem>
                              <Link
                                to={`projects/${project._id}/edit`}
                                className="block px-3 py-1 text-sm leading-6 text-gray-900 hover:bg-gray-100 w-full text-left rounded-sm"
                              >
                                Editar Proyecto
                              </Link>
                            </MenuItem>
                            <MenuItem>
                              <button
                                type="button"
                                className="block px-3 py-1 text-sm leading-6 text-red-500 cursor-pointer hover:bg-gray-100 w-full text-left rounded-sm"
                                onClick={() => {
                                  navigate(
                                    location.pathname +
                                      `?deleteProject=${project._id}`,
                                  )
                                }}
                              >
                                Eliminar Proyecto
                              </button>
                            </MenuItem>
                          </>
                        )}
                      </MenuItems>
                    </Transition>
                  </Menu>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No hay proyectos aún"
            description="Crea tu primer proyecto para organizar tareas y colaborar con tu equipo."
            action={
              <Link className="btn btn-primary" to="/projects/create">
                crea uno nuevo
              </Link>
            }
          />
        )}
        <DeleteProjectModal />
      </>
    )
}
