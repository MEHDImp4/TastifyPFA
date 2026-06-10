import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table } from '../../types/salle';
import {
  Loader2,
  Users,
  ArrowRight
} from 'lucide-react';

import { useSocketStore } from '../../store/socketStore';

export const SallePage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const lastUpdate = useSocketStore(state => state.lastUpdate);
  
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

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden selection:bg-on-background/10 font-body">
      
      {/* Header */}
      <div className="flex-none flex items-center justify-center px-staff-margin h-16 border-b border-outline bg-surface">
        <div className="flex items-center gap-8">
          <h1 className="text-sm font-bold tracking-widest text-on-background uppercase">Plan de Salle <span className="sr-only">Main Dining Area</span></h1>
          <div className="hidden sm:flex items-center gap-6 border-l border-outline pl-8">
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
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-on-background">
            <Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/>
          </div>
        ) : (
          <div className="h-full w-full overflow-y-auto custom-scrollbar p-8 bg-background">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {tables.filter(t => t.est_active).sort((a, b) => a.numero - b.numero).map((table) => (
                <button
                  key={`grid-table-${table.id}`}
                  data-testid={`table-${table.numero}`}
                  onClick={() => handleTableClick(table)}
                  className={`
                    aspect-square atelier-card flex flex-col items-center justify-between p-6 transition-all active:scale-95 group
                    ${table.statut === 'LIBRE' ? 'text-on-surface-variant hover:border-on-background' : ''}
                    ${table.statut === 'OCCUPEE' ? 'bg-on-background border-on-background text-background bg-amber' : ''}
                    ${table.statut === 'ENCAISSEMENT' ? 'bg-error border-error text-on-error' : ''}
                    ${table.statut === 'RESERVEE' ? 'border-dashed border-outline-variant text-on-surface-variant bg-aged-paper' : ''}
                  `}
                >
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest"><Users className="w-3 h-3" strokeWidth={2} /> {table.capacite}</div>
                    <span className="text-[8px] font-bold uppercase tracking-widest">{table.statut}</span>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-1">Table</span>
                    <span className="text-6xl font-bold tracking-tighter leading-none">{table.numero}</span>
                  </div>
                  
                  <div className="w-full pt-4 border-t border-current/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[9px] font-bold uppercase tracking-widest">Ouvrir</span>
                     <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
            <div className="h-20" />
          </div>
        )}
      </div>
    </div>
  );
};


