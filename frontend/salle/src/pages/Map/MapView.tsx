import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Table } from '@shared/types/tables';
import { TableMap } from '../../components/map/TableMap';
import { Loader2, RefreshCw } from 'lucide-react';

export const MapView: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchTables = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const response = await axiosInstance.get('/tables/');
      setTables(response.data);
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

    // Initial polling (10s) until WebSockets are implemented in Phase 13
    const interval = setInterval(() => {
      fetchTables(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTables]);

  const handleTableClick = (table: Table) => {
    console.log('Table clicked:', table);
    // Placeholder for Phase 12 ordering modal
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
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Plan de Salle</h1>
          <p className="text-foreground-muted mt-1">Sélectionnez une table pour commencer le service.</p>
        </div>
        <div className="flex items-center gap-4">
          {isRefreshing && <Loader2 className="w-4 h-4 text-teal animate-spin" />}
          <button 
            onClick={() => fetchTables()}
            className="p-3 rounded-full bg-surface hover:bg-surface-elevated text-foreground-muted hover:text-white transition-all active:scale-90 border border-white/5"
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
          <TableMap tables={tables} onTableClick={handleTableClick} />
          
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
