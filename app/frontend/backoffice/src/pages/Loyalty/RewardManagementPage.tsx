import React, { useState, useEffect } from 'react';
import axiosInstance from '@shared/auth/axiosInstance';
import { Plus, Edit, Trash, Check, X } from 'lucide-react';
import { Reward } from '@shared/types/loyalty';

const RewardManagementPage: React.FC = () => {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Reward>>({});

  const fetchRewards = async () => {
    try {
      const resp = await axiosInstance.get('/rewards/');
      setRewards(resp.data);
    } catch (err) {
      console.error('Failed to fetch rewards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const handleCreate = async () => {
    try {
      const resp = await axiosInstance.post('/rewards/', {
        nom: 'Nouvelle Récompense',
        description: 'Description...',
        points_requis: 100,
        est_actif: true
      });
      setRewards([...rewards, resp.data]);
      setEditingId(resp.data.id);
      setEditForm(resp.data);
    } catch (err) {
      alert('Erreur lors de la création');
    }
  };

  const handleUpdate = async (id: number) => {
    try {
      const resp = await axiosInstance.patch(`/rewards/${id}/`, editForm);
      setRewards(rewards.map(r => r.id === id ? resp.data : r));
      setEditingId(null);
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette récompense ?')) return;
    try {
      await axiosInstance.delete(`/rewards/${id}/`);
      setRewards(rewards.filter(r => r.id !== id));
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  if (loading) return <div className="p-6 text-white">Chargement...</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Gestion des Récompenses</h1>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition"
        >
          <Plus size={18} />
          Ajouter une récompense
        </button>
      </div>

      <div className="grid gap-4">
        {rewards.map(reward => (
          <div key={reward.id} className="bg-surface border border-white/5 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {editingId === reward.id ? (
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                <input 
                  className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white"
                  value={editForm.nom || ''} 
                  onChange={e => setEditForm({...editForm, nom: e.target.value})}
                  placeholder="Nom"
                />
                <input 
                  className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white"
                  value={editForm.description || ''} 
                  onChange={e => setEditForm({...editForm, description: e.target.value})}
                  placeholder="Description"
                />
                <input 
                  type="number"
                  className="bg-black/20 border border-white/10 rounded px-3 py-1 text-white w-24"
                  value={editForm.points_requis || ''} 
                  onChange={e => setEditForm({...editForm, points_requis: e.target.value})}
                  placeholder="Points"
                />
              </div>
            ) : (
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg">{reward.nom}</h3>
                <p className="text-gray-400 text-sm">{reward.description}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-primary font-bold">{reward.points_requis} points</span>
                  {!reward.est_actif && <span className="text-red-400 text-xs px-2 py-0.5 bg-red-400/10 rounded">Inactif</span>}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 shrink-0">
              {editingId === reward.id ? (
                <>
                  <button onClick={() => handleUpdate(reward.id)} className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg"><Check size={20}/></button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-gray-400 hover:bg-white/10 rounded-lg"><X size={20}/></button>
                </>
              ) : (
                <>
                  <button onClick={() => { setEditingId(reward.id); setEditForm(reward); }} className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"><Edit size={20}/></button>
                  <button onClick={() => handleDelete(reward.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"><Trash size={20}/></button>
                </>
              )}
            </div>
          </div>
        ))}

        {rewards.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-surface rounded-xl border border-dashed border-white/10">
            Aucune récompense configurée.
          </div>
        )}
      </div>
    </div>
  );
};

export default RewardManagementPage;
