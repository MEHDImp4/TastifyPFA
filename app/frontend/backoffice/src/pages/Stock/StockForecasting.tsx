import React, { useState, useEffect } from 'react'
import { Brain, CloudSun, TrendingDown, AlertTriangle, Download, Loader2 } from 'lucide-react'
import axios from '@shared/auth/axiosInstance'

interface ForecastItem {
  nom: string
  unite: string
  current_stock: number
  predicted_usage: number
  suggested_purchase: number
}

export const StockForecasting: React.FC = () => {
  const [forecast, setForecast] = useState<Record<string, ForecastItem>>({})
  const [isLoading, setIsLoading] = useState(true)

  const fetchForecast = async () => {
    setIsLoading(true)
    try {
      const response = await axios.get<Record<string, ForecastItem>>('/ingredients/forecasting/')
      setForecast(response.data)
    } catch (err) {
      console.error("Failed to fetch stock forecast", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchForecast()
  }, [])

  const items = Object.values(forecast).sort((a, b) => b.suggested_purchase - a.suggested_purchase)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-white/5 bg-white/5">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-teal" />
          <p className="text-sm font-bold text-foreground-muted">Calcul des prévisions IA...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Weather & Info Header */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-4">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-6 flex items-start gap-6">
          <div className="h-12 w-12 rounded-2xl bg-teal/10 flex items-center justify-center text-teal flex-shrink-0">
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white leading-tight">Analyse Prédictive</h2>
            <p className="text-sm text-foreground-muted mt-1 max-w-xl">
              Les suggestions ci-dessous sont générées par notre modèle IA en croisant vos ventes historiques avec les prévisions météo à 7 jours (soleil, précipitations).
            </p>
          </div>
        </div>
        
        <div className="rounded-3xl border border-teal/10 bg-teal/5 p-6 flex flex-col justify-center">
           <div className="flex items-center gap-3 text-teal">
              <CloudSun size={20} />
              <span className="text-sm font-bold uppercase tracking-widest">Météo Locale</span>
           </div>
           <p className="mt-2 text-2xl font-black text-white">26°C</p>
           <p className="text-[10px] font-bold text-teal/60 uppercase tracking-widest mt-1">Ensoleillé • Marrakech</p>
        </div>
      </div>

      <div className="rounded-[32px] border border-white/5 bg-white/[0.02] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Ingrédient</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Stock Actuel</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Usage Prévu (7j)</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Statut</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted">Besoin Achat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item, i) => {
                const isCritical = item.suggested_purchase > 0
                return (
                  <tr key={i} className="group hover:bg-white/5 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-white">{item.nom}</span>
                        <span className="text-[10px] text-foreground-muted uppercase tracking-widest">{item.unite}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-300">{item.current_stock.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{item.predicted_usage.toFixed(2)}</span>
                        <TrendingDown size={12} className="text-amber/40" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isCritical ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-red-400 border border-red-500/20">
                          <AlertTriangle size={10} />
                          Rupture Probable
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-green-400 border border-green-500/20">
                          Suffisant
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                       {item.suggested_purchase > 0 ? (
                         <span className="text-sm font-black text-amber">+{item.suggested_purchase.toFixed(2)} {item.unite}</span>
                       ) : (
                         <span className="text-sm font-medium text-foreground-muted/30">—</span>
                       )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="group flex h-11 items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-6 text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95">
          <Download size={16} className="text-teal group-hover:scale-110 transition-transform" />
          Exporter Liste de Courses
        </button>
      </div>
    </div>
  )
}
