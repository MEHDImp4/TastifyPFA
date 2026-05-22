import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table, PlanText } from '../../types/salle';
import { Loader2, Users, Move, Plus, X, Trash2, Type, Save } from 'lucide-react';
import { motion } from 'framer-motion';
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

  const getStatutStyles = (statut: Table['statut']) => {
    switch (statut) {
      case 'LIBRE': return 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low';
      case 'OCCUPEE': return 'bg-amber border-amber text-aged-paper font-black';
      case 'RESERVEE': return 'bg-aged-paper border-aged-paper text-ink font-black';
      case 'ENCAISSEMENT': return 'bg-surface border-error text-error animate-pulse-error font-black';
      default: return 'border-outline-variant bg-surface-container-lowest text-on-surface-variant';
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
    <div className="h-full flex flex-col bg-surface-container-lowest -m-4 overflow-hidden selection:bg-primary/20 selection:text-primary font-body">
      <h1 className="sr-only">Architectural Floor Plan</h1>
      {/* Legend & Toolbar */}
      <div className="flex items-center justify-between px-staff-margin py-3 border-b border-outline-variant bg-surface-main z-10">
        {/* Legend */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-outline-variant bg-surface-container-lowest rounded-sm"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-amber border border-amber rounded-sm"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-aged-paper border border-aged-paper rounded-sm"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">Reserved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3.5 h-3.5 bg-surface border-2 border-error rounded-sm animate-pulse"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">Check Req</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {role === 'GERANT' && isEditMode && (
            <>
              <button
                onClick={() => { setIsAddingTable(true); setFormData({ numero: '', capacite: '' }); setSelectedTableForEdit(null); }}
                className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface font-sans text-xs font-bold rounded hover:bg-surface-variant transition-colors flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Add Unit
              </button>
              <button
                onClick={() => { setIsAddingText(true); setTextFormData({ texte: '' }); setSelectedTextForEdit(null); }}
                className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface font-sans text-xs font-bold rounded hover:bg-surface-variant transition-colors flex items-center gap-2"
              >
                <Type className="w-3.5 h-3.5" /> Label
              </button>
            </>
          )}
          {role === 'GERANT' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-4 py-2 rounded font-sans text-xs font-bold flex items-center gap-2 transition-all ${isEditMode ? 'bg-primary text-on-primary border border-primary' : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-variant'}`}
            >
              {isEditMode ? <><Save className="w-3.5 h-3.5" /> Save Layout</> : <><Move className="w-3.5 h-3.5" /> Edit Layout</>}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Area */}
      <div className="flex-1 overflow-hidden p-staff-margin pb-0 bg-surface-main">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary">
            <Loader2 className="w-10 h-10 animate-spin" strokeWidth={2.5}/>
          </div>
        ) : (
          <div 
              ref={mapContainerRef}
              className="h-full w-full border border-outline-variant bg-[#15110e] relative blueprint-grid overflow-auto custom-scrollbar"
              onPointerDown={handlePointerDownMap}
          >
              <div 
                  ref={mapRef}
                  className={`min-w-[1500px] min-h-[1000px] w-full h-full relative transition-colors duration-500 ${isEditMode ? 'bg-primary/5 cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
              >
                  {/* Zone Label Placeholder */}
                  <div className="absolute top-8 left-8 font-serif text-3xl text-outline-variant/20 font-black uppercase tracking-[0.3em] select-none pointer-events-none">
                      Main Dining Area
                  </div>

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
                              absolute flex items-center justify-center transition-all duration-150
                              ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-105 touch-none px-4 py-2 border border-dashed border-primary bg-background/50' : 'pointer-events-none'}
                              ${draggingItem?.type === 'text' && draggingItem.id === textObj.id ? 'z-50 border-primary-container bg-surface-container shadow-2xl' : 'z-0'}
                          `}
                      >
                          <span className="font-serif text-2xl text-on-surface-variant select-none tracking-widest opacity-60 uppercase">{textObj.texte}</span>
                      </div>
                  ))}

                  {/* Tables */}
                  {tables.filter(t => t.est_active).map((table) => {
                      const isBooth = table.capacite >= 6;
                      const isRound = table.statut === 'ENCAISSEMENT';
                      
                      return (
                      <div
                          key={`table-${table.id}`}
                          onPointerDown={(e) => handlePointerDown(e, 'table', table.id)}
                          onClick={() => handleTableClick(table)}
                          aria-label={`Table ${table.numero}`}
                          style={{
                              left: `${table.pos_x || 50}%`,
                              top: `${table.pos_y || 50}%`,
                              transform: 'translate(-50%, -50%)',
                          }}
                          className={`
                              absolute flex flex-col items-center justify-center border-2 transition-all duration-300
                              ${isEditMode ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-pointer hover:scale-105'}
                              ${getStatutStyles(table.statut)}
                              ${draggingItem?.type === 'table' && draggingItem.id === table.id ? 'z-50 ring-4 ring-primary/30 scale-110' : 'z-10'}
                              ${isBooth ? 'w-36 h-20 rounded' : isRound ? 'w-20 h-20 rounded-full' : 'w-24 h-24 rounded-lg'}
                          `}
                      >
                          <span className={`font-sans text-lg font-black tracking-tighter ${isBooth ? 'text-2xl' : ''}`}>
                             <span className="sr-only">Table </span>{table.numero}
                          </span>
                          {isEditMode && (
                              <div className="flex items-center gap-1 mt-0.5 opacity-60">
                                  <Users className="w-3 h-3" />
                                  <span className="font-sans text-[10px] font-black">{table.capacite}</span>
                              </div>
                          )}
                          
                          {/* Structural rim lighting for absolute visibility */}
                          <div className="absolute inset-0 rounded-[inherit] border border-white/5 pointer-events-none"></div>
                      </div>
                  )})}
              </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {(selectedTableForEdit || isAddingTable) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container border border-outline-variant p-8 max-w-sm w-full rounded-xl shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-sans text-xs font-black uppercase tracking-[0.2em] text-on-surface">Unit Configuration</h2>
                    <button onClick={() => { setSelectedTableForEdit(null); setIsAddingTable(false); }} className="p-1 hover:bg-surface-container-high rounded transition-colors text-on-surface-variant">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">TABLE IDENTIFIER</label>
                        <input 
                            type="number" 
                            value={formData.numero}
                            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                            className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">CAPACITY (COVERS)</label>
                        <input 
                            type="number" 
                            value={formData.capacite}
                            onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                            className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all"
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
                            className="h-12 w-12 flex items-center justify-center text-error border border-error/20 hover:bg-error/5 rounded transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
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
                        className="flex-1 h-12 bg-primary text-on-primary font-sans text-[11px] font-black uppercase tracking-[0.2em] rounded shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Save Configuration
                    </button>
                </div>
            </motion.div>
        </div>
      )}

      {(selectedTextForEdit || isAddingText) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-surface-container border border-outline-variant p-8 max-w-sm w-full rounded-xl shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="font-sans text-xs font-black uppercase tracking-[0.2em] text-on-surface">Label Editor</h2>
                    <button onClick={() => { setSelectedTextForEdit(null); setIsAddingText(false); }} className="p-1 hover:bg-surface-container-high rounded transition-colors text-on-surface-variant">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.1em] text-on-surface-variant">TEXT CONTENT</label>
                        <input 
                            type="text" 
                            value={textFormData.texte}
                            onChange={(e) => setTextFormData({ ...textFormData, texte: e.target.value })}
                            className="w-full h-12 px-4 bg-surface-container-low border border-outline-variant rounded font-sans font-bold text-on-surface focus:border-primary outline-none transition-all uppercase"
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
                            className="h-12 w-12 flex items-center justify-center text-error border border-error/20 hover:bg-error/5 rounded transition-all"
                        >
                            <Trash2 className="w-5 h-5" />
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
                        className="flex-1 h-12 bg-primary text-on-primary font-sans text-[11px] font-black uppercase tracking-[0.2em] rounded shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        Commit Label
                    </button>
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
};

