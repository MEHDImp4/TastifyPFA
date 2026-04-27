import { useAuthStore } from '@shared/auth/useAuthStore'
import Login from '@shared/auth/Login'
import axiosInstance from '@shared/auth/axiosInstance'
import logo from '@shared/assets/logo.svg'

function App() {
  const { isAuthenticated, clearAuth, user } = useAuthStore()

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
    return <Login onSuccess={() => {}} title="Tastify Salle" />
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans flex flex-col items-center justify-center gap-8 p-6">
      <div className="w-full max-w-[440px] animate-enter">
        <div className="bg-surface rounded-3xl border border-white/5 p-10 shadow-2xl text-center">
          <div className="w-24 h-24 bg-teal/10 rounded-2xl flex items-center justify-center mb-8 border border-teal/20 mx-auto relative">
             <div className="absolute inset-0 bg-teal/10 blur-xl rounded-full" />
            <img src={logo} alt="Tastify" className="w-16 h-16 relative z-10" />
          </div>
          
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Interface Salle</h1>
          <p className="text-foreground-muted mb-6">Prêt pour le service, <span className="text-teal font-semibold">{user?.username}</span></p>
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal/10 border border-teal/20 text-[11px] font-bold text-teal uppercase tracking-[0.15em]">
            <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
            {user?.role}
          </div>
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="text-[11px] text-foreground-muted hover:text-error uppercase tracking-[0.2em] font-bold transition-all active:scale-95 flex items-center gap-2 opacity-60 hover:opacity-100"
      >
        Se déconnecter
      </button>
    </main>
  )
}

export default App
