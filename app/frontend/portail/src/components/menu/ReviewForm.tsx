import React, { useState } from 'react';
import { createAvis } from '../../api/avis';

interface ReviewFormProps {
  platId?: number;
  commandeId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ platId, commandeId, onSuccess, onCancel }) => {
  const [note, setNote] = useState(5);
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentaire.trim()) {
      setError('Veuillez laisser un commentaire.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAvis({
        plat: platId,
        commande: commandeId,
        commentaire,
        note,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Une erreur est survenue lors de l\'envoi de votre avis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground-muted">Note</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setNote(star)}
              className={`text-2xl transition-transform active:scale-90 ${
                star <= note ? 'text-amber' : 'text-white/10'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="commentaire" className="text-sm font-medium text-foreground-muted">
          Votre avis
        </label>
        <textarea
          id="commentaire"
          value={commentaire}
          onChange={(e) => setCommentaire(e.target.value)}
          placeholder="Dites-nous ce que vous en avez pensé..."
          className="min-h-[120px] w-full rounded-xl border border-white/10 bg-background/50 p-4 text-white outline-none focus:border-teal/50"
        />
      </div>

      {error && <p className="text-xs text-terracotta">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-lg border border-white/10 py-3 text-sm font-bold uppercase tracking-widest text-foreground-muted hover:bg-white/5 active:scale-95 transition-all"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-lg bg-teal py-3 text-sm font-bold uppercase tracking-widest text-white shadow-lg shadow-teal/20 hover:brightness-110 disabled:opacity-50 active:scale-95 transition-all"
        >
          {loading ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
    </form>
  );
};
