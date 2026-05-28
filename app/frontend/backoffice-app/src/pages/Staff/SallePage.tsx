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
  const [viewMode, setViewMode] = useState<'plan' | 'grid'>('grid');
  
  const mapRef = useRef<HTMLDivElement>(null);
  
  const [draggingItem, setDraggingItem] = useState<{ type: 'table' | 'text', id: number } | null>(null);
  const [selectedTableForEdit, setSelectedTableForEdit] = useState<Table | null>(null);
  const [selectedTextForEdit, setSelectedTextForEdit] = useState<PlanText | null>(null);
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [isAddingText, setIsAddingText] = useState(false);
  const [formData, setFormData] = useState({ numero: '', capacite: '' });
  const [textFormData, setTextFormData] = useState({ texte: '' });

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
    if (isMobile) {
      setViewMode('grid');
    } else {
      setViewMode('plan');
    }
  }, [isMobile]);

  const getStatutStyles = (statut: Table['statut'], isDragging: boolean) => {
    if (isDragging) return 'border-primary bg-primary/20 scale-110 z-50 ring-4 ring-primary/30';
    
    switch (statut) {
      case 'LIBRE': 
        return 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary transition-all';
      case 'OCCUPEE': 
        return 'bg-primary border-primary text-on-primary font-black shadow-lg shadow-primary/20';
      case 'RESERVEE': 
        return 'bg-surface-container-high border-primary-container text-primary font-black border-dashed';
      case 'ENCAISSEMENT': 
        return 'bg-error border-error text-white animate-pulse font-black shadow-lg shadow-error/30';
      default: 
        return 'border-outline-variant bg-surface-container-low text-on-surface';
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
    if (dx > 5 || dy > 5) hasDragged.current = true;

    const rect = mapRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    if (draggingItem.type === 'table') {
        setTables(prev => prev.map(t => t.id === draggingItem.id ? { ...t, pos_x: x, pos_y: y } : t));
    } else {
        setPlanTexts(prev => prev.map(t => t.id === draggingItem.id ? { ...t, pos_x: x, pos_y: y } : t));
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
    <div className="h-full flex flex-col bg-background -m-4 overflow-hidden selection:bg-primary/20 selection:text-primary font-body">
      
      {/* Header Toolbar */}
      <div className="flex flex-col gap-4 px-staff-margin py-4 border-b border-outline-variant bg-surface-container-lowest z-10 xl:flex-row xl:items-center xl:justify-between shadow-md flex-none">
        
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex bg-surface-container-low p-1.5 rounded-2xl border border-outline-variant/30 shadow-inner">
             <button 
               onClick={() => setViewMode('plan')}
               className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-sans text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'plan' ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
             >
                <MapIcon className="w-4 h-4" /> Plan
             </button>
             <button 
               onClick={() => setViewMode('grid')}
               className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-sans text-[11px] font-black uppercase tracking-widest transition-all ${viewMode === 'grid' ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'}`}
             >
                <LayoutGrid className="w-4 h-4" /> Grille
             </button>
          </div>

          <div className="hidden sm:flex items-center gap-6 border-l border-outline-variant/20 pl-6">
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-outline-variant bg-surface-container-low rounded-md"></div>
                <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Libre</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-primary rounded-md shadow-sm shadow-primary/40"></div>
                <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Occupé</span>
            </div>
            <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-error rounded-md animate-pulse shadow-sm shadow-error/40"></div>
                <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-error">Addition</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {role === 'GERANT' && isEditMode && viewMode === 'plan' && (
            <div className="flex items-center gap-3 pr-4 border-r border-outline-variant/20">
              <button
                onClick={() => { setIsAddingTable(true); setFormData({ numero: '', capacite: '' }); }}
                className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface font-sans text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2.5 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Table
              </button>
              <button
                onClick={() => { setIsAddingText(true); setTextFormData({ texte: '' }); }}
                className="px-5 py-2.5 bg-surface-container border border-outline-variant text-on-surface font-sans text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2.5 shadow-sm"
              >
                <Type className="w-4 h-4" /> Label
              </button>
            </div>
          )}
          {role === 'GERANT' && viewMode === 'plan' && (
            <button 
              onClick={() => setIsEditMode(!isEditMode)}
              className={`px-6 py-3 rounded-xl font-sans text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all shadow-xl ${isEditMode ? 'bg-primary text-on-primary border-2 border-primary hover:scale-[1.02]' : 'bg-surface-container-low border-2 border-outline-variant/30 text-on-surface hover:bg-surface-container-high'}`}
            >
              {isEditMode ? <><Save className="w-5 h-5" /> Finir Plan</> : <><Move className="w-5 h-5" /> Configurer</>}
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Map / Grid Area */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary">
            <Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {viewMode === 'plan' ? (
              <motion.div key="plan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full w-full">
                <TransformWrapper initialScale={1} centerOnInit={true} minScale={0.2} maxScale={3} disabled={isEditMode && draggingItem !== null}>
                    {({ zoomIn, zoomOut, resetTransform }) => (
                    <div className="h-full w-full relative bg-[#0a0908]">
                        
                        {/* Map Controls */}
                        <div className="absolute bottom-10 right-10 z-30 flex flex-col gap-4">
                            <button onClick={() => zoomIn()} className="w-14 h-14 bg-surface-container-lowest border border-outline-variant/50 text-primary flex items-center justify-center rounded-2xl shadow-2xl hover:bg-primary hover:text-on-primary transition-all active:scale-90"><ZoomIn className="w-7 h-7" /></button>
                            <button onClick={() => zoomOut()} className="w-14 h-14 bg-surface-container-lowest border border-outline-variant/50 text-primary flex items-center justify-center rounded-2xl shadow-2xl hover:bg-primary hover:text-on-primary transition-all active:scale-90"><ZoomOut className="w-7 h-7" /></button>
                            <button onClick={() => resetTransform()} className="w-14 h-14 bg-surface-container-lowest border border-outline-variant/50 text-primary flex items-center justify-center rounded-2xl shadow-2xl hover:bg-primary hover:text-on-primary transition-all active:scale-90"><RotateCcw className="w-7 h-7" /></button>
                        </div>

                        <TransformComponent wrapperClass="!w-full !h-full" contentClass="!w-full !h-full">
                            <div 
                                ref={mapRef}
                                className={`min-w-[3000px] min-h-[2000px] w-full h-full relative transition-colors duration-700 blueprint-grid ${isEditMode ? 'bg-primary/[0.02] cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
                                onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}
                            >
                                {planTexts.filter(t => t.est_active).map(textObj => (
                                    <motion.div
                                        key={`text-${textObj.id}`} layout
                                        onPointerDown={(e) => handlePointerDown(e, 'text', textObj.id)}
                                        onDoubleClick={() => handleTextClick(textObj)}
                                        style={{ left: `${textObj.pos_x}%`, top: `${textObj.pos_y}%`, transform: 'translate(-50%, -50%)' }}
                                        className={`absolute flex items-center justify-center transition-all ${isEditMode ? 'cursor-grab px-8 py-4 border border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10' : 'pointer-events-none'}`}
                                    >
                                        <span className="font-serif text-4xl text-on-surface opacity-30 uppercase font-black tracking-[0.4em] select-none">{textObj.texte}</span>
                                    </motion.div>
                                ))}

                                {tables.filter(t => t.est_active).map(table => (
                                    <motion.div
                                        key={`table-${table.id}`} layout
                                        onPointerDown={(e) => handlePointerDown(e, 'table', table.id)}
                                        onDoubleClick={() => handleTableClick(table)}
                                        style={{ left: `${table.pos_x}%`, top: `${table.pos_y}%`, transform: 'translate(-50%, -50%)' }}
                                        className={`absolute flex flex-col items-center justify-center border-2 transition-all duration-300 ${isEditMode ? 'cursor-grab touch-none' : 'cursor-pointer'} ${getStatutStyles(table.statut, draggingItem?.id === table.id)} ${table.capacite >= 6 ? 'w-48 h-28 rounded-2xl' : 'w-32 h-32 rounded-3xl'}`}
                                    >
                                        <span className="font-sans text-3xl font-black tracking-tighter">{table.numero}</span>
                                        <div className="flex items-center gap-1.5 mt-2.5 opacity-60 font-sans text-[11px] font-black uppercase tracking-widest">
                                            <Users className="w-4 h-4" /> {table.capacite}
                                        </div>
                                        {table.statut === 'ENCAISSEMENT' && (
                                           <div className="absolute -top-4 -right-4 bg-error text-white p-2.5 rounded-full shadow-2xl animate-bounce border-2 border-surface-main"><DollarSign className="w-5 h-5" strokeWidth={3} /></div>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </TransformComponent>
                    </div>
                    )}
                </TransformWrapper>
              </motion.div>
            ) : (
              <motion.div key="grid" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-background">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-5">
                  {tables.filter(t => t.est_active).sort((a, b) => a.numero - b.numero).map((table) => (
                    <button
                      key={`grid-table-${table.id}`}
                      onClick={() => handleTableClick(table)}
                      className={`
                        aspect-square rounded-[2.5rem] flex flex-col items-center justify-between p-8 transition-all active:scale-95 border-2 shadow-sm relative overflow-hidden group
                        ${table.statut === 'LIBRE' ? 'bg-surface-container border-outline-variant/40 text-on-surface hover:border-primary/40' : ''}
                        ${table.statut === 'OCCUPEE' ? 'bg-primary border-primary text-on-primary shadow-2xl shadow-primary/30' : ''}
                        ${table.statut === 'ENCAISSEMENT' ? 'bg-error border-error text-on-error animate-pulse shadow-2xl shadow-error/30' : ''}
                        ${table.statut === 'RESERVEE' ? 'bg-surface-container-high border-primary-container text-primary border-dashed' : ''}
                      `}
                    >
                      <div className="w-full flex justify-between items-center opacity-60">
                        <div className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-widest"><Users className="w-3.5 h-3.5" /> {table.capacite}</div>
                        <span className="font-sans text-[8px] font-black uppercase tracking-[0.2em]">{table.statut}</span>
                      </div>
                      <span className="font-serif text-6xl font-black italic tracking-tighter">{table.numero}</span>
                      <div className="w-full pt-4 border-t border-current/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="font-sans text-[10px] font-black uppercase tracking-widest">Ouvrir</span>
                         <ArrowRight className="w-5 h-5" />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="h-32" />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {(selectedTableForEdit || isAddingTable) && (
            <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-md">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface-container border border-outline-variant p-12 max-w-md w-full rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="font-serif text-3xl font-black text-on-surface uppercase italic">Table {formData.numero}</h2>
                        <button onClick={() => { setSelectedTableForEdit(null); setIsAddingTable(false); }} className="p-3 bg-surface-container-high hover:bg-primary hover:text-on-primary rounded-full transition-all"><X className="w-7 h-7" /></button>
                    </div>
                    <div className="space-y-10">
                        <div className="space-y-3">
                            <label className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant ml-1">Identifiant Unité</label>
                            <input type="number" value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full h-20 px-8 bg-background border-2 border-outline-variant rounded-2xl font-mono text-3xl font-black text-primary focus:border-primary transition-all shadow-inner" />
                        </div>
                        <div className="space-y-3">
                            <label className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant ml-1">Capacité Couverts</label>
                            <input type="number" value={formData.capacite} onChange={(e) => setFormData({ ...formData, capacite: e.target.value })} className="w-full h-20 px-8 bg-background border-2 border-outline-variant rounded-2xl font-mono text-3xl font-black text-on-surface focus:border-primary transition-all shadow-inner" />
                        </div>
                    </div>
                    <div className="flex gap-6 mt-16">
                        {selectedTableForEdit && <button onClick={() => setDeleteConfig({ isOpen: true, id: selectedTableForEdit.id, type: 'table' })} className="w-20 h-20 flex items-center justify-center border-2 border-error/30 text-error hover:bg-error hover:text-on-error rounded-2xl transition-all shadow-lg active:scale-90"><Trash2 className="w-8 h-8" /></button>}
                        <button onClick={async () => { try { if (selectedTableForEdit) { await salleApi.updateTable(selectedTableForEdit.id, { numero: parseInt(formData.numero), capacite: parseInt(formData.capacite) }); } else { await salleApi.createTable({ numero: parseInt(formData.numero), capacite: parseInt(formData.capacite), pos_x: 50, pos_y: 50, statut: 'LIBRE', est_active: true }); } fetchData(); setSelectedTableForEdit(null); setIsAddingTable(false); } catch (err) { toast.error('Erreur'); } }} className="flex-1 h-20 bg-primary text-on-primary font-sans text-xs font-black uppercase tracking-[0.5em] rounded-2xl shadow-2xl hover:brightness-110 active:scale-95">Valider</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(selectedTextForEdit || isAddingText) && (
            <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-8 backdrop-blur-md">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-surface-container border border-outline-variant p-12 max-w-md w-full rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-primary" />
                    <div className="flex items-center justify-between mb-12">
                        <h2 className="font-serif text-3xl font-black text-on-surface uppercase italic">Étiquette</h2>
                        <button onClick={() => { setSelectedTextForEdit(null); setIsAddingText(false); }} className="p-3 bg-surface-container-high hover:bg-primary hover:text-on-primary rounded-full transition-all"><X className="w-7 h-7" /></button>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="font-sans text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant ml-1">Contenu Texte</label>
                            <input type="text" value={textFormData.texte} onChange={(e) => setTextFormData({ ...textFormData, texte: e.target.value })} className="w-full h-20 px-8 bg-background border-2 border-outline-variant rounded-2xl font-serif text-2xl font-black text-on-surface focus:border-primary transition-all uppercase shadow-inner" />
                        </div>
                    </div>
                    <div className="flex gap-6 mt-16">
                        {selectedTextForEdit && <button onClick={() => setDeleteConfig({ isOpen: true, id: selectedTextForEdit.id, type: 'text' })} className="w-20 h-20 flex items-center justify-center border-2 border-error/30 text-error hover:bg-error hover:text-on-error rounded-2xl transition-all shadow-lg active:scale-90"><Trash2 className="w-8 h-8" /></button>}
                        <button onClick={async () => { try { if (selectedTextForEdit) { await salleApi.updatePlanText(selectedTextForEdit.id, { texte: textFormData.texte }); } else { await salleApi.createPlanText({ texte: textFormData.texte, pos_x: 50, pos_y: 50, est_active: true }); } fetchData(); setSelectedTextForEdit(null); setIsAddingText(false); } catch (err) { toast.error('Erreur'); } }} className="flex-1 h-20 bg-primary text-on-primary font-sans text-xs font-black uppercase tracking-[0.5em] rounded-2xl shadow-2xl hover:brightness-110 active:scale-95">Valider</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <ConfirmationModal
        isOpen={deleteConfig.isOpen}
        onClose={() => setDeleteConfig({ ...deleteConfig, isOpen: false })}
        onConfirm={executeDelete}
        title="RÉVOCATION UNITÉ"
        message="Confirmer l'effacement définitif ? Cette action est irréversible et purgera les données liées."
        confirmLabel="SUPPRIMER"
        variant="danger"
      />
    </div>
  );
};
