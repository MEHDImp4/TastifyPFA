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
    return <Login onSuccess={() => {}} title="Tastify Back-Office" />
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white font-sans flex flex-col items-center justify-center gap-6 p-4">
      <div className="w-full max-w-md bg-[#141414] rounded-2xl border border-white/5 p-8 shadow-2xl text-center">
        <div className="w-16 h-16 bg-blue-600/10 rounded-xl flex items-center justify-center mb-6 border border-blue-500/20 mx-auto">
          <img src={logo} alt="Tastify" className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-blue-500">Tastify Back-Office</h1>
        <p className="text-gray-400 mt-2">Connecté en tant que <span className="text-white font-semibold">{user?.username}</span></p>
        <div className="mt-4 inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 uppercase tracking-widest">
          {user?.role}
        </div>
      </div>

      <button 
        onClick={handleLogout}
        className="text-xs text-gray-500 hover:text-red-400 uppercase tracking-widest font-bold transition-colors flex items-center gap-2"
      >
        Se déconnecter
      </button>
    </main>
  )
}

export default App
