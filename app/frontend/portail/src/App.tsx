import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom'
import { AuthBootstrap } from '@shared/auth/AuthBootstrap'
import { useAuthStore } from '@shared/auth/useAuthStore'
import Login from '@shared/auth/Login'
import axiosInstance from '@shared/auth/axiosInstance'
import { CLIENT_ROLES, isRoleAllowed } from '@shared/auth/roleAccess'
import { AppErrorBoundary } from '@shared/ui/AppErrorBoundary'
import { ReservationWizardShell } from './pages/Reservations/ReservationWizardShell'
import { PaymentLandingPage } from './pages/Payment/PaymentLandingPage'

const ClientLoginRoute = () => {
  const { clearAuth, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()
  const [kickMessage, setKickMessage] = useState<string | undefined>()

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    if (user?.role && !isRoleAllowed(user.role, CLIENT_ROLES)) {
      clearAuth()
      setKickMessage("Ce compte est reserve a l'espace staff.")
      return
    }

    navigate('/', { replace: true })
  }, [clearAuth, isAuthenticated, navigate, user?.role])

  return (
    <Login
      onSuccess={() => navigate('/')}
      allowedRoles={CLIENT_ROLES}
      appLabel="Portail Client"
      appDescription="Acces reserve aux clients du restaurant"
      deniedMessage="Ce compte est reserve a l'espace staff."
      variant="client"
      initialError={kickMessage}
    />
  )
}

const ProtectedClientShell = () => {
  const { clearAuth, isAuthenticated, user } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout/')
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      clearAuth()
    }
  }

  useEffect(() => {
    if (!isAuthenticated || (user?.role && !isRoleAllowed(user.role, CLIENT_ROLES))) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate, user?.role])

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <header className="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <span className="text-sm font-semibold tracking-wide text-teal">Portail Client</span>
        <button
          onClick={handleLogout}
          className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-muted opacity-60 active:scale-95"
          style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
        >
          Deconnexion
        </button>
      </header>
      <Outlet />
    </main>
  )
}

function App() {

  return (
    <AppErrorBoundary appLabel="Le portail client">
      <AuthBootstrap>
        <BrowserRouter
          future={{
            v7_relativeSplatPath: true,
            v7_startTransition: true,
          }}
        >
          <Routes>
            <Route path="/login" element={<ClientLoginRoute />} />
            <Route path="/pay/:token" element={<PaymentLandingPage />} />
            <Route element={<ProtectedClientShell />}>
              <Route index element={<Navigate to="/reservations/new" replace />} />
              <Route path="/reservations/*" element={<ReservationWizardShell />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthBootstrap>
    </AppErrorBoundary>
  )
}

export default App
