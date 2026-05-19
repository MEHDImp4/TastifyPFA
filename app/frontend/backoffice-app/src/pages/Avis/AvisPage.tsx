import React, { useState, useEffect } from 'react';
import { api } from '../../api/axios';
import { Star, MessageSquare, TrendingUp, TrendingDown, Minus } from 'lucide-react';

import { Skeleton } from '../../components/ui/Skeleton';

export const AvisPage: React.FC = () => {
  const [avis, setAvis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAvis = async () => {
    try {
      const res = await api.get('/avis/');
      setAvis(res.data);
    } catch (err) {
      console.error('Failed to fetch avis', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvis();
  }, []);

  const getSentimentIcon = (score: number) => {
    if (score > 10) return <TrendingUp className="w-5 h-5" style={{ color: '#8d4e1c' }}  strokeWidth={2}/>;
    if (score < -10) return <TrendingDown className="w-5 h-5" style={{ color: '#ba1a1a' }}  strokeWidth={2}/>;
    return <Minus className="w-5 h-5" style={{ color: '#53443a' }}  strokeWidth={2}/>;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 10) return "Positif";
    if (score < -10) return "Négatif";
    return "Neutre";
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="w-48 h-8" />
                <Skeleton className="w-64 h-4" />
            </div>
        </div>
        <div className="grid grid-cols-1 gap-3">
            <Skeleton className="h-48 rounded-[2.5rem]" />
            <Skeleton className="h-48 rounded-[2.5rem]" />
            <Skeleton className="h-48 rounded-[2.5rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: '#301400' }}>Analyse des Sentiments</h1>
          <p className="mt-1 font-medium" style={{ color: '#53443a' }}>Écoutez vos clients grâce à notre moteur d'IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {avis.map((a) => (
          <div key={a.id} className="p-5 tonal-card flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-surface-container flex items-center justify-center" style={{ color: '#53443a' }}>
                      <MessageSquare className="w-6 h-6"  strokeWidth={2}/>
                  </div>
                  <div>
                      <h3 className="font-bold text-sm" style={{ color: '#301400' }}>Avis #{a.id}</h3>
                      <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < a.note ? 'text-primary fill-current' : 'text-outline-variant'}`}  strokeWidth={2}/>
                          ))}
                      </div>
                  </div>
              </div>
              <p className="leading-relaxed italic text-sm font-medium" style={{ color: '#301400' }}>"{a.commentaire}"</p>
              <p className="text-xs mt-6 font-bold uppercase tracking-widest font-sans" style={{ color: '#53443a' }}>Posté par {a.user_username} • {new Date(a.created_at).toLocaleDateString()}</p>
            </div>

            <div className="w-full md:w-64 p-4 bg-surface-container rounded-xl border border-outline-variant/30 flex flex-col items-center justify-center text-center gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#53443a' }}>Score Sentiment IA</p>
                <div className="p-4 bg-surface-container-high rounded-xl">
                    {getSentimentIcon(a.sentiment_score || 0)}
                </div>
                <div>
                    <p className="text-base font-bold" style={{ color: (a.sentiment_score || 0) > 10 ? '#8d4e1c' : (a.sentiment_score || 0) < -10 ? '#ba1a1a' : '#301400' }}>
                        {getSentimentLabel(a.sentiment_score || 0)}
                    </p>
                    <p className="text-xs font-sans mt-1" style={{ color: '#53443a' }}>{a.sentiment_score || 0} pts</p>
                </div>
            </div>
          </div>
        ))}

        {avis.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center" style={{ color: '#53443a', opacity: 0.5 }}>
                <MessageSquare className="w-16 h-10 mb-4"  strokeWidth={2}/>
                <p className="font-bold">Aucun avis client pour le moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};
