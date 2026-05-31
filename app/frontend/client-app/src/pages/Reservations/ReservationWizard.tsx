import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationApi } from '../../api/reservations';
import { useAuthStore } from '../../store/authStore';
import { 
  ChevronRight, 
  Loader2,
  Table as TableIcon,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Minus,
  UserPlus,
  Calendar,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export const ReservationWizard: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime] = useState('21:00');
  const [guests, setGuests] = useState(2);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const fetchAvailableTables = async () => {
    setIsLoading(true);
    try {
      const res = await reservationApi.getAvailableTables({
        date,
        heure_debut: startTime,
        heure_fin: endTime,
        nombre_personnes: guests
      });
      const filtered = res.data.filter((t: any) => t.est_disponible);
      setAvailableTables(filtered);
      if (filtered.length > 0) setSelectedTable(filtered[0].id);
      nextStep();
    } catch (err) {
      toast.error('Échec de la vérification de disponibilité');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!selectedTable) return;
    setIsLoading(true);
    try {
      await reservationApi.createReservation({
        table: selectedTable,
        date_reservation: date,
        heure_debut: startTime,
        heure_fin: endTime,
        nombre_personnes: guests,
        notes: notes
      });
      nextStep();
    } catch (err: any) {
        toast.error(err.response?.data?.detail || "Une erreur est survenue lors de la réservation.");
    } finally {
      setIsLoading(false);
    }
  };

  // Invitation state for guests
  if (!isAuthenticated && step < 4) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#FAF9F6] font-body overflow-hidden min-h-[85vh]">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-2xl w-full bg-white border border-[#2D2424]/5 rounded-[3rem] p-12 md:p-20 text-center shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] space-y-12 relative"
              >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-[#FAF9F6] rounded-full flex items-center justify-center border border-[#2D2424]/5 shadow-lg">
                    <Calendar className="w-10 h-10 text-[#D14D1A]" strokeWidth={1.5} />
                </div>

                <div className="space-y-6 pt-4">
                    <h2 className=" text-5xl md:text-6xl text-[#2D2424]  tracking-tight m-0">Prenez place.</h2>
                    <p className="text-lg text-[#2D2424]/60 font-medium leading-relaxed max-w-md mx-auto">
                        Pour garantir un service d'exception et suivre vos réservations, la création d'un compte est nécessaire.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                    <button 
                        onClick={() => navigate('/register')}
                        className="px-8 py-6 bg-[#2D2424] text-[#FAF9F6] rounded-3xl font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-[#D14D1A] hover:scale-105 active:scale-95 shadow-xl flex items-center justify-center gap-3"
                    >
                        <UserPlus className="w-4 h-4" /> Créer un compte
                    </button>
                    <button 
                        onClick={() => navigate('/login')}
                        className="px-8 py-6 border border-[#2D2424]/10 text-[#2D2424] rounded-3xl font-sans text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-[#2D2424]/5 active:scale-95"
                    >
                        Se connecter
                    </button>
                </div>

                <div className="pt-8 border-t border-[#2D2424]/5 flex items-center justify-center gap-2 text-[#C5A059]">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-sans text-[10px] font-black uppercase tracking-[0.3em]">Avantages Membres Inclus</span>
                </div>
              </motion.div>
          </div>
      );
  }

  return (
    <div className="flex-1 bg-[#FAF9F6] font-body selection:bg-[#C5A059]/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        {/* Reservation Wizard Card */}
        <div className="w-full bg-white border border-[#2D2424]/5 rounded-[3rem] flex flex-col overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.05)] relative">
          
          {/* Header */}
          <div className="px-10 py-12 border-b border-[#2D2424]/5 bg-white text-center">
                <h2 className=" text-4xl md:text-5xl font-black text-[#2D2424]  tracking-tight m-0">Réserver une Table</h2>
                <p className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-[0.4em] mt-3 ">Étape {step} sur 3</p>
          </div>

          {/* Stepper */}
          <div className="px-12 py-8 bg-[#FAF9F6]/50 border-b border-[#2D2424]/5 flex items-center justify-center gap-12">
             <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-[10px] font-black transition-all ${step >= 1 ? 'bg-[#2D2424] text-white shadow-lg' : 'bg-[#2D2424]/5 text-[#2D2424]/20'}`}>1</div>
                <span className={`font-sans text-[9px] font-black uppercase tracking-widest ${step >= 1 ? 'text-[#2D2424]' : 'text-[#2D2424]/30'}`}>Détails</span>
             </div>
             <div className="h-px w-10 bg-[#2D2424]/5" />
             <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-[10px] font-black transition-all ${step >= 2 ? 'bg-[#2D2424] text-white shadow-lg' : 'bg-[#2D2424]/5 text-[#2D2424]/20'}`}>2</div>
                <span className={`font-sans text-[9px] font-black uppercase tracking-widest ${step >= 2 ? 'text-[#2D2424]' : 'text-[#2D2424]/30'}`}>Table</span>
             </div>
             <div className="h-px w-10 bg-[#2D2424]/5" />
             <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-[10px] font-black transition-all ${step >= 3 ? 'bg-[#2D2424] text-white shadow-lg' : 'bg-[#2D2424]/5 text-[#2D2424]/20'}`}>3</div>
                <span className={`font-sans text-[9px] font-black uppercase tracking-widest ${step >= 3 ? 'text-[#2D2424]' : 'text-[#2D2424]/30'}`}>Confirmation</span>
             </div>
          </div>

          {/* Content */}
          <div className="p-10 md:p-16">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-12">
                   <div className="p-8 bg-[#FAF9F6] border border-[#2D2424]/5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 hover:border-[#C5A059]/30 transition-all">
                      <div className="text-center sm:text-left">
                         <h3 className="font-sans text-[10px] font-black text-[#2D2424]/40 uppercase tracking-[0.2em] mb-1">Nombre de personnes</h3>
                         <p className="font-body text-[14px] text-[#2D2424]/80 ">Couverts à prévoir</p>
                      </div>
                      <div className="flex items-center gap-8">
                         <button aria-label="Réduire le nombre de convives" onClick={() => setGuests(Math.max(1, guests - 1))} className="w-12 h-12 rounded-2xl bg-white border border-[#2D2424]/5 flex items-center justify-center text-[#2D2424] hover:text-[#D14D1A] shadow-sm active:scale-90 transition-all"><Minus className="w-4 h-4" /></button>
                         <span className=" text-5xl font-black text-[#2D2424]  w-12 text-center">{guests}</span>
                         <button aria-label="Augmenter le nombre de convives" onClick={() => setGuests(Math.min(12, guests + 1))} className="w-12 h-12 rounded-2xl bg-white border border-[#2D2424]/5 flex items-center justify-center text-[#2D2424] hover:text-[#D14D1A] shadow-sm active:scale-90 transition-all"><Plus className="w-4 h-4" /></button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-3">
                         <label htmlFor="res-date" className="font-sans text-[10px] font-black text-[#2D2424]/40 uppercase tracking-[0.3em] ml-2">Date du repas</label>
                         <input id="res-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-16 px-6 bg-[#FAF9F6] border border-[#2D2424]/5 rounded-2xl font-sans font-bold text-[#2D2424] focus:border-[#D14D1A]/30 outline-none transition-all" />
                      </div>
                      <div className="space-y-3">
                         <label htmlFor="res-time" className="font-sans text-[10px] font-black text-[#2D2424]/40 uppercase tracking-[0.3em] ml-2">Heure d'arrivée</label>
                         <input id="res-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-16 px-6 bg-[#FAF9F6] border border-[#2D2424]/5 rounded-2xl font-sans font-bold text-[#2D2424] focus:border-[#D14D1A]/30 outline-none transition-all" />
                      </div>
                   </div>

                   <button 
                     onClick={fetchAvailableTables} disabled={isLoading}
                     className="w-full h-20 bg-[#2D2424] text-[#FAF9F6] rounded-3xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#D14D1A] transition-all flex items-center justify-center gap-4 group"
                   >
                     {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Voir les tables libres</span><ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                   </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-12">
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {availableTables.length > 0 ? availableTables.map(t => (
                        <button key={t.id} onClick={() => setSelectedTable(t.id)} className={`p-8 rounded-[2rem] border-2 flex flex-col items-center gap-4 transition-all duration-500 ${selectedTable === t.id ? 'bg-[#D14D1A] border-[#D14D1A] text-white shadow-xl scale-105' : 'bg-white border-[#2D2424]/5 text-[#2D2424] hover:border-[#D14D1A]'}`}>
                           <TableIcon className={`w-8 h-8 ${selectedTable === t.id ? 'text-white' : 'text-[#D14D1A] opacity-20'}`} />
                           <div className="text-center">
                              <span className="block  text-2xl font-black ">Table {t.numero}</span>
                              <span className={`font-sans text-[9px] font-black uppercase tracking-widest ${selectedTable === t.id ? 'text-white/80' : 'text-[#2D2424]/40'}`}>{t.capacite} PERS</span>
                           </div>
                        </button>
                      )) : (
                        <div className="col-span-full py-10 text-center opacity-40 font-body ">Aucune table disponible pour ce créneau.</div>
                      )}
                   </div>
                   <div className="flex flex-col sm:flex-row gap-6 pt-6">
                      <button onClick={prevStep} className="flex-1 h-20 border border-[#2D2424]/10 rounded-3xl font-sans text-[10px] font-black uppercase tracking-widest text-[#2D2424] hover:bg-[#2D2424]/5 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Modifier les détails</button>
                      <button onClick={nextStep} disabled={!selectedTable} className="flex-[1.5] h-20 bg-[#2D2424] text-[#FAF9F6] rounded-3xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#D14D1A] transition-all disabled:opacity-30 disabled:hover:bg-[#2D2424]">Confirmer mon choix</button>
                   </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-12">
                   <div className="bg-[#FAF9F6] border border-[#2D2424]/5 rounded-[2rem] p-10 space-y-10">
                      <div className="grid grid-cols-2 gap-10 border-b border-[#2D2424]/5 pb-10">
                         <div>
                            <p className="font-sans text-[9px] font-black text-[#2D2424]/30 uppercase tracking-widest mb-2">Quand</p>
                            <p className=" text-2xl text-[#2D2424] ">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' })} <br/> à {startTime}</p>
                         </div>
                         <div className="text-right">
                            <p className="font-sans text-[9px] font-black text-[#2D2424]/30 uppercase tracking-widest mb-2">Convives</p>
                            <p className=" text-2xl text-[#2D2424] ">{guests} Personnes</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label htmlFor="res-notes" className="font-sans text-[10px] font-black text-[#2D2424]/30 uppercase tracking-widest ml-1">Une demande particulière ?</label>
                         <textarea id="res-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, anniversaire, préférences..." className="w-full p-6 bg-white border border-[#2D2424]/5 rounded-2xl font-body text-base  text-[#2D2424] focus:border-[#D14D1A]/30 outline-none transition-all resize-none" rows={4} />
                      </div>
                   </div>
                   <div className="flex flex-col sm:flex-row gap-6 pt-6">
                      <button onClick={prevStep} className="flex-1 h-20 border border-[#2D2424]/10 rounded-3xl font-sans text-[10px] font-black uppercase tracking-widest text-[#2D2424] hover:bg-[#2D2424]/5 transition-all flex items-center justify-center gap-3"><ArrowLeft className="w-4 h-4" /> Retour</button>
                      <button 
                        onClick={handleFinish} disabled={isLoading}
                        className="flex-[1.5] h-20 bg-[#D14D1A] text-white rounded-3xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-[#D14D1A]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                      >
                         {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><span>Valider ma réservation</span><ShieldCheck className="w-5 h-5" /></>}
                      </button>
                   </div>
                </motion.div>
              )}

              {step === 4 && (
                 <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-10 space-y-12">
                    <div className="w-32 h-32 rounded-full bg-[#D14D1A]/5 flex items-center justify-center text-[#D14D1A] mx-auto border border-[#D14D1A]/10 relative">
                       <ShieldCheck className="w-16 h-16" strokeWidth={1} />
                       <div className="absolute inset-0 bg-[#D14D1A]/10 rounded-full animate-ping opacity-10" />
                    </div>
                    <div className="space-y-6">
                       <h2 className=" text-5xl md:text-6xl font-black text-[#2D2424]  leading-none m-0">C'est confirmé.</h2>
                       <p className=" text-xl md:text-2xl text-[#2D2424]/60  max-w-lg mx-auto">Nous avons hâte de vous recevoir pour ce moment d'exception.</p>
                    </div>
                    <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center">
                       <button onClick={() => navigate('/')} className="px-14 py-6 bg-[#2D2424] text-[#FAF9F6] rounded-full font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl hover:bg-[#D14D1A] transition-all">Retour à l'accueil</button>
                       <button onClick={() => navigate('/account')} className="px-14 py-6 border border-[#2D2424]/10 text-[#2D2424] rounded-full font-sans text-[11px] font-black uppercase tracking-[0.4em] hover:bg-[#2D2424]/5 transition-all">Voir mes réservations</button>
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
