import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate, Link } from 'react-router-dom'
import { AuthBootstrap } from '@shared/auth/AuthBootstrap'
import { useAuthStore } from '@shared/auth/useAuthStore'
import Login from '@shared/auth/Login'
import axiosInstance from '@shared/auth/axiosInstance'
import { CLIENT_ROLES, isRoleAllowed } from '@shared/auth/roleAccess'
import { AppErrorBoundary } from '@shared/ui/AppErrorBoundary'
import { ReservationWizardShell } from './pages/Reservations/ReservationWizardShell'
import { PaymentLandingPage } from './pages/Payment/PaymentLandingPage'
import { MenuPage } from './pages/Menu/MenuPage'
import { PortalHomePage } from './pages/Home/PortalHomePage'
import { ProtectedFeatureNotice } from './components/ProtectedFeatureNotice'
import LoyaltyPage from './pages/Loyalty/LoyaltyPage'
import { ConnectivityBanner } from '@shared/components/ConnectivityBanner'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from './store/useCartStore'
import { CartOverlay } from './components/cart/CartOverlay'

export const ClientLoginRoute = () => {
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

export const PublicClientShell = () => {
  const { clearAuth, isAuthenticated, user } = useAuthStore()
  const itemCount = useCartStore((s) => s.getItemCount())
  const [isCartOpen, setIsCartOpen] = useState(false)

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
    if (isAuthenticated && user?.role && !isRoleAllowed(user.role, CLIENT_ROLES)) {
      clearAuth()
    }
  }, [clearAuth, isAuthenticated, user?.role])

  return (
    <main className="min-h-screen bg-background text-foreground font-sans">
      <header className="border-b border-white/5 bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
            <Link to="/" className="text-sm font-semibold tracking-[0.18em] text-teal uppercase">
              Portail Client
            </Link>
            <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-foreground-muted">
              <Link to="/" className="transition-colors hover:text-teal">Accueil</Link>
              <Link to="/menu" className="transition-colors hover:text-teal">Menu</Link>
              <Link to="/reservations" className="transition-colors hover:text-teal">Reservation</Link>
              <Link to="/fidelite" className="transition-colors hover:text-teal">Fidelite</Link>
            </nav>
          </div>
          <div className="flex items-center justify-between md:justify-end gap-6">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-foreground-muted hover:text-teal transition-colors"
            >
              <ShoppingBag size={22} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[10px] font-bold text-white">
                  {itemCount}
                </span>
              )}
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-xs font-medium uppercase tracking-[0.16em] text-foreground-muted">
                  {user?.username ?? 'Client connecte'}
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-white/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-muted active:scale-[0.97]"
                  style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
                >
                  Deconnexion
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal px-5 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-white active:scale-[0.97]"
                style={{ transition: 'opacity 180ms ease-out, transform 160ms ease-out' }}
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>
      <Outlet />
      <CartOverlay isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </main>
  )
}

const RequireClientAuth = () => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || (user?.role && !isRoleAllowed(user.role, CLIENT_ROLES))) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export const ClientReservationRoute = () => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || (user?.role && !isRoleAllowed(user.role, CLIENT_ROLES))) {
    return (
      <ProtectedFeatureNotice
        eyebrow="Reservation"
        title="La reservation en ligne demande un compte client."
        description="Vous pouvez consulter le menu librement, mais la creation, l'annulation et le suivi d'une reservation restent reserves aux comptes clients."
        primaryAction={{ label: 'Se connecter', to: '/login' }}
        secondaryAction={{ label: 'Voir le menu', to: '/menu' }}
      />
    )
  }

  return <ReservationWizardShell />
}

export const ClientLoyaltyRoute = () => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated || (user?.role && !isRoleAllowed(user.role, CLIENT_ROLES))) {
    return (
      <ProtectedFeatureNotice
        eyebrow="Fidelite"
        title="Le programme de fidelite demande un compte client."
        description="Les points, coupons et avantages sont lies a votre profil. Connectez-vous pour y acceder."
        primaryAction={{ label: 'Se connecter', to: '/login' }}
        secondaryAction={{ label: 'Retour accueil', to: '/' }}
      />
    )
  }

  return <LoyaltyPage />
}

const AuthenticatedApp = () => (
  <AuthBootstrap>
    <ConnectivityBanner />
    <Routes>
      <Route path="/login" element={<ClientLoginRoute />} />
      <Route element={<PublicClientShell />}>
        <Route index element={<PortalHomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/reservations" element={<ProtectedFeatureNotice
          eyebrow="Reservation"
          title="Les reservations sont visibles ici, mais l'action demande un compte."
          description="Le portail client laisse le menu en acces libre. En revanche, reserver, annuler ou suivre une reservation exige une authentification client."
          primaryAction={{ label: 'Se connecter', to: '/login' }}
          secondaryAction={{ label: 'Voir le menu', to: '/menu' }}
        />} />
        <Route path="/reservations/*" element={<ClientReservationRoute />} />
        <Route path="/fidelite" element={<ClientLoyaltyRoute />} />
        <Route element={<RequireClientAuth />}>
          <Route path="/mon-compte" element={<Navigate to="/reservations/new" replace />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </AuthBootstrap>
)

function App() {
  return (
    <AppErrorBoundary appLabel="Le portail client">
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <Routes>
          <Route path="/pay/:token" element={<PaymentLandingPage />} />
          <Route path="*" element={<AuthenticatedApp />} />
        </Routes>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}

export default App
