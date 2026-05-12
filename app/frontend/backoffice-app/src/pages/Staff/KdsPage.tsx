import React, { useState, useEffect } from 'react';
import { kdsApi } from '../../api/kds';
import { useKdsStore } from '../../store/kdsStore';
import { Loader2, Clock, CheckCircle2, ChefHat, PlayCircle } from 'lucide-react';

export const KdsPage: React.FC = () => {
  const { tickets, setTickets, updateLigneStatut } = useKdsStore();
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      const res = await kdsApi.getActiveTickets();
      // Transform backend response to KDS store format if needed, 
      // but here I'll assume they match for simplicity or transform inline
      const transformed = res.data.map((cmd: any) => ({
        id: cmd.id,
        statut: cmd.statut,
        table_numero: cmd.table_numero,
        type: cmd.type,
        client_nom: cmd.client_nom,
        created_at: cmd.created_at,
        lignes: cmd.lignes.map((l: any) => ({
          id: l.id,
          plat_nom: l.plat_nom || `Plat #${l.plat}`,
          quantite: l.quantite,
          statut: l.statut,
          notes: l.notes,
          heure_lancement: l.heure_lancement
        }))
      }));
      setTickets(transformed);
    } catch (err) {
      console.error('Failed to fetch KDS tickets', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateItem = async (ligneId: number, currentStatut: string) => {
    let nextStatut = '';
    if (currentStatut === 'EN_ATTENTE') nextStatut = 'EN_PREPARATION';
    else if (currentStatut === 'EN_PREPARATION') nextStatut = 'PRET';
    else return;

    try {
      await kdsApi.updateItemStatut(ligneId, nextStatut);
      updateLigneStatut(ligneId, nextStatut);
    } catch (err) {
      console.error('Failed to update item statut', err);
    }
  };

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - start) / 60000);
    return `${diff}m`;
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-teal"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">KDS Cuisine</h1>
          <p className="text-gray-400 mt-1">Gérez la préparation des commandes en temps réel.</p>
        </div>
        <div className="flex items-center gap-4 px-4 py-2 bg-dark-surface rounded-xl border border-white/5">
          <div className="w-2 h-2 rounded-full bg-teal animate-pulse" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="flex flex-col bg-dark-surface rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            {/* Ticket Header */}
            <div className={`p-5 flex items-center justify-between border-b border-white/5 ${ticket.type === 'EMPORTER' ? 'bg-orange/10' : 'bg-teal/10'}`}>
              <div>
                <h3 className="font-bold text-lg">
                    {ticket.type === 'SUR_PLACE' ? `TABLE #${ticket.table_numero || '?'}` : `EMPORTER: ${ticket.client_nom || 'Client'}`}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                    <Clock className="w-3 h-3" />
                    <span>Reçue à {new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <span className="px-3 py-1 bg-dark/50 backdrop-blur-md rounded-full text-[10px] font-bold text-white uppercase tracking-widest border border-white/10">
                #{ticket.id}
              </span>
            </div>

            {/* Items List */}
            <div className="flex-1 p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {ticket.lignes.map((item) => (
                <div key={item.id} className="group relative flex flex-col gap-2 p-4 bg-dark/40 rounded-2xl border border-white/5 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-white leading-none">x{item.quantite}</span>
                        <span className={`text-lg font-bold ${item.statut === 'PRET' ? 'text-gray-500 line-through' : 'text-white'}`}>
                          {item.plat_nom}
                        </span>
                      </div>
                      {item.notes && (
                        <p className="mt-1 text-xs text-orange font-medium bg-orange/5 px-2 py-1 rounded-lg italic">
                          "{item.notes}"
                        </p>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                      <span className={`
                        px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider
                        ${item.statut === 'EN_ATTENTE' ? 'bg-gray-800 text-gray-400' : 
                          item.statut === 'EN_PREPARATION' ? 'bg-teal/20 text-teal' : 
                          'bg-gray-500/20 text-gray-500'}
                      `}>
                        {item.statut.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  {item.statut !== 'PRET' && item.statut !== 'SERVI' && item.statut !== 'ANNULE' && (
                    <button 
                      onClick={() => handleUpdateItem(item.id, item.statut)}
                      className={`
                        w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all mt-2
                        ${item.statut === 'EN_ATTENTE' ? 'bg-white text-dark hover:scale-[0.98]' : 'bg-teal text-white hover:brightness-110 active:scale-95 shadow-lg shadow-teal/20'}
                      `}
                    >
                      {item.statut === 'EN_ATTENTE' ? (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          <span>Démarrer</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Prêt</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Ticket Footer */}
            <div className="p-4 bg-dark/20 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Depuis {getElapsedTime(ticket.created_at)}</span>
                </div>
                {ticket.lignes.every(l => l.statut === 'PRET') && (
                    <div className="flex items-center gap-1 text-teal text-xs font-bold uppercase tracking-widest animate-pulse">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Complet</span>
                    </div>
                )}
            </div>
          </div>
        ))}
        
        {tickets.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 opacity-30">
            <div className="p-12 bg-dark rounded-full border-2 border-dashed border-white/10 mb-6">
                <ChefHat className="w-16 h-16" />
            </div>
            <p className="text-xl font-medium">Cuisine calme. Aucune commande en cours.</p>
          </div>
        )}
      </div>
    </div>
  );
};
