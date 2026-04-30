import { useEffect } from 'react'
import { useAuthStore } from '@shared/auth/useAuthStore'
import Login from '@shared/auth/Login'
import axiosInstance from '@shared/auth/axiosInstance'
import { redirectToRoleApp } from '@shared/auth/roleRedirect'
import { Route, Routes } from 'react-router-dom'
import { MapView } from './pages/Map/MapView'
import { OrderingPage } from './pages/Ordering/OrderingPage'
import logo from '@shared/assets/logo.svg'

function App() {
  const { isAuthenticated, clearAuth, user } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && user?.role) {
      redirectToRoleApp(user.role)
    }
  }, [isAuthenticated, user?.role])

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout/')
    } catch (err) {
      console.error("Logout failed", err)
    } finally {
      clearAuth()
    }
  }

  if (!isAuthenticated) {
    return <Login onSuccess={(role) => redirectToRoleApp(role)} />
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navigation Header */}
      <nav className="h-20 border-b border-white/5 bg-surface/50 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src={logo} alt="Tastify" className="w-10 h-10" />
          <div className="h-6 w-px bg-white/10" />
          <span className="text-[11px] font-bold text-teal uppercase tracking-[0.2em]">Interface Salle</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-white">{user?.username}</span>
            <span className="text-[10px] text-teal font-bold uppercase tracking-wider">{user?.role}</span>
          </div>
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-full bg-white/5 hover:bg-error/10 text-foreground-muted hover:text-error transition-all active:scale-90 border border-white/5"
            title="Se déconnecter"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </nav>

      <main className="flex-1 p-6 sm:p-10 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<MapView />} />
          <Route path="/tables/:id/order" element={<OrderingPage />} />
        </Routes>
      </main>

      <footer className="py-6 text-center border-t border-white/5">
        <p className="text-[10px] text-foreground-muted font-bold uppercase tracking-widest opacity-50">
          Tastify OS — Plan de Salle v1.0
        </p>
      </footer>
    </div>
  )
}

export default App
