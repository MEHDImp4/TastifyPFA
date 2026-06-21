import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationApi } from '../../api/reservations';
import { useAuthStore } from '../../store/authStore';
import {
  ChevronRight,
  Loader2,
  Table as TableIcon,
  ShieldCheck,
  Plus,
  Minus,
  UserPlus,
  Calendar,
  Check,
  PartyPopper
} from 'lucide-react';
import { toast } from 'sonner';

export const ReservationWizard: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('19:00');
  const [guests, setGuests] = useState(2);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  function computeEndTime(start: string): string {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + 30;
    return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  const fetchAvailableTables = async () => {
    setIsLoading(true);
    setActionError(null);
    try {
      const res = await reservationApi.getAvailableTables({
        date,
        heure_debut: startTime,
        heure_fin: computeEndTime(startTime),
        nombre_personnes: guests
      });
      const filtered = res.data.filter((t: any) => t.est_disponible);
      setAvailableTables(filtered);
      if (filtered.length > 0) setSelectedTable(filtered[0].id);
      nextStep();
    } catch (err) {
      const message = 'Impossible de vérifier les disponibilités. Réessayez dans un instant.';
      setActionError(message);
      toast.error('Échec de la vérification de disponibilité');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedTable) return;
    setIsLoading(true);
    setActionError(null);
    try {
      await reservationApi.createReservation({
        table: selectedTable,
        date_reservation: date,
        heure_debut: startTime,
        heure_fin: computeEndTime(startTime),
        nombre_personnes: guests,
        notes: notes
      });
      nextStep();
    } catch (err: any) {
        const message = err.response?.data?.detail || "Nous n'avons pas pu confirmer cette réservation. Vérifiez le créneau puis réessayez.";
        setActionError(message);
        toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated && step < 4) {
      return (
          <div className="page-shell flex flex-col items-center justify-center p-6 min-h-[85vh] bg-background">
              <div className="max-w-xl w-full bg-surface border border-outline rounded-2xl p-8 md:p-12 text-center space-y-8 shadow-premium relative">
                <div className="mx-auto w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center border border-outline">
                    <Calendar className="w-6 h-6 text-accent" strokeWidth={2} />
                </div>
 
                <div className="space-y-3">
                    <h2 className="text-3xl font-bold tracking-tight text-on-background lowercase font-heading">prenez place.</h2>
                    <p className="text-sm text-on-surface-muted leading-relaxed max-w-sm mx-auto">
                        Créez un compte ou connectez-vous pour réserver votre table d'exception et suivre vos réservations en temps réel.
                    </p>
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button
                        onClick={() => navigate('/register')}
                        className="btn-primary min-h-[48px] text-xs font-bold uppercase tracking-wider"
                    >
                        <UserPlus className="w-4 h-4 mr-2" /> Créer un compte
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-secondary min-h-[48px] text-xs font-bold uppercase tracking-wider"
                    >
                        Se connecter
                    </button>
                </div>
 
                <div className="pt-6 border-t border-outline/50 flex items-center justify-center gap-2 text-on-surface-subtle">
                    <span className="text-[9px] font-bold uppercase tracking-[0.25em]">Compte membre Tastify</span>
                </div>
              </div>
          </div>
      );
  }
 
  return (
    <div className="page-shell bg-background">
      <main className="max-w-3xl mx-auto px-client-margin page-section">
        <div className="w-full bg-surface border border-outline rounded-2xl flex flex-col overflow-hidden relative shadow-premium">
 
          <div className="px-6 md:px-10 py-6 border-b border-outline/50 bg-surface text-center">
                <span className="text-[9px] font-bold text-accent tracking-[0.25em] uppercase block mb-1">Réservations</span>
                <h2 className="text-2xl font-bold text-on-background tracking-tight lowercase font-heading">Réserver une table.</h2>
          </div>
 
          {/* Progress Bar with checkmarks */}
          <div className="px-6 md:px-10 py-5 bg-surface-container-high border-b border-outline/40">
             <div className="flex items-center justify-between">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2 min-w-0">
                      <motion.div
                        animate={{ scale: step === s ? 1.08 : 1 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 border transition-all duration-300 ${
                          step > s ? 'bg-success border-success text-on-success' :
                          step === s ? 'bg-primary border-primary text-on-primary shadow-sm' :
                          'bg-surface border-outline text-on-surface-subtle'
                        }`}
                      >
                        {step > s ? <Check className="w-4 h-4" strokeWidth={3} /> : s}
                      </motion.div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:inline whitespace-nowrap ${
                        step >= s ? 'text-on-background' : 'text-on-surface-subtle'
                      }`}>
                        {s === 1 ? "Détails" : s === 2 ? "Table" : "Confirmation"}
                      </span>
                    </div>
                    {s < 3 && (
                      <div className="flex-1 h-0.5 mx-4 rounded-full transition-colors duration-500 bg-outline/50" style={{ background: step > s ? '#0F766E' : '#EFE3D8' }} />
                    )}
                  </React.Fragment>
                ))}
             </div>
          </div>
 
          <div className="p-6 md:p-10">
              {actionError && (
                <div id="reservation-error" role="alert" className="form-error mb-6">
                  {actionError}
                </div>
              )}
 
              <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                   <div className="p-6 bg-background border border-outline rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left">
                         <h3 className="text-[10px] font-bold text-accent uppercase tracking-[0.25em] mb-0.5">Nombre de personnes</h3>
                         <p className="text-xs text-on-surface-subtle">Indiquez le nombre de couverts à préparer</p>
                      </div>
                      <div className="flex items-center gap-6">
                         <button aria-label="Réduire" onClick={() => setGuests(Math.max(1, guests - 1))} className="btn-icon"><Minus className="w-4 h-4" /></button>
                         <span className="text-3xl font-bold text-on-background w-12 text-center font-mono">{guests}</span>
                         <button aria-label="Augmenter le nombre de convives" onClick={() => setGuests(Math.min(12, guests + 1))} className="btn-icon"><Plus className="w-4 h-4" /></button>
                      </div>
                   </div>
 
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label htmlFor="res-date" className="text-[10px] font-bold text-on-surface-subtle uppercase tracking-[0.25em] ml-1">Date du repas</label>
                          <input id="res-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-describedby={actionError ? 'reservation-error' : undefined} className="field-control" />
                       </div>
                       <div className="space-y-2">
                          <label htmlFor="res-time" className="text-[10px] font-bold text-on-surface-subtle uppercase tracking-[0.25em] ml-1">Heure d'arrivée</label>
                          <input id="res-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} aria-describedby={actionError ? 'reservation-error' : undefined} className="field-control" />
                       </div>
                    </div>
 
                    <button
                      onClick={fetchAvailableTables} disabled={isLoading}
                      className="btn-primary w-full h-12 shadow-sm"
                    >
                      {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <span className="flex items-center gap-2">Voir les tables libres <ChevronRight className="w-4 h-4" /></span>}
                    </button>
                </motion.div>
              )}
 
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {availableTables.length > 0 ? availableTables.map(t => (
                        <button key={t.id} onClick={() => setSelectedTable(t.id)} className={`min-h-[110px] p-5 rounded-xl border-2 flex flex-col items-center justify-center gap-2.5 transition-all duration-300 ${selectedTable === t.id ? 'bg-primary border-primary text-on-primary shadow-md' : 'bg-background border-outline text-on-background hover:border-accent'}`}>
                           <TableIcon className={`w-5 h-5 ${selectedTable === t.id ? 'text-on-primary opacity-60' : 'text-accent opacity-30'}`} />
                           <div className="text-center">
                              <span className="block text-lg font-bold tracking-tight">Table {t.numero}</span>
                              <span className={`text-[8px] font-bold uppercase tracking-[0.25em] block mt-0.5 ${selectedTable === t.id ? 'text-on-primary/70' : 'text-on-surface-subtle'}`}>{t.capacite} personnes</span>
                           </div>
                        </button>
                      )) : (
                        <div className="col-span-full py-12 text-center text-on-surface-subtle border border-dashed border-outline rounded-xl bg-background/50">Aucune table disponible pour ce créneau.</div>
                      )}
                   </div>
                   <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button onClick={prevStep} className="btn-secondary flex-1 h-12">Retour</button>
                      <button onClick={nextStep} disabled={!selectedTable} className="btn-primary flex-[1.5] h-12">Confirmer mon choix</button>
                   </div>
                </motion.div>
              )}
 
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-8">
                   <div className="bg-background border border-outline rounded-xl p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border-b border-outline/50 pb-6">
                         <div>
                            <p className="text-[9px] font-bold text-accent uppercase tracking-[0.25em] mb-1.5">Date & Heure</p>
                            <p className="text-lg font-bold text-on-background capitalize">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} à {startTime}</p>
                         </div>
                         <div className="sm:text-right">
                            <p className="text-[9px] font-bold text-accent uppercase tracking-[0.25em] mb-1.5">Nombre de couverts</p>
                            <p className="text-lg font-bold text-on-background capitalize">{guests} Convives</p>
                         </div>
                      </div>
                      <div className="space-y-2">
                         <label htmlFor="res-notes" className="text-[10px] font-bold text-on-surface-subtle uppercase tracking-[0.25em] ml-1">Une demande particulière ?</label>
                         <textarea id="res-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, anniversaire, préférences..." className="field-control min-h-[110px] py-3 resize-none font-medium" rows={3} />
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-4 pt-2">
                      <button onClick={prevStep} className="btn-secondary flex-1 h-12">Retour</button>
                      <button
                        onClick={handleFinish} disabled={isLoading}
                        className="btn-primary flex-[1.5] h-12 shadow-sm"
                      >
                         {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-on-primary" /> : <span className="flex items-center gap-2">Valider ma réservation <ShieldCheck className="w-4 h-4" /></span>}
                      </button>
                   </div>
                </motion.div>
              )}
 
              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-center py-4 space-y-8">
                   <motion.div
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     transition={{ type: "spring", damping: 10, stiffness: 150, delay: 0.1 }}
                     className="relative"
                   >
                     <motion.div
                       animate={{ scale: [1, 1.08, 1] }}
                       transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                       className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center text-success mx-auto border border-success/20"
                     >
                       <PartyPopper className="w-10 h-10" strokeWidth={1.5} />
                     </motion.div>
                   </motion.div>
                   <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-on-background lowercase font-heading">c'est confirmé.</h2>
                      <p className="text-sm text-on-surface-muted max-w-sm mx-auto">Votre table est maintenant réservée. Vous pouvez retrouver tous les détails dans votre espace client.</p>
                   </div>
                   <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
                      <button onClick={() => navigate('/')} className="btn-primary px-8 h-12">Accueil</button>
                      <button onClick={() => navigate('/account')} className="btn-secondary px-8 h-12">Voir mes réservations</button>
                   </div>
                </motion.div>
              )}
              </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
};
