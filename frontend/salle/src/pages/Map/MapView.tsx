import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Table } from '@shared/types/tables';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { TableMap, TablePosition } from '../../components/map/TableMap';
import { Check, Loader2, Lock, RefreshCw, RotateCcw, Unlock } from 'lucide-react';

export const MapView: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [tables, setTables] = useState<Table[]>([]);
  const [lastFetchedTables, setLastFetchedTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dirtyTables, setDirtyTables] = useState<Record<number, TablePosition>>({});
  const [isSaving, setIsSaving] = useState(false);

  const isGerant = user?.role === 'GERANT';
  const dirtyCount = Object.keys(dirtyTables).length;

  const fetchTables = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const response = await axiosInstance.get('/tables/');
      setTables(response.data);
      setLastFetchedTables(response.data);
    } catch (err) {
      console.error('Failed to fetch tables', err);
      setError('Impossible de charger le plan de salle.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useEffect(() => {
    if (isEditMode) return;

    const interval = setInterval(() => {
      fetchTables(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTables, isEditMode]);

  const handleToggleEditMode = () => {
    if (!isGerant) return;

    setError(null);
    setIsEditMode((current) => !current);
  };

  const handlePositionChange = (tableId: number, position: TablePosition) => {
    setTables((currentTables) => (
      currentTables.map((table) => (
        table.id === tableId
          ? { ...table, pos_x: position.pos_x, pos_y: position.pos_y }
          : table
      ))
    ));

    const originalTable = lastFetchedTables.find((table) => table.id === tableId);
    const hasChanged = !originalTable || originalTable.pos_x !== position.pos_x || originalTable.pos_y !== position.pos_y;

    setDirtyTables((current) => {
      const next = { ...current };

      if (hasChanged) {
        next[tableId] = position;
      } else {
        delete next[tableId];
      }

      return next;
    });
  };

  const handleCancelEdit = () => {
    setTables(lastFetchedTables);
    setDirtyTables({});
    setIsEditMode(false);
    setError(null);
  };

  const handleSavePositions = async () => {
    if (dirtyCount === 0) {
      setIsEditMode(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await Promise.all(
        Object.entries(dirtyTables).map(([tableId, position]) => (
          axiosInstance.patch(`/tables/${tableId}/`, position)
        )),
      );
      setDirtyTables({});
      setIsEditMode(false);
      await fetchTables(true);
    } catch (err) {
      console.error('Failed to save table positions', err);
      setError('Impossible d’enregistrer le plan. Les modifications restent visibles.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTableClick = (table: Table) => {
    console.log('Table clicked:', table);
    alert(`Table ${table.numero} selected (Statut: ${table.statut})`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 text-teal animate-spin" />
        <p className="text-foreground-muted animate-pulse font-medium">Chargement du plan de salle...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-enter">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Plan de Salle</h1>
          <p className="text-foreground-muted mt-1">
            {isEditMode ? 'Déplacez les tables, puis enregistrez le plan.' : 'Sélectionnez une table pour commencer le service.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="min-h-11 inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-4 text-xs font-bold uppercase tracking-wider text-foreground-muted">
            {isEditMode ? <Unlock className="h-4 w-4 text-amber" /> : <Lock className="h-4 w-4 text-teal" />}
            {isEditMode ? `${dirtyCount} modification${dirtyCount > 1 ? 's' : ''}` : 'Positions verrouillées'}
          </div>

          {isGerant && !isEditMode && (
            <button
              onClick={handleToggleEditMode}
              className="min-h-11 rounded-full bg-teal px-5 font-bold text-white transition-colors duration-200 hover:bg-teal/90 active:scale-[0.97]"
            >
              Mode édition
            </button>
          )}

          {isGerant && isEditMode && (
            <>
              <button
                onClick={handleSavePositions}
                disabled={isSaving}
                className="min-h-11 inline-flex items-center gap-2 rounded-full bg-teal px-5 font-bold text-white transition-colors duration-200 hover:bg-teal/90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Enregistrer
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="min-h-11 inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-5 font-bold text-foreground-muted transition-colors duration-200 hover:bg-surface-elevated hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RotateCcw className="h-4 w-4" />
                Annuler
              </button>
            </>
          )}

          {isRefreshing && <Loader2 className="w-4 h-4 text-teal animate-spin" />}
          <button 
            onClick={() => fetchTables()}
            disabled={isEditMode || isSaving}
            className="min-h-11 min-w-11 rounded-full border border-white/5 bg-surface p-3 text-foreground-muted transition-colors duration-200 hover:bg-surface-elevated hover:text-white active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </header>

      {error ? (
        <div className="bg-error/10 border border-error/20 rounded-3xl p-12 text-center space-y-4">
          <p className="text-error font-medium">{error}</p>
          <button 
            onClick={() => fetchTables()}
            className="bg-error/20 hover:bg-error/30 text-error px-6 py-2 rounded-full font-bold transition-all"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="max-w-5xl mx-auto">
          <TableMap
            tables={tables}
            isEditMode={isEditMode}
            onTableClick={handleTableClick}
            onTablePositionChange={handlePositionChange}
          />
          
          <div className="mt-8 flex flex-wrap justify-center gap-6">
            <LegendItem color="bg-[#2A9D8F]" label="Libre" />
            <LegendItem color="bg-[#E76F51]" label="Occupée" />
            <LegendItem color="bg-[#E9C46A]" label="Encaissement" />
            <LegendItem color="bg-[#264653]" label="Réservée" />
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-3 h-3 rounded-full ${color}`} />
    <span className="text-xs font-bold text-foreground-muted uppercase tracking-wider">{label}</span>
  </div>
);
