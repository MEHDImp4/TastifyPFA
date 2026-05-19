import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table, PlanText } from '../../types/salle';
import { Loader2, Users, Move, Plus, X, Trash2, Type } from 'lucide-react';
import { toast } from 'sonner';

import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';

export const SallePage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [planTexts, setPlanTexts] = useState<PlanText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const lastUpdate = useSocketStore(state => state.lastUpdate);
  const { role } = useAuthStore();
  const [isEditMode, setIsEditMode] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [draggingItem, setDraggingItem] = useState<{ type: 'table' | 'text', id: number } | null>(null);
  const [selectedTableForEdit, setSelectedTableForEdit] = useState<Table | null>(null);
  const [selectedTextForEdit, setSelectedTextForEdit] = useState<PlanText | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isAddingText, setIsAddingText] = useState(false);
  const [formData, setFormData] = useState({ numero: '', capacite: '' });
  const [textFormData, setTextFormData] = useState({ texte: '' });

  const hasDragged = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const fetchData = async () => {
    try {
      const [tablesRes, textsRes] = await Promise.all([
        salleApi.getTables(),
        salleApi.getPlanTexts().catch(() => ({ data: [] })) // catch in case backend is missing
      ]);
      setTables(tablesRes.data);
      setPlanTexts(textsRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
    if (hasDragged.current) return;
    
    if (isEditMode) {
      setSelectedTableForEdit(table);
      setFormData({ numero: table.numero.toString(), capacite: table.capacite.toString() });
      return;
    }
    navigate(`/ordering/${table.id}`);
  };

  const handleTextClick = (textObj: PlanText) => {
    if (hasDragged.current) return;
    if (isEditMode) {
      setSelectedTextForEdit(textObj);
      setTextFormData({ texte: textObj.texte });
    }
  };

  const handlePointerDownMap = (e: React.PointerEvent) => {
    // Only start panning if clicking the map background (not a table or text)
    if (e.target === mapRef.current || (e.target as HTMLElement).parentElement === mapRef.current) {
      if (!mapContainerRef.current) return;
      isPanning.current = true;
      panStart.current = { 
        x: e.clientX, 
        y: e.clientY, 
        scrollLeft: mapContainerRef.current.scrollLeft, 
        scrollTop: mapContainerRef.current.scrollTop 
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerDown = (e: React.PointerEvent, type: 'table' | 'text', id: number) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setDraggingItem({ type, id });
    startPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPanning.current && mapContainerRef.current) {
        const dx = e.clientX - panStart.current.x;
        const dy = e.clientY - panStart.current.y;
        mapContainerRef.current.scrollLeft = panStart.current.scrollLeft - dx;
        mapContainerRef.current.scrollTop = panStart.current.scrollTop - dy;
        return;
    }

    if (!isEditMode || draggingItem === null || !mapRef.current) return;
    
    const dx = Math.abs(e.clientX - startPos.current.x);
    const dy = Math.abs(e.clientY - startPos.current.y);
    if (dx > 5 || dy > 5) {
        hasDragged.current = true;
    }

    const rect = mapRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    if (draggingItem.type === 'table') {
        setTables(prev => prev.map(t => 
            t.id === draggingItem.id ? { ...t, pos_x: x, pos_y: y } : t
        ));
    } else {
        setPlanTexts(prev => prev.map(t => 
            t.id === draggingItem.id ? { ...t, pos_x: x, pos_y: y } : t
        ));
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (isPanning.current) {
        isPanning.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        return;
    }

    if (!isEditMode || draggingItem === null) return;
    
    if (draggingItem.type === 'table') {
        const table = tables.find(t => t.id === draggingItem.id);
        if (table) {
            try {
                await salleApi.updateTablePos(table.id, { pos_x: table.pos_x, pos_y: table.pos_y });
                toast.success('Position sauvegardée');
            } catch (err) {
                toast.error('Erreur lors de la sauvegarde de la position');
            }
        }
    } else {
        const textObj = planTexts.find(t => t.id === draggingItem.id);
        if (textObj) {
            try {
                await salleApi.updatePlanTextPos(textObj.id, { pos_x: textObj.pos_x, pos_y: textObj.pos_y });
                toast.success('Position texte sauvegardée');
            } catch (err) {
                toast.error('Erreur');
            }
        }
    }
    
    setDraggingItem(null);
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
               <div className="flex items-center gap-3">
                 {isEditMode && (
                     <>
                     <button
                        onClick={() => {
                            setIsAddingTable(true);
                            setFormData({ numero: '', capacite: '' });
                            setSelectedTableForEdit(null);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                     >
                        <Plus className="w-5 h-5" />
                        <span className="font-sans text-sm">Add Table</span>
                     </button>
                     <button
                        onClick={() => {
                            setIsAddingText(true);
                            setTextFormData({ texte: '' });
                            setSelectedTextForEdit(null);
                        }}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 bg-surface-container-high text-on-surface hover:bg-surface-container-highest"
                     >
                        <Type className="w-5 h-5" />
                        <span className="font-sans text-sm">Add Text</span>
                     </button>
                     </>
                 )}
                 <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-bold transition-all duration-300 active:scale-95 ${isEditMode ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white border border-surface-container-high text-on-surface hover:bg-surface-container-low'}`}
                 >
                     <Move className="w-5 h-5" />
                     <span className="font-sans text-sm">{isEditMode ? 'Save Layout' : 'Modify Layout'}</span>
                 </button>
               </div>
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
            ref={mapContainerRef}
            className="flex-1 overflow-auto rounded-[2.5rem] border-2 border-surface-container-high shadow-[0px_40px_80px_rgba(0,0,0,0.03)] relative hide-scrollbar cursor-grab active:cursor-grabbing"
            onPointerDown={handlePointerDownMap}
        >
            <div 
                ref={mapRef}
                className={`min-w-[1200px] min-h-[800px] w-full h-full relative bg-white transition-all duration-500 ${isEditMode ? 'border-primary border-dashed bg-primary/5' : ''}`}
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

                {/* Plan Texts */}
                {planTexts.filter(t => t.est_active).map((textObj) => (
                    <div
                        key={`text-${textObj.id}`}
                        onPointerDown={(e) => handlePointerDown(e, 'text', textObj.id)}
                        onClick={() => handleTextClick(textObj)}
                        style={{
                            left: `${textObj.pos_x || 50}%`,
                            top: `${textObj.pos_y || 50}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        className={`
                            absolute flex flex-col items-center justify-center gap-1 transition-all duration-500 group
                            ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105 touch-none px-4 py-2 border-2 border-dashed border-on-surface-variant/30 rounded-xl bg-white/50 backdrop-blur-sm' : 'pointer-events-none'}
                            ${draggingItem?.type === 'text' && draggingItem.id === textObj.id ? 'z-50 ring-4 ring-primary/20 scale-110 shadow-2xl' : 'z-0'}
                        `}
                    >
                        <span className="text-3xl font-display-accent italic tracking-tighter text-on-surface-variant/50 whitespace-nowrap">{textObj.texte}</span>
                    </div>
                ))}

                {/* Tables */}
                {tables.filter(t => t.est_active).map((table) => (
                    <div
                        key={`table-${table.id}`}
                        onPointerDown={(e) => handlePointerDown(e, 'table', table.id)}
                        onClick={() => handleTableClick(table)}
                        style={{
                            left: `${table.pos_x || 50}%`,
                            top: `${table.pos_y || 50}%`,
                            transform: 'translate(-50%, -50%)',
                        }}
                        className={`
                            absolute w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center justify-center gap-1 rounded-2xl border-2 transition-all duration-500 group
                            ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105 touch-none' : 'cursor-pointer hover:scale-110 active:scale-95'}
                            ${getStatutColor(table.statut)}
                            ${draggingItem?.type === 'table' && draggingItem.id === table.id ? 'z-50 ring-4 ring-primary/20 scale-110 shadow-2xl' : 'z-10 shadow-sm'}
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
            </div>
        </div>
      )}

      {/* Edit/Add Table Modal */}
      {(selectedTableForEdit || isAddingTable) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-on-surface font-display">{selectedTableForEdit ? 'Edit Table' : 'Add New Table'}</h2>
                    <button onClick={() => { setSelectedTableForEdit(null); setIsAddingTable(false); }} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-on-surface-variant mb-2 font-sans uppercase tracking-wider">Table Number</label>
                        <input 
                            type="number" 
                            value={formData.numero}
                            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-sans text-lg font-bold"
                            placeholder="e.g. 12"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-on-surface-variant mb-2 font-sans uppercase tracking-wider">Capacity</label>
                        <input 
                            type="number" 
                            value={formData.capacite}
                            onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-sans text-lg font-bold"
                            placeholder="e.g. 4"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-8">
                    {selectedTableForEdit && (
                        <button
                            onClick={async () => {
                                try {
                                    await salleApi.deleteTable(selectedTableForEdit.id);
                                    toast.success('Table deleted');
                                    fetchData();
                                    setSelectedTableForEdit(null);
                                } catch (err) {
                                    toast.error('Failed to delete table');
                                }
                            }}
                            className="p-3 text-error hover:bg-error/10 rounded-xl transition-colors"
                            title="Delete Table"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    )}
                    <button 
                        onClick={async () => {
                            try {
                                if (selectedTableForEdit) {
                                    await salleApi.updateTable(selectedTableForEdit.id, { 
                                        numero: parseInt(formData.numero), 
                                        capacite: parseInt(formData.capacite) 
                                    });
                                    toast.success('Table updated');
                                } else {
                                    await salleApi.createTable({ 
                                        numero: parseInt(formData.numero), 
                                        capacite: parseInt(formData.capacite),
                                        pos_x: 50,
                                        pos_y: 50,
                                        statut: 'LIBRE',
                                        est_active: true
                                    });
                                    toast.success('Table added');
                                }
                                fetchData();
                                setSelectedTableForEdit(null);
                                setIsAddingTable(false);
                            } catch (err) {
                                toast.error('Failed to save table');
                            }
                        }}
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Edit/Add Text Modal */}
      {(selectedTextForEdit || isAddingText) && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-on-surface font-display">{selectedTextForEdit ? 'Edit Text' : 'Add New Text'}</h2>
                    <button onClick={() => { setSelectedTextForEdit(null); setIsAddingText(false); }} className="p-2 hover:bg-surface-container rounded-full text-on-surface-variant transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-on-surface-variant mb-2 font-sans uppercase tracking-wider">Text Content</label>
                        <input 
                            type="text" 
                            value={textFormData.texte}
                            onChange={(e) => setTextFormData({ ...textFormData, texte: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl bg-surface-container-low border-2 border-transparent focus:border-primary focus:bg-white transition-all outline-none font-sans text-lg font-bold"
                            placeholder="e.g. VIP Lounge"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-8">
                    {selectedTextForEdit && (
                        <button
                            onClick={async () => {
                                try {
                                    await salleApi.deletePlanText(selectedTextForEdit.id);
                                    toast.success('Text deleted');
                                    fetchData();
                                    setSelectedTextForEdit(null);
                                } catch (err) {
                                    toast.error('Failed to delete text');
                                }
                            }}
                            className="p-3 text-error hover:bg-error/10 rounded-xl transition-colors"
                            title="Delete Text"
                        >
                            <Trash2 className="w-6 h-6" />
                        </button>
                    )}
                    <button 
                        onClick={async () => {
                            if (!textFormData.texte) return;
                            try {
                                if (selectedTextForEdit) {
                                    await salleApi.updatePlanText(selectedTextForEdit.id, { 
                                        texte: textFormData.texte
                                    });
                                    toast.success('Text updated');
                                } else {
                                    await salleApi.createPlanText({ 
                                        texte: textFormData.texte,
                                        pos_x: 50,
                                        pos_y: 50,
                                        est_active: true
                                    });
                                    toast.success('Text added');
                                }
                                fetchData();
                                setSelectedTextForEdit(null);
                                setIsAddingText(false);
                            } catch (err) {
                                toast.error('Failed to save text');
                            }
                        }}
                        className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all active:scale-95"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
