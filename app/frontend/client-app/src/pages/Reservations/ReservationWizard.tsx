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
  ArrowLeft,
  Sparkles
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-8 text-center gap-6 md:gap-8 py-24 md:py-32 bg-background animate-in fade-in duration-700">
              <div className="w-20 md:w-24 h-20 md:h-24 rounded-full bg-primary-container/20 flex items-center justify-center text-primary border-2 border-dashed border-primary/20">
                <Users className="w-8 md:w-10 h-8 md:h-10" />
              </div>
              <div className="max-w-md">
                <h2 className="text-3xl md:text-4xl font-display-accent italic text-on-surface mb-3 md:mb-4">Table Reservation</h2>
                <p className="text-on-surface-variant font-medium leading-relaxed text-sm md:text-base">Sign in to access our architectural booking system and secure your premium dining experience.</p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-10 py-4 bg-primary text-white rounded-xl font-bold transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/20 active:scale-95 shadow-lg shadow-primary/10"
              >
                  Sign In to Continue
              </button>
          </div>
      );
  }

  return (
    <div className="flex-1 max-w-4xl mx-auto w-full px-5 md:px-8 py-10 md:py-32 animate-in fade-in duration-700 bg-background overflow-x-hidden">
      {/* Architectural Progress Stepper */}
      <div className="mb-12 md:mb-20 px-2 md:px-4">
          <div className="flex items-center justify-between relative">
              <div className="absolute top-[22px] md:top-[24px] left-0 w-full h-[1px] bg-surface-container-high z-0" />
              {[1, 2, 3, 4].map(s => (
                  <div key={s} className="relative z-10 flex flex-col items-center gap-2 md:gap-3">
                      <div className={`
                        w-10 md:w-12 h-10 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center border-2 transition-all duration-700 font-bold font-sans text-[10px] md:text-sm
                        ${step >= s ? 'bg-primary border-primary text-white shadow-lg md:shadow-xl shadow-primary/20 scale-110' : 'bg-white border-surface-container-high text-on-surface-variant'}
                      `}>
                          {step > s ? <CheckCircle2 className="w-5 md:w-6 h-5 md:h-6" /> : s}
                      </div>
                      <span className={`text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-opacity duration-500 ${step === s ? 'opacity-100 text-primary' : 'opacity-40 text-on-surface-variant'}`}>
                          {s === 1 ? 'Details' : s === 2 ? 'Placement' : s === 3 ? 'Confirm' : 'Secured'}
                      </span>
                  </div>
              ))}
          </div>
      </div>

      {error && (
        <div className="mb-8 md:mb-10 p-4 md:p-5 bg-error-container/30 border border-error/20 rounded-2xl text-error text-xs md:text-sm text-center font-bold animate-in shake duration-500">
            {error}
        </div>
      )}

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <div className="space-y-10 md:space-y-12 animate-in slide-in-from-right-8 duration-700">
            <div className="text-center max-w-xl mx-auto">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-primary text-[8px] md:text-[10px] font-bold uppercase tracking-widest mb-4 md:mb-6">
                    <Sparkles className="w-3 h-3" />
                    <span>Planning intelligence</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display-accent italic tracking-tight text-on-surface mb-3 md:mb-4 leading-tight">When shall we <br/> expect you?</h2>
                <p className="text-sm md:text-on-surface-variant font-medium opacity-70">Define your visiting session details with surgical precision.</p>
            </div>
            
            <div className="double-bezel p-6 md:p-10 bg-white grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
                <div className="flex flex-col gap-2 md:gap-3">
                    <label className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
                        <CalendarIcon className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary" />
                        <span>Date Selection</span>
                    </label>
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-4 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface font-bold text-sm md:text-base focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2 md:gap-3">
                    <label className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
                        <Users className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary" />
                        <span>Party Size</span>
                    </label>
                    <input 
                        type="number" 
                        min="1" 
                        max="20"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        className="w-full p-4 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface font-bold text-sm md:text-base focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2 md:gap-3">
                    <label className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
                        <Clock className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary" />
                        <span>Arrival Time</span>
                    </label>
                    <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-4 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface font-bold text-sm md:text-base focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2 md:gap-3">
                    <label className="text-[10px] md:text-xs font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1 flex items-center gap-3">
                        <Clock className="w-3.5 md:w-4 h-3.5 md:h-4 text-primary opacity-50" />
                        <span>Estimated Departure</span>
                    </label>
                    <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-4 bg-surface-container-low border border-surface-container-high rounded-xl text-on-surface font-bold text-sm md:text-base focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all"
                    />
                </div>
            </div>

            <button 
                onClick={fetchAvailableTables}
                disabled={isLoading}
                className="w-full py-4 md:py-5 bg-primary text-white rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 active:scale-95 shadow-xl shadow-primary/10 disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                        <span>Check Availability</span>
                        <ChevronRight className="w-6 h-6" />
                    </>
                )}
            </button>
        </div>
      )}

      {/* Step 2: Table Selection */}
      {step === 2 && (
        <div className="space-y-10 md:space-y-12 animate-in slide-in-from-right-8 duration-700">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-display-accent italic tracking-tight text-on-surface mb-3 md:mb-4 leading-tight">Secure your spot.</h2>
                <p className="text-sm md:text-on-surface-variant font-medium opacity-70">Architectural placement for the optimal atmosphere.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {availableTables.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedTable(t.id)}
                        className={`
                            double-bezel p-5 md:p-8 flex flex-col items-center justify-center gap-3 md:gap-4 transition-all duration-500
                            ${selectedTable === t.id ? 'bg-primary border-primary text-white shadow-xl md:shadow-2xl shadow-primary/20 scale-105' : 'bg-white hover:border-primary/40 text-on-surface-variant hover:text-on-surface group'}
                        `}
                    >
                        <TableIcon className={`w-6 md:w-8 h-6 md:h-8 transition-transform duration-500 ${selectedTable === t.id ? 'scale-110' : 'group-hover:scale-110 opacity-40'}`} />
                        <div className="text-center">
                            <span className="text-lg md:text-xl font-bold font-sans tracking-tight block">Table {t.numero}</span>
                            <span className={`text-[8px] md:text-[10px] uppercase font-bold tracking-[0.2em] ${selectedTable === t.id ? 'text-white/60' : 'text-on-surface-variant opacity-50'}`}>{t.capacite} SITS</span>
                        </div>
                    </button>
                ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                <button onClick={prevStep} className="order-2 sm:order-1 flex-1 py-4 md:py-5 bg-surface-container-low text-on-surface-variant rounded-2xl font-bold hover:bg-surface-container-high transition-all active:scale-95 flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button 
                    onClick={nextStep} 
                    className="order-1 sm:order-2 flex-[2] py-4 md:py-5 bg-primary text-white rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 active:scale-95 shadow-xl shadow-primary/10"
                >
                    Continue Placement
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-10 md:space-y-12 animate-in slide-in-from-right-8 duration-700">
            <div className="text-center">
                <h2 className="text-4xl md:text-5xl font-display-accent italic tracking-tight text-on-surface mb-3 md:mb-4 leading-tight">Final verification.</h2>
                <p className="text-sm md:text-on-surface-variant font-medium opacity-70">Confirming your session parameters.</p>
            </div>

            <div className="double-bezel p-6 md:p-10 bg-white space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8 pb-8 border-b border-surface-container-high">
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Session Date</span>
                        <span className="text-lg md:text-xl font-bold text-on-surface font-sans capitalize">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Time Window</span>
                        <span className="text-lg md:text-xl font-bold text-on-surface font-sans">{startTime} — {endTime}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Placement</span>
                        <span className="text-lg md:text-xl font-bold text-on-surface font-sans">Table #{availableTables.find(t => t.id === selectedTable)?.numero}</span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <span className="text-[9px] md:text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Attendees</span>
                        <span className="text-lg md:text-xl font-bold text-on-surface font-sans">{guests} Guests</span>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:gap-4">
                    <label className="text-[9px] md:text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.2em] ml-1">Special Requirements</label>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Allergies, celebrations, or specific seating requests..."
                        className="w-full p-5 md:p-6 bg-surface-container-low border border-surface-container-high rounded-2xl focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all resize-none font-semibold text-sm md:text-base text-on-surface"
                        rows={3}
                    />
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                <button onClick={prevStep} className="order-2 sm:order-1 flex-1 py-4 md:py-5 bg-surface-container-low text-on-surface-variant rounded-2xl font-bold hover:bg-surface-container-high transition-all active:scale-95 flex items-center justify-center gap-2">
                    <ArrowLeft className="w-5 h-5" />
                    Back
                </button>
                <button 
                    onClick={handleFinish}
                    disabled={isLoading}
                    className="order-1 sm:order-2 flex-[2] py-4 md:py-5 bg-primary text-white rounded-2xl font-bold text-base md:text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/20 active:scale-95 shadow-xl shadow-primary/10"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            <span>Finalize Booking</span>
                            <CheckCircle2 className="w-5 md:w-6 h-5 md:h-6" />
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center space-y-8 md:space-y-12 animate-in zoom-in-95 duration-1000 max-w-2xl mx-auto py-6 md:py-10">
            <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 bg-primary opacity-10 blur-3xl rounded-full scale-150" />
                <div className="relative w-24 md:w-32 h-24 md:h-32 rounded-full bg-white double-bezel flex items-center justify-center text-primary animate-in zoom-in duration-700">
                    <CheckCircle2 className="w-12 md:w-16 h-12 md:h-16" />
                </div>
            </div>
            <div className="space-y-3 md:space-y-6">
                <h2 className="text-5xl md:text-6xl font-display-accent italic tracking-tight text-on-surface leading-tight">Confirmed.</h2>
                <p className="text-lg md:text-xl text-on-surface-variant font-medium leading-relaxed">Your table has been digitally secured. An architectural dining experience awaits you at {brandName}.</p>
            </div>
            <div className="pt-6 md:pt-8 flex flex-col sm:flex-row gap-4 md:gap-6">
                <button onClick={() => navigate('/')} className="flex-1 py-4 md:py-5 bg-on-surface text-white rounded-xl md:rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-on-surface/10">Return Home</button>
                <button className="flex-1 py-4 md:py-5 glass text-on-surface rounded-xl md:rounded-2xl font-bold transition-all hover:bg-white active:scale-95">Add to Wallet</button>
            </div>
        </div>
      )}
    </div>
  );
};
