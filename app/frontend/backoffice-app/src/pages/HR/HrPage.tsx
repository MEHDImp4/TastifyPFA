import React, { useState, useEffect } from 'react';
import { hrApi } from '../../api/inventory_hr';
import type { Employe } from '../../types/inventory';
import {
  Users,
  Loader2,
  Search,
  Download,
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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [totalCount, setTotalCount] = useState(0);

  const fetchHr = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await hrApi.getEmployesPage({
        page,
        page_size: itemsPerPage,
        search: search.trim() || undefined,
        poste: activeTab === 'ALL' ? undefined : activeTab,
      });
      setEmployes(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch HR data', err);
      toast.error('Erreur chargement personnel');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHr();
  }, [currentPage, search, activeTab]);

  const handleExportCSV = async () => {
    try {
        toast.info("Préparation de l'export");
        const exportRes = await hrApi.getEmployes({
          search: search.trim() || undefined,
          poste: activeTab === 'ALL' ? undefined : activeTab,
        });
        if (exportRes.data.length === 0) return;
        const headers = ["ID", "IDENTIFIANT", "IDENTITÉ", "POSTE", "EMAIL", "TÉLÉPHONE"];
        const rows = exportRes.data.map(e => [
            `#${e.id}`,
            e.user_details?.username || e.username || 'Non renseigné',
            `${e.user_details?.first_name || e.first_name || ''} ${e.user_details?.last_name || e.last_name || ''}`.trim() || 'Non renseigné',
            e.poste,
            e.user_details?.email || e.email || 'Non renseigné',
            e.telephone || 'Non renseigné'
        ]);
        const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(row => row.join(";"))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `PERSONNEL_TASTIFY.csv`);
        link.click();
        toast.success("Liste exportée");
    } catch (err) {
        toast.error("Export impossible");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">

      <div className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div>
          <h1 aria-label="Ressources humaines" className="text-sm font-bold tracking-widest text-on-background uppercase">Personnel</h1>
          <p className="text-[10px] font-bold text-on-surface-variant tracking-widest mt-1 opacity-60">Employés, postes et contacts</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
           <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input
              type="text"
              aria-label="Rechercher dans le personnel"
              placeholder="Rechercher nom, poste ou ID..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="field-control w-full sm:w-56 pl-10 pr-4 text-[10px] uppercase"
            />
          </div>
          <button onClick={handleExportCSV} className="btn-ghost h-10 px-4">
             <Download className="w-3.5 h-3.5" /> <span>Exporter</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-8 gap-4 md:gap-8 min-h-0">

        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
                {['ALL', 'GERANT', 'CUISINIER', 'SERVEUR'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveFilter(tab); setCurrentPage(1); }}
                        className={`min-h-[44px] px-4 rounded font-bold text-[9px] uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-on-background text-background' : 'bg-surface border border-outline text-on-background hover:border-on-background'}`}
                    >
                        {tab === 'ALL' ? 'Toute l\'équipe' : tab}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-8 bg-surface border border-outline px-6 py-2.5 rounded-lg">
                <div className="text-center border-r border-outline pr-8">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Employés</p>
                    <p className="text-lg font-bold text-on-background mt-0.5">{totalCount}</p>
                </div>
                <div className="text-center">
                    <p className="text-[8px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Statut</p>
                    <p className="text-lg font-bold text-success mt-0.5">Prêt</p>
                </div>
            </div>
        </div>

        <div className="flex-1 atelier-card overflow-hidden flex flex-col">

          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-[750px]">
          <div className="flex-none grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-2.5 h-2.5" /> ID</div>
            <div className="col-span-3">Identité</div>
            <div className="col-span-2 text-center">Rôle</div>
            <div className="col-span-2 text-center">Statut</div>
            <div className="col-span-4">Contact</div>
          </div>

            {employes.length > 0 ? employes.map((emp) => (
                <div
                  key={emp.id}
                  className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline hover:bg-background/50 transition-colors items-center group"
                >
                  <div className="col-span-1 font-mono text-[10px] font-bold text-on-surface-variant">#{emp.id.toString().slice(-4)}</div>
                  <div className="col-span-3 flex items-center gap-4 min-w-0">
                    <div className="w-9 h-9 rounded bg-background border border-outline flex items-center justify-center shrink-0">
                        <span className="text-[11px] font-bold text-on-background">{(emp.user_details?.first_name || emp.first_name || emp.user_details?.username || emp.username || '?').charAt(0).toUpperCase()}</span>
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
                      <span className="text-[8px] font-bold uppercase tracking-widest">{(emp.user_details?.is_active ?? emp.is_active ?? true) ? 'ACTIF' : 'INACTIF'}</span>
                    </div>
                  </div>
                  <div className="col-span-4 space-y-1">
                    <div className="flex items-center gap-2 text-on-surface-variant/60">
                      <Mail className="w-3 h-3 opacity-20" />
                      <span className="text-[9px] font-bold truncate">{emp.user_details?.email || emp.email || 'Non renseigné'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-on-surface-variant/60">
                      <Phone className="w-3 h-3 opacity-20" />
                      <span className="text-[9px] font-bold">{emp.telephone || 'Non renseigné'}</span>
                    </div>
                  </div>
                </div>
            )) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Users className="w-12 h-12 mb-4" strokeWidth={1} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Aucun membre du personnel trouvé</p>
                </div>
            )}
            </div>
          </div>

          <div className="flex-none px-4 md:px-8 h-14 border-t border-outline bg-surface-container-high flex justify-between items-center gap-4">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                Total : {totalCount} employés
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-3">
                    <button aria-label="Page précédente" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-icon"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-on-surface-variant">
                        <span className="text-on-background">{currentPage}</span>
                        <span>/</span>
                        <span>{totalPages}</span>
                    </div>
                    <button aria-label="Page suivante" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-icon"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
