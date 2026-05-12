import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table } from '../../types/salle';
import { Loader2, Users, Move } from 'lucide-react';
import { toast } from 'sonner';

import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';

export const SallePage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const lastUpdate = useSocketStore(state => state.lastUpdate);
  const { role } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [draggingTable, setDraggingTable] = useState<number | null>(null);

  const fetchTables = async () => {
    try {
      const res = await salleApi.getTables();
      setTables(res.data);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [lastUpdate]);

  const getStatutColor = (statut: Table['statut']) => {
    switch (statut) {
      case 'LIBRE': return 'bg-teal text-white border-teal/20';
      case 'OCCUPEE': return 'bg-orange text-white border-orange/20';
      case 'RESERVEE': return 'bg-amber text-dark border-amber/20';
      case 'ENCAISSEMENT': return 'bg-terracotta text-white border-terracotta/20 shadow-[0_0_20px_rgba(231,111,81,0.5)]';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleTableClick = (table: Table) => {
    if (isEditMode) return;
    navigate(`/ordering/${table.id}`);
  };

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggingTable(id);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isEditMode || draggingTable === null || !mapRef.current) return;
    const rect = mapRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    setTables(prev => prev.map(t => 
        t.id === draggingTable ? { ...t, pos_x: x, pos_y: y } : t
    ));
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!isEditMode || draggingTable === null) return;
    const table = tables.find(t => t.id === draggingTable);
    if (table) {
        try {
            await salleApi.updateTablePos(table.id, { pos_x: table.pos_x, pos_y: table.pos_y });
            toast.success('Position sauvegardée');
        } catch (err) {
            toast.error('Erreur lors de la sauvegarde de la position');
        }
    }
    setDraggingTable(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100dvh-8rem)] flex flex-col animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan de Salle</h1>
          <p className="text-gray-400 mt-1">Visualisez et gérez l'état de vos tables.</p>
        </div>
        <div className="flex gap-4">
           {role === 'GERANT' && (
               <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${isEditMode ? 'bg-amber text-dark' : 'bg-dark-surface border border-white/10 text-white hover:border-white/30'}`}
               >
                   <Move className="w-5 h-5" />
                   <span>{isEditMode ? 'Quitter Édition' : 'Éditer Plan'}</span>
               </button>
           )}
           <div className="hidden md:flex items-center gap-6 px-6 py-3 bg-dark-surface rounded-2xl border border-white/5 shadow-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-teal" />
               <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Libre</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-orange" />
               <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Occupée</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-amber" />
               <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Réservée</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-terracotta" />
               <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Paiement</span>
             </div>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div 
            ref={mapRef}
            className={`flex-1 relative bg-dark-surface rounded-[2.5rem] border overflow-hidden ${isEditMode ? 'border-amber border-dashed bg-amber/5' : 'border-white/5 shadow-2xl shadow-teal/5'}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Grid background for editing mode */}
            {isEditMode && (
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            )}

            {tables.filter(t => t.est_active).map((table) => (
                <div
                    key={table.id}
                    onPointerDown={(e) => handlePointerDown(e, table.id)}
                    onClick={() => handleTableClick(table)}
                    style={{
                        left: `${table.pos_x || 50}%`,
                        top: `${table.pos_y || 50}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                    className={`
                        absolute w-24 h-24 sm:w-28 sm:h-28 flex flex-col items-center justify-center gap-1.5 rounded-[1.5rem] sm:rounded-[2rem] border-2 transition-all duration-300
                        ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-pointer hover:scale-110 active:scale-95'}
                        ${getStatutColor(table.statut)}
                        ${draggingTable === table.id ? 'z-50 shadow-2xl scale-110' : 'z-10 shadow-lg'}
                    `}
                >
                    <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tighter">#{table.numero}</div>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-black/10 rounded-full text-[10px] font-bold uppercase tracking-widest">
                        <Users className="w-3 h-3" />
                        <span>{table.capacite}</span>
                    </div>
                    
                    {table.statut === 'ENCAISSEMENT' && !isEditMode && (
                        <div className="absolute -top-2 -right-2">
                            <span className="relative flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
                            </span>
                        </div>
                    )}
                </div>
            ))}
        </div>
      )}
    </div>
  );
};
