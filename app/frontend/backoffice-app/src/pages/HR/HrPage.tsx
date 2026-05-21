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
    <div className="max-w-[1400px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Human Resources</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold">Workforce Management & Payroll Audit</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
            <button 
                onClick={() => {
                    toast.success('GENERATING PAYROLL MANIFEST...');
                }}
                className="flex items-center gap-3 px-6 py-3 bg-background border-2 border-on-surface text-ui-button font-ui-button transition-all hover:bg-surface-container active:translate-y-[2px]"
            >
                <FileText className="w-5 h-5"  strokeWidth={2.5}/>
                <span>EXPORT MANIFEST</span>
            </button>
            <button className="flex items-center gap-3 px-6 py-3 bg-primary text-on-primary border-2 border-on-surface text-ui-button font-ui-button shadow-[4px_4px_0px_#301400] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400] active:translate-y-[2px] active:shadow-none">
                <Plus className="w-5 h-5"  strokeWidth={2.5}/>
                <span>ADD OPERATOR</span>
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
            <div key={emp.id} className="bg-surface-container border-2 border-on-surface p-6 transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_#301400]">
              <div className="flex items-start justify-between mb-8">
                <div className="w-12 h-12 border-2 border-on-surface bg-background flex items-center justify-center text-primary shadow-[3px_3px_0px_#301400]">
                    <Users className="w-7 h-7"  strokeWidth={2.5}/>
                </div>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 border-2 border-transparent hover:border-primary text-primary transition-all"><Edit2 className="w-4 h-4"  strokeWidth={2.5}/></button>
                    <button className="p-2 border-2 border-transparent hover:border-error text-error transition-all"><Trash2 className="w-4 h-4"  strokeWidth={2.5}/></button>
                </div>
              </div>
              
              <h3 className="text-ui-label-bold text-base text-on-surface font-black uppercase tracking-tight mb-2">{emp.username}</h3>
              <div className="flex items-center gap-2 bg-on-surface text-background px-3 py-1 w-fit mb-6">
                  <Briefcase className="w-3 h-3"  strokeWidth={2.5}/>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">{emp.poste.toUpperCase()}</span>
              </div>
              
              <div className="space-y-4 pt-6 border-t-2 border-on-surface/5">
                  <div className="flex justify-between items-end">
                      <span className="text-ui-label-bold text-[10px] text-on-surface-variant">MONTHLY REMUNERATION</span>
                      <span className="text-ui-data-dense font-black text-primary text-base">{emp.salaire} DH</span>
                  </div>
                  <div className="flex justify-between items-end">
                      <span className="text-ui-label-bold text-[10px] text-on-surface-variant">COMMISSION DATE</span>
                      <span className="text-ui-data-dense font-black text-on-surface">{new Date(emp.date_embauche).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between items-end">
                      <span className="text-ui-label-bold text-[10px] text-on-surface-variant">IDENTITY RECORD (CIN)</span>
                      <span className="text-ui-data-dense font-black text-on-surface uppercase">{emp.cin}</span>
                  </div>
              </div>
            </div>
          ))}
          
          {employes.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-on-surface-variant opacity-20">
                <Users className="w-16 h-10 mb-6"  strokeWidth={2.5}/>
                <p className="text-display-lg text-3xl italic uppercase tracking-tighter">No Active Personnel</p>
                <p className="text-ui-label-bold text-[11px] mt-4 tracking-[0.3em]">Operational roles vacant</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
