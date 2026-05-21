import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ArrowLeft
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
    <div className="flex-1 bg-background">
      <div className="max-w-5xl mx-auto w-full px-8 py-12 md:py-20">
        
        {/* Cinematic Stepper */}
        <div className="mb-20 px-4">
            <div className="flex items-center justify-between relative">
                <div className="absolute top-[20px] left-0 w-full h-[1px] bg-on-surface/5 z-0" />
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-4">
                        <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-1000 font-black text-[11px]
                            ${step >= s ? 'bg-on-surface border-on-surface text-background cinematic-shadow scale-110' : 'bg-background border-on-surface/10 text-on-surface-variant/40'}
                        `}>
                            {step > s ? <CheckCircle2 className="w-5 h-5" strokeWidth={2} /> : `0${s}`}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-700 ${step === s ? 'opacity-100 text-primary translate-y-0' : 'opacity-30 text-on-surface-variant translate-y-1'}`}>
                            {s === 1 ? 'Manifest' : s === 2 ? 'Placement' : s === 3 ? 'Validation' : 'Secured'}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {error && (
            <div className="mb-12 p-6 bg-error text-on-error border-2 border-on-surface text-[10px] font-black tracking-[0.2em] text-center uppercase cinematic-shadow animate-in shake duration-500">
                SYSTEM ERROR: {error}
            </div>
        )}

        {/* Step 1: Configuration */}
        {step === 1 && (
            <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
                <div className="text-center max-w-2xl mx-auto space-y-4">
                    <div className="flex items-center justify-center gap-3 mb-4">
                        <span className="h-[1px] w-8 bg-primary"></span>
                        <span className="editorial-kicker">Planning Intelligence</span>
                        <span className="h-[1px] w-8 bg-primary"></span>
                    </div>
                    <h2 className="text-display-lg text-4xl md:text-6xl text-on-surface leading-tight">Configure your <br /><span className="italic font-light">Session.</span></h2>
                    <p className="text-lg font-body text-on-surface-variant opacity-60 leading-relaxed">Define the temporal coordinates for your visit.</p>
                </div>
                
                <div className="editorial-card p-10 grid grid-cols-1 md:grid-cols-2 gap-10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -mr-32 -mt-32" />
                    
                    <div className="flex flex-col gap-3 relative z-10">
                        <label className="text-ui-label-bold text-[9px] text-on-surface-variant/40 flex items-center gap-3">
                            <CalendarIcon className="w-4 h-4 text-primary" strokeWidth={1.5} />
                            <span>SESSION DATE</span>
                        </label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-6 py-4 bg-surface-container-low border border-on-surface/5 rounded-2xl text-on-surface font-black text-sm focus:bg-background focus:outline-none focus:border-primary transition-all cinematic-shadow"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-3 relative z-10">
                        <label className="text-ui-label-bold text-[9px] text-on-surface-variant/40 flex items-center gap-3">
                            <Users className="w-4 h-4 text-primary" strokeWidth={1.5} />
                            <span>GUEST QUOTA</span>
                        </label>
                        <input 
                            type="number" 
                            min="1" 
                            max="20"
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value))}
                            className="w-full px-6 py-4 bg-surface-container-low border border-on-surface/5 rounded-2xl text-on-surface font-black text-sm focus:bg-background focus:outline-none focus:border-primary transition-all cinematic-shadow"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-3 relative z-10">
                        <label className="text-ui-label-bold text-[9px] text-on-surface-variant/40 flex items-center gap-3">
                            <Clock className="w-4 h-4 text-primary" strokeWidth={1.5} />
                            <span>ARRIVAL WINDOW</span>
                        </label>
                        <input 
                            type="time" 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full px-6 py-4 bg-surface-container-low border border-on-surface/5 rounded-2xl text-on-surface font-black text-sm focus:bg-background focus:outline-none focus:border-primary transition-all cinematic-shadow"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-3 relative z-10">
                        <label className="text-ui-label-bold text-[9px] text-on-surface-variant/40 flex items-center gap-3 opacity-60">
                            <Clock className="w-4 h-4 text-primary/40" strokeWidth={1.5} />
                            <span>ESTIMATED DURATION</span>
                        </label>
                        <input 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full px-6 py-4 bg-surface-container-low border border-on-surface/5 rounded-2xl text-on-surface font-black text-sm focus:bg-background focus:outline-none focus:border-primary transition-all cinematic-shadow"
                        />
                    </div>
                </div>

                <button 
                    onClick={fetchAvailableTables}
                    disabled={isLoading}
                    className="w-full py-6 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={2.5} /> : (
                        <>
                            <span>Analyze Availability</span>
                            <ChevronRight className="w-6 h-6 text-primary" strokeWidth={2.5} />
                        </>
                    )}
                </button>
            </div>
        )}

        {/* Step 2: Placement Mapping */}
        {step === 2 && (
            <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
                <div className="text-center space-y-4">
                    <span className="editorial-kicker">Architectural Selection</span>
                    <h2 className="text-display-lg text-4xl md:text-6xl text-on-surface leading-tight">Secure your <br /><span className="italic font-light">Placement.</span></h2>
                    <p className="text-lg font-body text-on-surface-variant opacity-60">Select an optimized coordinate for your gastronomic session.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {availableTables.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTable(t.id)}
                            className={`
                                relative p-8 flex flex-col items-center justify-center gap-4 transition-all duration-700 rounded-3xl border-2
                                ${selectedTable === t.id ? 'bg-on-surface border-on-surface text-background cinematic-shadow scale-105 z-10' : 'bg-background border-on-surface/5 text-on-surface-variant hover:border-primary group'}
                            `}
                        >
                            <TableIcon strokeWidth={1} className={`w-12 h-12 transition-transform duration-1000 ${selectedTable === t.id ? 'scale-110 text-primary' : 'group-hover:scale-110 opacity-10'}`} />
                            <div className="text-center">
                                <span className="text-2xl font-serif italic block leading-none mb-2">Unit {t.numero}</span>
                                <span className={`text-[9px] uppercase font-black tracking-[0.3em] ${selectedTable === t.id ? 'text-primary' : 'text-on-surface-variant/30'}`}>{t.capacite} SECTOR QUOTA</span>
                            </div>
                            
                            {selectedTable === t.id && (
                                <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary rounded-full flex items-center justify-center cinematic-shadow border-2 border-on-surface">
                                    <CheckCircle2 className="w-5 h-5 text-background" strokeWidth={2.5} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <button onClick={prevStep} className="order-2 sm:order-1 flex-1 py-5 bg-surface-container text-on-surface text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                        Previous Matrix
                    </button>
                    <button 
                        onClick={nextStep} 
                        className="order-1 sm:order-2 flex-[2] py-5 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95"
                    >
                        <span>Confirm Placement</span>
                        <ChevronRight className="w-6 h-6 text-primary" strokeWidth={2.5} />
                    </button>
                </div>
            </div>
        )}

        {/* Step 3: Formal Validation */}
        {step === 3 && (
            <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-1000">
                <div className="text-center space-y-4">
                    <span className="editorial-kicker">Formal Verification</span>
                    <h2 className="text-display-lg text-4xl md:text-6xl text-on-surface leading-tight">Formal <br /><span className="italic font-light">Validation.</span></h2>
                    <p className="text-lg font-body text-on-surface-variant opacity-60">Final confirmation of session parameters before registry commit.</p>
                </div>

                <div className="editorial-card p-10 space-y-10 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 blur-[120px] -ml-48 -mt-48" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-12 pb-10 border-b border-on-surface/5 relative z-10">
                        <div className="space-y-3">
                            <span className="editorial-kicker text-[8px] opacity-40">Session Date</span>
                            <p className="text-2xl font-serif italic text-on-surface capitalize leading-tight">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="space-y-3">
                            <span className="editorial-kicker text-[8px] opacity-40">Temporal Window</span>
                            <p className="text-2xl font-serif italic text-on-surface">{startTime} — {endTime}</p>
                        </div>
                        <div className="space-y-3">
                            <span className="editorial-kicker text-[8px] opacity-40">Placement Coordinate</span>
                            <p className="text-2xl font-serif italic text-on-surface text-primary">Table Unit #{availableTables.find(t => t.id === selectedTable)?.numero}</p>
                        </div>
                        <div className="space-y-3">
                            <span className="editorial-kicker text-[8px] opacity-40">Guest Count</span>
                            <p className="text-2xl font-serif italic text-on-surface">{guests} Verified Identities</p>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <label className="editorial-kicker text-[8px] opacity-40">Specific Requirements (Optional)</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Allergies, celebrations, or specific architectural placement preferences..."
                            className="w-full p-6 bg-background border border-on-surface/5 rounded-3xl focus:outline-none focus:border-primary focus:ring-8 focus:ring-primary/5 transition-all resize-none font-body text-on-surface text-base italic cinematic-shadow"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-6">
                    <button onClick={prevStep} className="order-2 sm:order-1 flex-1 py-5 bg-surface-container text-on-surface text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3">
                        <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
                        Return to Placement
                    </button>
                    <button 
                        onClick={handleFinish}
                        disabled={isLoading}
                        className="order-1 sm:order-2 flex-[2] py-5 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] flex items-center justify-center gap-4 transition-all hover:bg-primary cinematic-shadow active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" strokeWidth={2.5} /> : (
                            <>
                                <span>Commit to Registry</span>
                                <CheckCircle2 className="w-6 h-6 text-primary" strokeWidth={2.5} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        )}

        {/* Step 4: Security Confirmed */}
        {step === 4 && (
            <div className="text-center space-y-12 animate-in zoom-in-95 duration-1000 max-w-2xl mx-auto py-10">
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-primary opacity-10 blur-[100px] rounded-full scale-150 animate-pulse" />
                    <div className="relative w-32 h-32 rounded-[2.5rem] bg-background border-2 border-primary/20 flex items-center justify-center text-primary cinematic-shadow animate-in zoom-in duration-1000">
                        <CheckCircle2 className="w-16 h-16" strokeWidth={1} />
                    </div>
                </div>
                
                <div className="space-y-6">
                    <h2 className="text-display-lg text-5xl md:text-7xl text-on-surface leading-none">Registry <br /><span className="italic font-light">Secured.</span></h2>
                    <p className="text-xl font-body text-on-surface-variant leading-relaxed opacity-80">Your placement has been formally committed. An exceptional gastronomic orchestration awaits your presence at {brandName}.</p>
                </div>
                
                <div className="pt-10 flex flex-col sm:flex-row gap-6">
                    <button onClick={() => navigate('/')} className="flex-1 py-5 bg-on-surface text-background text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-primary active:scale-95 cinematic-shadow">Return Home</button>
                    <button className="flex-1 py-5 bg-surface-container text-on-surface text-[11px] font-black uppercase tracking-[0.4em] transition-all hover:bg-surface-container-highest active:scale-95 border border-on-surface/5">Download Identity Pass</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

