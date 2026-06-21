import React, { useEffect, useMemo, useState } from 'react';
import { loyaltyApi } from '../../api/loyalty';
import type { LoyaltyProfile, Reward, RewardPayload } from '../../api/loyalty';
import {
  Edit2,
  Gift,
  Loader2,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

type EditorMode = 'create' | 'edit';

interface EditorState extends RewardPayload {
  mode: EditorMode;
  id: number | null;
}

const EMPTY_EDITOR: EditorState = {
  mode: 'create',
  id: null,
  nom: '',
  description: '',
  points_requis: 100,
  est_actif: true,
};

export const LoyaltyPage: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [profiles, setProfiles] = useState<LoyaltyProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [rewardsRes, profilesRes] = await Promise.all([
        loyaltyApi.getRewards(),
        loyaltyApi.getProfiles().catch(() => ({ data: [] as LoyaltyProfile[] })),
      ]);
      setRewards(rewardsRes.data);
      setProfiles(profilesRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Chargement fidélité impossible');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const summary = useMemo(() => {
    const active = rewards.filter(reward => reward.est_actif).length;
    const inactive = rewards.length - active;
    const totalPoints = profiles.reduce((sum, profile) => sum + Number(profile.points), 0);
    return { active, inactive, totalPoints };
  }, [profiles, rewards]);

  const filteredRewards = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rewards;
    return rewards.filter(reward =>
      reward.nom.toLowerCase().includes(query) ||
      reward.description.toLowerCase().includes(query)
    );
  }, [rewards, search]);

  const openCreate = () => setEditor({ ...EMPTY_EDITOR });

  const openEdit = (reward: Reward) => setEditor({
    mode: 'edit',
    id: reward.id,
    nom: reward.nom,
    description: reward.description ?? '',
    points_requis: Number(reward.points_requis),
    est_actif: reward.est_actif,
  });

  const closeEditor = () => setEditor(null);

  const handleSave = async () => {
    if (!editor || !editor.nom.trim()) {
      toast.error('Nom de récompense obligatoire');
      return;
    }
    setIsSaving(true);
    const payload: RewardPayload = {
      nom: editor.nom.trim(),
      description: editor.description.trim(),
      points_requis: Number(editor.points_requis),
      est_actif: editor.est_actif,
    };

    try {
      if (editor.mode === 'create') {
        await loyaltyApi.createReward(payload);
        toast.success('Récompense créée');
      } else if (editor.id !== null) {
        await loyaltyApi.updateReward(editor.id, payload);
        toast.success('Récompense mise à jour');
      }
      closeEditor();
      await fetchData();
    } catch (err) {
      toast.error("Enregistrement impossible");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (reward: Reward) => {
    try {
      await loyaltyApi.updateReward(reward.id, { est_actif: !reward.est_actif });
      setRewards(prev => prev.map(item => item.id === reward.id ? { ...item, est_actif: !item.est_actif } : item));
      toast.success(reward.est_actif ? 'Récompense désactivée' : 'Récompense activée');
    } catch (err) {
      toast.error('Changement de statut impossible');
    }
  };

  const deleteReward = async (reward: Reward) => {
    try {
      await loyaltyApi.deleteReward(reward.id);
      setRewards(prev => prev.filter(item => item.id !== reward.id));
      toast.success('Récompense supprimée');
    } catch (err) {
      toast.error('Suppression impossible');
    }
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
          <button onClick={fetchData} className="btn-ghost h-10 px-4">
            <RotateCcw className="w-3.5 h-3.5" /> <span>Actualiser</span>
          </button>
          <button data-testid="loyalty-create-button" onClick={openCreate} className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Nouvelle Récompense</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6">
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Actives', value: summary.active },
            { label: 'Inactives', value: summary.inactive },
            { label: 'Points clients', value: summary.totalPoints.toFixed(2) },
          ].map(item => (
            <div key={item.label} className="atelier-card p-5">
              <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{item.label}</span>
              <p className="mt-2 font-mono text-2xl font-bold text-on-background">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="atelier-card flex flex-col min-h-[28rem]">
          <div className="flex flex-col gap-3 border-b border-outline p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Gift className="w-5 h-5 text-on-surface-variant opacity-50" />
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-background">Récompenses</h2>
            </div>
            <div className="relative group w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
              <input
                type="text"
                aria-label="Rechercher une récompense"
                placeholder="Rechercher..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="field-control w-full pl-10 pr-4 text-[10px] uppercase"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="border-b border-outline text-[9px] font-bold uppercase tracking-widest text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Récompense</th>
                  <th className="px-4 py-3">Points</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Mise à jour</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline">
                {filteredRewards.map(reward => (
                  <tr key={reward.id} data-testid={`loyalty-reward-${reward.id}`} className="text-sm text-on-background">
                    <td className="px-4 py-4">
                      <div className="font-bold">{reward.nom}</div>
                      <div className="mt-1 max-w-md truncate text-[10px] uppercase tracking-widest text-on-surface-variant opacity-50">{reward.description || 'Aucune description'}</div>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-accent">{Number(reward.points_requis).toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <button
                        type="button"
                        onClick={() => toggleActive(reward)}
                        className={`min-h-[44px] rounded-full border px-3 text-[9px] font-bold uppercase tracking-widest ${reward.est_actif ? 'border-success/30 bg-success/10 text-success' : 'border-outline bg-surface-container-high text-on-surface-variant'}`}
                      >
                        {reward.est_actif ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-4 text-[10px] uppercase tracking-widest text-on-surface-variant">
                      {new Date(reward.updated_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button aria-label={`Modifier ${reward.nom}`} onClick={() => openEdit(reward)} className="btn-icon"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button aria-label={`Supprimer ${reward.nom}`} onClick={() => deleteReward(reward)} className="btn-icon text-error hover:border-error/30 hover:text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRewards.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-16 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Aucune récompense trouvée
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {editor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={closeEditor} />
          <div role="dialog" aria-modal="true" aria-labelledby="loyalty-editor-title" className="relative w-full max-w-md max-h-[calc(100dvh-3rem)] bg-surface border border-outline rounded-xl flex flex-col shadow-2xl">
            <div className="p-6 border-b border-outline flex items-center justify-between">
              <h2 id="loyalty-editor-title" className="text-sm font-bold text-on-background uppercase tracking-[0.2em]">
                {editor.mode === 'create' ? 'Nouvelle Récompense' : 'Modifier la Récompense'}
              </h2>
              <button aria-label="Fermer l'éditeur" onClick={closeEditor} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 p-8 space-y-6 overflow-y-auto">
              <div className="space-y-2">
                <label htmlFor="reward-name" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Nom</label>
                <input
                  id="reward-name"
                  value={editor.nom}
                  onChange={event => setEditor(prev => prev ? { ...prev, nom: event.target.value } : prev)}
                  className="field-control"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reward-description" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Description</label>
                <textarea
                  id="reward-description"
                  value={editor.description}
                  onChange={event => setEditor(prev => prev ? { ...prev, description: event.target.value } : prev)}
                  rows={3}
                  className="field-control min-h-28 py-3 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="reward-points" className="block text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Points requis</label>
                <input
                  id="reward-points"
                  type="number"
                  min={0}
                  step="0.01"
                  value={editor.points_requis}
                  onChange={event => setEditor(prev => prev ? { ...prev, points_requis: Number(event.target.value) } : prev)}
                  className="field-control"
                />
              </div>
              <label className="flex min-h-[44px] items-center justify-between rounded-lg border border-outline px-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Récompense active</span>
                <input
                  type="checkbox"
                  checked={editor.est_actif}
                  onChange={event => setEditor(prev => prev ? { ...prev, est_actif: event.target.checked } : prev)}
                  className="h-4 w-4 accent-current"
                />
              </label>
            </div>

            <div className="p-6 border-t border-outline flex gap-3">
              <button onClick={closeEditor} className="flex-1 h-12 border border-outline rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-background transition-all">Annuler</button>
              <button onClick={handleSave} disabled={isSaving} className="flex-[2] btn-primary h-12">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Enregistrer</span></>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
