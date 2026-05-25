import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table, PlanText } from '../../types/salle';
import { Loader2, Users, Move, Plus, X, Trash2, Type, Save, DollarSign } from 'lucide-react';
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

  const getStatutStyles = (statut: Table['statut'], isDragging: boolean) => {
    if (isDragging) return 'border-primary bg-primary/20 scale-110 z-50 ring-4 ring-primary/30';
    
    switch (statut) {
      case 'LIBRE': 
        return 'border-outline-variant bg-surface-container-lowest/40 text-on-surface-variant hover:border-primary/50 hover:bg-surface-container-low transition-all';
      case 'OCCUPEE': 
        return 'bg-primary border-primary text-on-primary font-black shadow-lg shadow-primary/20';
      case 'RESERVEE': 
        return 'bg-surface-container-highest border-primary-container text-primary font-black border-dashed';
      case 'ENCAISSEMENT': 
        return 'bg-error border-error text-white animate-pulse font-black shadow-lg shadow-error/30';
      default: 
        return 'border-outline-variant bg-surface-container-lowest text-on-surface-variant';
    }
  };

  const handleTableClick = (table: Table) => {
    if (hasDragged.current) return;
    
    if (isEditMode) {
      setSelectedTableForEdit(table);
      setFormData({ numero: table.numero.toString(), capacite: table.capacite.toString() });
      return;
    }
    
    // Quick feedback
    toast.info(`ACCÈS TABLE ${table.numero}`);
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
                toast.success('Position enregistrée');
            } catch (err) {
                toast.error('Échec de sauvegarde');
            }
        }
    } else {
        const textObj = planTexts.find(t => t.id === draggingItem.id);
        if (textObj) {
            try {
                await salleApi.updatePlanTextPos(textObj.id, { pos_x: textObj.pos_x, pos_y: textObj.pos_y });
                toast.success('Étiquette enregistrée');
            } catch (err) {
                toast.error('Échec de sauvegarde');
            }
        }
    }
    
    setDraggingItem(null);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest -m-4 overflow-hidden selection:bg-primary/20 selection:text-primary font-body">
      <h1 className="sr-only">Plan de Salle Architectural</h1>
      
      {/* Legend & Toolbar */}
      <div className="flex flex-col gap-4 px-staff-margin py-3 border-b border-outline-variant bg-surface-main z-10 xl:flex-row xl:items-center xl:justify-between shadow-sm flex-none">
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 border-2 border-outline-variant bg-surface-container-lowest/40 rounded-sm shadow-inner"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Disponible</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-primary border border-primary rounded-sm shadow-lg shadow-primary/20"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Occupé</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-surface-container-highest border border-primary-container rounded-sm border-dashed"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-primary">Réservé</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 bg-error border-2 border-error rounded-sm animate-pulse shadow-lg shadow-error/20"></div>
            <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-error">Addition</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {role === 'GERANT' && isEditMode && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 pr-4 border-r border-outline-variant/30 mr-1">
              <button
                onClick={() => { setIsAddingTable(true); setFormData({ numero: '', capacite: '' }); setSelectedTableForEdit(null); }}
                className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface font-sans text-[10px] font-black uppercase tracking-widest rounded hover:bg-surface-container-highest transition-colors flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" /> Ajouter Table
              </button>
              <button
                onClick={() => { setIsAddingText(true); setTextFormData({ texte: '' }); setSelectedTextForEdit(null); }}
                className="px-4 py-2 bg-surface-container border border-outline-variant text-on-surface font-sans text-[10px] font-black uppercase tracking-widest rounded hover:bg-surface-container-highest transition-colors flex items-center gap-2"
              >
                <Type className="w-3.5 h-3.5" /> Étiquette
              </button>
            </motion.div>
          )}
          {role === 'GERANT' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-5 py-2.5 rounded font-sans text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2.5 transition-all shadow-xl ${isEditMode ? 'bg-primary text-on-primary border border-primary hover:scale-[1.02]' : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-highest'}`}
            >
              {isEditMode ? <><Save className="w-4 h-4" /> Sauvegarder Plan</> : <><Move className="w-4 h-4" /> Modifier Plan</>}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Map Area */}
      <div className="flex-1 overflow-hidden p-staff-margin pb-0 bg-surface-container-lowest">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary">
            <Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/>
          </div>
        ) : (
          <div 
              ref={mapContainerRef}
              className="h-full w-full border border-outline-variant/50 bg-[#0d0b0a] relative blueprint-grid overflow-auto custom-scrollbar rounded-t-2xl shadow-inner"
              tabIndex={0}
              aria-label="Canevas du plan de salle"
              role="region"
              onPointerDown={handlePointerDownMap}
          >
              {/* Architectural Overlay Decor */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 overflow-hidden">
                  <div className="absolute top-10 left-10 w-20 h-20 border-t border-l border-primary/40" />
                  <div className="absolute top-10 right-10 w-20 h-20 border-t border-r border-primary/40" />
                  <div className="absolute bottom-10 left-10 w-20 h-20 border-b border-l border-primary/40" />
                  <div className="absolute bottom-10 right-10 w-20 h-20 border-b border-r border-primary/40" />
              </div>

              <div className="sticky left-0 top-0 z-20 flex w-full flex-col gap-2 border-b border-outline-variant/50 bg-[#0d0b0a]/90 backdrop-blur-md px-6 py-3.5 md:flex-row md:items-center md:justify-between">
                  <div>
                      <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-primary">Disposition de Salle</p>
                      <p className="mt-1 text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
                          Mode {isEditMode ? 'CONFIGURATION' : 'DIRECT'} • Synchro Temps Réel
                      </p>
                  </div>
              </div>

              <div 
                  ref={mapRef}
                  className={`min-w-[1500px] min-h-[1000px] w-full h-full relative transition-colors duration-700 ${isEditMode ? 'bg-primary/[0.03] cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
                  tabIndex={0}
                  aria-label="Zone de disposition de la salle"
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerUp}
              >
                  {/* Plan Texts */}
                  {planTexts.filter(t => t.est_active).map((textObj) => (
                      <motion.div
                          key={`text-${textObj.id}`}
                          layout
                          onPointerDown={(e) => handlePointerDown(e, 'text', textObj.id)}
                          onClick={() => handleTextClick(textObj)}
                          style={{
                              left: `${textObj.pos_x || 50}%`,
                              top: `${textObj.pos_y || 50}%`,
                              transform: 'translate(-50%, -50%)',
                          }}
                          className={`
                              absolute flex items-center justify-center transition-all duration-300
                              ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-110 touch-none px-6 py-3 border border-dashed border-primary bg-primary/5' : 'pointer-events-none'}
                              ${draggingItem?.type === 'text' && draggingItem.id === textObj.id ? 'z-50 border-primary bg-primary/10 shadow-2xl scale-125' : 'z-0'}
                          `}
                      >
                          <span className="font-serif text-3xl text-on-surface-variant select-none tracking-[0.25em] opacity-40 uppercase font-black">{textObj.texte}</span>
                      </motion.div>
                  ))}

                  {/* Tables */}
                  {tables.filter(t => t.est_active).map((table) => {
                      const isBooth = table.capacite >= 6;
                      const isDragging = draggingItem?.type === 'table' && draggingItem.id === table.id;
                      
                      return (
                      <motion.div
                          key={`table-${table.id}`}
                          layout
                          onPointerDown={(e) => handlePointerDown(e, 'table', table.id)}
                          onClick={() => handleTableClick(table)}
                          aria-label={`Table ${table.numero}`}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          style={{
                              left: `${table.pos_x || 50}%`,
                              top: `${table.pos_y || 50}%`,
                              transform: 'translate(-50%, -50%)',
                          }}
                          className={`
                              absolute flex flex-col items-center justify-center border-2 transition-all duration-300
                              ${isEditMode ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-pointer'}
                              ${getStatutStyles(table.statut, isDragging)}
                              ${isBooth ? 'w-40 h-24 rounded-lg' : table.statut === 'ENCAISSEMENT' ? 'w-24 h-24 rounded-full' : 'w-28 h-28 rounded-xl'}
                          `}
                      >
                          {/* Structural Details for "Tactical" look */}
                          <div className="absolute top-1 left-1 w-2 h-2 border-t border-l border-current opacity-20" />
                          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-current opacity-20" />
                          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-current opacity-20" />
                          <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-current opacity-20" />

                          <span className={`font-sans text-2xl font-black tracking-tighter ${isBooth ? 'text-3xl' : ''}`}>
                             <span className="sr-only">Table </span>{table.numero}
                          </span>
                          
                          <div className={`flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-current/10 font-sans text-[10px] font-black uppercase tracking-widest ${isDragging ? 'opacity-100' : 'opacity-60'}`}>
                              <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                              <span>{table.capacite}</span>
                          </div>
                          
                          {table.statut === 'ENCAISSEMENT' && (
                             <div className="absolute -top-3 -right-3 bg-error text-white p-2 rounded-full shadow-lg animate-bounce">
                                <DollarSign className="w-4 h-4" strokeWidth={3} />
                             </div>
                          )}
                      </motion.div>
                  )})}
              </div>
          </div>
        )}
      </div>

      {/* Modals - Localized and Styled */}
      {(selectedTableForEdit || isAddingTable) && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-surface-container border border-outline-variant p-10 max-w-md w-full rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                
                <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="font-serif text-2xl font-black text-on-surface uppercase italic tracking-tight">Config. Unité</h2>
                      <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Paramètres Techniques Table</p>
                    </div>
                    <button onClick={() => { setSelectedTableForEdit(null); setIsAddingTable(false); }} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Identifiant Table</label>
                        <input 
                            type="number" 
                            value={formData.numero}
                            placeholder="EX: 12"
                            onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                            className="w-full h-16 px-6 bg-surface-main border border-outline-variant rounded-xl font-sans text-xl font-black text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Capacité (Couverts)</label>
                        <div className="relative group">
                          <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40" />
                          <input 
                              type="number" 
                              value={formData.capacite}
                              placeholder="EX: 4"
                              onChange={(e) => setFormData({ ...formData, capacite: e.target.value })}
                              className="w-full h-16 pl-14 pr-6 bg-surface-main border border-outline-variant rounded-xl font-sans text-xl font-black text-on-surface focus:border-primary outline-none transition-all placeholder:text-on-surface-variant/20"
                          />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-12">
                    {selectedTableForEdit && (
                        <button
                            onClick={async () => {
                                if (window.confirm('SUPPRIMER DÉFINITIVEMENT CETTE UNITÉ ?')) {
                                  try {
                                      await salleApi.deleteTable(selectedTableForEdit.id);
                                      toast.success('UNITÉ SUPPRIMÉE');
                                      fetchData();
                                      setSelectedTableForEdit(null);
                                  } catch (err) {
                                      toast.error('ÉCHEC DE SUPPRESSION');
                                  }
                                }
                            }}
                            className="h-16 w-16 flex items-center justify-center text-error border border-error/30 hover:bg-error/10 rounded-xl transition-all active:scale-90"
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
                                    toast.success('CONFIGURATION MISE À JOUR');
                                } else {
                                    await salleApi.createTable({ 
                                        numero: parseInt(formData.numero), 
                                        capacite: parseInt(formData.capacite),
                                        pos_x: 50,
                                        pos_y: 50,
                                        statut: 'LIBRE',
                                        est_active: true
                                    });
                                    toast.success('UNITÉ AJOUTÉE AU PLAN');
                                }
                                fetchData();
                                setSelectedTableForEdit(null);
                                setIsAddingTable(false);
                            } catch (err) {
                                toast.error('ÉCHEC D\'ENREGISTREMENT');
                            }
                        }}
                        className="flex-1 h-16 bg-primary text-on-primary font-sans text-xs font-black uppercase tracking-[0.3em] rounded-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-primary"
                    >
                        Valider Configuration
                    </button>
                </div>
            </motion.div>
        </div>
      )}

      {(selectedTextForEdit || isAddingText) && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
              className="bg-surface-container border border-outline-variant p-10 max-w-md w-full rounded-2xl shadow-2xl relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />

                <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="font-serif text-2xl font-black text-on-surface uppercase italic tracking-tight">Éditeur Étiquette</h2>
                      <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Marquage de Zone Architectural</p>
                    </div>
                    <button onClick={() => { setSelectedTextForEdit(null); setIsAddingText(false); }} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Contenu Textuel</label>
                        <input 
                            type="text" 
                            value={textFormData.texte}
                            placeholder="EX: TERRASSE"
                            onChange={(e) => setTextFormData({ ...textFormData, texte: e.target.value })}
                            className="w-full h-16 px-6 bg-surface-main border border-outline-variant rounded-xl font-serif text-2xl font-black text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/20 tracking-widest"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-4 mt-12">
                    {selectedTextForEdit && (
                        <button
                            onClick={async () => {
                                try {
                                    await salleApi.deletePlanText(selectedTextForEdit.id);
                                    toast.success('ÉTIQUETTE SUPPRIMÉE');
                                    fetchData();
                                    setSelectedTextForEdit(null);
                                } catch (err) {
                                    toast.error('ÉCHEC DE SUPPRESSION');
                                }
                            }}
                            className="h-16 w-16 flex items-center justify-center text-error border border-error/30 hover:bg-error/10 rounded-xl transition-all active:scale-90"
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
                                    toast.success('ÉTIQUETTE MISE À JOUR');
                                } else {
                                    await salleApi.createPlanText({ 
                                        texte: textFormData.texte,
                                        pos_x: 50,
                                        pos_y: 50,
                                        est_active: true
                                    });
                                    toast.success('ÉTIQUETTE AJOUTÉE');
                                }
                                fetchData();
                                setSelectedTextForEdit(null);
                                setIsAddingText(false);
                            } catch (err) {
                                toast.error('ÉCHEC D\'ENREGISTREMENT');
                            }
                        }}
                        className="flex-1 h-16 bg-primary text-on-primary font-sans text-xs font-black uppercase tracking-[0.3em] rounded-xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all border border-primary"
                    >
                        Valider Marquage
                    </button>
                </div>
            </motion.div>
        </div>
      )}
    </div>
  );
};
