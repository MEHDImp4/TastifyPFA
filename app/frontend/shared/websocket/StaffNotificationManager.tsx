import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@shared/auth/useAuthStore'
import { useStaffWebSocket } from './WebSocketProvider'
import { Bell, CheckCircle2, X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'info' | 'success'
}

/**
 * Global notification manager for staff.
 */
export const StaffNotificationManager = () => {
  const user = useAuthStore((state: any) => state.user)
  const { lastEvent } = useStaffWebSocket()
  const notifiedOrders = useRef<Set<string>>(new Set())
  const kitchenAudioRef = useRef<HTMLAudioElement | null>(null)
  const readyAudioRef = useRef<HTMLAudioElement | null>(null)
  const isUnlocked = useRef(false)
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const kitchenAudio = new Audio('/sounds/kitchen-bell.mp3')
      const readyAudio = new Audio('/sounds/order-ready.mp3')
      
      kitchenAudioRef.current = kitchenAudio
      readyAudioRef.current = readyAudio

      const unlock = () => {
        if (isUnlocked.current) return
        
        // The most passive way to unlock: just resume a dummy context
        // No media playback, no volume changes, no hardware 'pop'
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContextClass) {
          try {
            const context = new AudioContextClass()
            if (context.state === 'suspended') {
              context.resume()
            }
          } catch (e) {
            // Silently fail
          }
        }

        isUnlocked.current = true
        window.removeEventListener('click', unlock)
        window.removeEventListener('touchstart', unlock)
      }

      window.addEventListener('click', unlock, { capture: true, once: true })
      window.addEventListener('touchstart', unlock, { capture: true, once: true })

      return () => {
        window.removeEventListener('click', unlock)
        window.removeEventListener('touchstart', unlock)
        kitchenAudioRef.current = null
        readyAudioRef.current = null
      }
    }
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  useEffect(() => {
    if (!lastEvent || !user) return

    const order = lastEvent.payload?.order as any
    if (!order || lastEvent.type !== 'order_updated') return

    const orderId = order.id
    const status = order.statut
    const tableName = order.table_numero || order.table || '?'
    
    if (status !== 'EN_CUISINE' && status !== 'PRETE') return

    const notificationKey = `${orderId}-${status}`
    if (notifiedOrders.current.has(notificationKey)) return

    let shouldNotify = false
    let message = ''
    let audioToPlay: HTMLAudioElement | null = null

    if (user.role === 'CUISINIER' && status === 'EN_CUISINE') {
      shouldNotify = true
      message = `Nouvelle commande : Table ${tableName}`
      audioToPlay = kitchenAudioRef.current
    } else if ((user.role === 'SERVEUR' || user.role === 'GERANT') && status === 'PRETE') {
      shouldNotify = true
      message = `Commande prête : Table ${tableName}`
      audioToPlay = readyAudioRef.current
    }

    if (shouldNotify) {
      notifiedOrders.current.add(notificationKey)
      
      // Audio
      if (audioToPlay) {
        audioToPlay.currentTime = 0
        audioToPlay.play().catch(() => {
          console.warn('Audio blocked')
        })
      }

      // Visual Toast
      const id = Math.random().toString(36).substring(2, 9)
      setToasts((prev) => [...prev, { id, message, type: status === 'PRETE' ? 'success' : 'info' }])
      
      // Auto remove
      setTimeout(() => removeToast(id), 6000)
    }
    
    if (notifiedOrders.current.size > 100) {
      const firstItem = notifiedOrders.current.values().next().value
      if (firstItem) notifiedOrders.current.delete(firstItem)
    }
  }, [lastEvent, user])

  return (
    <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 w-[calc(100%-2rem)] sm:w-80 pointer-events-none">
      {toasts.map((toast) => (
        <div 
          key={toast.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border shadow-2xl animate-enter backdrop-blur-xl ${
            toast.type === 'success' 
              ? 'bg-green-500/10 border-green-500/20 text-green-400' 
              : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
          }`}
        >
          <div className="flex items-center gap-3">
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <Bell size={18} className="animate-bounce" />}
            <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
          </div>
          <button 
            onClick={() => removeToast(toast.id)}
            className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
