import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Table } from '@shared/types/tables';
import { useAuthStore } from '@shared/auth/useAuthStore';
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider';
import { TableMap, TablePosition } from '@shared/components/map/TableMap';
import { Check, LayoutDashboard, LayoutList, Loader2, RefreshCw, RotateCcw, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MapView: React.FC = () => {
  const user = useAuthStore((state: any) => state.user);
  const { lastEvent } = useStaffWebSocket();
  const navigate = useNavigate();
  const [tables, setTables] = useState<Table[]>([]);
  const [lastFetchedTables, setLastFetchedTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
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
    if (!lastEvent || isEditMode) return;

    if (lastEvent.type === 'order_updated' || lastEvent.type === 'order_created') {
      void fetchTables(true);
    }
  }, [lastEvent, fetchTables, isEditMode]);

  useEffect(() => {
    if (isEditMode) return;

    const interval = setInterval(() => {
      fetchTables(true);
    }, 15000); // Increased interval since we have WS

    return () => clearInterval(interval);
  }, [fetchTables, isEditMode]);

  const handleToggleEditMode = () => {
    if (!isGerant) return;
    setError(null);
    setIsEditMode((current) => !current);
    if (viewMode === 'list') setViewMode('map');
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
      if (hasChanged) next[tableId] = position;
      else delete next[tableId];
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
      setError('Impossible d’enregistrer le plan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTableClick = (table: Table) => {
    navigate(`/tables/${table.id}/order`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-10 h-10 text-teal animate-spin" />
        <p className="text-foreground-muted font-bold text-sm uppercase tracking-widest">Initialisation du plan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sticky top-0 z-40 bg-background/80 backdrop-blur-md -mx-4 px-4 py-4 sm:mx-0 sm:px-0 border-b border-white/5 sm:static sm:bg-transparent sm:backdrop-blur-none sm:border-none">
        <div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tighter leading-none">Plan de Salle</h1>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-foreground-muted mt-2">
            {isEditMode ? 'Configuration du plan' : 'Sélectionnez une table pour servir'}
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
          <div className="flex items-center gap-1 rounded-xl bg-surface border border-white/5 p-1 shrink-0">
            <button
              onClick={() => setViewMode('map')}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${viewMode === 'map' ? 'bg-teal text-white' : 'text-foreground-muted hover:text-white'}`}
            >
              <LayoutDashboard className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all ${viewMode === 'list' ? 'bg-teal text-white' : 'text-foreground-muted hover:text-white'}`}
            >
              <LayoutList className="h-4 w-4" />
            </button>
          </div>

          <button 
            onClick={() => fetchTables()}
            disabled={isEditMode || isSaving}
            className="h-11 w-11 flex items-center justify-center rounded-xl border border-white/5 bg-surface text-foreground-muted transition-all active:scale-90 disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {isGerant && (
            <div className="flex items-center gap-2 shrink-0">
              {isEditMode ? (
                <>
                  <button
                    onClick={handleSavePositions}
                    disabled={isSaving}
                    className="h-11 px-4 flex items-center gap-2 rounded-xl bg-teal font-black text-[11px] uppercase tracking-widest text-white shadow-lg shadow-teal/20 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Sauver
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="h-11 w-11 flex items-center justify-center rounded-xl border border-white/10 bg-surface-elevated text-foreground-muted transition-all active:scale-95"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleToggleEditMode}
                  className="h-11 px-4 rounded-xl border border-white/5 bg-surface font-black text-[11px] uppercase tracking-widest text-foreground-muted hover:text-white transition-all active:scale-95"
                >
                  Éditer
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {error && (
        <div className="bg-error/5 border border-error/10 rounded-2xl p-4 text-center">
          <p className="text-error text-xs font-bold">{error}</p>
        </div>
      )}

      <div className="animate-enter">
        {viewMode === 'map' ? (
          <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
            <TableMap
              tables={tables}
              isEditMode={isEditMode}
              onTableClick={handleTableClick}
              onTablePositionChange={handlePositionChange}
            />

            <aside className="hidden xl:block rounded-3xl border border-white/5 bg-surface p-6 shadow-xl">
              <div className="flex min-h-48 flex-col justify-center text-center">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-teal/10 flex items-center justify-center border border-teal/20 mb-4">
                  <LayoutDashboard className="h-6 w-6 text-teal" />
                </div>
                <h2 className="text-lg font-black text-white">Mode Plan</h2>
                <p className="mt-2 text-xs leading-5 text-foreground-muted">
                  Touchez une table sur le plan interactif pour commencer une commande.
                </p>
              </div>
            </aside>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {tables.map((table) => (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all active:scale-95 ${
                  table.statut === 'LIBRE' ? 'bg-teal/5 border-teal/20 text-teal hover:bg-teal/10' :
                  table.statut === 'OCCUPEE' ? 'bg-[#E76F51]/5 border-[#E76F51]/20 text-[#E76F51]' :
                  table.statut === 'ENCAISSEMENT' ? 'bg-[#E9C46A]/5 border-[#E9C46A]/20 text-[#E9C46A]' :
                  'bg-surface border-white/5 text-foreground-muted'
                }`}
              >
                <span className="text-3xl font-black tabular-nums tracking-tighter mb-1">{table.numero}</span>
                <div className="flex items-center gap-1.5 opacity-80">
                   <Users className="h-3 w-3" />
                   <span className="text-[10px] font-black uppercase tracking-widest">{table.capacite}</span>
                </div>
                <span className="mt-3 text-[9px] font-black uppercase tracking-[0.2em]">{table.statut}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4 border-t border-white/5">
        <LegendItem color="bg-teal" label="Libre" />
        <LegendItem color="bg-[#E76F51]" label="Occupée" />
        <LegendItem color="bg-[#E9C46A]" label="Paiement" />
        <LegendItem color="bg-surface-elevated border border-white/10" label="Réservée" />
      </div>
    </div>
  );
};

const LegendItem = ({ color, label }: { color: string, label: string }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
    <span className="text-[10px] font-black text-foreground-muted uppercase tracking-[0.15em]">{label}</span>
  </div>
);
