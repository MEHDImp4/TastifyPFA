import React, { useState } from 'react'
import { Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react'
import axiosInstance from './axiosInstance'
import { useAuthStore } from './useAuthStore'
import logo from '@shared/assets/logo.svg'

interface LoginProps {
  onSuccess: (role: string) => void
  title?: string
}

const Login: React.FC<LoginProps> = ({ onSuccess, title = "Bienvenue chez Tastify" }) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await axiosInstance.post('/users/login/', {
        username,
        password,
      })

      const { access, role, username: resUsername } = response.data
      setAuth({ username: resUsername, role }, access)
      onSuccess(role)
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        err.response?.data?.non_field_errors?.[0] || 
        "Identifiants invalides ou erreur serveur."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6 font-sans text-foreground">
      <div className="w-full max-w-[400px] animate-enter">
        <div className="bg-surface rounded-3xl border border-white/5 shadow-2xl overflow-hidden p-10">
          <div className="flex flex-col items-center mb-10">
            <div className="mb-6 relative">
              <div className="absolute inset-0 bg-teal/20 blur-2xl rounded-full" />
              <img src={logo} alt="Tastify" className="w-20 h-20 relative z-10" />
            </div>
            
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">{title}</h1>
            <p className="text-foreground-muted text-sm text-center px-4 leading-relaxed">
              Connectez-vous pour accéder à votre interface de gestion restaurant.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-teal uppercase tracking-[0.1em] ml-1">
                Utilisateur
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted group-focus-within:text-teal transition-colors" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:border-teal/50 focus:ring-4 focus:ring-teal/5 transition-all placeholder:text-foreground-muted/30"
                  placeholder="nom_utilisateur"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-teal uppercase tracking-[0.1em] ml-1">
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted group-focus-within:text-teal transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-11 pr-12 text-sm focus:outline-none focus:border-teal/50 focus:ring-4 focus:ring-teal/5 transition-all placeholder:text-foreground-muted/30"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border border-error/20 text-error text-[13px] p-4 rounded-2xl flex items-center gap-3 animate-enter">
                <span className="w-1.5 h-1.5 rounded-full bg-error shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal hover:bg-teal/90 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all shadow-[0_10px_20px_rgba(42,157,143,0.2)] flex items-center justify-center gap-3 mt-4"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] text-foreground-muted uppercase tracking-[0.2em] font-bold opacity-50">
              Tastify Ecosystem &bull; 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
