import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table } from '../../types/salle';
import { Loader2, Users, Move, Map as MapIcon } from 'lucide-react';
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
      case 'LIBRE': return 'bg-white text-on-surface border-surface-container-high hover:border-primary/50';
      case 'OCCUPEE': return 'bg-primary text-white border-primary/20 shadow-lg shadow-primary/20';
      case 'RESERVEE': return 'bg-secondary text-white border-secondary/20';
      case 'ENCAISSEMENT': return 'bg-error text-white border-error/20 shadow-lg shadow-error/20';
      default: return 'bg-surface-container text-on-surface-variant border-surface-container-high';
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
    <div className="max-w-[1600px] mx-auto h-[calc(100dvh-10rem)] flex flex-col animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface font-sans">Architectural Floor Plan</h1>
          <p className="text-on-surface-variant mt-1.5 font-sans font-medium">Real-time occupancy visualization and table management.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
           {role === 'GERANT' && (
               <button 
                onClick={() => setIsEditMode(!isEditMode)}
                className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 ${isEditMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-surface-container-high text-on-surface hover:bg-surface-container-low'}`}
               >
                   <Move className="w-5 h-5" />
                   <span className="font-sans text-sm">{isEditMode ? 'Save Layout' : 'Modify Layout'}</span>
               </button>
           )}
           <div className="flex items-center gap-6 px-8 py-4 glass rounded-2xl border border-surface-container-high shadow-sm">
             <div className="flex items-center gap-2.5">
               <div className="w-2.5 h-2.5 rounded-full border border-surface-container-highest bg-white" />
               <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans">Available</span>
             </div>
             <div className="flex items-center gap-2.5">
               <div className="w-2.5 h-2.5 rounded-full bg-primary" />
               <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans">Occupied</span>
             </div>
             <div className="flex items-center gap-2.5">
               <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
               <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans">Reserved</span>
             </div>
             <div className="flex items-center gap-2.5">
               <div className="w-2.5 h-2.5 rounded-full bg-error" />
               <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest font-sans">Payment</span>
             </div>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-primary">
          <Loader2 className="w-12 h-12 animate-spin" />
        </div>
      ) : (
        <div 
            ref={mapRef}
            className={`flex-1 relative bg-white rounded-[2.5rem] border-2 transition-all duration-500 overflow-hidden ${isEditMode ? 'border-primary border-dashed bg-primary/5' : 'border-surface-container-high shadow-[0px_40px_80px_rgba(0,0,0,0.03)]'}`}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Grid background for editing mode */}
            {isEditMode ? (
                <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0040e0 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            ) : (
                <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(#0040e0 1px, transparent 1px), linear-gradient(90deg, #0040e0 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
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
                        absolute w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all duration-500 group
                        ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105' : 'cursor-pointer hover:scale-110 active:scale-95'}
                        ${getStatutColor(table.statut)}
                        ${draggingTable === table.id ? 'z-50 ring-4 ring-primary/20 scale-110 shadow-2xl' : 'z-10 shadow-sm'}
                    `}
                >
                    <div className="text-2xl sm:text-3xl font-bold font-sans tracking-tighter leading-none">{table.numero}</div>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest ${table.statut === 'LIBRE' ? 'bg-surface-container text-on-surface-variant' : 'bg-black/10 text-white'}`}>
                        <Users className="w-2.5 h-2.5" />
                        <span className="font-sans">{table.capacite}</span>
                    </div>
                    
                    {table.statut === 'ENCAISSEMENT' && !isEditMode && (
                        <div className="absolute -top-2 -right-2">
                            <span className="relative flex h-5 w-5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-5 w-5 bg-error border-2 border-white"></span>
                            </span>
                        </div>
                    )}

                    {/* Architectural Bezel Effect */}
                    <div className="absolute inset-1 border border-white/10 rounded-xl pointer-events-none" />
                </div>
            ))}

            {/* Room Labels or Decorative Elements */}
            <div className="absolute bottom-10 left-10 pointer-events-none opacity-20">
                <div className="flex items-center gap-3 text-on-surface-variant">
                    <MapIcon className="w-8 h-8" />
                    <span className="text-3xl font-display-accent italic tracking-tighter">Main Dining Hall</span>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
