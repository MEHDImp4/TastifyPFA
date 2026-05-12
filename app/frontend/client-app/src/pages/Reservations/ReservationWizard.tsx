import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationApi } from '../../api/reservations';
import { useAuthStore } from '../../store/authStore';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  ChevronRight, 
  CheckCircle2, 
  Loader2,
  Table as TableIcon
} from 'lucide-react';

export const ReservationWizard: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
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
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6 py-24">
              <div className="p-8 bg-teal/5 rounded-full border-2 border-dashed border-teal/20 text-teal">
                <Users className="w-16 h-16" />
              </div>
              <div>
                <h2 className="text-3xl font-bold tracking-tight text-dark mb-2">Réservation de table</h2>
                <p className="text-gray-500 max-w-sm">Veuillez vous connecter pour réserver votre table en quelques clics.</p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="px-8 py-3.5 bg-dark text-white rounded-2xl font-bold transition-transform hover:scale-105 active:scale-95"
              >
                  Se connecter
              </button>
          </div>
      );
  }

  return (
    <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-12 md:py-24 animate-in fade-in duration-500">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-12 relative">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0" />
          {[1, 2, 3, 4].map(s => (
              <div key={s} className={`
                relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-500 font-bold
                ${step >= s ? 'bg-teal border-teal text-white shadow-lg shadow-teal/20' : 'bg-white border-gray-200 text-gray-300'}
              `}>
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
              </div>
          ))}
      </div>

      {error && (
        <div className="mb-8 p-4 bg-terracotta/10 border border-terracotta/20 rounded-2xl text-terracotta text-sm text-center">
            {error}
        </div>
      )}

      {/* Step 1: Date & Time */}
      {step === 1 && (
        <div className="space-y-8 animate-in slide-in-from-right-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-dark mb-2">Quand venez-vous ?</h2>
                <p className="text-gray-500">Choisissez la date et l'heure de votre visite.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-teal" />
                        <span>Date</span>
                    </label>
                    <input 
                        type="date" 
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-teal transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        <Users className="w-4 h-4 text-teal" />
                        <span>Personnes</span>
                    </label>
                    <input 
                        type="number" 
                        min="1"
                        max="20"
                        value={guests}
                        onChange={(e) => setGuests(parseInt(e.target.value))}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-teal transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal" />
                        <span>Arrivée</span>
                    </label>
                    <input 
                        type="time" 
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-teal transition-all"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal" />
                        <span>Départ prévu</span>
                    </label>
                    <input 
                        type="time" 
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:border-teal transition-all"
                    />
                </div>
            </div>

            <button 
                onClick={fetchAvailableTables}
                disabled={isLoading}
                className="w-full py-4 bg-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-teal/10"
            >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        <span>Vérifier la disponibilité</span>
                        <ChevronRight className="w-5 h-5" />
                    </>
                )}
            </button>
        </div>
      )}

      {/* Step 2: Table Selection */}
      {step === 2 && (
        <div className="space-y-8 animate-in slide-in-from-right-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-dark mb-2">Choisissez votre table</h2>
                <p className="text-gray-500">Sélectionnez l'emplacement qui vous convient le mieux.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {availableTables.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setSelectedTable(t.id)}
                        className={`
                            p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-3 transition-all
                            ${selectedTable === t.id ? 'bg-teal border-teal text-white shadow-xl shadow-teal/20 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-teal/30'}
                        `}
                    >
                        <TableIcon className="w-6 h-6" />
                        <span className="text-lg font-bold">Table {t.numero}</span>
                        <span className="text-xs uppercase font-bold tracking-widest opacity-60">{t.capacite} pers.</span>
                    </button>
                ))}
            </div>

            <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">Retour</button>
                <button 
                    onClick={nextStep} 
                    className="flex-[2] py-4 bg-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-teal/10"
                >
                    Continuer
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {step === 3 && (
        <div className="space-y-8 animate-in slide-in-from-right-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-dark mb-2">Presque terminé</h2>
                <p className="text-gray-500">Vérifiez les détails de votre réservation.</p>
            </div>

            <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 space-y-6">
                <div className="flex justify-between items-center py-4 border-b border-gray-200/50">
                    <span className="text-gray-500 font-medium">Date</span>
                    <span className="font-bold text-dark">{new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-200/50">
                    <span className="text-gray-500 font-medium">Créneau</span>
                    <span className="font-bold text-dark">{startTime} - {endTime}</span>
                </div>
                <div className="flex justify-between items-center py-4 border-b border-gray-200/50">
                    <span className="text-gray-500 font-medium">Table & Convives</span>
                    <span className="font-bold text-dark">Table {availableTables.find(t => t.id === selectedTable)?.numero} • {guests} personnes</span>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-widest">Notes particulières</label>
                    <textarea 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Allergies, anniversaire, demande spécifique..."
                        className="w-full p-4 bg-white border border-gray-200 rounded-2xl focus:border-teal outline-none transition-all resize-none"
                        rows={3}
                    />
                </div>
            </div>

            <div className="flex gap-4">
                <button onClick={prevStep} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all">Retour</button>
                <button 
                    onClick={handleFinish}
                    disabled={isLoading}
                    className="flex-[2] py-4 bg-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-teal/10"
                >
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                        <>
                            <span>Confirmer la réservation</span>
                            <CheckCircle2 className="w-5 h-5" />
                        </>
                    )}
                </button>
            </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <div className="text-center space-y-8 animate-in zoom-in-95 duration-500">
            <div className="inline-flex p-8 bg-teal/10 rounded-full text-teal mb-4 animate-bounce">
                <CheckCircle2 className="w-20 h-10" />
            </div>
            <div>
                <h2 className="text-4xl font-bold tracking-tight text-dark mb-4">C'est confirmé !</h2>
                <p className="text-lg text-gray-500 max-w-md mx-auto">Votre table est réservée. Vous recevrez un rappel le jour de votre visite.</p>
            </div>
            <div className="pt-8 flex flex-col gap-4">
                <button onClick={() => navigate('/')} className="w-full py-4 bg-dark text-white rounded-2xl font-bold transition-all hover:bg-dark/90 active:scale-[0.98]">Retour à l'accueil</button>
                <button className="w-full py-4 bg-white text-teal border border-teal rounded-2xl font-bold transition-all hover:bg-teal/5">Ajouter au calendrier</button>
            </div>
        </div>
      )}
    </div>
  );
};
