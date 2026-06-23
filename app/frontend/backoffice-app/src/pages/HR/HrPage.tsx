import React, { useState, useEffect, useMemo } from 'react';
import { hrApi } from '../../api/inventory_hr';
import type { Employe, Shift, OffreEmploi, Candidature } from '../../types/inventory';
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
  Briefcase,
  Plus,
  Edit2,
  Trash2,
  CalendarClock,
  UserPlus,
  FileText,
  Building2,
  Filter,
  X
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

type Tab = 'employes' | 'shifts' | 'recrutement';
type RecrutementTab = 'offres' | 'candidatures';
type OffreForm = Pick<OffreEmploi, 'titre' | 'description' | 'type_contrat' | 'salaire_propose' | 'est_publiee'>;

const ROLE_TABS = ['ALL', 'GERANT', 'CUISINIER', 'SERVEUR'] as const;
const CONTRAT_OPTIONS = ['CDI', 'CDD', 'SAISONNIER'] as const;
const STATUT_OPTIONS = ['NOUVELLE', 'ENTRETENUE', 'REFUSEE', 'RECRUTEE'] as const;

const getEmployeRole = (emp: Employe) => emp.user_details?.role || emp.poste || 'SERVEUR';
const getEmployeSearchText = (emp: Employe) => [
  emp.id, emp.username, emp.first_name, emp.last_name, emp.email,
  emp.poste, emp.telephone, emp.cin,
  emp.user_details?.username, emp.user_details?.first_name, emp.user_details?.last_name,
  emp.user_details?.email, emp.user_details?.role,
].filter(Boolean).join(' ').toLowerCase();

const formatRoleLabel = (role: string) => role.replace('_', ' ');

interface EditorState {
  mode: 'create' | 'edit';
  id?: number;
}

