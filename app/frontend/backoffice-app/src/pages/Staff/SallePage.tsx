import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { salleApi } from '../../api/salle';
import type { Table } from '../../types/salle';
import { Loader2, Users, Plus } from 'lucide-react';

export const SallePage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchTables = async () => {
    try {
      const res = await salleApi.getTables();
      setTables(res.data);
    } catch (err) {
      console.error('Failed to fetch tables', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 10000); // Polling every 10s
    return () => clearInterval(interval);
  }, []);

  const getStatutColor = (statut: Table['statut']) => {
    switch (statut) {
      case 'LIBRE': return 'bg-teal text-white border-teal/20';
      case 'OCCUPEE': return 'bg-orange text-white border-orange/20';
      case 'RESERVEE': return 'bg-amber text-dark border-amber/20';
      case 'ENCAISSEMENT': return 'bg-terracotta text-white border-terracotta/20';
      default: return 'bg-gray-500 text-white';
    }
  };

  const handleTableClick = (table: Table) => {
    navigate(`/ordering/${table.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plan de Salle</h1>
          <p className="text-gray-400 mt-1">Visualisez et gérez l'état de vos tables.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-6 px-6 py-3 bg-dark-surface rounded-2xl border border-white/5 shadow-sm">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-teal" />
               <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Libre</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-orange" />
               <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Occupée</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded-full bg-amber" />
               <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Réservée</span>
             </div>
           </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-teal" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {tables.filter(t => t.est_active).map((table) => (
            <button
              key={table.id}
              onClick={() => handleTableClick(table)}
              className={`
                relative aspect-square flex flex-col items-center justify-center gap-3 p-6 rounded-[2.5rem] border-2 transition-all duration-300
                hover:scale-105 active:scale-95 shadow-xl
                ${getStatutColor(table.statut)}
                ${table.statut === 'LIBRE' ? 'hover:shadow-teal/20' : 'hover:shadow-orange/20'}
              `}
            >
              <div className="text-4xl font-bold font-mono tracking-tighter">#{table.numero}</div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-black/10 rounded-full text-xs font-bold uppercase tracking-widest">
                <Users className="w-3 h-3" />
                <span>{table.capacite}</span>
              </div>
              
              {table.statut === 'OCCUPEE' && (
                <div className="absolute top-4 right-4">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                  </span>
                </div>
              )}
            </button>
          ))}
          
          <button className="aspect-square flex flex-col items-center justify-center gap-2 p-6 rounded-[2.5rem] border-2 border-dashed border-white/10 text-gray-500 hover:border-teal/50 hover:text-teal transition-all">
            <Plus className="w-8 h-8" />
            <span className="text-xs font-bold uppercase tracking-widest">Nouvelle Table</span>
          </button>
        </div>
      )}
    </div>
  );
};
