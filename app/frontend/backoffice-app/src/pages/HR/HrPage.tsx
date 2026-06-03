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
  MoreVertical,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Hash,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';

export const HrPage: React.FC = () => {
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveFilter] = useState('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const fetchHr = async () => {
    try {
      const res = await hrApi.getEmployes();
      setEmployes(res.data);
    } catch (err) {
      console.error('Failed to fetch HR data', err);
      toast.error('Erreur chargement personnel');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHr();
  }, []);

  const handleExportCSV = () => {
    try {
        toast.info("GENERATING_EXPORT_STREAM");
        if (employes.length === 0) return;
        const headers = ["ID", "PSEUDONYME", "IDENTITÉ", "POSTE", "EMAIL", "TELEPHONE"];
        const rows = employes.map(e => [
            `#${e.id}`,
            e.user_details?.username || e.username || 'N/A',
            `${e.user_details?.first_name || e.first_name || ''} ${e.user_details?.last_name || e.last_name || ''}`.trim() || 'N/A',
            e.poste,
            e.user_details?.email || e.email || 'N/A',
            e.telephone || 'N/A'
        ]);
        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PERSONNEL_TASTIFY.csv`);
        link.click();
        toast.success("REGISTRE EXPORTÉ");
    } catch (err) {
        toast.error("ERREUR EXPORT");
    }
  };

  const filteredEmployes = employes.filter(emp => {
    const fullName = `${emp.user_details?.first_name || emp.first_name || ''} ${emp.user_details?.last_name || emp.last_name || ''}`.trim();
    const u = emp.user_details?.username || emp.username || '';
    const matchesSearch = 
      u.toLowerCase().includes(search.toLowerCase()) || 
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.poste.toLowerCase().includes(search.toLowerCase());
      
    if (activeTab === 'ALL') return matchesSearch;
    return matchesSearch && emp.poste.toUpperCase().includes(activeTab);
  });

  const totalPages = Math.ceil(filteredEmployes.length / itemsPerPage);
  const paginatedEmployes = filteredEmployes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      
      {/* Header */}
      <div className="flex-none flex justify-between items-center px-8 h-20 border-b border-outline bg-surface">
        <div>
          <h1 aria-label="Human Resources" className="text-sm font-bold tracking-widest text-on-background uppercase">Registre du Personnel</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Gestion des effectifs et accès opérationnels</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH BY NAME, ROLE, OR ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-48 h-10 bg-background border border-outline pl-10 pr-4 rounded text-[10px] font-bold text-on-background focus:border-on-background outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button onClick={handleExportCSV} className="btn-ghost h-10 px-4">
             <Download className="w-3.5 h-3.5" /> <span>EXPORT ROSTER</span>
          </button>
          <button className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Nouvel Employé</span>
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 gap-8 min-h-0">
        
        {/* Top Status Bar */}
        <div className="flex items-center justify-between">
            <div className="flex gap-2">
                {['ALL', 'GERANT', 'CUISINIER', 'SERVEUR'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => { setActiveFilter(tab); setCurrentPage(1); }}
                        className={`px-4 h-9 rounded font-bold text-[9px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-on-background text-background' : 'bg-surface border border-outline text-on-surface-variant hover:text-on-background'}`}
                    >
                        {tab === 'ALL' ? 'Tout l\'Effectif' : tab}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-8 bg-surface border border-outline px-6 py-2.5 rounded-lg">
                <div className="text-center border-r border-outline pr-8">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Effectif Actif</p>
                    <p className="text-lg font-bold text-on-background mt-0.5">{employes.filter(e => e.user_details?.is_active ?? e.is_active ?? true).length}</p>
                </div>
                <div className="text-center">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Opérationnel</p>
                    <p className="text-lg font-bold text-success mt-0.5">READY</p>
                </div>
            </div>
        </div>

        <div className="flex-1 atelier-card overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="flex-none grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-2.5 h-2.5" /> ID</div>
            <div className="col-span-3">Identité</div>
            <div className="col-span-2 text-center">Rôle</div>
            <div className="col-span-2 text-center">Statut</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {paginatedEmployes.length > 0 ? paginatedEmployes.map((emp) => (
                <div 
                  key={emp.id}
                  className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline hover:bg-background/50 transition-colors items-center group"
                >
                  <div className="col-span-1 font-mono text-[10px] font-bold text-on-surface-variant">#{emp.id.toString().slice(-4)}</div>
                  <div className="col-span-3 flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded bg-background border border-outline flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-on-background">{(emp.user_details?.first_name || emp.first_name || emp.user_details?.username || emp.username || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-[11px] font-bold text-on-background uppercase tracking-wider truncate">
                            {(emp.user_details?.first_name || emp.first_name) && (emp.user_details?.last_name || emp.last_name)
                            ? `${emp.user_details?.first_name || emp.first_name} ${emp.user_details?.last_name || emp.last_name}`
                            : emp.user_details?.username || emp.username || 'Inconnu'}
                        </h3>
                        <p className="text-[8px] font-mono text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">@{emp.user_details?.username || emp.username || 'no_user'}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-high border border-outline rounded text-on-background">
                        <Briefcase className="w-3 h-3 opacity-20" />
                        <span className="text-[9px] font-bold uppercase tracking-widest">{emp.poste}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded border ${(emp.user_details?.is_active ?? emp.is_active ?? true) ? 'bg-success/5 border-success/30 text-success' : 'bg-surface-container-low border-outline text-on-surface-variant'}`}>
                      <div className={`w-1 h-1 rounded-full ${(emp.user_details?.is_active ?? emp.is_active ?? true) ? 'bg-success' : 'bg-outline-variant'}`} />
                      <span className="text-[8px] font-bold uppercase tracking-widest">{(emp.user_details?.is_active ?? emp.is_active ?? true) ? 'ACTIF' : 'OFF'}</span>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center gap-2 text-on-surface-variant/60 hover:text-on-background transition-colors">
                      <Mail className="w-3 h-3 opacity-20" />
                      <span className="text-[9px] font-bold truncate">{emp.user_details?.email || emp.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant/60 hover:text-on-background transition-colors">
                      <Phone className="w-3 h-3 opacity-20" />
                      <span className="text-[9px] font-bold">{emp.telephone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button className="w-8 h-8 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-on-background transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button className="w-8 h-8 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-on-background transition-all"><MoreVertical className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
            )) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Users className="w-12 h-12 mb-4" strokeWidth={1} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">NO STAFF RECORDS FOUND</p>
                </div>
            )}
          </div>

          {/* Table Footer */}
          <div className="flex-none px-8 h-14 border-t border-outline bg-surface-container-high flex justify-between items-center">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                Total : {filteredEmployes.length} Dossiers
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-outline rounded hover:bg-background disabled:opacity-10 transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-on-surface-variant">
                        <span className="text-on-background">{currentPage}</span>
                        <span>/</span>
                        <span>{totalPages}</span>
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border border-outline rounded hover:bg-background disabled:opacity-10 transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

