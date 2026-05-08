import { useEffect, useState } from 'react';
import { fetchAllAvis, Avis } from './reviewService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SentimentBadge = ({ score }: { score?: number }) => {
  if (score === undefined || score === null) return <span className="text-xs text-white/40 italic">En attente d'analyse...</span>;

  const getLabel = () => {
    if (score >= 4) return { text: 'Positif', color: 'bg-teal/20 text-teal' };
    if (score <= 2) return { text: 'Négatif', color: 'bg-terracotta/20 text-terracotta' };
    return { text: 'Neutre', color: 'bg-amber/20 text-amber' };
  };

  const { text, color } = getLabel();
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${color}`}>
      AI: {text} ({score}/5)
    </span>
  );
};

export const ReviewsPage = () => {
  const [reviews, setReviews] = useState<Avis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const data = await fetchAllAvis();
        setReviews(data);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    loadReviews();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Avis Clients</h1>
          <p className="text-foreground-muted">Surveillance de la satisfaction et analyse de sentiment BERT.</p>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/5 px-4 py-2">
          <span className="text-sm text-foreground-muted">Total: {reviews.length}</span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="group relative flex flex-col gap-4 rounded-2xl border border-white/5 bg-white/5 p-6 transition-all hover:bg-white/[0.07]"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-white">{review.username}</span>
                <span className="text-[10px] text-foreground-muted uppercase tracking-widest">
                  {format(new Date(review.created_at), 'PPP', { locale: fr })}
                </span>
              </div>
              <div className="flex text-amber">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className={i < review.note ? 'text-amber' : 'text-white/10'}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <p className="flex-1 text-sm leading-relaxed text-foreground-muted line-clamp-4 italic">
              "{review.commentaire}"
            </p>

            <div className="flex items-center justify-between border-t border-white/5 pt-4">
              <SentimentBadge score={review.sentiment_score} />
              {review.plat && (
                <span className="text-[10px] font-bold text-teal/80 uppercase">Plat #{review.plat}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 py-20">
          <p className="text-foreground-muted italic">Aucun avis pour le moment.</p>
        </div>
      )}
    </div>
  );
};

export default ReviewsPage;
