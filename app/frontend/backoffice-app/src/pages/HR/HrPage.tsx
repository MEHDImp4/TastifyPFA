import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/inventory_hr';
import type { Employe } from '../../types/inventory';
import { Plus, Edit2, Trash2, Users, Briefcase } from 'lucide-react';

import { CardSkeleton } from '../../components/ui/Skeleton';

export const HrPage: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchHr = async () => {
    try {
      const res = await hrApi.getEmployes();
      setEmployes(res.data);
    } catch (err) {
      console.error('Failed to fetch HR data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHr();
  }, []);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion du Personnel</h1>
          <p className="text-gray-400 mt-1">Gérez votre équipe, les postes et les fiches de paie.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-teal text-white rounded-xl font-medium transition-transform hover:brightness-110 active:scale-95 shadow-lg shadow-teal/20">
          <Plus className="w-5 h-5" />
          Ajouter un membre
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employes.map((emp) => (
            <div key={emp.id} className="p-6 bg-dark-surface rounded-[2.5rem] border border-white/10 shadow-xl group hover:border-teal/30 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-teal/10 flex items-center justify-center text-teal">
                    <Users className="w-7 h-7" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-dark/50 rounded-xl text-white hover:text-teal"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 bg-dark/50 rounded-xl text-white hover:text-terracotta"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-1">{emp.username}</h3>
              <p className="text-teal font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Briefcase className="w-3 h-3" />
                  <span>{emp.poste}</span>
              </p>
              
              <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Salaire</span>
                      <span className="font-bold">{emp.salaire} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">Date d'embauche</span>
                      <span className="text-white">{new Date(emp.date_embauche).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-medium">CIN</span>
                      <span className="text-white">{emp.cin}</span>
                  </div>
              </div>
            </div>
          ))}
          
          {employes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-gray-500 opacity-30">
                <Users className="w-16 h-16 mb-4" />
                <p>Aucun employé enregistré.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
