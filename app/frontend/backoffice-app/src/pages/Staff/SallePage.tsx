import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table } from '../../types/salle';
import {
  Loader2,
  Users,
  ArrowRight,
  Plus,
  Edit2,
  Lock,
  Trash2,
  X
} from 'lucide-react';

import { useSocketStore } from '../../store/socketStore';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

export const SallePage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const lastUpdate = useSocketStore(state => state.lastUpdate);
  const role = useAuthStore(state => state.role);

  const [isEditMode, setIsEditMode] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);

  const [numero, setNumero] = useState('');
  const [capacite, setCapacite] = useState('2');
  const [isSaving, setIsSaving] = useState(false);

  const isGerant = role === 'GERANT';

  const fetchData = useCallback(async () => {
    try {
      const tablesRes = await salleApi.getTables();
      setTables(tablesRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, lastUpdate]);

  const handleTableClick = (table: Table) => {
    navigate(`/ordering/${table.id}`);
  };

  const handleOpenCreate = () => {
    setNumero('');
    setCapacite('2');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (table: Table) => {
    setEditingTable(table);
    setNumero(String(table.numero));
    setCapacite(String(table.capacite));
    setIsEditOpen(true);
  };

  const handleCreateTable = async () => {
    if (!numero || !capacite) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setIsSaving(true);
    try {
      await salleApi.createTable({
        numero: parseInt(numero, 10),
        capacite: parseInt(capacite, 10),
        statut: 'LIBRE',
        est_active: true,
        pos_x: 0,
        pos_y: 0
      });
      toast.success(`Table ${numero} créée`);
      setIsCreateOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.numero?.[0] || err?.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateTable = async () => {
    if (!editingTable) return;
    if (!numero || !capacite) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    setIsSaving(true);
    try {
      await salleApi.updateTable(editingTable.id, {
        numero: parseInt(numero, 10),
        capacite: parseInt(capacite, 10)
      });
      toast.success(`Table mise à jour`);
      setIsEditOpen(false);
      setEditingTable(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.numero?.[0] || err?.response?.data?.detail || 'Erreur lors de la modification');
    } finally {
      setIsSaving(false);
    }
  };

  const requestDeleteTable = (tableId: number) => {
    setTableToDelete(tableId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    try {
      await salleApi.deleteTable(tableToDelete);
      toast.success('Table supprimée');
      setIsEditOpen(false);
      setEditingTable(null);
      setTableToDelete(null);
      fetchData();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden selection:bg-on-background/10 font-body">
      
      {/* Header */}
      <div className="flex-none flex items-center justify-center px-staff-margin min-h-16 py-3 border-b border-outline bg-surface">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8 w-full max-w-[1600px] justify-between">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-8">
            <div className="text-center sm:text-left">
              <h1 className="text-sm font-black uppercase tracking-[0.18em] text-on-background">
                Plan de Salle
              </h1>
            </div>
            <div className="hidden sm:flex items-center gap-4 lg:gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 border border-outline bg-background rounded-sm"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Libre</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-on-background rounded-sm"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-background">Occupé</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-error rounded-sm"></div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-error">Addition</span>
              </div>
            </div>
          </div>

          {isGerant && (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditMode(!isEditMode)} 
                className={`min-h-[40px] px-4 border rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                  isEditMode ? 'bg-on-background text-background border-on-background' : 'border-outline-variant text-on-background hover:border-on-background'
                }`}
              >
                {isEditMode ? <Lock className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                <span>{isEditMode ? 'Quitter Édition' : 'Mode Édition'}</span>
              </button>
              {isEditMode && (
                <button 
                  onClick={handleOpenCreate} 
                  className="min-h-[40px] px-4 bg-primary text-on-primary rounded-lg text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter Table</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-on-background">
            <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/>
          </div>
        ) : (
          <div className="h-full w-full overflow-y-auto custom-scrollbar p-4 md:p-8 bg-background">
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {tables.filter(t => t.est_active).sort((a, b) => a.numero - b.numero).map((table) => (
                <button
                  key={`grid-table-${table.id}`}
                  data-testid={`table-${table.numero}`}
                  onClick={() => isEditMode ? handleOpenEdit(table) : handleTableClick(table)}
                  className={`
                    aspect-square min-h-[9rem] atelier-card flex flex-col items-center justify-between p-4 sm:p-6 transition-all active:scale-95 group relative
                    ${table.statut === 'LIBRE' ? 'text-on-surface-variant hover:border-on-background' : ''}
                    ${table.statut === 'OCCUPEE' ? 'bg-on-background border-on-background text-background bg-amber' : ''}
                    ${table.statut === 'ENCAISSEMENT' ? 'bg-error border-error text-on-error' : ''}
                    ${table.statut === 'RESERVEE' ? 'border-dashed border-outline-variant text-on-surface-variant bg-aged-paper' : ''}
                  `}
                >
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><Users className="w-3 h-3" strokeWidth={2} /> {table.capacite}</div>
                    <span className="max-w-20 truncate text-[8px] font-bold uppercase tracking-widest sm:max-w-none">{isEditMode ? 'ÉDITER' : table.statut}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Table</span>
                    <span className="text-6xl font-bold tracking-tighter leading-none">{table.numero}</span>
                  </div>
                  
                  <div className="w-full pt-4 border-t border-current/10 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                     <span className="text-[9px] font-bold uppercase tracking-widest">{isEditMode ? 'Modifier' : 'Ouvrir'}</span>
                     <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
            <div className="h-20" />
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="create-table-title" className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 id="create-table-title" className="text-sm font-bold text-on-background uppercase tracking-[0.2em]">
                Nouvelle Table
              </h2>
              <button aria-label="Fermer" onClick={() => setIsCreateOpen(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label htmlFor="table-numero" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Numéro de table</label>
                <input
                  id="table-numero"
                  type="number"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  className="field-control"
                  placeholder="Ex: 5"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="table-capacite" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Capacité (personnes)</label>
                <input
                  id="table-capacite"
                  type="number"
                  value={capacite}
                  onChange={e => setCapacite(e.target.value)}
                  className="field-control"
                  placeholder="Ex: 4"
                />
              </div>
            </div>

            <div className="p-6 border-t border-outline flex gap-3">
              <button onClick={() => setIsCreateOpen(false)} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
              <button
                onClick={handleCreateTable}
                disabled={isSaving}
                className="flex-[2] btn-primary h-12"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Créer</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && editingTable && (
        <div className="fixed inset-0 z-[100] flex items-center justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div role="dialog" aria-modal="true" aria-labelledby="edit-table-title" className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 id="edit-table-title" className="text-sm font-bold text-on-background uppercase tracking-[0.2em]">
                Modifier Table {editingTable.numero}
              </h2>
              <button aria-label="Fermer" onClick={() => setIsEditOpen(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-8 space-y-6 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <label htmlFor="table-numero-edit" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Numéro de table</label>
                <input
                  id="table-numero-edit"
                  type="number"
                  value={numero}
                  onChange={e => setNumero(e.target.value)}
                  className="field-control"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="table-capacite-edit" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Capacité (personnes)</label>
                <input
                  id="table-capacite-edit"
                  type="number"
                  value={capacite}
                  onChange={e => setCapacite(e.target.value)}
                  className="field-control"
                />
              </div>
            </div>

            <div className="p-6 border-t border-outline flex flex-col gap-3">
              <div className="flex gap-3">
                <button onClick={() => setIsEditOpen(false)} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
                <button
                  onClick={handleUpdateTable}
                  disabled={isSaving}
                  className="flex-[2] btn-primary h-12"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enregistrer</span>}
                </button>
              </div>
              <button
                onClick={() => requestDeleteTable(editingTable.id)}
                className="w-full h-12 border border-error/30 text-error rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-error/5 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer la Table</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setTableToDelete(null);
        }}
        onConfirm={handleDeleteTable}
        title="Supprimer la table"
        message="Confirmez-vous la suppression de cette table ? Cette action la retirera du plan de salle."
        confirmLabel="Supprimer"
        variant="danger"
      />
    </div>
  );
};
