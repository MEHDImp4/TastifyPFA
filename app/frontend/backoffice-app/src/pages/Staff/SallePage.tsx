import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table, PlanText } from '../../types/salle';
import { Loader2, Users, Move, Plus, X, Trash2, Type, Filter, Map } from 'lucide-react';
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
        salleApi.getPlanTexts().catch(() => ({ data: [] }))
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
      case 'LIBRE': return 'bg-transparent text-on-surface border-on-surface hover:bg-surface-container-low';
      case 'OCCUPEE': return 'bg-secondary text-on-secondary border-on-surface shadow-[4px_4px_0px_#301400]';
      case 'RESERVEE': return 'bg-secondary-container text-on-secondary-fixed border-on-surface shadow-[4px_4px_0px_#301400]';
      case 'ENCAISSEMENT': return 'bg-surface-dim text-on-surface-variant border-on-surface shadow-[4px_4px_0px_#301400]'; // Used as 'Dirty/Payment'
      default: return 'bg-transparent text-on-surface border-on-surface hover:bg-surface-container-low';
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
                toast.success('Position saved');
            } catch (err) {
                toast.error('Save failed');
            }
        }
    } else {
        const textObj = planTexts.find(t => t.id === draggingItem.id);
        if (textObj) {
            try {
                await salleApi.updatePlanTextPos(textObj.id, { pos_x: textObj.pos_x, pos_y: textObj.pos_y });
                toast.success('Label saved');
            } catch (err) {
                toast.error('Save failed');
            }
        }
    }
    
    setDraggingItem(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden selection:bg-primary/10 selection:text-primary">
      {/* Tactical Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between mb-6 shrink-0 gap-4">
        <div>
          <h2 className="text-display-lg text-4xl text-primary leading-none uppercase tracking-tight">Main Salle</h2>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-on-surface bg-transparent"></div>
              <span className="text-ui-label-bold text-[10px] uppercase text-on-surface-variant">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary border-2 border-on-surface"></div>
              <span className="text-ui-label-bold text-[10px] uppercase text-on-surface-variant">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary-container border-2 border-on-surface"></div>
              <span className="text-ui-label-bold text-[10px] uppercase text-on-surface-variant">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-surface-dim border-2 border-on-surface"></div>
              <span className="text-ui-label-bold text-[10px] uppercase text-on-surface-variant">Dirty / Pay</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 items-center">
            {role === 'GERANT' && isEditMode && (
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setIsAddingTable(true); setFormData({ numero: '', capacite: '' }); setSelectedTableForEdit(null); }}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-on-surface bg-surface-container text-on-surface font-ui-button text-ui-button transition-all hover:bg-surface-container-highest active:translate-y-[2px]"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5}/> Add Unit
                    </button>
                    <button
                        onClick={() => { setIsAddingText(true); setTextFormData({ texte: '' }); setSelectedTextForEdit(null); }}
                        className="flex items-center gap-2 px-4 py-2 border-2 border-on-surface bg-surface-container text-on-surface font-ui-button text-ui-button transition-all hover:bg-surface-container-highest active:translate-y-[2px]"
                    >
                        <Type className="w-4 h-4" strokeWidth={2.5}/> Add Label
                    </button>
                </div>
            )}
            {role === 'GERANT' && (
                <button 
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-on-surface font-ui-button text-ui-button transition-all active:translate-y-[2px] ${isEditMode ? 'bg-primary text-on-primary shadow-[4px_4px_0px_#301400]' : 'bg-background text-on-surface hover:bg-surface-container'}`}
                >
                    <Move className="w-4 h-4" strokeWidth={2.5}/>
                    {isEditMode ? 'Save Layout' : 'Edit Layout'}
                </button>
            )}
            
            <div className="flex items-center bg-surface-container rounded-lg p-1 border border-on-surface/10">
                <button className="px-4 py-1.5 bg-background rounded shadow-sm text-on-surface font-ui-label-bold text-[10px] tracking-widest uppercase border border-on-surface/10">2D Map</button>
                <button className="px-4 py-1.5 text-on-surface-variant font-ui-label-bold text-[10px] opacity-60 tracking-widest uppercase hover:opacity-100">Timeline</button>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2 border-2 border-on-surface rounded-lg bg-background hover:bg-surface-container transition-colors">
                <Filter className="w-4 h-4 text-primary" strokeWidth={2.5} />
                <span className="font-ui-label-bold text-ui-label-bold">Filters</span>
            </button>
        </div>
      </header>

      {/* Map Canvas */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-primary">
          <Loader2 className="w-8 h-8 animate-spin" strokeWidth={2.5}/>
        </div>
      ) : (
        <div 
            ref={mapContainerRef}
            className="flex-1 border-2 border-on-surface rounded-xl overflow-hidden bg-background relative cursor-grab active:cursor-grabbing shadow-[6px_6px_0px_#301400] mb-4"
            onPointerDown={handlePointerDownMap}
            style={{ backgroundImage: 'radial-gradient(#d8c2b6 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        >
            <div 
                ref={mapRef}
                className={`min-w-[1200px] min-h-[800px] w-full h-full relative transition-colors duration-500 ${isEditMode ? 'bg-primary/5' : ''}`}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
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
                            absolute flex flex-col items-center justify-center transition-all duration-150 group
                            ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105 touch-none px-4 py-2 border-2 border-dashed border-on-surface bg-background' : 'pointer-events-none opacity-20 border-l-4 border-primary pl-4'}
                            ${draggingItem?.type === 'text' && draggingItem.id === textObj.id ? 'z-50 shadow-[4px_4px_0px_#301400]' : 'z-0'}
                        `}
                    >
                        <span className="text-display-lg text-4xl text-on-surface select-none leading-none">{textObj.texte}</span>
                    </div>
                ))}

                {/* Tables */}
                {tables.filter(t => t.est_active).map((table) => {
                    const isBooth = table.capacite >= 6; // Example logic for different shapes
                    const isRound = table.statut === 'ENCAISSEMENT'; // Dirty state
                    
                    return (
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
                            absolute flex flex-col items-center justify-center border-2 transition-all duration-300 group
                            ${isEditMode ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-pointer hover:-translate-y-1'}
                            ${getStatutColor(table.statut)}
                            ${draggingItem?.type === 'table' && draggingItem.id === table.id ? 'z-50 ring-4 ring-primary/20 scale-105' : 'z-10'}
                            ${isBooth ? 'w-40 h-24' : isRound ? 'w-20 h-20 rounded-full' : 'w-24 h-24'}
                        `}
                    >
                        {/* Status specific icons/indicators */}
                        {table.statut === 'ENCAISSEMENT' && !isEditMode ? (
                            <>
                                <span className="absolute -top-4 font-ui-data-dense text-[12px] bg-on-surface text-background px-2 py-0.5 rounded border border-on-surface/10">{table.numero}</span>
                                <Loader2 className="w-8 h-8 animate-spin opacity-50" />
                            </>
                        ) : table.statut === 'OCCUPEE' && !isEditMode && table.numero % 3 === 0 ? ( // Simulate a warning state
                            <>
                                <span className="font-ui-label-bold text-lg leading-none">{table.numero}</span>
                                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-error font-black animate-pulse">!</span>
                            </>
                        ) : (
                            <>
                                <span className={`font-ui-label-bold text-lg leading-none ${isBooth ? 'text-2xl' : ''}`}>{table.numero}</span>
                                {isEditMode && (
                                    <div className="flex items-center gap-1 mt-1 opacity-50">
                                        <Users className="w-3 h-3" strokeWidth={2.5}/>
                                        <span className="text-[10px] font-black">{table.capacite}</span>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Abstract Chair Indicators (only visible on regular tables, not booths or round) */}
                        {!isBooth && !isRound && (
                            <>
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-2 bg-on-surface"></div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2 bg-on-surface"></div>
                                {table.capacite > 2 && (
                                    <>
                                        <div className="absolute top-1/2 -left-3 -translate-y-1/2 w-2 h-8 bg-on-surface"></div>
                                        <div className="absolute top-1/2 -right-3 -translate-y-1/2 w-2 h-8 bg-on-surface"></div>
                                    </>
                                )}
                            </>
                        )}
                        {isBooth && (
                            <>
                                <div className="absolute -top-3 left-4 w-8 h-2 border border-on-surface"></div>
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-2 border border-on-surface"></div>
                                <div className="absolute -top-3 right-4 w-8 h-2 border border-on-surface"></div>
                                <div className="absolute -bottom-3 left-4 w-8 h-2 border border-on-surface"></div>
                                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-2 border border-on-surface"></div>
                                <div className="absolute -bottom-3 right-4 w-8 h-2 border border-on-surface"></div>
                            </>
                        )}
                    </div>
                )})}
            </div>
        </div>
      )}

      {/* Edit/Add Modals remain the same, just styled darker */}
      {(selectedTableForEdit || isAddingTable) && (
        <div className="fixed inset-0 bg-[#301400]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-background border-2 border-on-surface p-8 max-w-md w-full shadow-[8px_8px_0px_#301400] animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-ui-label-bold text-[14px] text-on-surface tracking-widest">{selectedTableForEdit ? 'EDIT TABLE UNIT' : 'ADD NEW TABLE UNIT'}</h2>
                    <button onClick={() => { setSelectedTableForEdit(null); setIsAddingTable(false); }} className="p-2 border-2 border-transparent hover:border-on-surface transition-all">
                        <X className="w-5 h-5 text-on-surface" strokeWidth={2.5}/>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">TABLE IDENTIFIER</label>
                        <input 
                            type="number" 
                            value={formData.numero}
                            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-container border-2 border-on-surface text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all"
                            placeholder="e.g. 12"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">COVER CAPACITY</label>
                        <input 
                            type="number" 
                            value={formData.capacite}
                            onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-container border-2 border-on-surface text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all"
                            placeholder="e.g. 4"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-10">
                    {selectedTableForEdit && (
                        <button
                            onClick={async () => {
                                try {
                                    await salleApi.deleteTable(selectedTableForEdit.id);
                                    toast.success('UNIT DELETED');
                                    fetchData();
                                    setSelectedTableForEdit(null);
                                } catch (err) {
                                    toast.error('FAILED TO DELETE');
                                }
                            }}
                            className="p-3 text-error border-2 border-transparent hover:border-error transition-all"
                        >
                            <Trash2 className="w-5 h-5" strokeWidth={2.5}/>
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
                                    toast.success('UNIT UPDATED');
                                } else {
                                    await salleApi.createTable({ 
                                        numero: parseInt(formData.numero), 
                                        capacite: parseInt(formData.capacite),
                                        pos_x: 50,
                                        pos_y: 50,
                                        statut: 'LIBRE',
                                        est_active: true
                                    });
                                    toast.success('UNIT ADDED');
                                }
                                fetchData();
                                setSelectedTableForEdit(null);
                                setIsAddingTable(false);
                            } catch (err) {
                                toast.error('SAVE FAILED');
                            }
                        }}
                        className="flex-1 py-4 bg-primary text-on-primary border-2 border-on-surface text-[11px] font-black uppercase tracking-[0.3em] shadow-[4px_4px_0px_#301400] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] transition-all active:translate-y-[2px] active:shadow-none"
                    >
                        COMMIT CHANGES
                    </button>
                </div>
            </div>
        </div>
      )}

      {(selectedTextForEdit || isAddingText) && (
        <div className="fixed inset-0 bg-[#301400]/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-background border-2 border-on-surface p-8 max-w-md w-full shadow-[8px_8px_0px_#301400] animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-ui-label-bold text-[14px] text-on-surface tracking-widest">{selectedTextForEdit ? 'EDIT PLAN LABEL' : 'ADD NEW PLAN LABEL'}</h2>
                    <button onClick={() => { setSelectedTextForEdit(null); setIsAddingText(false); }} className="p-2 border-2 border-transparent hover:border-on-surface transition-all">
                        <X className="w-5 h-5 text-on-surface" strokeWidth={2.5}/>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant">LABEL CONTENT</label>
                        <input 
                            type="text" 
                            value={textFormData.texte}
                            onChange={(e) => setTextFormData({ ...textFormData, texte: e.target.value })}
                            className="w-full px-4 py-3 bg-surface-container border-2 border-on-surface text-ui-data-dense font-black focus:shadow-[4px_4px_0px_#301400] outline-none transition-all uppercase"
                            placeholder="e.g. VIP LOUNGE"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 mt-10">
                    {selectedTextForEdit && (
                        <button
                            onClick={async () => {
                                try {
                                    await salleApi.deletePlanText(selectedTextForEdit.id);
                                    toast.success('LABEL DELETED');
                                    fetchData();
                                    setSelectedTextForEdit(null);
                                } catch (err) {
                                    toast.error('FAILED TO DELETE');
                                }
                            }}
                            className="p-3 text-error border-2 border-transparent hover:border-error transition-all"
                        >
                            <Trash2 className="w-5 h-5" strokeWidth={2.5}/>
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
                                    toast.success('LABEL UPDATED');
                                } else {
                                    await salleApi.createPlanText({ 
                                        texte: textFormData.texte,
                                        pos_x: 50,
                                        pos_y: 50,
                                        est_active: true
                                    });
                                    toast.success('LABEL ADDED');
                                }
                                fetchData();
                                setSelectedTextForEdit(null);
                                setIsAddingText(false);
                            } catch (err) {
                                toast.error('SAVE FAILED');
                            }
                        }}
                        className="flex-1 py-4 bg-primary text-on-primary border-2 border-on-surface text-[11px] font-black uppercase tracking-[0.3em] shadow-[4px_4px_0px_#301400] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] transition-all active:translate-y-[2px] active:shadow-none"
                    >
                        COMMIT CHANGES
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
