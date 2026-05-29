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
        if (employes.length === 0) return;
        const reportTitle = "REGISTRE DU PERSONNEL TASTIFY OS";
        const headers = ["ID", "PSEUDONYME", "IDENTITÉ", "POSTE", "EMAIL", "TELEPHONE"];
        const rows = employes.map(e => [
            `#${e.id.toString().padStart(4, '0')}`,
            e.user_details?.username?.toUpperCase() || 'N/A',
            `${e.user_details?.first_name || ''} ${e.user_details?.last_name || ''}`.toUpperCase().trim() || 'N/A',
            e.poste.toUpperCase(),
            e.user_details?.email || 'N/A',
            e.telephone || 'N/A'
        ]);
        const csvContent = "\uFEFF" + [`"${reportTitle}"`, "", headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PERSONNEL_TASTIFY_${new Date().toISOString().split('T')[0]}.csv`);
        link.click();
        toast.success("REGISTRE EXPORTÉ");
    } catch (err) {
        toast.error("ERREUR EXPORT");
    }
  };

  const filteredEmployes = employes.filter(emp => {
    const fullName = `${emp.user_details?.first_name || ''} ${emp.user_details?.last_name || ''}`.trim();
    const u = emp.user_details?.username || '';
    const matchesSearch = 
      u.toLowerCase().includes(search.toLowerCase()) || 
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.poste.toLowerCase().includes(search.toLowerCase());
      
    if (activeTab === 'ALL') return matchesSearch;
    return matchesSearch && emp.poste.toUpperCase().includes(activeTab);
  });

  const totalPages = Math.ceil(filteredEmployes.length / itemsPerPage);
  const paginatedEmployes = filteredEmployes.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* HR Header */}
      <div className="flex-none flex justify-between items-end px-8 py-8 border-b border-outline bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface uppercase italic leading-none">Capital Humain <span className="sr-only">Human Resources</span></h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.4em] mt-3 opacity-50">Gestion du Registre du Personnel et des Accès Staff</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH BY NAME, ROLE, OR ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-64 h-12 bg-surface-container-low border border-outline pl-12 pr-4 rounded-lg text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button onClick={handleExportCSV} className="h-12 px-6 border border-outline rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
             <Download className="w-4 h-4 inline-block mr-2" /> Registre CSV
          </button>
          <button className="btn-primary">
            <Plus className="w-4 h-4" strokeWidth={3} /> Nouvel Employé
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 min-h-0">
        
        {/* Top Status Bar */}
        <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
                {['ALL', 'GERANT', 'CUISINIER', 'SERVEUR'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => { setActiveFilter(tab); setCurrentPage(1); }}
                        className={`px-6 h-10 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-on-primary' : 'bg-surface-container-low border border-outline text-on-surface-variant/60 hover:text-on-surface'}`}
                    >
                        {tab === 'ALL' ? 'Tout l\'Effectif' : tab}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-8 bg-surface-container-lowest border border-outline px-8 py-3 rounded-xl">
                <div className="text-center border-r border-outline pr-8">
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Effectif Actif</p>
                    <p className="text-lg font-black text-on-surface mt-1">{employes.filter(e => e.user_details?.is_active).length}</p>
                </div>
                <div className="text-center">
                    <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">Postes Ouverts</p>
                    <p className="text-lg font-black text-primary mt-1">GRILL, SALLE</p>
                </div>
            </div>
        </div>

        <div className="flex-1 bg-surface-container-lowest border border-outline rounded-xl overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="flex-none grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline bg-surface-container-low text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-3 h-3" /> ID</div>
            <div className="col-span-3">Identité de l'Employé</div>
            <div className="col-span-2 text-center">Poste / Rôle</div>
            <div className="col-span-2 text-center">Statut</div>
            <div className="col-span-2">Contact Direct</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {paginatedEmployes.length > 0 ? paginatedEmployes.map((emp) => (
                <div 
                  key={emp.id}
                  className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline-variant hover:bg-white/[0.02] transition-colors items-center group"
                >
                  <div className="col-span-1 font-mono text-xs font-bold text-on-surface-variant/40">#{emp.id.toString().padStart(4, '0')}</div>
                  <div className="col-span-3 flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded bg-background border border-outline flex items-center justify-center shrink-0">
                        <span className="font-serif text-sm font-black text-on-surface">{(emp.user_details?.first_name || emp.user_details?.username || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-sm font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                            {emp.user_details?.first_name && emp.user_details?.last_name 
                            ? `${emp.user_details.first_name} ${emp.user_details.last_name}`
                            : emp.user_details?.username || 'Inconnu'}
                        </h3>
                        <p className="text-[9px] font-mono font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-50">@{emp.user_details?.username || 'no_user'}</p>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className="flex items-center gap-2 px-3 py-1 bg-surface-container-low border border-outline rounded text-on-surface">
                        <Briefcase className="w-3 h-3 text-primary" />
                        <span className="text-[10px] font-black uppercase tracking-widest">{emp.poste}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded border ${emp.user_details?.is_active ? 'bg-success/5 border-success/30 text-success' : 'bg-surface-container-low border-outline text-on-surface-variant/40'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${emp.user_details?.is_active ? 'bg-success' : 'bg-outline-variant'}`} />
                      <span className="text-[9px] font-black uppercase tracking-widest">{emp.user_details?.is_active ? 'OPÉRATIONNEL' : 'HORS SERVICE'}</span>
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <div className="flex items-center gap-2 text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
                      <Mail className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold truncate">{emp.user_details?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant opacity-60 hover:opacity-100 transition-opacity">
                      <Phone className="w-3 h-3 text-primary" />
                      <span className="text-[10px] font-bold">{emp.telephone || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-all"><Edit2 className="w-4 h-4" /></button>
                    <button className="w-9 h-9 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all"><MoreVertical className="w-4 h-4" /></button>
                  </div>
                </div>
            )) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Users className="w-16 h-16 mb-4" strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.4em]">Annuaire Vide</p>
                </div>
            )}
          </div>

          {/* Table Footer */}
          <div className="flex-none px-8 py-5 border-t border-outline bg-surface-container-low flex justify-between items-center">
            <span className="text-[9px] font-black text-on-surface-variant/40 uppercase tracking-widest">
                Total : {filteredEmployes.length} Dossiers Personnel
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-outline rounded hover:bg-white/5 disabled:opacity-10 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex items-center gap-2 font-mono text-xs font-black bg-background border border-outline px-4 py-2 rounded">
                        <span className="text-primary">{currentPage}</span>
                        <span className="text-on-surface-variant/30">/</span>
                        <span className="text-on-surface">{totalPages}</span>
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-outline rounded hover:bg-white/5 disabled:opacity-10 transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
