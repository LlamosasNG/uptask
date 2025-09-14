import AppLayout from '@/layouts/AppLayout'
import AuthLayout from '@/layouts/AuthLayout'
import DashboardView from '@/views/DashboardView'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import ConfirmAccountView from './views/auth/ConfirmAccountView'
import ForgotPasswordView from './views/auth/ForgotPasswordView'
import LoginView from './views/auth/LoginView'
import NewPasswordView from './views/auth/NewPasswordView'
import RegisterView from './views/auth/RegisterView'
import RequestNewCodeView from './views/auth/RequestNewCodeView'
import CreateProjectView from './views/projects/CreateProjectView'
import EditProjectView from './views/projects/EditProjectView'
import ProjectDetailsView from './views/projects/ProjectDetailsView'
import ProjectTeamView from './views/projects/ProjectTeamView'

export default function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DashboardView />} index />
          <Route path="/projects/create" element={<CreateProjectView />} />
          <Route path="/projects/:projectId" element={<ProjectDetailsView />} />
          <Route
            path="/projects/:projectId/edit"
            element={<EditProjectView />}
          />
          <Route
            path="/projects/:projectId/team"
            element={<ProjectTeamView />}
          />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/auth/login" element={<LoginView />} />
          <Route path="/auth/register" element={<RegisterView />} />
          <Route
            path="/auth/confirm-account"
            element={<ConfirmAccountView />}
          />
          <Route path="/auth/request-code" element={<RequestNewCodeView />} />
          <Route
            path="/auth/forgot-password"
            element={<ForgotPasswordView />}
          />
          <Route path="/auth/new-password" element={<NewPasswordView />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
