import React, { useState, useEffect } from 'react';
import { reservationApi, Reservation } from '../../api/reservations';
import { avisApi, Avis } from '../../api/avis';
import { 
  Calendar, 
  MessageSquare, 
  Star, 
  Loader2, 
  ChevronRight,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { Modal } from '../../components/auth/AuthBootstrap'; // Reusing for now or create a UI one

export const AccountPage: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Feedback form
  const [isAvisModalOpen, setIsAvisModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [resRes, avisRes] = await Promise.all([
        reservationApi.getMyReservations(),
        avisApi.getAvis()
      ]);
      setReservations(resRes.data);
      setAvis(avisRes.data);
    } catch (err) {
      console.error('Failed to fetch account data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmitAvis = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await avisApi.createAvis({ note: rating, commentaire: comment });
        setIsAvisModalOpen(false);
        setComment('');
        fetchData();
    } catch (err) {
        console.error(err);
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="flex-1 flex items-center justify-center py-24"><Loader2 className="w-12 h-12 animate-spin text-teal" /></div>;

  return (
    <div className="flex-1 max-w-7xl mx-auto px-6 py-12 md:py-20 w-full animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row gap-12">
            {/* Sidebar info */}
            <aside className="md:w-80 shrink-0">
                <div className="p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm text-center">
                    <div className="w-20 h-20 bg-teal/10 rounded-3xl flex items-center justify-center text-teal mx-auto mb-6">
                        <UserIcon className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-dark mb-2">Mon Compte</h2>
                    <p className="text-gray-500 text-sm mb-8">Membre depuis {new Date().getFullYear()}</p>
                    
                    <button 
                        onClick={() => setIsAvisModalOpen(true)}
                        className="w-full py-3 bg-dark text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-105 active:scale-95"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Laisser un avis
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 space-y-12">
                {/* Reservations Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <Calendar className="w-6 h-6 text-teal" />
                            Mes Réservations
                        </h3>
                    </div>
                    
                    <div className="space-y-4">
                        {reservations.length === 0 ? (
                            <div className="p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center text-gray-400">
                                <p>Vous n'avez aucune réservation pour le moment.</p>
                            </div>
                        ) : (
                            reservations.map(res => (
                                <div key={res.id} className="p-6 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-teal/30 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="hidden sm:flex flex-col items-center justify-center w-16 h-16 bg-gray-50 rounded-2xl text-dark">
                                            <span className="text-[10px] uppercase font-bold text-gray-400 leading-none mb-1">
                                                {new Date(res.date_reservation).toLocaleDateString('fr-FR', { month: 'short' })}
                                            </span>
                                            <span className="text-xl font-bold leading-none">
                                                {new Date(res.date_reservation).getDate()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-lg text-dark">Table #{res.table}</p>
                                            <p className="text-sm text-gray-500 font-medium">
                                                {res.heure_debut} - {res.heure_fin} • {res.nombre_personnes} personnes
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`
                                        px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest
                                        ${res.statut === 'CONFIRMEE' ? 'bg-teal/10 text-teal' : 'bg-gray-100 text-gray-500'}
                                    `}>
                                        {res.statut}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Avis Section */}
                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                            <Star className="w-6 h-6 text-orange" />
                            Mes Avis
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {avis.map(a => (
                            <div key={a.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                <div className="flex gap-1 mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < a.note ? 'text-amber fill-current' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                                <p className="text-dark text-sm leading-relaxed italic">"{a.commentaire}"</p>
                                {a.sentiment_score !== undefined && (
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${a.sentiment_score > 0 ? 'bg-teal' : a.sentiment_score < 0 ? 'bg-terracotta' : 'bg-gray-300'}`} />
                                        <span className="text-[10px] font-bold uppercase tracking-tighter text-gray-400">Analyse IA complétée</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>

        {/* Feedback Modal */}
        {isAvisModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAvisModalOpen(false)} />
                <div className="relative w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-8 animate-in zoom-in-95 duration-200">
                    <h3 className="text-2xl font-bold text-dark mb-2">Votre avis compte</h3>
                    <p className="text-gray-500 text-sm mb-8">Comment s'est passée votre expérience chez Tastify ?</p>
                    
                    <form onSubmit={handleSubmitAvis} className="space-y-6">
                        <div className="flex flex-col items-center gap-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Note globale</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button 
                                        key={s} 
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className={`p-1.5 transition-transform hover:scale-125 ${rating >= s ? 'text-amber scale-110' : 'text-gray-200'}`}
                                    >
                                        <Star className={`w-8 h-8 ${rating >= s ? 'fill-current' : ''}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Commentaire</label>
                            <textarea 
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                                rows={4}
                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:border-teal outline-none transition-all resize-none text-sm"
                                placeholder="Dites-nous ce que vous avez aimé..."
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4 bg-teal text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[0.98] active:scale-95 disabled:opacity-50 shadow-xl shadow-teal/10"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Publier mon avis'}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
