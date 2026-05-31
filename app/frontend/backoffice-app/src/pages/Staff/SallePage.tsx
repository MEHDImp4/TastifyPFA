import React, { useState, useEffect } from 'react';
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
  
  const fetchData = async () => {
    try {
      const tablesRes = await salleApi.getTables();
      setTables(tablesRes.data);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [lastUpdate]);

  const handleTableClick = (table: Table) => {
    navigate(`/ordering/${table.id}`);
  };

  return (
    <div className="h-full flex flex-col bg-background -m-4 overflow-hidden selection:bg-primary/20 selection:text-primary font-body">
      
      {/* Header */}
      <div className="flex-none flex items-center justify-between px-staff-margin py-4 border-b border-outline-variant bg-surface-container-lowest shadow-md">
        <div className="flex items-center gap-6">
          <h1 className="text-xl font-black tracking-tight text-on-surface uppercase ">Plan de Salle</h1>
          <div className="hidden sm:flex items-center gap-6 border-l border-outline-variant/20 pl-6">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 border-2 border-outline-variant bg-surface-container-low rounded-md"></div>
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">Libre</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-primary rounded-md"></div>
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-on-surface">Occupé</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-error rounded-md animate-pulse"></div>
              <span className="font-sans text-[10px] font-black uppercase tracking-[0.2em] text-error">Addition</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-primary">
            <Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/>
          </div>
        ) : (
          <div className="h-full w-full overflow-y-auto custom-scrollbar p-6 bg-background">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-5">
              {tables.filter(t => t.est_active).sort((a, b) => a.numero - b.numero).map((table) => (
                <button
                  key={`grid-table-${table.id}`}
                  aria-label={'Table ' + table.numero}
                  onClick={() => handleTableClick(table)}
                  className={`
                    aspect-square rounded-[2.5rem] flex flex-col items-center justify-between p-8 transition-all active:scale-95 border-2 relative overflow-hidden group
                    ${table.statut === 'LIBRE' ? 'bg-surface-container border-outline-variant/40 text-on-surface hover:border-primary/40' : ''}
                    ${table.statut === 'OCCUPEE' ? 'bg-primary border-primary text-on-primary bg-amber' : ''}
                    ${table.statut === 'ENCAISSEMENT' ? 'bg-error border-error text-on-error animate-pulse' : ''}
                    ${table.statut === 'RESERVEE' ? 'bg-surface-container-high border-primary-container text-primary border-dashed bg-aged-paper' : ''}
                  `}
                >
                  <div className="w-full flex justify-between items-center opacity-60">
                    <div className="flex items-center gap-2 font-sans text-[10px] font-black uppercase tracking-widest"><Users className="w-3.5 h-3.5" /> {table.capacite}</div>
                    <span className="font-sans text-[8px] font-black uppercase tracking-[0.2em]">{table.statut}</span>
                  </div>
                  <span className="font-serif text-6xl font-black  tracking-tighter"><span className="sr-only">Table </span>{table.numero}</span>
                  <div className="w-full pt-4 border-t border-current/10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="font-sans text-[10px] font-black uppercase tracking-widest">Ouvrir</span>
                     <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              ))}
            </div>
            <div className="h-32" />
          </div>
        )}
      </div>
    </div>
  );
};
