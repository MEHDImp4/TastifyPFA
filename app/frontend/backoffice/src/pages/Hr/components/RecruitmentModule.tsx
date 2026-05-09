import React, { useState, useEffect } from 'react'
import { Briefcase, FileUser, Plus, ExternalLink, Mail, Phone, MessageSquare } from 'lucide-react'
import axios from '@shared/auth/axiosInstance'

interface OffreEmploi {
  id: number
  titre: string
  description: string
  type_contrat: string
  salaire_propose: string
  est_publiee: boolean
  candidatures_count: number
}

interface Candidature {
  id: number
  offre_titre: string
  nom_complet: string
  email: string
  telephone: string
  message_motivation: string
  cv_url: string
  statut: string
  created_at: string
}

export const RecruitmentModule: React.FC = () => {
  const [offres, setOffres] = useState<OffreEmploi[]>([])
  const [candidatures, setCandidatures] = useState<Candidature[]>([])
  const [activeTab, setActiveTab] = useState<'OFFRES' | 'CANDIDATURES'>('OFFRES')

  const fetchData = async () => {
    try {
      const [offresRes, candidaturesRes] = await Promise.all([
        axios.get<OffreEmploi[]>('/offres/'),
        axios.get<Candidature[]>('/candidatures/')
      ])
      setOffres(offresRes.data)
      setCandidatures(candidaturesRes.data)
    } catch (err) {
      console.error("Failed to fetch recruitment data", err)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-2xl bg-white/5 p-1 border border-white/5">
           <button 
             onClick={() => setActiveTab('OFFRES')}
             className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'OFFRES' ? 'bg-teal text-surface shadow-lg shadow-teal/20' : 'text-foreground-muted hover:text-white'}`}
           >
             Offres
           </button>
           <button 
             onClick={() => setActiveTab('CANDIDATURES')}
             className={`px-6 py-2.5 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'CANDIDATURES' ? 'bg-teal text-surface shadow-lg shadow-teal/20' : 'text-foreground-muted hover:text-white'}`}
           >
             Candidatures
           </button>
        </div>
        
        {activeTab === 'OFFRES' && (
          <button className="flex h-10 items-center gap-2 rounded-xl bg-white/5 border border-white/5 px-4 text-xs font-bold text-white hover:bg-white/10 transition-all active:scale-95">
             <Plus size={16} className="text-teal" />
             Nouvelle Offre
          </button>
        )}
      </div>

      {activeTab === 'OFFRES' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offres.map(offre => (
            <div key={offre.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5 hover:bg-white/[0.05] transition-all group">
              <div className="flex justify-between items-start">
                 <div>
                    <h3 className="text-lg font-bold text-white leading-tight">{offre.titre}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal mt-1">{offre.type_contrat} • {offre.salaire_propose || 'Non spécifié'}</p>
                 </div>
                 <div className="flex flex-col items-end gap-1">
                   <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${offre.est_publiee ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                     {offre.est_publiee ? 'Publiée' : 'Brouillon'}
                   </span>
                   <span className="text-[10px] font-bold text-foreground-muted mt-1">{offre.candidatures_count} candidatures</span>
                 </div>
              </div>
              <p className="text-sm text-foreground-muted mt-4 line-clamp-2">{offre.description}</p>
              <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                 <button className="flex-1 py-2 rounded-lg bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">Editer</button>
                 <button className="px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-teal hover:bg-white/10 transition-all"><ExternalLink size={14}/></button>
              </div>
            </div>
          ))}
          {offres.length === 0 && (
            <div className="md:col-span-2 py-20 text-center rounded-3xl border border-dashed border-white/10 opacity-40">
              <Briefcase size={40} className="mx-auto mb-4" />
              <p className="text-sm font-medium">Aucune offre d'emploi active.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {candidatures.map(c => (
            <div key={c.id} className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-teal/10 border border-teal/20 flex items-center justify-center text-teal">
                       <FileUser size={24} />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-white leading-tight">{c.nom_complet}</h3>
                       <p className="text-xs text-foreground-muted mt-1">Postule pour : <span className="text-white font-bold">{c.offre_titre}</span></p>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                   <a href={`mailto:${c.email}`} className="p-2 rounded-lg bg-white/5 text-foreground-muted hover:text-teal hover:bg-teal/10 transition-all" title={c.email}><Mail size={18}/></a>
                   <a href={`tel:${c.telephone}`} className="p-2 rounded-lg bg-white/5 text-foreground-muted hover:text-teal hover:bg-teal/10 transition-all" title={c.telephone}><Phone size={18}/></a>
                   <button className="px-4 py-2 rounded-xl bg-teal text-surface text-[11px] font-black uppercase tracking-widest shadow-lg shadow-teal/20 active:scale-95 transition-all">Gérer</button>
                 </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_200px] gap-6">
                 <div className="p-4 rounded-xl bg-black/20 border border-white/5 flex gap-3">
                    <MessageSquare size={16} className="text-teal flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground-muted italic leading-relaxed">"{c.message_motivation}"</p>
                 </div>
                 {c.cv_url && (
                    <a href={c.cv_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4 text-xs font-bold text-white hover:bg-white/10 transition-all">
                       <ExternalLink size={16} />
                       Voir le CV
                    </a>
                 )}
              </div>
            </div>
          ))}
          {candidatures.length === 0 && (
            <div className="py-20 text-center rounded-3xl border border-dashed border-white/10 opacity-40">
              <FileUser size={40} className="mx-auto mb-4" />
              <p className="text-sm font-medium">Aucune candidature reçue.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
