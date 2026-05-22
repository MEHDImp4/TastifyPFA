import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationApi } from '../../api/reservations';
import { useAuthStore } from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import { getBrandName } from '../../components/branding/brandName';
import { 
  ChevronRight, 
  Loader2,
  Table as TableIcon,
  ArrowLeft,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { toast } from 'sonner';

export const ReservationWizard: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const config = useConfigStore(state => state.config);
  const navigate = useNavigate();
  const brandName = getBrandName(config?.nom);
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
      toast.error('Availability check failed');
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

  if (!isAuthenticated && step < 4) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-12 py-32 bg-background font-body animate-in fade-in duration-1000">
              <div className="max-w-md space-y-8">
                <h2 className="text-display-lg text-4xl lg:text-6xl text-primary leading-tight italic">Reserved Access.</h2>
                <p className="text-lg text-on-surface-variant uppercase tracking-widest leading-relaxed opacity-60">Authentication required to secure a placement in our high-speed reservation matrix.</p>
                <button 
                  onClick={() => navigate('/login')}
                  className="px-16 py-6 bg-primary text-on-primary rounded-full font-sans text-xs font-black uppercase tracking-[0.4em] transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-primary/20"
                >
                    Authenticate
                </button>
              </div>
          </div>
      );
  }

  return (
    <div className="flex-1 bg-background font-body selection:bg-primary/20 overflow-y-auto custom-scrollbar">
      <main className="max-w-4xl mx-auto px-6 py-12 md:py-24">
        
        {/* Parchment Reservation Card */}
        <div className="w-full bg-surface-container border border-outline-variant rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl relative">
          
          {/* Visual Header */}
          <div className="h-48 w-full relative border-b border-outline-variant bg-surface-container-high overflow-hidden">
             <img src="https://images.unsplash.com/photo-1550966841-3ee5ad6ee1b7?auto=format&fit=crop&q=80&w=1200" className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale" alt="Interior" />
             <div className="absolute inset-0 bg-gradient-to-t from-surface-container to-transparent opacity-80" />
             <div className="absolute bottom-10 left-10">
                <h2 className="font-serif text-3xl md:text-5xl font-black text-primary italic leading-none m-0">Book a Table</h2>
                <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.4em] mt-3">Reserve your culinary session</p>
             </div>
          </div>

          {/* Stepper Integration */}
          <div className="px-10 py-6 border-b border-outline-variant bg-surface-container-low flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-black transition-all ${step >= 1 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>1</div>
                <span className={`font-sans text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-on-surface' : 'text-on-surface-variant opacity-40'}`}>Session</span>
             </div>
             <div className="h-px w-12 bg-outline-variant/30" />
             <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-black transition-all ${step >= 2 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>2</div>
                <span className={`font-sans text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-on-surface' : 'text-on-surface-variant opacity-40'}`}>Placement</span>
             </div>
             <div className="h-px w-12 bg-outline-variant/30" />
             <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-sans text-xs font-black transition-all ${step >= 3 ? 'bg-primary text-on-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>3</div>
                <span className={`font-sans text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-on-surface' : 'text-on-surface-variant opacity-40'}`}>Commit</span>
             </div>
          </div>

          {/* Step Content */}
          <div className="p-8 md:p-12">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-12">
                   {/* Guests */}
                   <div className="p-8 bg-surface-container-lowest border border-outline-variant rounded-2xl flex items-center justify-between group hover:border-primary transition-all">
                      <div>
                         <h3 className="font-sans text-[11px] font-black text-on-surface uppercase tracking-[0.2em] mb-1">Identity Quota</h3>
                         <p className="font-body text-[14px] text-on-surface-variant italic opacity-60">Verified guests for this placement</p>
                      </div>
                      <div className="flex items-center gap-6">
                         <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all"><Minus className="w-4 h-4" /></button>
                         <span className="font-serif text-3xl font-black text-primary italic w-10 text-center">{guests}</span>
                         <button onClick={() => setGuests(Math.min(12, guests + 1))} className="w-12 h-12 rounded-xl bg-surface-container-highest flex items-center justify-center text-on-surface hover:bg-primary hover:text-on-primary transition-all"><Plus className="w-4 h-4" /></button>
                      </div>
                   </div>

                   {/* Date & Time Grid */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                         <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">Temporal Window</label>
                         <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full h-16 px-6 bg-surface-container-lowest border border-outline-variant rounded-2xl font-sans font-bold text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all uppercase" />
                      </div>
                      <div className="space-y-4">
                         <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em] ml-2">Arrival Pivot</label>
                         <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full h-16 px-6 bg-surface-container-lowest border border-outline-variant rounded-2xl font-sans font-bold text-on-surface focus:border-primary focus:ring-4 focus:ring-primary/5 outline-none transition-all" />
                      </div>
                   </div>

                   <button 
                     onClick={fetchAvailableTables} disabled={isLoading}
                     className="w-full h-16 mt-8 bg-primary text-on-primary rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                   >
                     {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Analyze Availability</span><ChevronRight className="w-5 h-5" /></>}
                   </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                      {availableTables.map(t => (
                        <button key={t.id} onClick={() => setSelectedTable(t.id)} className={`p-8 rounded-3xl border-2 flex flex-col items-center gap-4 transition-all duration-500 ${selectedTable === t.id ? 'bg-primary border-primary text-on-primary shadow-xl scale-105' : 'bg-surface-container-lowest border-outline-variant/30 text-on-surface hover:border-primary'}`}>
                           <TableIcon className={`w-8 h-8 ${selectedTable === t.id ? 'text-on-primary' : 'text-primary opacity-20'}`} />
                           <div className="text-center">
                              <span className="block font-serif text-xl font-black italic">Unit {t.numero}</span>
                              <span className={`font-sans text-[9px] font-black uppercase tracking-widest ${selectedTable === t.id ? 'text-on-primary opacity-60' : 'opacity-40'}`}>{t.capacite} CAP</span>
                           </div>
                        </button>
                      ))}
                   </div>
                   <div className="flex gap-4 pt-6">
                      <button onClick={prevStep} className="flex-1 h-16 border border-outline-variant rounded-2xl font-sans text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                      <button onClick={nextStep} className="flex-[2] h-16 bg-primary text-on-primary rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Confirm Placement</button>
                   </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-10">
                   <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-8 space-y-8">
                      <div className="grid grid-cols-2 gap-8 border-b border-outline-variant/20 pb-8">
                         <div>
                            <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Temporal</p>
                            <p className="font-serif text-xl text-on-surface italic">{new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: '2-digit', month: 'short' })} • {startTime}</p>
                         </div>
                         <div className="text-right">
                            <p className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Covers</p>
                            <p className="font-serif text-xl text-on-surface italic">{guests} Verified Identities</p>
                         </div>
                      </div>
                      <div className="space-y-4">
                         <label className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest ml-1">Specific Manifest Requirements</label>
                         <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Allergies, architectural preferences..." className="w-full p-6 bg-surface-container border border-outline-variant rounded-xl font-body text-base italic text-on-surface focus:border-primary outline-none transition-all resize-none" rows={3} />
                      </div>
                   </div>
                   <div className="flex gap-4 pt-6">
                      <button onClick={prevStep} className="flex-1 h-16 border border-outline-variant rounded-2xl font-sans text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                      <button 
                        onClick={handleFinish} disabled={isLoading}
                        className="flex-[2] h-16 bg-primary text-on-primary rounded-2xl font-sans text-[11px] font-black uppercase tracking-[0.4em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                      >
                         {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Commit to Registry</span><ShieldCheck className="w-5 h-5" /></>}
                      </button>
                   </div>
                </motion.div>
              )}

              {step === 4 && (
                 <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12 space-y-10">
                    <div className="relative inline-flex items-center justify-center">
                       <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full scale-150 animate-pulse" />
                       <div className="relative w-32 h-32 rounded-3xl bg-surface-container-high border-2 border-primary/20 flex items-center justify-center text-primary shadow-2xl shadow-primary/10">
                          <ShieldCheck className="w-16 h-16" strokeWidth={1} />
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h2 className="font-serif text-4xl md:text-6xl font-black text-on-surface italic leading-none">Secured.</h2>
                       <p className="font-body text-lg text-on-surface-variant italic opacity-60 max-w-lg mx-auto">Your placement at {brandName} has been formally committed. An exceptional gastronomic orchestration awaits.</p>
                    </div>
                    <div className="pt-8 flex flex-col sm:flex-row gap-6 justify-center">
                       <button onClick={() => navigate('/')} className="px-12 py-5 bg-on-surface text-background rounded-full font-sans text-xs font-black uppercase tracking-[0.4em] transition-all hover:bg-primary shadow-2xl">Return Home</button>
                       <button onClick={() => navigate('/orders')} className="px-12 py-5 border border-outline-variant text-on-surface-variant rounded-full font-sans text-xs font-black uppercase tracking-[0.4em] transition-all hover:bg-surface-container-highest">View Registry</button>
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


