import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { reservationApi } from '../../api/reservations';
import { useAuthStore } from '../../store/authStore';
import { useConfigStore } from '../../store/configStore';
import { getBrandName } from '../../components/branding/BrandWordmark';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Loader2,
  Table as TableIcon,
  ArrowLeft,
  Info,
  ShieldCheck,
  Plus
} from 'lucide-react';

export const ReservationWizard: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const config = useConfigStore(state => state.config);
  const navigate = useNavigate();
  const brandName = getBrandName(config?.nom);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('21:00');
  const [guests, setGuests] = useState(2);
  const [availableTables, setAvailableTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [notes, setNotes] = useState('');

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const fetchAvailableTables = async () => {
    setIsLoading(true);
    setError(null);
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
      setError('Impossible de vérifier la disponibilité. Veuillez vérifier les horaires.');
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
        setError(err.response?.data?.detail || "Une erreur est survenue lors de la réservation.");
    } finally {
      setIsLoading(false);
    }
  };

  const moodContent = {
    1: {
        src: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800',
        text: '"Every ingredient tells a story of the soil."'
    },
    2: {
        src: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&q=80&w=800',
        text: '"Time is our most precious ingredient."'
    },
    3: {
        src: 'https://images.unsplash.com/photo-1550966841-3ee5ad6ee1b7?auto=format&fit=crop&q=80&w=800',
        text: '"The art of the table is a dialogue of the senses."'
    },
    4: {
        src: 'https://images.unsplash.com/photo-1550966841-3ee5ad6ee1b7?auto=format&fit=crop&q=80&w=800',
        text: '"Success in every orchestration."'
    }
  };

  if (!isAuthenticated && step < 4) {
      return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-12 py-32 bg-background animate-in fade-in duration-1000">
              <div className="relative">
                  <div className="absolute inset-0 bg-primary opacity-5 blur-[60px] rounded-full scale-150" />
                  <div className="relative w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center text-primary border-2 border-dashed border-primary/20">
                    <Users className="w-12 h-12" strokeWidth={1} />
                  </div>
              </div>
              <div className="max-w-md space-y-6">
                <h2 className="text-display-lg text-4xl lg:text-5xl text-on-surface">Reserved Access.</h2>
                <p className="text-lg font-body text-on-surface-variant leading-relaxed opacity-80">Please identify yourself to access our high-speed reservation matrix and secure your placement.</p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="px-12 py-5 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.3em] transition-all hover:bg-primary cinematic-shadow active:scale-95"
              >
                  Authenticate Now
              </button>
          </div>
      );
  }

  return (
    <div className="flex-1 bg-background selection:bg-primary/10 selection:text-primary min-h-screen">
      <main className="max-w-[1400px] mx-auto px-8 py-12 lg:py-24">
        
        {/* Header Section */}
        <div className="text-center mb-20 max-w-2xl mx-auto space-y-6">
            <span className="editorial-kicker text-secondary">Reservation Wizard</span>
            <h1 className="text-display-lg text-4xl md:text-7xl text-on-surface leading-none">Secure Your Table</h1>
            <p className="text-xl font-body text-on-surface-variant italic opacity-60">An evening of sensory exploration awaits. Please guide us through your preferences.</p>
        </div>

        {/* Stepper Indicator */}
        <div className="w-full max-w-lg mx-auto flex justify-between items-center mb-24 relative">
            <div className="absolute top-1/2 left-0 w-full h-[1px] bg-on-surface/5 -z-10"></div>
            {[1, 2, 3].map(s => (
                <div key={s} className="relative flex flex-col items-center gap-4">
                    <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-1000 font-black text-[12px]
                        ${step >= s ? 'bg-on-surface border-on-surface text-background cinematic-shadow scale-110' : 'bg-background border-on-surface/10 text-on-surface-variant/40'}
                    `}>
                        {step > s ? <CheckCircle2 className="w-6 h-6" strokeWidth={2} /> : `0${s}`}
                    </div>
                </div>
            ))}
        </div>

        {/* Form Canvas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Left: Mood Anchor */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-32">
                <AnimatePresence mode="wait">
                    <motion.div 
                        key={step}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        transition={{ duration: 0.8 }}
                        className="space-y-10"
                    >
                        <div className="aspect-[3/4] rounded-3xl overflow-hidden border border-on-surface/5 cinematic-shadow grayscale-[0.2] hover:grayscale-0 transition-all duration-1000">
                            <img src={moodContent[step as keyof typeof moodContent].src} className="w-full h-full object-cover" alt="Atmospheric" />
                        </div>
                        <p className="text-center font-body text-lg italic text-on-surface-variant opacity-60">{moodContent[step as keyof typeof moodContent].text}</p>
                    </motion.div>
                </AnimatePresence>
            </aside>

            {/* Right: Interactive Steps */}
            <div className="lg:col-span-8 w-full">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.section 
                            key="step1"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="editorial-card p-10 lg:p-16 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[100px] -mr-40 -mt-40" />
                                
                                <h2 className="text-display-lg text-3xl lg:text-5xl text-primary mb-12">Temporal Selection</h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                                    <div className="space-y-4">
                                        <label className="editorial-kicker opacity-40">Session Date</label>
                                        <input 
                                            type="date" 
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full px-8 py-6 bg-surface-container border border-on-surface/5 rounded-3xl text-on-surface font-black text-sm focus:outline-none focus:border-primary transition-all cinematic-shadow"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="editorial-kicker opacity-40">Arrival Window</label>
                                        <input 
                                            type="time" 
                                            value={startTime}
                                            onChange={(e) => setStartTime(e.target.value)}
                                            className="w-full px-8 py-6 bg-surface-container border border-on-surface/5 rounded-3xl text-on-surface font-black text-sm focus:outline-none focus:border-primary transition-all cinematic-shadow"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="editorial-kicker opacity-40">Verified Identity Quota</label>
                                        <div className="flex items-center gap-6 p-2 bg-surface-container rounded-3xl border border-on-surface/5">
                                            <button onClick={() => setGuests(Math.max(1, guests - 1))} className="w-14 h-14 rounded-2xl bg-background border border-on-surface/5 flex items-center justify-center hover:bg-on-surface hover:text-background transition-all">
                                                <Users className="w-5 h-5" strokeWidth={1.5} />
                                            </button>
                                            <span className="flex-1 text-center text-2xl font-serif italic text-on-surface">{guests}</span>
                                            <button onClick={() => setGuests(Math.min(20, guests + 1))} className="w-14 h-14 rounded-2xl bg-background border border-on-surface/5 flex items-center justify-center hover:bg-on-surface hover:text-background transition-all">
                                                <Plus className="w-5 h-5" strokeWidth={1.5} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="editorial-kicker opacity-40">Estimated Duration</label>
                                        <input 
                                            type="time" 
                                            value={endTime}
                                            onChange={(e) => setEndTime(e.target.value)}
                                            className="w-full px-8 py-6 bg-surface-container border border-on-surface/5 rounded-3xl text-on-surface font-black text-sm focus:outline-none focus:border-primary transition-all cinematic-shadow opacity-40"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={fetchAvailableTables}
                                    disabled={isLoading}
                                    className="w-full py-7 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                        <>
                                            <span>Analyze Availability</span>
                                            <ChevronRight className="w-6 h-6 text-primary" strokeWidth={2.5} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.section>
                    )}

                    {step === 2 && (
                        <motion.section 
                            key="step2"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="editorial-card p-10 lg:p-16 relative overflow-hidden">
                                <h2 className="text-display-lg text-3xl lg:text-5xl text-primary mb-12 italic">Architectural Placement</h2>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 mb-12">
                                    {availableTables.map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => setSelectedTable(t.id)}
                                            className={`
                                                relative p-8 flex flex-col items-center justify-center gap-4 transition-all duration-700 rounded-[2rem] border-2
                                                ${selectedTable === t.id ? 'bg-on-surface border-on-surface text-background cinematic-shadow scale-105 z-10' : 'bg-background border-on-surface/5 text-on-surface-variant hover:border-primary group'}
                                            `}
                                        >
                                            <TableIcon strokeWidth={1} className={`w-10 h-10 transition-transform duration-1000 ${selectedTable === t.id ? 'scale-110 text-primary' : 'group-hover:scale-110 opacity-10'}`} />
                                            <div className="text-center">
                                                <span className="text-2xl font-serif italic block mb-1">Unit {t.numero}</span>
                                                <span className={`text-[8px] uppercase font-black tracking-[0.3em] ${selectedTable === t.id ? 'text-primary' : 'opacity-30'}`}>{t.capacite} CAP</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="flex gap-6">
                                    <button onClick={prevStep} className="flex-1 py-6 bg-surface-container text-on-surface text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 rounded-2xl">
                                        <ArrowLeft className="w-4 h-4" /> BACK
                                    </button>
                                    <button 
                                        onClick={nextStep} 
                                        className="flex-[2] py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95 rounded-2xl"
                                    >
                                        <span>Confirm Placement</span>
                                        <ChevronRight className="w-6 h-6 text-primary" strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {step === 3 && (
                        <motion.section 
                            key="step3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-12"
                        >
                            <div className="editorial-card p-10 lg:p-16 relative overflow-hidden">
                                <h2 className="text-display-lg text-3xl lg:text-5xl text-primary mb-12">Final Validation</h2>
                                
                                <div className="space-y-12 mb-12">
                                    <div className="grid grid-cols-2 gap-12 pb-12 border-b border-on-surface/5">
                                        <div className="space-y-2">
                                            <span className="editorial-kicker text-[8px] opacity-40">Date</span>
                                            <p className="text-2xl font-serif italic">{new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="editorial-kicker text-[8px] opacity-40">Window</span>
                                            <p className="text-2xl font-serif italic">{startTime} — {endTime}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="editorial-kicker text-[8px] opacity-40">Coordinate</span>
                                            <p className="text-2xl font-serif italic text-primary">Table Unit #{availableTables.find(t => t.id === selectedTable)?.numero}</p>
                                        </div>
                                        <div className="space-y-2">
                                            <span className="editorial-kicker text-[8px] opacity-40">Quotas</span>
                                            <p className="text-2xl font-serif italic">{guests} Identities</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="editorial-kicker text-[8px] opacity-40">Specific Manifest Requirements</label>
                                        <textarea 
                                            value={notes}
                                            onChange={(e) => setNotes(e.target.value)}
                                            placeholder="Allergies, anniversaries, or specific architectural placement preferences..."
                                            className="w-full p-8 bg-surface-container border border-on-surface/5 rounded-[2rem] focus:outline-none focus:border-primary transition-all resize-none font-body text-lg italic cinematic-shadow"
                                            rows={3}
                                        />
                                    </div>

                                    <div className="p-8 bg-primary/5 rounded-3xl border border-primary/10 flex gap-6 items-start">
                                        <Info className="w-6 h-6 text-primary shrink-0" />
                                        <p className="text-[11px] font-body text-on-surface-variant italic leading-relaxed">Reservations are held for 15 minutes post-window arrival. For parties exceeding the verified identity quota, contact Private Dining directly.</p>
                                    </div>
                                </div>

                                <div className="flex gap-6">
                                    <button onClick={prevStep} className="flex-1 py-6 bg-surface-container text-on-surface text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 rounded-2xl">
                                        <ArrowLeft className="w-4 h-4" /> BACK
                                    </button>
                                    <button 
                                        onClick={handleFinish}
                                        disabled={isLoading}
                                        className="flex-[2] py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95 rounded-2xl"
                                    >
                                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                                            <>
                                                <span>Commit to Registry</span>
                                                <ShieldCheck className="w-6 h-6 text-primary" strokeWidth={2} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.section>
                    )}

                    {step === 4 && (
                        <motion.section 
                            key="step4"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center space-y-12 py-20"
                        >
                            <div className="relative inline-flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary opacity-10 blur-[100px] rounded-full scale-150 animate-pulse" />
                                <div className="relative w-40 h-40 rounded-[3rem] bg-background border-2 border-primary/20 flex items-center justify-center text-primary cinematic-shadow">
                                    <ShieldCheck className="w-20 h-20" strokeWidth={1} />
                                </div>
                            </div>
                            
                            <div className="space-y-6">
                                <h2 className="text-display-lg text-5xl md:text-8xl text-on-surface leading-none italic">Secured.</h2>
                                <p className="text-2xl font-body text-on-surface-variant italic opacity-60 leading-relaxed max-w-xl mx-auto">Your placement at {brandName} has been formally committed. An exceptional gastronomic orchestration awaits.</p>
                            </div>
                            
                            <div className="pt-10 flex flex-col sm:flex-row gap-6 justify-center">
                                <button onClick={() => navigate('/')} className="px-16 py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary active:scale-95 cinematic-shadow rounded-2xl">Return Home</button>
                                <button onClick={() => navigate('/account')} className="px-16 py-6 bg-surface-container text-on-surface text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-surface-container-highest active:scale-95 rounded-2xl border border-on-surface/5">View Echelon Pass</button>
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </main>
    </div>
  );
};

