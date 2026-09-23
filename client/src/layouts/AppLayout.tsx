import LoadingApp from '@/components/LoadingApp'
import AsyncState from '@/components/AsyncState'
import { normalizeApiError } from '@/api/errors'
import Logo from '@/components/Logo'
import NavMenu from '@/components/NavMenu'
import { useAuth } from '@/hooks/useAuth'
import { Link, Navigate, Outlet } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function AppLayout() {
  const { data, error, isError, isLoading, refetch } = useAuth()

  if (isLoading) return <LoadingApp />
  if (isError && normalizeApiError(error).status === 401)
    return <Navigate to={'/auth/login'} />
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

  if (!data) return <Navigate to={'/auth/login'} />

  return (
    <>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">Saltar al contenido</a>
        <header className="bg-slate-900 py-4">
          <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 sm:px-8">
            <div className="w-40 sm:w-48">
              <Link to={'/'} aria-label="UpTask: mis proyectos">
                <Logo />
              </Link>
            </div>
            <NavMenu name={data.name} />
          </div>
        </header>

        <main id="main-content" tabIndex={-1} className="mx-auto min-h-[70vh] w-full max-w-screen-2xl px-4 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </main>

        <footer className="px-4 py-6 text-sm text-slate-500">
          <p className="text-center">
            Todos los derechos reservados {new Date().getFullYear()}
          </p>
        </footer>
        <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
    </>
  )
}
