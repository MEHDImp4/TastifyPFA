import React, { useState } from 'react'
import { Eye, EyeOff, Lock, User, Loader2 } from 'lucide-react'
import axiosInstance from './axiosInstance'
import { useAuthStore } from './useAuthStore'
import logo from '@shared/assets/logo.svg'
import { isRoleAllowed } from './roleAccess'

interface LoginProps {
  onSuccess: (role: string) => void
  allowedRoles?: readonly string[]
  appLabel?: string
  appDescription?: string
  deniedMessage?: string
  variant?: 'staff' | 'client'
  initialError?: string
}

const STYLES = {
  staff: {
    glow: 'bg-primary/25',
    label: 'text-primary',
    focus: 'group-focus-within:text-primary',
    input: 'focus:border-primary/40 focus:ring-primary/10',
    button: 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20',
  },
  client: {
    glow: 'bg-accent/25',
    label: 'text-accent',
    focus: 'group-focus-within:text-accent',
    input: 'focus:border-accent/40 focus:ring-accent/10',
    button: 'bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20',
  },
} as const

const Login: React.FC<LoginProps> = ({
  onSuccess,
  allowedRoles,
  appLabel = 'Tastify',
  appDescription = 'Connectez-vous a votre espace',
  deniedMessage = "Ce compte n'est pas autorise sur ce portail.",
  variant = 'staff',
  initialError,
}) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(initialError || null)

  React.useEffect(() => {
    if (initialError) {
      setError(initialError)
    }
  }, [initialError])

  const setAuth = useAuthStore((state: any) => state.setAuth)
  const clearAuth = useAuthStore((state: any) => state.clearAuth)
  const styles = STYLES[variant]

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await axiosInstance.post('/users/login/', {
        username,
        password,
      })

      const { access, role, username: resUsername } = response.data
      if (allowedRoles && !isRoleAllowed(role, allowedRoles)) {
        clearAuth()
        try {
          await axiosInstance.post('/users/logout/')
        } catch {
          // The role gate is enforced client-side even if logout cleanup is unavailable.
        }
        setError(deniedMessage)
        return
      }

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
          <div className="flex flex-col items-center mb-12 mt-2">
            <div className="relative">
              <div className={`absolute inset-0 ${styles.glow} blur-3xl rounded-full scale-125`} />
              <img src={logo} alt="Tastify" className="w-[320px] max-w-full relative z-10" />
            </div>
            <div className="text-center mt-6">
              <h1 className="text-2xl font-bold text-white tracking-tight">{appLabel}</h1>
              <p className="text-sm text-foreground-muted mt-2">{appDescription}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className={`text-[11px] font-bold ${styles.label} uppercase tracking-[0.1em] ml-1`}>
                Utilisateur
              </label>
              <div className="relative group">
                <User className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted ${styles.focus} transition-colors`} />
                <input
                  type="text"
                  value={username}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                  className={`w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-4 ${styles.input} transition-all placeholder:text-foreground-muted/30`}
                  placeholder="nom_utilisateur"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={`text-[11px] font-bold ${styles.label} uppercase tracking-[0.1em] ml-1`}>
                Mot de passe
              </label>
              <div className="relative group">
                <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted ${styles.focus} transition-colors`} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  className={`w-full bg-black/20 border border-white/5 rounded-2xl py-3.5 pl-11 pr-12 text-sm focus:outline-none focus:ring-4 ${styles.input} transition-all placeholder:text-foreground-muted/30`}
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
              className={`w-full ${styles.button} active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-3 mt-4`}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/5 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted opacity-50">
              Tastify Ecosystem • 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