export const HrPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('employes');
  const [recrutementTab, setRecrutementTab] = useState<RecrutementTab>('offres');
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const [totalCount, setTotalCount] = useState(0);

  // Employés state
  const [employes, setEmployes] = useState<Employe[]>([]);
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Editor state
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Delete state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: number; label: string } | null>(null);

  // ---- Editor form fields (Employé) ----
  const [formEmploye, setFormEmploye] = useState({
    username: '', password: '', first_name: '', last_name: '',
    email: '', role: 'SERVEUR', poste: '', salaire: '',
    date_embauche: '', telephone: '', cin: '',
  });

  // Shifts state
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedEmployeShift, setSelectedEmployeShift] = useState<number | ''>('');
  const [employeList, setEmployeList] = useState<Employe[]>([]);

  // Shift editor form
  const [shiftEditorOpen, setShiftEditorOpen] = useState(false);
  const [shiftForm, setShiftForm] = useState({ employe: '', jour: '', heure_debut: '', heure_fin: '', notes: '' });

  // Offres state
  const [offres, setOffres] = useState<OffreEmploi[]>([]);

  // Offre editor form
  const [offreEditorOpen, setOffreEditorOpen] = useState(false);
  const [editingOffre, setEditingOffre] = useState<OffreEmploi | null>(null);
  const [offreForm, setOffreForm] = useState<OffreForm>({ titre: '', description: '', type_contrat: 'CDI', salaire_propose: '', est_publiee: true });

  // Candidatures state
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);

  // ============ DATA FETCHING ============

  const fetchEmployes = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await hrApi.getEmployesPage({
        page, page_size: itemsPerPage,
        search: search.trim() || undefined,
        poste: activeFilter === 'ALL' ? undefined : activeFilter,
      });
      setEmployes(res.data.results);
      setTotalCount(res.data.count);
    } catch { toast.error('Erreur chargement personnel'); }
    finally { setIsLoading(false); setHasLoaded(true); }
  };

  const fetchAllEmployes = async () => {
    try {
      const res = await hrApi.getEmployes();
      setEmployeList(res.data);
    } catch { /* silent */ }
  };

  const fetchShifts = async () => {
    try {
      const params: any = {};
      if (selectedEmployeShift) params.employe = selectedEmployeShift;
      const res = await hrApi.getShifts(params);
      setShifts(res.data);
    } catch { toast.error('Erreur chargement plannings'); }
  };

  const fetchOffres = async () => {
    try {
      const res = await hrApi.getOffres();
      setOffres(res.data.results);
    } catch { toast.error('Erreur chargement offres'); }
  };

  const fetchCandidatures = async () => {
    try {
      const res = await hrApi.getCandidatures();
      setCandidatures(res.data);
    } catch { toast.error('Erreur chargement candidatures'); }
  };

  useEffect(() => {
    if (activeTab === 'employes') {
      fetchEmployes();
      fetchAllEmployes();
    } else if (activeTab === 'shifts') {
      fetchAllEmployes();
      fetchShifts();
    } else if (activeTab === 'recrutement') {
      fetchOffres();
      fetchCandidatures();
    }
  }, [activeTab]);

  useEffect(() => { if (activeTab === 'employes') fetchEmployes(); }, [currentPage, search, activeFilter]);
  useEffect(() => { if (activeTab === 'shifts') fetchShifts(); }, [selectedEmployeShift]);
  useEffect(() => { if (activeTab === 'recrutement') { fetchOffres(); fetchCandidatures(); } }, [recrutementTab]);

  // ============ EMPLOYÉ CRUD ============

  const openEmployeEditor = (emp?: Employe) => {
    if (emp) {
      setEditor({ mode: 'edit', id: emp.id });
      setFormEmploye({
        username: emp.user_details?.username || emp.username || '',
        password: '', first_name: emp.user_details?.first_name || emp.first_name || '',
        last_name: emp.user_details?.last_name || emp.last_name || '',
        email: emp.user_details?.email || emp.email || '',
        role: emp.user_details?.role || emp.poste || 'SERVEUR',
        poste: emp.poste || '', salaire: emp.salaire || '',
        date_embauche: emp.date_embauche || '', telephone: emp.telephone || '',
        cin: emp.cin || '',
      });
    } else {
      setEditor({ mode: 'create' });
      setFormEmploye({ username: '', password: '', first_name: '', last_name: '',
        email: '', role: 'SERVEUR', poste: '', salaire: '',
        date_embauche: new Date().toISOString().split('T')[0], telephone: '', cin: '' });
    }
    setSaveError('');
  };

  const closeEditor = () => { setEditor(null); setSaveError(''); };

  const handleSaveEmploye = async () => {
    setIsSaving(true);
    setSaveError('');
    try {
      const payload: any = { ...formEmploye };
      if (editor?.mode === 'create') {
        await hrApi.createEmploye(payload);
        toast.success(`${formEmploye.username} créé`);
      } else if (editor?.id) {
        if (!payload.password) delete payload.password;
        await hrApi.updateEmploye(editor.id, payload);
        toast.success(`${formEmploye.first_name || formEmploye.username} mis à jour`);
      }
      closeEditor();
      fetchEmployes();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data || 'Échec enregistrement';
      const msg = typeof detail === 'string' ? detail : Object.values(detail).flat().join(', ');
      setSaveError(msg);
    } finally { setIsSaving(false); }
  };

  const handleDeleteEmploye = async () => {
    if (!deleteTarget || deleteTarget.type !== 'employe') return;
    try {
      await hrApi.deleteEmploye(deleteTarget.id);
      toast.success('Employé désactivé');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchEmployes();
    } catch { toast.error('Échec suppression'); }
  };

  // ============ SHIFT CRUD ============

  const handleCreateShift = async () => {
    if (!shiftForm.employe || !shiftForm.jour || !shiftForm.heure_debut || !shiftForm.heure_fin) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      await hrApi.createShift({
        employe: Number(shiftForm.employe),
        jour: shiftForm.jour,
        heure_debut: shiftForm.heure_debut,
        heure_fin: shiftForm.heure_fin,
        notes: shiftForm.notes,
      });
      toast.success('Shift ajouté');
      setShiftEditorOpen(false);
      setShiftForm({ employe: '', jour: '', heure_debut: '', heure_fin: '', notes: '' });
      fetchShifts();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur création shift');
    }
  };

  const handleDeleteShift = async () => {
    if (!deleteTarget || deleteTarget.type !== 'shift') return;
    try {
      await hrApi.deleteShift(deleteTarget.id);
      toast.success('Shift supprimé');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchShifts();
    } catch { toast.error('Échec suppression shift'); }
  };

  // ============ OFFRE CRUD ============

  const openOffreEditor = (offre?: OffreEmploi) => {
    if (offre) {
      setEditingOffre(offre);
      setOffreForm({ titre: offre.titre, description: offre.description,
        type_contrat: offre.type_contrat, salaire_propose: offre.salaire_propose,
        est_publiee: offre.est_publiee });
    } else {
      setEditingOffre(null);
      setOffreForm({ titre: '', description: '', type_contrat: 'CDI', salaire_propose: '', est_publiee: true });
    }
    setOffreEditorOpen(true);
  };

  const handleSaveOffre = async () => {
    if (!offreForm.titre) { toast.error('Le titre est requis'); return; }
    try {
      if (editingOffre) {
        await hrApi.updateOffre(editingOffre.id, offreForm);
        toast.success('Offre mise à jour');
      } else {
        await hrApi.createOffre(offreForm);
        toast.success('Offre créée');
      }
      setOffreEditorOpen(false);
      fetchOffres();
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || 'Erreur enregistrement offre');
    }
  };

  const handleDeleteOffre = async () => {
    if (!deleteTarget || deleteTarget.type !== 'offre') return;
    try {
      await hrApi.deleteOffre(deleteTarget.id);
      toast.success('Offre supprimée');
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchOffres();
    } catch { toast.error('Échec suppression offre'); }
  };

  // ============ CANDIDATURE STATUS ============

  const handleUpdateCandidatureStatus = async (id: number, statut: string) => {
    try {
      await hrApi.updateCandidatureStatus(id, statut);
      toast.success('Statut mis à jour');
      fetchCandidatures();
    } catch { toast.error('Erreur mise à jour statut'); }
  };

  // ============ EXPORT CSV ============

  const handleExportCSV = async () => {
    try {
      toast.info("Préparation de l'export");
      const exportRes = await hrApi.getEmployes({
        search: search.trim() || undefined,
        poste: activeFilter === 'ALL' ? undefined : activeFilter,
      });
      if (exportRes.data.length === 0) return;
      const headers = ["ID", "IDENTIFIANT", "IDENTITÉ", "POSTE", "EMAIL", "TÉLÉPHONE"];
      const rows = exportRes.data.map(e => [
        `#${e.id}`,
        e.user_details?.username || e.username || 'N/R',
        `${e.user_details?.first_name || e.first_name || ''} ${e.user_details?.last_name || e.last_name || ''}`.trim() || 'N/R',
        e.poste,
        e.user_details?.email || e.email || 'N/R',
        e.telephone || 'N/R'
      ]);
      const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "PERSONNEL_TASTIFY.csv"; a.click();
      toast.success("Liste exportée");
    } catch { toast.error("Export impossible"); }
  };

  // ============ RENDER HELPERS ============

  const visibleEmployes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employes.filter(e => {
      const roleMatch = activeFilter === 'ALL' || getEmployeRole(e) === activeFilter || e.poste === activeFilter;
      const searchMatch = !q || getEmployeSearchText(e).includes(q);
      return roleMatch && searchMatch;
    });
  }, [activeFilter, employes, search]);

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  if (isLoading && !hasLoaded && activeTab === 'employes') {
    return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;
  }

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 min-h-[44px] px-5 rounded font-bold text-[9px] uppercase tracking-widest transition-all ${
        activeTab === tab
          ? 'bg-on-background text-background'
          : 'bg-surface border border-outline text-on-background hover:border-on-background'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">

      {/* HEADER */}
      <div className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
          {/* Tab Navigation */}
          <div className="flex gap-2">
            <TabButton tab="employes" label="Employés" icon={<Users className="w-3.5 h-3.5" />} />
            <TabButton tab="shifts" label="Plannings" icon={<CalendarClock className="w-3.5 h-3.5" />} />
            <TabButton tab="recrutement" label="Recrutement" icon={<UserPlus className="w-3.5 h-3.5" />} />
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">

        {/* ===== TAB: EMPLOYÉS ===== */}
        {activeTab === 'employes' && (
          <>
            <div className="flex-none flex flex-wrap items-center gap-3 px-4 md:px-8 py-3 border-b border-outline bg-surface/50">
              <div className="relative group w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
                <input
                  type="text" aria-label="Rechercher dans le personnel"
                  placeholder="Rechercher nom, poste ou ID..."
                  value={search}
                  onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                  className="field-control w-full sm:w-56 pl-10 pr-4 text-[10px] uppercase"
                />
              </div>
              <button onClick={handleExportCSV} className="btn-ghost h-10 px-4">
                <Download className="w-3.5 h-3.5" /> <span>Exporter</span>
              </button>
              <button onClick={() => openEmployeEditor()} className="btn-primary h-10 px-6">
                <Plus className="w-4 h-4" /> <span>Ajouter</span>
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-8 gap-4 md:gap-8 min-h-0">
              {isLoading && (
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.5} /> Recherche en cours
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {ROLE_TABS.map(tab => (
                    <button key={tab} onClick={() => { setActiveFilter(tab); setCurrentPage(1); }}
                      className={`min-h-[44px] px-4 rounded font-bold text-[9px] uppercase tracking-widest transition-all ${activeFilter === tab ? 'bg-on-background text-background' : 'bg-surface border border-outline text-on-background hover:border-on-background'}`}
                    >{tab === 'ALL' ? "Toute l'équipe" : tab}</button>
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
                  <div className="min-w-[900px]">
                    <div className="flex-none grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <div className="col-span-1 flex items-center gap-2"><Hash className="w-2.5 h-2.5" /> ID</div>
                      <div className="col-span-3">Identité</div>
                      <div className="col-span-2 text-center">Rôle</div>
                      <div className="col-span-1 text-center">Statut</div>
                      <div className="col-span-3">Contact</div>
                      <div className="col-span-2 text-center">Actions</div>
                    </div>

                    {visibleEmployes.length > 0 ? visibleEmployes.map((emp) => (
                      <div key={emp.id} className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline hover:bg-background/50 transition-colors items-center group">
                        <div className="col-span-1 font-mono text-[10px] font-bold text-on-surface-variant">#{emp.id.toString().slice(-4)}</div>
                        <div className="col-span-3 flex items-center gap-4 min-w-0">
                          <div className="w-9 h-9 rounded bg-background border border-outline flex items-center justify-center shrink-0">
                            <span className="text-[11px] font-bold text-on-background">
                              {(emp.user_details?.first_name || emp.first_name || emp.user_details?.username || emp.username || '?').charAt(0).toUpperCase()}
                            </span>
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
                            <span className="text-[9px] font-bold uppercase tracking-widest">{formatRoleLabel(getEmployeRole(emp))}</span>
                          </div>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <div className={`flex items-center gap-2 px-3 py-1 rounded border ${(emp.user_details?.is_active ?? emp.is_active ?? true) ? 'bg-success/5 border-success/30 text-success' : 'bg-surface-container-low border-outline text-on-surface-variant'}`}>
                            <div className={`w-1 h-1 rounded-full ${(emp.user_details?.is_active ?? emp.is_active ?? true) ? 'bg-success' : 'bg-outline-variant'}`} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">{(emp.user_details?.is_active ?? emp.is_active ?? true) ? 'ACTIF' : 'INACTIF'}</span>
                          </div>
                        </div>
                        <div className="col-span-3 space-y-1">
                          <div className="flex items-center gap-2 text-on-surface-variant/60">
                            <Mail className="w-3 h-3 opacity-20" />
                            <span className="text-[9px] font-bold truncate">{emp.user_details?.email || emp.email || 'N/R'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-on-surface-variant/60">
                            <Phone className="w-3 h-3 opacity-20" />
                            <span className="text-[9px] font-bold">{emp.telephone || 'N/R'}</span>
                          </div>
                        </div>
                        <div className="col-span-2 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button aria-label={`Modifier ${emp.user_details?.first_name || emp.first_name || emp.username}`} onClick={() => openEmployeEditor(emp)} className="btn-icon">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button aria-label={`Supprimer ${emp.user_details?.first_name || emp.first_name || emp.username}`}
                            onClick={() => { setDeleteTarget({ type: 'employe', id: emp.id, label: emp.user_details?.first_name || emp.first_name || emp.username || emp.id.toString() }); setIsDeleteModalOpen(true); }}
                            className="btn-icon text-error hover:border-error/30 hover:text-error">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">Total : {totalCount} employés</span>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-3">
                      <button aria-label="Page précédente" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn-icon"><ChevronLeft className="w-3.5 h-3.5" /></button>
                      <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-on-surface-variant">
                        <span className="text-on-background">{currentPage}</span><span>/</span><span>{totalPages}</span>
                      </div>
                      <button aria-label="Page suivante" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn-icon"><ChevronRight className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== TAB: SHIFTS ===== */}
        {activeTab === 'shifts' && (
          <>
            <div className="flex-none flex flex-wrap items-center gap-3 px-4 md:px-8 py-3 border-b border-outline bg-surface/50">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-on-surface-variant" />
                <select
                  value={selectedEmployeShift}
                  onChange={e => setSelectedEmployeShift(e.target.value ? Number(e.target.value) : '')}
                  className="field-control text-[10px] uppercase w-56"
                >
                  <option value="">Tous les employés</option>
                  {employeList.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.user_details?.first_name || e.first_name} {e.user_details?.last_name || e.last_name} - {e.poste}
                    </option>
                  ))}
                </select>
              </div>
              <button onClick={() => {
                setShiftForm({ employe: selectedEmployeShift ? String(selectedEmployeShift) : '', jour: new Date().toISOString().split('T')[0], heure_debut: '08:00', heure_fin: '16:00', notes: '' });
                setShiftEditorOpen(true);
              }} className="btn-primary h-10 px-6">
                <Plus className="w-4 h-4" /> <span>Ajouter un shift</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
              {shifts.length > 0 ? (
                <div className="atelier-card overflow-hidden">
                  <div className="min-w-[600px]">
                    <div className="grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                      <div className="col-span-3">Employé</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2 text-center">Début</div>
                      <div className="col-span-2 text-center">Fin</div>
                      <div className="col-span-2 text-center">Notes</div>
                      <div className="col-span-1 text-center">Action</div>
                    </div>
                    {shifts.map(s => (
                      <div key={s.id} className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-outline hover:bg-background/50 transition-colors items-center group">
                        <div className="col-span-3 font-bold text-[10px] uppercase tracking-wider text-on-background">{s.employe_name || `#${s.employe}`}</div>
                        <div className="col-span-2 font-mono text-[10px] text-on-surface-variant">{s.jour}</div>
                        <div className="col-span-2 text-center font-mono text-[10px] font-bold text-on-background">{s.heure_debut.slice(0, 5)}</div>
                        <div className="col-span-2 text-center font-mono text-[10px] font-bold text-on-background">{s.heure_fin.slice(0, 5)}</div>
                        <div className="col-span-2 text-[9px] text-on-surface-variant truncate">{s.notes || '—'}</div>
                        <div className="col-span-1 flex justify-center">
                          <button onClick={() => { setDeleteTarget({ type: 'shift', id: s.id, label: `${s.employe_name || `#${s.employe}`} - ${s.jour}` }); setIsDeleteModalOpen(true); }}
                            className="btn-icon text-error hover:border-error/30 hover:text-error opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                  <CalendarClock className="w-12 h-12 mb-4" strokeWidth={1} />
                  <p className="text-[10px] font-bold uppercase tracking-widest">Aucun shift trouvé</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ===== TAB: RECRUTEMENT ===== */}
        {activeTab === 'recrutement' && (
          <>
            <div className="flex-none flex items-center gap-2 px-4 md:px-8 py-3 border-b border-outline bg-surface/50">
              <button onClick={() => setRecrutementTab('offres')}
                className={`min-h-[44px] px-4 rounded font-bold text-[9px] uppercase tracking-widest transition-all ${recrutementTab === 'offres' ? 'bg-on-background text-background' : 'bg-surface border border-outline text-on-background hover:border-on-background'}`}>
                <Building2 className="w-3 h-3 inline mr-1.5" /> Offres d'emploi
              </button>
              <button onClick={() => setRecrutementTab('candidatures')}
                className={`min-h-[44px] px-4 rounded font-bold text-[9px] uppercase tracking-widest transition-all ${recrutementTab === 'candidatures' ? 'bg-on-background text-background' : 'bg-surface border border-outline text-on-background hover:border-on-background'}`}>
                <FileText className="w-3 h-3 inline mr-1.5" /> Candidatures
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
              {/* Offres */}
              {recrutementTab === 'offres' && (
                <>
                  <div className="mb-4">
                    <button onClick={() => openOffreEditor()} className="btn-primary h-10 px-6">
                      <Plus className="w-4 h-4" /> <span>Nouvelle offre</span>
                    </button>
                  </div>
                  {offres.length > 0 ? (
                    <div className="atelier-card overflow-hidden">
                      <div className="min-w-[700px]">
                        <div className="grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                          <div className="col-span-3">Titre</div>
                          <div className="col-span-2">Type</div>
                          <div className="col-span-2 text-center">Publiée</div>
                          <div className="col-span-2 text-center">Candidatures</div>
                          <div className="col-span-3 text-center">Actions</div>
                        </div>
                        {offres.map(o => (
                          <div key={o.id} className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-outline hover:bg-background/50 transition-colors items-center group">
                            <div className="col-span-3 font-bold text-[10px] uppercase tracking-wider text-on-background">{o.titre}</div>
                            <div className="col-span-2 text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">{o.type_contrat}</div>
                            <div className="col-span-2 flex justify-center">
                              <div className={`px-3 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${o.est_publiee ? 'bg-success/5 text-success border border-success/30' : 'bg-surface-container-low text-on-surface-variant border border-outline'}`}>
                                {o.est_publiee ? 'Oui' : 'Non'}
                              </div>
                            </div>
                            <div className="col-span-2 text-center font-mono text-[10px] font-bold text-on-background">{o.candidatures_count || 0}</div>
                            <div className="col-span-3 flex justify-center gap-2">
                              <button onClick={() => openOffreEditor(o)} className="btn-icon"><Edit2 className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { setDeleteTarget({ type: 'offre', id: o.id, label: o.titre }); setIsDeleteModalOpen(true); }}
                                className="btn-icon text-error hover:border-error/30 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center opacity-10">
                      <Building2 className="w-12 h-12 mb-4" strokeWidth={1} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Aucune offre d'emploi</p>
                    </div>
                  )}
                </>
              )}

              {/* Candidatures */}
              {recrutementTab === 'candidatures' && (
                <>
                  {candidatures.length > 0 ? (
                    <div className="atelier-card overflow-hidden">
                      <div className="min-w-[700px]">
                        <div className="grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                          <div className="col-span-3">Candidat</div>
                          <div className="col-span-2">Offre</div>
                          <div className="col-span-2">Contact</div>
                          <div className="col-span-3 text-center">Statut</div>
                          <div className="col-span-2 text-center">Date</div>
                        </div>
                        {candidatures.map(c => (
                          <div key={c.id} className="grid grid-cols-12 gap-4 px-8 py-4 border-b border-outline hover:bg-background/50 transition-colors items-center group">
                            <div className="col-span-3">
                              <p className="text-[10px] font-bold text-on-background uppercase tracking-wider">{c.nom_complet}</p>
                            </div>
                            <div className="col-span-2 text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{c.offre_titre || `#${c.offre}`}</div>
                            <div className="col-span-2 text-[9px] text-on-surface-variant">
                              <p>{c.email}</p>
                              <p className="text-[8px]">{c.telephone}</p>
                            </div>
                            <div className="col-span-3 flex justify-center">
                              <select
                                value={c.statut}
                                onChange={e => handleUpdateCandidatureStatus(c.id, e.target.value)}
                                className={`text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded border cursor-pointer ${
                                  c.statut === 'NOUVELLE' ? 'bg-surface-container-high border-outline text-on-background' :
                                  c.statut === 'ENTRETENUE' ? 'bg-primary/5 border-primary/30 text-primary' :
                                  c.statut === 'RECRUTEE' ? 'bg-success/5 border-success/30 text-success' :
                                  'bg-error/5 border-error/30 text-error'
                                }`}
                              >
                                {STATUT_OPTIONS.map(s => (
                                  <option key={s} value={s}>
                                    {s === 'NOUVELLE' ? 'Nouvelle' : s === 'ENTRETENUE' ? 'Entretien' : s === 'RECRUTEE' ? 'Recrutée' : 'Refusée'}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2 text-center font-mono text-[9px] text-on-surface-variant">
                              {new Date(c.created_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center opacity-10">
                      <FileText className="w-12 h-12 mb-4" strokeWidth={1} />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Aucune candidature</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ============ EMPLOYÉ EDITOR (SLIDE-IN PANEL) ============ */}
      <AnimatePresence>
        {editor && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={closeEditor} />
            <div role="dialog" aria-modal="true" className="relative w-full max-w-md h-full bg-surface border-l border-outline flex flex-col shadow-2xl">
              <div className="p-8 border-b border-outline bg-surface-container-high flex items-center justify-between">
                <h2 className="text-sm font-bold text-on-background uppercase tracking-[0.3em]">
                  {editor.mode === 'create' ? "Nouvel employé" : "Modifier l'employé"}
                </h2>
                <button onClick={closeEditor} className="btn-icon"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 md:p-10 space-y-5 flex-1 overflow-y-auto custom-scrollbar">
                {saveError && <p role="alert" className="text-[9px] font-bold text-error bg-error/5 border border-error/30 rounded-lg px-4 py-3 uppercase tracking-widest">{saveError}</p>}

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Identifiant *</label>
                  <input value={formEmploye.username} onChange={e => setFormEmploye(f => ({ ...f, username: e.target.value }))} type="text" className="field-control" placeholder="Nom d'utilisateur" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">{editor.mode === 'create' ? 'Mot de passe *' : 'Mot de passe (laisser vide pour conserver)'}</label>
                  <input value={formEmploye.password} onChange={e => setFormEmploye(f => ({ ...f, password: e.target.value }))} type="password" className="field-control" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Prénom</label>
                    <input value={formEmploye.first_name} onChange={e => setFormEmploye(f => ({ ...f, first_name: e.target.value }))} type="text" className="field-control" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Nom</label>
                    <input value={formEmploye.last_name} onChange={e => setFormEmploye(f => ({ ...f, last_name: e.target.value }))} type="text" className="field-control" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Email</label>
                  <input value={formEmploye.email} onChange={e => setFormEmploye(f => ({ ...f, email: e.target.value }))} type="email" className="field-control" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Rôle *</label>
                    <select value={formEmploye.role} onChange={e => setFormEmploye(f => ({ ...f, role: e.target.value }))} className="field-control">
                      <option value="GERANT">Gérant</option>
                      <option value="CUISINIER">Cuisinier</option>
                      <option value="SERVEUR">Serveur</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Poste *</label>
                    <input value={formEmploye.poste} onChange={e => setFormEmploye(f => ({ ...f, poste: e.target.value }))} type="text" className="field-control" placeholder="ex: Chef de rang" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Salaire (DH)</label>
                    <input value={formEmploye.salaire} onChange={e => setFormEmploye(f => ({ ...f, salaire: e.target.value }))} type="number" className="field-control" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Date d'embauche *</label>
                    <input value={formEmploye.date_embauche} onChange={e => setFormEmploye(f => ({ ...f, date_embauche: e.target.value }))} type="date" className="field-control" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Téléphone</label>
                    <input value={formEmploye.telephone} onChange={e => setFormEmploye(f => ({ ...f, telephone: e.target.value }))} type="text" className="field-control" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">CIN</label>
                    <input value={formEmploye.cin} onChange={e => setFormEmploye(f => ({ ...f, cin: e.target.value }))} type="text" className="field-control" />
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 border-t border-outline bg-surface-container-high flex gap-4">
                <button type="button" onClick={closeEditor} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
                <button onClick={handleSaveEmploye} disabled={isSaving} className="flex-[2] btn-primary h-12">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Enregistrer</span>}
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ SHIFT EDITOR (MODAL) ============ */}
      <AnimatePresence>
        {shiftEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setShiftEditorOpen(false)} />
            <div role="dialog" aria-modal="true" className="relative w-full max-w-md bg-surface border border-outline rounded-xl shadow-2xl">
              <div className="p-6 border-b border-outline bg-surface-container-high rounded-t-xl flex items-center justify-between">
                <h2 className="text-sm font-bold text-on-background uppercase tracking-[0.3em]">Nouveau shift</h2>
                <button onClick={() => setShiftEditorOpen(false)} className="btn-icon"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Employé *</label>
                  <select value={shiftForm.employe} onChange={e => setShiftForm(f => ({ ...f, employe: e.target.value }))} className="field-control">
                    <option value="">Sélectionner...</option>
                    {employeList.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.user_details?.first_name || e.first_name} {e.user_details?.last_name || e.last_name} - {e.poste}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Date *</label>
                  <input value={shiftForm.jour} onChange={e => setShiftForm(f => ({ ...f, jour: e.target.value }))} type="date" className="field-control" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Début *</label>
                    <input value={shiftForm.heure_debut} onChange={e => setShiftForm(f => ({ ...f, heure_debut: e.target.value }))} type="time" className="field-control" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Fin *</label>
                    <input value={shiftForm.heure_fin} onChange={e => setShiftForm(f => ({ ...f, heure_fin: e.target.value }))} type="time" className="field-control" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Notes</label>
                  <input value={shiftForm.notes} onChange={e => setShiftForm(f => ({ ...f, notes: e.target.value }))} type="text" className="field-control" placeholder="Optionnel" />
                </div>
              </div>
              <div className="p-6 border-t border-outline bg-surface-container-high rounded-b-xl flex gap-4">
                <button onClick={() => setShiftEditorOpen(false)} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
                <button onClick={handleCreateShift} className="flex-[2] btn-primary h-12">Ajouter</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ OFFRE EDITOR (MODAL) ============ */}
      <AnimatePresence>
        {offreEditorOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setOffreEditorOpen(false)} />
            <div role="dialog" aria-modal="true" className="relative w-full max-w-md bg-surface border border-outline rounded-xl shadow-2xl">
              <div className="p-6 border-b border-outline bg-surface-container-high rounded-t-xl flex items-center justify-between">
                <h2 className="text-sm font-bold text-on-background uppercase tracking-[0.3em]">
                  {editingOffre ? "Modifier l'offre" : "Nouvelle offre"}
                </h2>
                <button onClick={() => setOffreEditorOpen(false)} className="btn-icon"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Titre *</label>
                  <input value={offreForm.titre} onChange={e => setOffreForm(f => ({ ...f, titre: e.target.value }))} type="text" className="field-control" placeholder="ex: Chef de cuisine" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Description</label>
                  <textarea value={offreForm.description} onChange={e => setOffreForm(f => ({ ...f, description: e.target.value }))} className="field-control min-h-[100px]" placeholder="Décrivez le poste..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Type de contrat</label>
                    <select value={offreForm.type_contrat} onChange={e => setOffreForm(f => ({ ...f, type_contrat: e.target.value as OffreForm['type_contrat'] }))} className="field-control">
                      {CONTRAT_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest ml-1">Salaire proposé</label>
                    <input value={offreForm.salaire_propose} onChange={e => setOffreForm(f => ({ ...f, salaire_propose: e.target.value }))} type="text" className="field-control" placeholder="ex: 5000 DH" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input id="offre-publiee" type="checkbox" checked={offreForm.est_publiee} onChange={e => setOffreForm(f => ({ ...f, est_publiee: e.target.checked }))}
                    className="w-4 h-4 rounded border-outline text-on-background focus:ring-0" />
                  <label htmlFor="offre-publiee" className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant cursor-pointer">Publier l'offre</label>
                </div>
              </div>
              <div className="p-6 border-t border-outline bg-surface-container-high rounded-b-xl flex gap-4">
                <button onClick={() => setOffreEditorOpen(false)} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
                <button onClick={handleSaveOffre} className="flex-[2] btn-primary h-12">Enregistrer</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ============ CONFIRMATION MODAL ============ */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => { setIsDeleteModalOpen(false); setDeleteTarget(null); }}
        onConfirm={
          deleteTarget?.type === 'employe' ? handleDeleteEmploye :
          deleteTarget?.type === 'shift' ? handleDeleteShift :
          deleteTarget?.type === 'offre' ? handleDeleteOffre :
          () => {}
        }
        title={
          deleteTarget?.type === 'employe' ? "Désactiver l'employé" :
          deleteTarget?.type === 'shift' ? 'Supprimer le shift' :
          "Supprimer l'offre"
        }
        message={
          deleteTarget?.type === 'employe'
            ? `L'utilisateur sera désactivé mais ses données resteront accessibles.`
            : `Voulez-vous supprimer définitivement cet élément ?`
        }
        confirmLabel={
          deleteTarget?.type === 'employe' ? 'Désactiver' : 'Supprimer'
        }
        variant="danger"
      />
    </div>
  );
};
