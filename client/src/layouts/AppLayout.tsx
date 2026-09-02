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

  if (data)
    return (
      <>
        <header className="bg-gray-800 py-5">
          <div className="max-w-screen-2xl mx-auto flex flex-col lg:flex-row justify-between items-center">
            <div className="w-64">
              <Link to={'/'}>
                <Logo />
              </Link>
            </div>
            <NavMenu name={data.name} />
          </div>
        </header>

        <section className="max-w-screen-2xl mx-auto mt-10 p-5">
          <Outlet />
        </section>

        <footer className="py-5">
          <p className="text-center">
            Todos los derechos reservados {new Date().getFullYear()}
          </p>
        </footer>
        <ToastContainer pauseOnHover={false} pauseOnFocusLoss={false} />
      </>
    )
}
