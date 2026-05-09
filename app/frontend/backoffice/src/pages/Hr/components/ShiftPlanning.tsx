import React, { useState, useEffect } from 'react'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, User as UserIcon } from 'lucide-react'
import axios from '@shared/auth/axiosInstance'

interface Shift {
  id: number
  employe: number
  employe_name: string
  jour: string
  heure_debut: string
  heure_fin: string
  notes: string
}

export const ShiftPlanning: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [shifts, setShifts] = useState<Shift[]>([])

  const fetchShifts = async () => {
    try {
      const response = await axios.get<Shift[]>('/shifts/')
      setShifts(response.data)
    } catch (err) {
      console.error("Failed to fetch shifts", err)
    }
  }

  useEffect(() => {
    fetchShifts()
  }, [])

  const startOfWeek = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(d.setDate(diff))
  }

  const getWeekDays = (date: Date) => {
    const start = startOfWeek(date)
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      return d
    })
  }

  const weekDays = getWeekDays(currentDate)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal/10 border border-teal/20 text-teal">
            <CalendarIcon size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Planning Hebdomadaire</h2>
            <p className="text-xs text-foreground-muted mt-0.5">Semaine du {weekDays[0].toLocaleDateString()} au {weekDays[6].toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}
            className="p-2 rounded-lg hover:bg-white/5 text-foreground-muted"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
             onClick={() => setCurrentDate(new Date())}
             className="px-3 py-1.5 text-xs font-bold text-white rounded-lg hover:bg-white/5"
          >
            Aujourd'hui
          </button>
          <button 
            onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}
            className="p-2 rounded-lg hover:bg-white/5 text-foreground-muted"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-4">
        {weekDays.map((day, i) => {
          const dayStr = day.toISOString().split('T')[0]
          const dayShifts = shifts.filter(s => s.jour === dayStr)
          const isToday = dayStr === new Date().toISOString().split('T')[0]

          return (
            <div key={i} className={`flex flex-col rounded-2xl border ${isToday ? 'border-teal/30 bg-teal/5' : 'border-white/5 bg-white/[0.02]'} min-h-[400px]`}>
              <header className="p-4 border-b border-white/5 text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isToday ? 'text-teal' : 'text-foreground-muted'}`}>
                  {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                </p>
                <p className={`text-lg font-bold mt-1 ${isToday ? 'text-white' : 'text-foreground-muted'}`}>
                  {day.getDate()}
                </p>
              </header>

              <div className="flex-1 p-2 space-y-2">
                {dayShifts.map(shift => (
                  <div key={shift.id} className="p-2.5 rounded-xl bg-surface-elevated border border-white/5 shadow-sm group">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-teal">
                      <Clock size={10} />
                      <span>{shift.heure_debut.substring(0, 5)} - {shift.heure_fin.substring(0, 5)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                       <UserIcon size={12} className="text-foreground-muted" />
                       <span className="text-xs font-semibold text-white truncate">{shift.employe_name || `ID:${shift.employe}`}</span>
                    </div>
                  </div>
                ))}
                
                <button className="w-full py-2 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-foreground-muted hover:border-teal/40 hover:text-teal transition-all group active:scale-95 mt-2">
                   <Plus size={14} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Add</span>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
