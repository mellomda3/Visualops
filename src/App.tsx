import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { useAuth } from './context/AuthContext'
import { canAccessPath, homePathForRole } from './lib/status'
import { GraduacionPage } from './pages/Graduacion'
import { LoginPage } from './pages/Login'
import { OpticoPage } from './pages/Optico'
import { PanelPage } from './pages/Panel'
import { RecepcionPage } from './pages/Recepcion'
import type { ReactNode } from 'react'

function Protected({ children }: { children: ReactNode }) {
  const { profile, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-600">
        Cargando…
      </div>
    )
  }
  if (!profile) return <Navigate to="/login" replace />
  return children
}

function RoleGate({ path, children }: { path: string; children: ReactNode }) {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  if (!canAccessPath(profile.role, path)) {
    return <Navigate to={homePathForRole(profile.role)} replace />
  }
  return children
}

function AppHome() {
  const { profile } = useAuth()
  if (!profile) return <Navigate to="/login" replace />
  return <Navigate to={homePathForRole(profile.role)} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/app"
        element={
          <Protected>
            <AppShell />
          </Protected>
        }
      >
        <Route index element={<AppHome />} />
        <Route
          path="recepcion"
          element={
            <RoleGate path="/app/recepcion">
              <RecepcionPage />
            </RoleGate>
          }
        />
        <Route
          path="graduacion"
          element={
            <RoleGate path="/app/graduacion">
              <GraduacionPage />
            </RoleGate>
          }
        />
        <Route
          path="optico"
          element={
            <RoleGate path="/app/optico">
              <OpticoPage />
            </RoleGate>
          }
        />
        <Route
          path="panel"
          element={
            <RoleGate path="/app/panel">
              <PanelPage />
            </RoleGate>
          }
        />
      </Route>
      <Route path="/" element={<Navigate to="/app" replace />} />
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}
