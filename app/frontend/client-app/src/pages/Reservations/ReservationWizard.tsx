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
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-12 py-32 bg-[#fff8f5] animate-in fade-in duration-1000">
              <div className="w-24 h-24 rounded-full bg-[#fff1ea] flex items-center justify-center text-[#8d4e1c] border-2 border-dashed border-[#8d4e1c]/30">
                <Users className="w-10 h-10" />
              </div>
              <div className="max-w-md space-y-4">
                <h2 className="text-5xl font-serif italic text-[#301400]">Accès Réservé.</h2>
                <p className="text-[#53443a] font-medium leading-relaxed text-lg">Veuillez vous authentifier pour accéder à notre système de réservation architectural et sécuriser votre expérience gastronomique.</p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="px-12 py-4 bg-[#301400] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-black/20"
              >
                  Se Connecter
              </button>
          </div>
      );
  }

  return (
    <div className="flex-1 bg-[#fff8f5]">
      <div className="max-w-4xl mx-auto w-full px-6 py-10 md:py-16">
        
        {/* Architectural Stepper */}
        <div className="mb-12 px-2">
            <div className="flex items-center justify-between relative">
                <div className="absolute top-[20px] left-0 w-full h-[1px] bg-[#d8c2b6] z-0" />
                {[1, 2, 3, 4].map(s => (
                    <div key={s} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all duration-700 font-bold text-xs
                            ${step >= s ? 'bg-[#301400] border-[#301400] text-white shadow-xl shadow-black/20 scale-105' : 'bg-white border-[#d8c2b6] text-[#53443a]/40'}
                        `}>
                            {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-[0.2em] transition-opacity duration-500 ${step === s ? 'opacity-100 text-[#8d4e1c]' : 'opacity-40 text-[#53443a]'}`}>
                            {s === 1 ? 'Plan' : s === 2 ? 'Placement' : s === 3 ? 'Validation' : 'Sécurisé'}
                        </span>
                    </div>
                ))}
            </div>
        </div>

        {error && (
            <div className="mb-8 p-4 bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl text-[#ba1a1a] text-xs text-center font-bold animate-in shake duration-500">
                {error}
            </div>
        )}

        {/* Step 1: Configuration */}
        {step === 1 && (
            <div className="space-y-10 animate-in slide-in-from-right-12 duration-1000">
                <div className="text-center max-w-xl mx-auto space-y-3">
                    <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#fff1ea] text-[#8d4e1c] text-[9px] font-black uppercase tracking-widest mb-2">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Intelligence de Planning</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight text-[#301400] leading-tight">Configurez votre Session.</h2>
                    <p className="text-base text-[#53443a] font-medium opacity-70 italic font-serif">Définissez les paramètres temporels de votre visite.</p>
                </div>
                
                <div className="bg-white border border-[#d8c2b6] rounded-[2rem] p-6 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#8d4e1c]/5 blur-3xl -mr-24 -mt-24" />
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 flex items-center gap-2.5 opacity-40">
                            <CalendarIcon className="w-3.5 h-3.5 text-[#8d4e1c]" />
                            <span>Sélection Date</span>
                        </label>
                        <input 
                            type="date" 
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 flex items-center gap-2.5 opacity-40">
                            <Users className="w-3.5 h-3.5 text-[#8d4e1c]" />
                            <span>Nombre de Convives</span>
                        </label>
                        <input 
                            type="number" 
                            min="1" 
                            max="20"
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value))}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 flex items-center gap-2.5 opacity-40">
                            <Clock className="w-3.5 h-3.5 text-[#8d4e1c]" />
                            <span>Heure d'Arrivée</span>
                        </label>
                        <input 
                            type="time" 
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all"
                        />
                    </div>
                    
                    <div className="flex flex-col gap-2 relative z-10">
                        <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.3em] ml-1 flex items-center gap-2.5 opacity-40">
                            <Clock className="w-3.5 h-3.5 text-[#8d4e1c] opacity-50" />
                            <span>Fin Estimée</span>
                        </label>
                        <input 
                            type="time" 
                            value={endTime}
                            onChange={(e) => setEndTime(e.target.value)}
                            className="w-full p-4 bg-[#fff1ea] border border-[#ffe3d2] rounded-xl text-[#301400] font-bold text-base focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all"
                        />
                    </div>
                </div>

                <button 
                    onClick={fetchAvailableTables}
                    disabled={isLoading}
                    className="w-full py-5 bg-[#301400] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20 active:scale-95 disabled:opacity-50"
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

        {/* Step 2: Placement Mapping */}
        {step === 2 && (
            <div className="space-y-10 animate-in slide-in-from-right-12 duration-1000">
                <div className="text-center space-y-3">
                    <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight text-[#301400] leading-tight">Sélection de Placement.</h2>
                    <p className="text-base text-[#53443a] font-medium opacity-70 italic font-serif">Placement architectural pour une atmosphère optimale.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {availableTables.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setSelectedTable(t.id)}
                            className={`
                                relative p-5 flex flex-col items-center justify-center gap-2.5 transition-all duration-700 rounded-2xl border
                                ${selectedTable === t.id ? 'bg-[#301400] border-[#301400] text-white shadow-xl scale-105 z-10' : 'bg-white border-[#d8c2b6] text-[#53443a] hover:border-[#8d4e1c] group'}
                            `}
                        >
                            <TableIcon className={`w-8 h-8 transition-transform duration-700 ${selectedTable === t.id ? 'scale-110 text-[#8d4e1c]' : 'group-hover:scale-110 opacity-20'}`} />
                            <div className="text-center">
                                <span className="text-lg font-bold tracking-tighter block leading-none mb-0.5">Table {t.numero}</span>
                                <span className={`text-[8px] uppercase font-black tracking-[0.3em] ${selectedTable === t.id ? 'text-[#8d4e1c]' : 'text-[#53443a]/40'}`}>{t.capacite} SIÈGES</span>
                            </div>
                            
                            {selectedTable === t.id && (
                                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-[#8d4e1c] rounded-full flex items-center justify-center shadow-lg border-2 border-[#301400]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={prevStep} className="order-2 sm:order-1 flex-1 py-4 bg-[#fff1ea] text-[#301400] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#ffe3d2] transition-all flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Précédent
                    </button>
                    <button 
                        onClick={nextStep} 
                        className="order-1 sm:order-2 flex-[2] py-4 bg-[#301400] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-xl shadow-black/10 active:scale-95"
                    >
                        <span>Continuer le Placement</span>
                        <ChevronRight className="w-6 h-6 text-[#8d4e1c]" />
                    </button>
                </div>
            </div>
        )}

        {/* Step 3: Formal Validation */}
        {step === 3 && (
            <div className="space-y-10 animate-in slide-in-from-right-12 duration-1000">
                <div className="text-center space-y-3">
                    <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight text-[#301400] leading-tight">Validation Formelle.</h2>
                    <p className="text-base text-[#53443a] font-medium opacity-70 italic font-serif">Confirmation finale des paramètres de session.</p>
                </div>

                <div className="bg-white border border-[#d8c2b6] rounded-[2rem] p-8 space-y-8 shadow-sm">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-8 border-b border-[#fff1ea]">
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-[#8d4e1c] uppercase tracking-[0.4em]">Date de Session</span>
                            <p className="text-xl font-serif italic text-[#301400] capitalize leading-tight">
                                {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-[#8d4e1c] uppercase tracking-[0.4em]">Fenêtre Temporelle</span>
                            <p className="text-xl font-serif italic text-[#301400]">{startTime} — {endTime}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-[#8d4e1c] uppercase tracking-[0.4em]">Placement</span>
                            <p className="text-xl font-serif italic text-[#301400]">Table #{availableTables.find(t => t.id === selectedTable)?.numero}</p>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[9px] font-black text-[#8d4e1c] uppercase tracking-[0.4em]">Participants</span>
                            <p className="text-xl font-serif italic text-[#301400]">{guests} Convives</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-[#53443a] uppercase tracking-[0.4em] ml-1 opacity-40">Exigences Particulières</label>
                        <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Allergies, célébrations, ou préférences architecturales de placement..."
                            className="w-full p-5 bg-[#fff1ea] border border-[#ffe3d2] rounded-2xl focus:bg-white focus:outline-none focus:border-[#8d4e1c] focus:ring-4 focus:ring-[#8d4e1c]/5 transition-all resize-none font-semibold text-[#301400] text-sm"
                            rows={3}
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <button onClick={prevStep} className="order-2 sm:order-1 flex-1 py-4 bg-[#fff1ea] text-[#301400] rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[#ffe3d2] transition-all flex items-center justify-center gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Précédent
                    </button>
                    <button 
                        onClick={handleFinish}
                        disabled={isLoading}
                        className="order-1 sm:order-2 flex-[2] py-4 bg-[#301400] text-white rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] hover:shadow-xl shadow-black/10 active:scale-95 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                            <>
                                <span>Confirmer la Réservation</span>
                                <CheckCircle2 className="w-6 h-6 text-[#8d4e1c]" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        )}

        {/* Step 4: Security Confirmed */}
        {step === 4 && (
            <div className="text-center space-y-8 animate-in zoom-in-95 duration-1000 max-w-xl mx-auto py-8">
                <div className="relative inline-flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#8d4e1c] opacity-10 blur-[80px] rounded-full scale-125" />
                    <div className="relative w-24 h-24 rounded-[2rem] bg-white border border-[#d8c2b6] flex items-center justify-center text-[#8d4e1c] shadow-xl animate-in zoom-in duration-700">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>
                </div>
                
                <div className="space-y-4">
                    <h2 className="text-5xl font-serif italic tracking-tight text-[#301400] leading-none">Confirmé.</h2>
                    <p className="text-xl text-[#53443a] font-medium leading-relaxed italic font-serif opacity-80">Votre table a été sécurisée numériquement. Une expérience gastronomique architecturale vous attend chez {brandName}.</p>
                </div>
                
                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                    <button onClick={() => navigate('/')} className="flex-1 py-4 bg-[#301400] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-black/10">Retour à l'Accueil</button>
                    <button className="flex-1 py-4 bg-white border border-[#d8c2b6] text-[#301400] rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:bg-[#fff1ea] active:scale-95">Générer le Pass</button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

