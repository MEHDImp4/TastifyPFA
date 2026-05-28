import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table, PlanText } from '../../types/salle';
import { 
  Loader2, 
  Users, 
  Move, 
  Plus, 
  X, 
  Trash2, 
  Type, 
  Save, 
  DollarSign, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  LayoutGrid,
  Map as MapIcon,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { toast } from 'sonner';

import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const SallePage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [planTexts, setPlanTexts] = useState<PlanText[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const lastUpdate = useSocketStore(state => state.lastUpdate);
  const { role } = useAuthStore();
  const isMobile = useIsMobile();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'plan' | 'grid'>('grid'); // Default to grid for better usability
  
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [draggingItem, setDraggingItem] = useState<{ type: 'table' | 'text', id: number } | null>(null);
  const [selectedTableForEdit, setSelectedTableForEdit] = useState<Table | null>(null);
  const [selectedTextForEdit, setSelectedTextForEdit] = useState<PlanText | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isAddingText, setIsAddingText] = useState(false);
  const [formData, setFormData] = useState({ numero: '', capacite: '' });
  const [textFormData, setTextFormData] = useState({ texte: '' });

  // Modal State
  const [deleteConfig, setDeleteConfig] = useState<{ isOpen: boolean, type: 'table' | 'text', id: number | null }>({
    isOpen: false,
    type: 'table',
    id: null
  });

  const hasDragged = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

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

  useEffect(() => {
    // On desktop, default to plan. On mobile, default to grid.
    if (!isMobile) {
      setViewMode('plan');
    } else {
      setViewMode('grid');
    }
  }, [isMobile]);

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
    
    if (isEditMode && viewMode === 'plan') {
      setSelectedTableForEdit(table);
      setFormData({ numero: table.numero.toString(), capacite: table.capacite.toString() });
      return;
    }
    
    navigate(`/ordering/${table.id}`);
  };

  const handleTextClick = (textObj: PlanText) => {
    if (hasDragged.current) return;
    if (isEditMode && viewMode === 'plan') {
      setSelectedTextForEdit(textObj);
      setTextFormData({ texte: textObj.texte });
    }
  };

  const handlePointerDown = (e: React.PointerEvent, type: 'table' | 'text', id: number) => {
    if (!isEditMode || viewMode !== 'plan') return;
    e.stopPropagation();
    setDraggingItem({ type, id });
    startPos.current = { x: e.clientX, y: e.clientY };
    hasDragged.current = false;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isEditMode || draggingItem === null || !mapRef.current || viewMode !== 'plan') return;
    
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
    if (!isEditMode || draggingItem === null || viewMode !== 'plan') return;
    
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

  const executeDelete = async () => {
    if (!deleteConfig.id) return;
    try {
        if (deleteConfig.type === 'table') {
            await salleApi.deleteTable(deleteConfig.id);
            toast.success('UNITÉ SUPPRIMÉE');
            setSelectedTableForEdit(null);
        } else {
            await salleApi.deletePlanText(deleteConfig.id);
            toast.success('ÉTIQUETTE SUPPRIMÉE');
            setSelectedTextForEdit(null);
        }
        fetchData();
    } catch (err) {
        toast.error('ÉCHEC DE SUPPRESSION');
    }
    setDeleteConfig({ isOpen: false, type: 'table', id: null });
  };

  return (
    <div className="h-full flex flex-col bg-surface-container-lowest -m-4 overflow-hidden selection:bg-primary/20 selection:text-primary font-body">
      <h1 className="sr-only">Disposition de la Salle</h1>
      
      {/* Legend & Toolbar */}
      <div className="flex flex-col gap-4 px-staff-margin py-3 border-b border-outline-variant bg-surface-main z-10 xl:flex-row xl:items-center xl:justify-between shadow-sm flex-none">
        
        {/* Toggle & Legend */}
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex bg-surface-container-low p-1 rounded-xl border border-outline-variant">
             <button 
               onClick={() => setViewMode('plan')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'plan' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-variant'}`}
             >
                <MapIcon className="w-3.5 h-3.5" /> Plan
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={`flex items-center gap-2 px-4 py-2 rounded-lg font-sans text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' : 'text-on-surface-variant hover:bg-surface-variant'}`}
             >
                <LayoutGrid className="w-3.5 h-3.5" /> Grille
             </button>
          </div>

          <div className="hidden sm:flex flex-wrap items-center gap-6 border-l border-outline-variant/30 pl-6">
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 border-2 border-outline-variant bg-surface-container-lowest/40 rounded-sm shadow-inner"></div>
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Libre</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-primary border border-primary rounded-sm shadow-lg shadow-primary/20"></div>
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Occupé</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-3.5 h-3.5 bg-error border-2 border-error rounded-sm animate-pulse shadow-lg shadow-error/20"></div>
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-error">Addition</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {role === 'GERANT' && isEditMode && viewMode === 'plan' && (
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
          {role === 'GERANT' && viewMode === 'plan' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-5 py-2.5 rounded font-sans text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2.5 transition-all shadow-xl ${isEditMode ? 'bg-primary text-on-primary border border-primary hover:scale-[1.02]' : 'bg-surface-container border border-outline-variant text-on-surface hover:bg-surface-container-highest'}`}
            >
              {isEditMode ? <><Save className="w-4 h-4" /> Sauvegarder Plan</> : <><Move className="w-4 h-4" /> Modifier Plan</>}
            </button>
          )}
        </div>
      </div>

      {/* Interactive Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary">
            <Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'plan' ? (
              <motion.div 
                key="plan-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="h-full w-full"
              >
                <TransformWrapper
                    initialScale={1}
                    minScale={0.3}
                    maxScale={2}
                    centerOnInit={true}
                    disabled={isEditMode && draggingItem !== null}
                    limitToBounds={false}
                    wheel={{ disabled: true }}
                    pinch={{ disabled: true }}
                    doubleClick={{ disabled: true }}
                >
                    {({ zoomIn, zoomOut, resetTransform }) => (
                    <div className="h-full w-full relative">
                        {/* Tactical Control Panel */}
                        <div className="absolute bottom-10 right-10 z-30 flex flex-col gap-3">
                            <button onClick={() => zoomIn()} className="w-12 h-12 bg-[#0d0b0a]/80 backdrop-blur-md border border-outline-variant/50 text-primary flex items-center justify-center rounded-xl hover:bg-primary hover:text-on-primary transition-all shadow-2xl active:scale-95" title="Zoom In"><ZoomIn className="w-6 h-6" strokeWidth={2.5} /></button>
                            <button onClick={() => zoomOut()} className="w-12 h-12 bg-[#0d0b0a]/80 backdrop-blur-md border border-outline-variant/50 text-primary flex items-center justify-center rounded-xl hover:bg-primary hover:text-on-primary transition-all shadow-2xl active:scale-95" title="Zoom Out"><ZoomOut className="w-6 h-6" strokeWidth={2.5} /></button>
                            <button onClick={() => resetTransform()} className="w-12 h-12 bg-[#0d0b0a]/80 backdrop-blur-md border border-outline-variant/50 text-primary flex items-center justify-center rounded-xl hover:bg-primary hover:text-on-primary transition-all shadow-2xl active:scale-95" title="Reset View"><RotateCcw className="w-6 h-6" strokeWidth={2.5} /></button>
                        </div>

                        <div className="absolute left-6 top-6 z-20 flex flex-col gap-2 border-l-4 border-primary bg-[#0d0b0a]/90 backdrop-blur-md px-6 py-3.5 shadow-2xl">
                            <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em] text-primary">Disposition de Salle</p>
                            <p className="mt-1 text-[11px] font-bold text-on-surface-variant/70 uppercase tracking-widest">
                                Mode {isEditMode ? 'CONFIGURATION' : 'DIRECT'} • Synchro Temps Réel
                            </p>
                        </div>

                        <TransformComponent
                        wrapperClass="!w-full !h-full border border-outline-variant/50 bg-[#0d0b0a] relative blueprint-grid rounded-t-2xl shadow-inner"
                        contentClass="!w-full !h-full"
                        >
                            <div 
                                ref={mapRef}
                                className={`min-w-[2000px] min-h-[1200px] w-full h-full relative transition-colors duration-700 ${isEditMode ? 'bg-primary/[0.03] cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
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
                                        onDoubleClick={() => handleTextClick(textObj)}
                                        style={{ left: `${textObj.pos_x || 50}%`, top: `${textObj.pos_y || 50}%`, transform: 'translate(-50%, -50%)' }}
                                        className={`absolute flex items-center justify-center transition-all duration-300 ${isEditMode ? 'cursor-grab active:cursor-grabbing hover:scale-110 touch-none px-6 py-3 border border-dashed border-primary bg-primary/5' : 'pointer-events-none'} ${draggingItem?.type === 'text' && draggingItem.id === textObj.id ? 'z-50 border-primary bg-primary/10 shadow-2xl scale-125' : 'z-0'}`}
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
                                        onDoubleClick={() => handleTableClick(table)}
                                        aria-label={`Table ${table.numero}`}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        style={{ left: `${table.pos_x || 50}%`, top: `${table.pos_y || 50}%`, transform: 'translate(-50%, -50%)' }}
                                        className={`absolute flex flex-col items-center justify-center border-2 transition-all duration-300 ${isEditMode ? 'cursor-grab active:cursor-grabbing touch-none' : 'cursor-pointer'} ${getStatutStyles(table.statut, isDragging)} ${isBooth ? 'w-40 h-24 rounded-lg' : table.statut === 'ENCAISSEMENT' ? 'w-24 h-24 rounded-full' : 'w-28 h-28 rounded-xl'}`}
                                    >
                                        <span className={`font-sans text-2xl font-black tracking-tighter ${isBooth ? 'text-3xl' : ''}`}>{table.numero}</span>
                                        <div className={`flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full bg-current/10 font-sans text-[10px] font-black uppercase tracking-widest ${isDragging ? 'opacity-100' : 'opacity-60'}`}>
                                            <Users className="w-3.5 h-3.5" strokeWidth={2.5} />
                                            <span>{table.capacite}</span>
                                        </div>
                                        {table.statut === 'ENCAISSEMENT' && <div className="absolute -top-3 -right-3 bg-error text-white p-2 rounded-full shadow-lg animate-bounce"><DollarSign className="w-4 h-4" strokeWidth={3} /></div>}
                                    </motion.div>
                                )})}
                            </div>
                        </TransformComponent>
                    </div>
                    )}
                </TransformWrapper>
              </motion.div>
            ) : (
              <motion.div 
                key="grid-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-surface-container-lowest"
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
                  {tables.filter(t => t.est_active).sort((a, b) => a.numero - b.numero).map((table) => (
                    <button
                      key={`grid-table-${table.id}`}
                      onClick={() => handleTableClick(table)}
                      className={`
                        aspect-square rounded-3xl flex flex-col items-center justify-between p-6 transition-all active:scale-95 border-2 shadow-sm relative overflow-hidden group
                        ${table.statut === 'LIBRE' ? 'bg-surface-main border-outline-variant/40 text-on-surface hover:border-primary/40' : ''}
                        ${table.statut === 'OCCUPEE' ? 'bg-primary border-primary text-on-primary shadow-xl shadow-primary/20' : ''}
                        ${table.statut === 'ENCAISSEMENT' ? 'bg-error border-error text-on-error animate-pulse shadow-xl shadow-error/20' : ''}
                        ${table.statut === 'RESERVEE' ? 'bg-surface-container border-primary-container text-primary border-dashed' : ''}
                      `}
                    >
                      {/* Status Badge */}
                      <div className="w-full flex justify-between items-center mb-2">
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full font-sans text-[9px] font-black uppercase tracking-widest ${table.statut === 'OCCUPEE' ? 'bg-on-primary/20' : 'bg-surface-container-high'}`}>
                          <Users className="w-3 h-3" />
                          {table.capacite}
                        </div>
                        <span className="font-sans text-[7px] font-black uppercase tracking-[0.2em] opacity-40">{table.statut}</span>
                      </div>

                      {/* Large Number */}
                      <div className="flex flex-col items-center">
                         <span className={`font-serif text-5xl font-black italic tracking-tighter ${table.statut === 'OCCUPEE' ? 'text-on-primary' : 'text-on-surface'}`}>
                           {table.numero}
                         </span>
                      </div>

                      {/* Action footer */}
                      <div className="w-full mt-4 pt-4 border-t border-current/10 flex items-center justify-between">
                         <span className="font-sans text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">
                            Accéder
                         </span>
                         <ArrowRight className={`w-4 h-4 ${table.statut === 'OCCUPEE' ? 'text-on-primary' : 'text-primary'}`} />
                      </div>

                      {/* Icon overlay for occupied */}
                      {table.statut === 'OCCUPEE' && (
                         <div className="absolute -bottom-6 -right-6 opacity-10 rotate-12">
                            <Users className="w-24 h-24" />
                         </div>
                      )}
                      {table.statut === 'ENCAISSEMENT' && (
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                            <DollarSign className="w-20 h-24" strokeWidth={3} />
                         </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Safe area padding */}
                <div className="h-24 sm:hidden" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modals - Simplified for cleaner code */}
      {(selectedTableForEdit || isAddingTable) && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container border border-outline-variant p-10 max-w-md w-full rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="font-serif text-2xl font-black text-on-surface uppercase italic tracking-tight">Table {formData.numero}</h2>
                      <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Paramètres Unité</p>
                    </div>
                    <button onClick={() => { setSelectedTableForEdit(null); setIsAddingTable(false); }} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-8">
                    <div className="space-y-3">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Numéro</label>
                        <input type="number" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full h-16 px-6 bg-surface-main border border-outline-variant rounded-xl font-sans text-xl font-black text-on-surface focus:border-primary outline-none transition-all" />
                    </div>
                    <div className="space-y-3">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Capacité</label>
                        <input type="number" value={formData.capacite} onChange={(e) => setFormData({ ...formData, capacite: e.target.value })} className="w-full h-16 px-6 bg-surface-main border border-outline-variant rounded-xl font-sans text-xl font-black text-on-surface focus:border-primary outline-none transition-all" />
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-12">
                    {selectedTableForEdit && <button onClick={() => setDeleteConfig({ isOpen: true, type: 'table', id: selectedTableForEdit.id })} className="h-16 w-16 flex items-center justify-center text-error border border-error/30 hover:bg-error/10 rounded-xl transition-all"><Trash2 className="w-6 h-6" /></button>}
                    <button onClick={async () => { try { if (selectedTableForEdit) { await salleApi.updateTable(selectedTableForEdit.id, { numero: parseInt(formData.numero), capacite: parseInt(formData.capacite) }); } else { await salleApi.createTable({ numero: parseInt(formData.numero), capacite: parseInt(formData.capacite), pos_x: 50, pos_y: 50, statut: 'LIBRE', est_active: true }); } fetchData(); setSelectedTableForEdit(null); setIsAddingTable(false); } catch (err) { toast.error('Erreur'); } }} className="flex-1 h-16 bg-primary text-on-primary font-sans text-xs font-black uppercase tracking-[0.3em] rounded-xl shadow-2xl">Enregistrer</button>
                </div>
            </motion.div>
        </div>
      )}

      {(selectedTextForEdit || isAddingText) && (
        <div className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container border border-outline-variant p-10 max-w-md w-full rounded-2xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
                <div className="flex items-center justify-between mb-10">
                    <div>
                      <h2 className="font-serif text-2xl font-black text-on-surface uppercase italic tracking-tight">Étiquette</h2>
                      <p className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Marquage Plan</p>
                    </div>
                    <button onClick={() => { setSelectedTextForEdit(null); setIsAddingText(false); }} className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-on-surface-variant"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-6">
                    <div className="space-y-3">
                        <label className="block font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant ml-1">Texte</label>
                        <input type="text" value={textFormData.texte} onChange={(e) => setTextFormData({ ...textFormData, texte: e.target.value })} className="w-full h-16 px-6 bg-surface-main border border-outline-variant rounded-xl font-serif text-2xl font-black text-on-surface focus:border-primary outline-none transition-all uppercase" />
                    </div>
                </div>
                <div className="flex items-center gap-4 mt-12">
                    {selectedTextForEdit && <button onClick={() => setDeleteConfig({ isOpen: true, type: 'text', id: selectedTextForEdit.id })} className="h-16 w-16 flex items-center justify-center text-error border border-error/30 hover:bg-error/10 rounded-xl transition-all"><Trash2 className="w-6 h-6" /></button>}
                    <button onClick={async () => { try { if (selectedTextForEdit) { await salleApi.updatePlanText(selectedTextForEdit.id, { texte: textFormData.texte }); } else { await salleApi.createPlanText({ texte: textFormData.texte, pos_x: 50, pos_y: 50, est_active: true }); } fetchData(); setSelectedTextForEdit(null); setIsAddingText(false); } catch (err) { toast.error('Erreur'); } }} className="flex-1 h-16 bg-primary text-on-primary font-sans text-xs font-black uppercase tracking-[0.3em] rounded-xl shadow-2xl">Enregistrer</button>
                </div>
            </motion.div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteConfig.isOpen}
        onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
        onConfirm={executeDelete}
        title={deleteConfig.type === 'table' ? "Supprimer Table" : "Supprimer Étiquette"}
        message={`Confirmer la suppression définitive ?`}
        confirmLabel="SUPPRIMER"
        variant="danger"
      />
    </div>
  );
};
