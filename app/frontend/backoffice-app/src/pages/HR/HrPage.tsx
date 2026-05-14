import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/inventory_hr';
import type { Employe } from '../../types/inventory';
import { Plus, Edit2, Trash2, Users, Briefcase, FileText } from 'lucide-react';
import { toast } from 'sonner';

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
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#301400' }}>Gestion du Personnel</h1>
          <p className="mt-1 font-medium" style={{ color: '#53443a' }}>Gérez votre équipe, les postes et les fiches de paie.</p>
        </div>
        <div className="flex gap-4">
            <button 
                onClick={() => {
                    toast.success('Génération du PDF en cours...');
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-surface-container border border-outline-variant/30 rounded-xl font-bold transition-transform hover:border-primary active:scale-95"
                style={{ color: '#301400' }}
            >
                <FileText className="w-4 h-4" />
                Exporter la liste (PDF)
            </button>
            <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-bold transition-transform hover:brightness-110 active:scale-95 shadow-lg shadow-primary/20">
                <Plus className="w-5 h-5" />
                Ajouter un membre
            </button>
        </div>
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
            <div key={emp.id} className="p-6 tonal-card group hover:border-primary/30 transition-all">
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary">
                    <Users className="w-7 h-7" />
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 bg-surface-container rounded-xl text-primary hover:bg-primary hover:text-on-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 bg-surface-container rounded-xl text-error hover:bg-error hover:text-on-error transition-colors"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-bold mb-1" style={{ color: '#301400' }}>{emp.username}</h3>
              <p className="text-primary font-mono text-xs font-bold uppercase tracking-widest flex items-center gap-2 mb-4">
                  <Briefcase className="w-3 h-3" />
                  <span>{emp.poste}</span>
              </p>
              
              <div className="space-y-3 pt-4 border-t border-outline-variant/30">
                  <div className="flex justify-between text-sm">
                      <span className="font-bold" style={{ color: '#53443a' }}>Salaire</span>
                      <span className="font-bold" style={{ color: '#301400' }}>{emp.salaire} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="font-bold" style={{ color: '#53443a' }}>Date d'embauche</span>
                      <span className="font-bold" style={{ color: '#301400' }}>{new Date(emp.date_embauche).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="font-bold" style={{ color: '#53443a' }}>CIN</span>
                      <span className="font-bold" style={{ color: '#301400' }}>{emp.cin}</span>
                  </div>
              </div>
            </div>
          ))}
          
          {employes.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center" style={{ color: '#53443a', opacity: 0.5 }}>
                <Users className="w-16 h-16 mb-4" />
                <p className="font-bold">Aucun employé enregistré.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
