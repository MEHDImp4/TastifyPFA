import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/inventory_hr';
import type { Employe } from '../../types/inventory';
import { 
  Plus, 
  Edit2, 
  Users, 
  Loader2, 
  Search, 
  Download,
  TrendingUp,
  Clock,
  AlertTriangle,
  MoreVertical,
  Mail,
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const HrPage: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveFilter] = useState('ALL');

  const fetchHr = async () => {
    try {
      const res = await hrApi.getEmployes();
      setEmployes(res.data);
    } catch (err) {
      console.error('Failed to fetch HR data', err);
      toast.error('Personnel record load failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHr();
  }, []);

  const filteredEmployes = employes.filter(emp => {
    const u = emp.username || '';
    const matchesSearch = u.toLowerCase().includes(search.toLowerCase()) || emp.poste.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'ALL') return matchesSearch;
    return matchesSearch && emp.poste.toUpperCase().includes(activeTab);
  });

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Page Header */}
      <header className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main sticky top-0 z-30 backdrop-blur-md bg-surface-main/90">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Human Resources</h1>
          <h2 className="sr-only">Employés</h2>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Staff roster and credential management</p>
        </div>
        <div className="flex gap-unit-md items-center">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all">
            <Download className="w-3.5 h-3.5" /> Exporter la liste
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-staff-margin bg-surface-container-lowest custom-scrollbar space-y-staff-margin">
        
        {/* KPI Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-unit-md">
          {/* Total Staff */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Total Personnel</span>
              <Users className="w-5 h-5 text-on-surface-variant/30" />
            </div>
            <div className="mt-6 z-10 flex items-end gap-3">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">{employes.length}</span>
              <span className="font-sans text-[9px] text-primary font-black uppercase tracking-widest mb-1 flex items-center gap-1">
                 <TrendingUp className="w-3 h-3" /> +2 this month
              </span>
            </div>
          </div>

          {/* Active Shifts */}
          <div className="bg-surface-container border border-outline-variant rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Active Shifts</span>
              <Clock className="w-5 h-5 text-on-surface-variant/30" />
            </div>
            <div className="mt-6 z-10">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">{Math.floor(employes.length * 0.4)}</span>
              <span className="block font-sans text-[10px] text-on-surface-variant uppercase tracking-widest mt-1">/ 24 Station Capacity</span>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-secondary-container/20 border border-primary/30 rounded-lg p-6 flex flex-col justify-between shadow-sm relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-primary uppercase tracking-widest">Pending Approvals</span>
              <AlertTriangle className="w-5 h-5 text-primary opacity-50" />
            </div>
            <div className="mt-6 z-10">
              <span className="font-serif text-3xl font-black text-primary tabular-nums">4</span>
              <span className="block font-sans text-[10px] text-primary/60 uppercase tracking-widest mt-1">Action required</span>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <section className="flex flex-col sm:flex-row justify-between items-center gap-unit-md bg-surface-container p-unit-sm rounded-lg border border-outline-variant">
          <div className="relative w-full sm:w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary" />
            <input 
              type="text"
              placeholder="SEARCH BY NAME, ROLE, OR ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-surface-main border border-outline-variant rounded py-2 pl-10 pr-3 text-on-surface font-sans text-xs font-bold focus:border-primary focus:ring-0 transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {['ALL', 'GERANT', 'CUISINIER', 'SERVEUR'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveFilter(tab)}
                className={`px-4 py-1.5 rounded-full border font-sans text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab ? 'bg-primary/10 border-primary text-primary' : 'border-outline-variant text-on-surface-variant hover:border-outline'}`}
              >
                {tab === 'ALL' ? 'All Staff' : tab}
              </button>
            ))}
          </div>
        </section>

        {/* Staff Data Grid */}
        <div className="bg-surface-main border border-outline-variant rounded-lg overflow-hidden flex flex-col shadow-2xl mb-8">
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-surface-container border-b border-outline-variant font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
            <div className="col-span-4 sm:col-span-3">Employee</div>
            <div className="col-span-3 hidden sm:block">Role & Sector</div>
            <div className="col-span-3 sm:col-span-2 text-center">Status</div>
            <div className="col-span-3 hidden md:block">Operational Contact</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          <div className="flex flex-col divide-y divide-outline-variant/30 min-h-[200px]">
            <AnimatePresence mode="popLayout">
              {filteredEmployes.map((emp) => (
                <motion.div 
                  key={emp.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-12 gap-4 px-6 py-4 items-center group hover:bg-surface-container-low transition-colors"
                >
                  <div className="col-span-4 sm:col-span-3 flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded bg-surface-container-highest border border-outline-variant flex items-center justify-center overflow-hidden shrink-0 relative shadow-inner">
                      <span className="font-serif text-sm font-black text-on-surface-variant">{(emp.username || 'U').charAt(0).toUpperCase()}</span>
                      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-surface-container-low" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-sans text-[13px] font-black text-on-surface uppercase tracking-tight truncate group-hover:text-primary transition-colors">{emp.username}</h3>
                      <p className="font-mono text-[9px] text-on-surface-variant uppercase tracking-widest opacity-40">ID: EMP-{emp.id.toString().padStart(4, '0')}</p>
                    </div>
                  </div>

                  <div className="col-span-3 hidden sm:flex flex-col justify-center">
                    <span className="font-sans text-[11px] font-bold text-on-surface uppercase">{emp.poste}</span>
                    <span className="font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">Operations</span>
                  </div>

                  <div className="col-span-3 sm:col-span-2 flex justify-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-success/5 border border-success/20 text-success font-sans text-[9px] font-black uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                      On Shift
                    </span>
                  </div>

                  <div className="col-span-3 hidden md:flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2 text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    <Mail className="w-3 h-3" />
                    <span className="font-sans text-[10px] font-bold">{(emp.username || 'unknown').toLowerCase()}@staff.os</span>
                  </div>
                  <div className="flex items-center gap-2 text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                    <Phone className="w-3 h-3" />
                    <span className="font-sans text-[10px] font-bold">+212-6-00-00-00</span>
                  </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button className="p-2 rounded hover:bg-primary/10 hover:text-primary transition-all active:scale-75">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded hover:bg-surface-container-highest text-on-surface-variant transition-all active:scale-75">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {filteredEmployes.length === 0 && (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-on-surface-variant/20">
                <Users className="w-16 h-16 mb-4 stroke-[1]" />
                <p className="font-sans text-[10px] font-black uppercase tracking-[0.4em]">Aucun employé enregistré.</p>
              </div>
            )}
          </div>

          <div className="flex-none px-6 py-3 border-t border-outline-variant bg-surface-container flex justify-between items-center font-sans text-[9px] font-black text-on-surface-variant uppercase tracking-[0.2em]">
            <span>Active Record Count: {filteredEmployes.length}</span>
            <div className="flex gap-4">
               <button className="px-2 py-1 rounded hover:bg-surface-container-high transition-all disabled:opacity-20">Prev</button>
               <span className="px-2 py-1 bg-primary text-on-primary rounded">1</span>
               <button className="px-2 py-1 rounded hover:bg-surface-container-high transition-all">2</button>
               <button className="px-2 py-1 rounded hover:bg-surface-container-high transition-all">Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

