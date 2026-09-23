import { lazy, Suspense } from 'react'
import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import LoadingApp from '@/components/LoadingApp'
import RouteErrorBoundary from '@/components/RouteErrorBoundary'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ProfileLayout from './layouts/ProfileLayout'

const DashboardView = lazy(() => import('@/views/DashboardView'))
const NotFoundView = lazy(() => import('./views/404/NotFoundView'))
const ConfirmAccountView = lazy(
  () => import('./views/auth/ConfirmAccountView')
)
const ForgotPasswordView = lazy(
  () => import('./views/auth/ForgotPasswordView')
)
const LoginView = lazy(() => import('./views/auth/LoginView'))
const NewPasswordView = lazy(() => import('./views/auth/NewPasswordView'))
const RegisterView = lazy(() => import('./views/auth/RegisterView'))
const RequestNewCodeView = lazy(
  () => import('./views/auth/RequestNewCodeView')
)
const ChangePasswordView = lazy(
  () => import('./views/profile/ChangePasswordView')
)
const ProfileView = lazy(() => import('./views/profile/ProfileView'))
const CreateProjectView = lazy(
  () => import('./views/projects/CreateProjectView')
)
const EditProjectView = lazy(
  () => import('./views/projects/EditProjectView')
)
const ProjectDetailsView = lazy(
  () => import('./views/projects/ProjectDetailsView')
)
const ProjectTeamView = lazy(
  () => import('./views/projects/ProjectTeamView')
)

export default function Router() {
  return (
    <BrowserRouter>
      <RouteErrorBoundary>
        <Suspense fallback={<LoadingApp />}>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardView />} index />
              <Route path="/projects/create" element={<CreateProjectView />} />
              <Route
                path="/projects/:projectId"
                element={<ProjectDetailsView />}
              />
              <Route
                path="/projects/:projectId/edit"
                element={<EditProjectView />}
              />
              <Route
                path="/projects/:projectId/team"
                element={<ProjectTeamView />}
              />
              <Route element={<ProfileLayout />}>
                <Route path={'/profile'} element={<ProfileView />} />
                <Route
                  path={'/profile/change-password'}
                  element={<ChangePasswordView />}
                />
              </Route>
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/auth/login" element={<LoginView />} />
              <Route path="/auth/register" element={<RegisterView />} />
              <Route
                path="/auth/confirm-account"
                element={<ConfirmAccountView />}
              />
              <Route
                path="/auth/request-code"
                element={<RequestNewCodeView />}
              />
              <Route
                path="/auth/forgot-password"
                element={<ForgotPasswordView />}
              />
              <Route path="/auth/new-password" element={<NewPasswordView />} />
            </Route>
            <Route element={<AuthLayout />}>
              <Route path="/404" element={<NotFoundView />} />
            </Route>
          </Routes>
        </Suspense>
      </RouteErrorBoundary>
    </BrowserRouter>
  )
}
