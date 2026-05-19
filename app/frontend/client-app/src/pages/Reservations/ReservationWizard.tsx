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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-8 py-20 bg-[#fff8f5] animate-in fade-in duration-1000">
              <div className="w-20 h-20 rounded-full bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] border-2 border-dashed border-[#8d4e1c]/30">
                <Users className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-3">
                <h2 className="text-4xl font-serif italic text-[#301400]">Accès Réservé.</h2>
                <p className="text-[#53443a] font-medium leading-relaxed text-base opacity-70">Authentifiez-vous pour sécuriser votre expérience gastronomique.</p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="px-10 py-3.5 bg-[#301400] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/10"
              >
                  Se Connecter
              </button>
          </div>
      );
  }

  return (
    <div className="flex-1 bg-[#fff8f5]">
      <div className="max-w-3xl mx-auto w-full px-6 py-10 md:py-16">
        
        {/* Compact Stepper */}
        <div className="mb-12 px-2">
            <div className="flex items-center justify-between relative">
                <div className="absolute top-[20px] left-0 w-full h-[1px] bg-[#d8c2b6] z-0" />
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-500 font-bold text-xs
                            ${step >= s ? 'bg-[#301400] border-[#301400] text-white shadow-lg scale-105' : 'bg-white border-[#d8c2b6] text-[#53443a]/40'}
                        `}>
                            {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-[0.15em] transition-opacity duration-300 ${step === s ? 'opacity-100 text-[#8d4e1c]' : 'opacity-40 text-[#53443a]'}`}>
                            {s === 1 ? 'Plan' : s === 2 ? 'Place' : s === 3 ? 'Conf' : 'Prêt'}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {error && (
            <div className="mb-8 p-4 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#ba1a1a] text-xs text-center font-bold">
                {error}
            </div>
        )}

        {/* Step 1: Configuration - Compact */}
        {step === 1 && (
            <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                <div className="text-center max-w-xl mx-auto space-y-2">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#fff1ea] text-[#8d4e1c] text-[8px] font-black uppercase tracking-widest mb-2">
                        <Sparkles className="w-3 h-3" />
                        <span>Planning</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight text-[#301400] leading-tight">Votre Session.</h2>
                    <p className="text-base text-[#53443a] font-medium opacity-60">Paramètres temporels.</p>
                </div>
                
                <div className="bg-white border border-[#d8c2b6] rounded-[1.5rem] p-8 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#8d4e1c]/5 blur-3xl -mr-24 -mt-24" />
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[8px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 flex items-center gap-2 opacity-40">
                            <CalendarIcon className="w-3.5 h-3.5 text-[#8d4e1c]" />
                            <span>Date</span>
                        </label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[8px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 flex items-center gap-2 opacity-40">
                            <Users className="w-3.5 h-3.5 text-[#8d4e1c]" />
                            <span>Convives</span>
                        </label>
                        <input 
                            type="number" 
                            min="1" 
                            max="20"
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value))}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[8px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 flex items-center gap-2 opacity-40">
                            <Clock className="w-3.5 h-3.5 text-[#8d4e1c]" />
                            <span>Arrivée</span>
                        </label>
                        <input 
                            type="time" 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[8px] font-black text-[#53443a] uppercase tracking-[0.2em] ml-1 flex items-center gap-2 opacity-40">
                            <Clock className="w-3.5 h-3.5 text-[#8d4e1c] opacity-50" />
                            <span>Fin</span>
                        </label>
                        <input 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all"
                        />
                    </div>
                </div>

                <button 
                    onClick={fetchAvailableTables}
                    disabled={isLoading}
                    className="w-full py-5 bg-[#301400] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:bg-[#4b2709] active:scale-95 disabled:opacity-50"
                >
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                            <span>Vérifier la Disponibilité</span>
                            <ChevronRight className="w-6 h-6 text-[#8d4e1c]" />
                        </>
                    )}
                </button>
            </div>
        )}

        {/* Step 2: Placement Mapping - Compact */}
        {step === 2 && (
            <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight text-[#301400] leading-tight">Placement.</h2>
                    <p className="text-base text-[#53443a] font-medium opacity-60">Sélection architecturale.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {availableTables.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTable(t.id)}
                            className={`
                                relative p-6 flex flex-col items-center justify-center gap-3 transition-all duration-300 rounded-2xl border
                                ${selectedTable === t.id ? 'bg-[#301400] border-[#301400] text-white shadow-xl scale-[1.02] z-10' : 'bg-white border-[#d8c2b6] text-[#53443a] hover:border-[#8d4e1c] group'}
                            `}
                        >
                            <TableIcon className={`w-8 h-8 transition-all ${selectedTable === t.id ? 'text-[#8d4e1c]' : 'opacity-20'}`} />
                            <div className="text-center">
                                <span className="text-lg font-bold tracking-tighter block leading-none mb-0.5">Table {t.numero}</span>
                                <span className={`text-[7px] uppercase font-black tracking-[0.2em] ${selectedTable === t.id ? 'text-[#8d4e1c]' : 'text-[#53443a]/40'}`}>{t.capacite} SIÈGES</span>
                            </div>
                        </button>
                    ))}
                </div>

                <div className="flex gap-4">
                    <button onClick={prevStep} className="flex-1 py-4 bg-[#fff1ea] text-[#301400] rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Retour</button>
                    <button onClick={nextStep} className="flex-[2] py-4 bg-[#301400] text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95 shadow-black/10">
                        <span>Continuer</span>
                        <ChevronRight className="w-5 h-5 text-[#8d4e1c]" />
                    </button>
                </div>
            </div>
        )}

        {/* Step 3: Formal Validation - Compact */}
        {step === 3 && (
            <div className="space-y-10 animate-in slide-in-from-right-8 duration-700">
                <div className="text-center space-y-2">
                    <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight text-[#301400] leading-tight">Validation.</h2>
                    <p className="text-base text-[#53443a] font-medium opacity-60">Confirmation finale.</p>
                </div>

                <div className="bg-white border border-[#d8c2b6] rounded-[2rem] p-8 space-y-8 shadow-sm">
                    <div className="grid grid-cols-2 gap-6 pb-8 border-b border-[#fff1ea]">
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-[#8d4e1c] uppercase tracking-[0.3em]">Date</span>
                            <p className="text-lg font-serif italic text-[#301400] leading-tight">
                                {new Date(date).toLocaleDateString('fr-FR', { month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-[#8d4e1c] uppercase tracking-[0.3em]">Fenêtre</span>
                            <p className="text-lg font-serif italic text-[#301400] leading-tight">{startTime} — {endTime}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-[#8d4e1c] uppercase tracking-[0.3em]">Place</span>
                            <p className="text-lg font-serif italic text-[#301400] leading-tight">Table #{availableTables.find(t => t.id === selectedTable)?.numero}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-[8px] font-black text-[#8d4e1c] uppercase tracking-[0.3em]">Convives</span>
                            <p className="text-lg font-serif italic text-[#301400] leading-tight">{guests} pers.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[8px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 opacity-40">Exigences</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Allergies, célébrations..."
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl focus:bg-white focus:outline-none focus:border-[#8d4e1c] transition-all resize-none text-sm font-semibold text-[#301400]"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button onClick={prevStep} className="flex-1 py-4 bg-[#fff1ea] text-[#301400] rounded-xl font-bold text-xs uppercase tracking-widest transition-all">Retour</button>
                    <button 
                        onClick={handleFinish}
                        disabled={isLoading}
                        className="flex-[2] py-4 bg-[#301400] text-white rounded-xl font-bold text-base flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                            <>
                                <span>Confirmer</span>
                                <CheckCircle2 className="w-5 h-5 text-[#8d4e1c]" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        )}

        {/* Step 4: Security Confirmed - Dense */}
        {step === 4 && (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-700 max-w-xl mx-auto py-10">
                <div className="w-20 h-20 rounded-2xl bg-white border border-[#d8c2b6] flex items-center justify-center text-[#8d4e1c] shadow-xl mx-auto">
                    <CheckCircle2 className="w-10 h-10" />
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-5xl font-serif italic tracking-tight text-[#301400] leading-none">Confirmé.</h2>
                    <p className="text-xl text-[#53443a] font-medium italic font-serif">Réservation sécurisée chez {brandName}.</p>
                </div>
                
                <div className="pt-6 flex gap-4">
                    <button onClick={() => navigate('/')} className="flex-1 py-4 bg-[#301400] text-white rounded-xl font-bold text-sm transition-all active:scale-95">Accueil</button>
                    <button className="flex-1 py-4 bg-white border border-[#d8c2b6] text-[#301400] rounded-xl font-bold text-sm transition-all hover:bg-[#fff8f5]">Générer Pass</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};
