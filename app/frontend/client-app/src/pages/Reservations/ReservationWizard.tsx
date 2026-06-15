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
  Sparkles,
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
          <div className="page-shell flex flex-col items-center justify-center p-6 min-h-[85vh]">
              <div className="max-w-2xl w-full bg-surface border border-outline rounded-lg p-8 md:p-14 text-center space-y-10 relative">
                <div className="mx-auto w-20 h-20 bg-background rounded-full flex items-center justify-center border border-outline">
                    <Calendar className="w-8 h-8 text-on-background" strokeWidth={1.5} />
                </div>

                <div className="space-y-4">
                    <h2 className="text-4xl font-bold tracking-tight m-0 uppercase">Prenez place.</h2>
                    <p className="text-lg text-on-surface-variant leading-relaxed max-w-md mx-auto">
                        Créez un compte pour confirmer votre table et retrouver vos réservations.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
                    <button
                        onClick={() => navigate('/register')}
                        className="btn-primary min-h-14"
                    >
                        <UserPlus className="w-4 h-4" /> Créer un compte
                    </button>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn-secondary min-h-14"
                    >
                        Se connecter
                    </button>
                </div>

                <div className="pt-8 border-t border-outline flex items-center justify-center gap-2 text-on-surface-variant/40">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-[10px] font-bold tracking-widest">Compte client requis</span>
                </div>
              </div>
          </div>
      );
  }

  return (
    <div className="page-shell">
      <main className="max-w-4xl mx-auto px-4 md:px-6 page-section">
        <div className="w-full bg-surface border border-outline rounded-xl flex flex-col overflow-hidden relative">

          <div className="px-6 md:px-10 py-8 md:py-10 border-b border-outline bg-surface text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-on-background tracking-tight m-0">Réserver une table</h2>
          </div>

          {/* Progress Bar with checkmarks */}
          <div className="px-5 md:px-12 py-5 md:py-6 bg-surface-container-high border-b border-outline">
             <div className="flex items-center gap-2 md:gap-0">
                {[1, 2, 3].map((s) => (
                  <React.Fragment key={s}>
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <motion.div
                        animate={{ scale: step === s ? 1.1 : 1 }}
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors duration-300 ${
                          step > s ? 'bg-success text-on-success' :
                          step === s ? 'bg-on-background text-background' :
                          'bg-outline text-on-surface'
                        }`}
                      >
                        {step > s ? <Check className="w-4 h-4" strokeWidth={3} /> : s}
                      </motion.div>
                      <span className={`text-[10px] font-bold uppercase tracking-widest hidden sm:inline whitespace-nowrap ${
                        step >= s ? 'text-on-background' : 'text-on-surface-variant'
                      }`}>
                        {s === 1 ? "Détails" : s === 2 ? "Table" : "Confirmation"}
                      </span>
                    </div>
                    {s < 3 && (
                      <div className="flex-1 h-0.5 mx-2 md:mx-4 rounded-full transition-colors duration-500" style={{ background: step > s ? '#15803D' : '#F0E6DC' }} />
                    )}
                  </React.Fragment>
                ))}
             </div>
          </div>

          <div className="p-6 md:p-12">
              {actionError && (
                <div id="reservation-error" role="alert" className="form-error mb-8">
                  {actionError}
                </div>
              )}

              <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
                   <div className="p-8 bg-background border border-outline rounded-lg flex flex-col sm:flex-row items-center justify-between gap-6">
                      <div className="text-center sm:text-left">
                         <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Nombre de personnes</h3>
                         <p className="text-sm text-on-surface-variant">Couverts à prévoir</p>
                      </div>
                      <div className="flex items-center gap-6">
                         <button aria-label="Réduire" onClick={() => setGuests(Math.max(1, guests - 1))} className="btn-icon"><Minus className="w-4 h-4" /></button>
                         <span className="text-4xl font-bold text-on-background w-12 text-center">{guests}</span>
                         <button aria-label="Augmenter le nombre de convives" onClick={() => setGuests(Math.min(12, guests + 1))} className="btn-icon"><Plus className="w-4 h-4" /></button>
                      </div>
                   </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label htmlFor="res-date" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Date du repas</label>
                          <input id="res-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-describedby={actionError ? 'reservation-error' : undefined} className="field-control" />
                       </div>
                       <div className="space-y-2">
                          <label htmlFor="res-time" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Heure d'arrivée</label>
                          <input id="res-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} aria-describedby={actionError ? 'reservation-error' : undefined} className="field-control" />
                       </div>
                    </div>

                   <button
                     onClick={fetchAvailableTables} disabled={isLoading}
                     className="btn-primary w-full h-16"
                   >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Voir les tables libres</span><ChevronRight className="w-4 h-4" /></>}
                   </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {availableTables.length > 0 ? availableTables.map(t => (
                        <button key={t.id} onClick={() => setSelectedTable(t.id)} className={`min-h-32 p-6 rounded-lg border-2 flex flex-col items-center gap-3 transition-all ${selectedTable === t.id ? 'bg-on-background border-on-background text-background' : 'bg-background border-outline text-on-background hover:border-on-background'}`}>
                           <TableIcon className="w-6 h-6 opacity-20" />
                           <div className="text-center">
                              <span className="block text-xl font-bold uppercase tracking-tighter">Table {t.numero}</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-on-surface-subtle">{t.capacite} PERS</span>
                           </div>
                        </button>
                      )) : (
                        <div className="col-span-full py-10 text-center text-on-surface-subtle">Aucune table disponible pour ce créneau.</div>
                      )}
                   </div>
                   <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button onClick={prevStep} className="btn-secondary flex-1 h-14 uppercase">Retour</button>
                      <button onClick={nextStep} disabled={!selectedTable} className="btn-primary flex-[1.5] h-14 uppercase">Confirmer mon choix</button>
                   </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-10">
                   <div className="bg-background border border-outline rounded-lg p-8 space-y-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-outline pb-8">
                         <div>
                            <p className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-widest mb-2">Quand</p>
                            <p className="text-xl font-bold text-on-background uppercase">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} <br/> à {startTime}</p>
                         </div>
                         <div className="sm:text-right">
                            <p className="text-[9px] font-bold text-on-surface-subtle uppercase tracking-widest mb-2">Convives</p>
                            <p className="text-xl font-bold text-on-background uppercase">{guests} Personnes</p>
                         </div>
                      </div>
                      <div className="space-y-3">
                         <label htmlFor="res-notes" className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Une demande particulière ?</label>
                         <textarea id="res-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, anniversaire, préférences..." className="field-control min-h-28 py-4 resize-none" rows={4} />
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-4 pt-4">
                      <button onClick={prevStep} className="btn-secondary flex-1 h-14 uppercase">Retour</button>
                      <button
                        onClick={handleFinish} disabled={isLoading}
                        className="btn-primary flex-[1.5] h-14 uppercase"
                      >
                         {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Valider ma réservation</span><ShieldCheck className="w-4 h-4" /></>}
                      </button>
                   </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="step4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }} className="text-center py-6 space-y-10">
                   <motion.div
                     initial={{ scale: 0, rotate: -30 }}
                     animate={{ scale: 1, rotate: 0 }}
                     transition={{ type: "spring", damping: 8, stiffness: 180, delay: 0.2 }}
                     className="relative"
                   >
                     <motion.div
                       animate={{ scale: [1, 1.15, 1] }}
                       transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                       className="w-28 h-28 rounded-full bg-success/10 flex items-center justify-center text-success mx-auto border-2 border-success/20"
                     >
                       <PartyPopper className="w-12 h-12" strokeWidth={1.5} />
                     </motion.div>
                   </motion.div>
                   <div className="space-y-4">
                      <h2 className="text-4xl font-bold text-on-background uppercase tracking-tight m-0">C'est confirmé.</h2>
                      <p className="text-lg text-on-surface-variant max-w-lg mx-auto">Votre table est réservée. Vous pouvez la retrouver dans votre compte.</p>
                   </div>
                   <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center">
                      <button onClick={() => navigate('/')} className="btn-primary px-12 h-14 uppercase">Accueil</button>
                      <button onClick={() => navigate('/account')} className="btn-secondary px-12 h-14 uppercase">Voir mes réservations</button>
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
