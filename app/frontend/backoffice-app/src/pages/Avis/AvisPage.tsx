import React, { useState, useEffect } from 'react';
import { api } from '../../api/axios';
import { Star, MessageSquare, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
    if (score > 10) return <TrendingUp className="w-5 h-5 text-teal" />;
    if (score < -10) return <TrendingDown className="w-5 h-5 text-terracotta" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 10) return "Positif";
    if (score < -10) return "Négatif";
    return "Neutre";
  };

  if (isLoading) return <div className="h-full flex items-center justify-center text-teal"><Loader2 className="w-10 h-10 animate-spin" /></div>;

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analyse des Sentiments</h1>
          <p className="text-gray-400 mt-1">Écoutez vos clients grâce à notre moteur d'IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {avis.map((a) => (
          <div key={a.id} className="p-8 bg-dark-surface rounded-[2.5rem] border border-white/10 shadow-xl flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-400">
                      <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                      <h3 className="font-bold text-lg text-white">Avis #{a.id}</h3>
                      <div className="flex gap-1">
                          {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < a.note ? 'text-amber fill-current' : 'text-gray-800'}`} />
                          ))}
                      </div>
                  </div>
              </div>
              <p className="text-gray-300 leading-relaxed italic text-lg">"{a.commentaire}"</p>
              <p className="text-xs text-gray-500 mt-6 font-medium uppercase tracking-widest">Posté par {a.user_username} • {new Date(a.created_at).toLocaleDateString()}</p>
            </div>

            <div className="w-full md:w-64 p-6 bg-dark rounded-3xl border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500">Score Sentiment IA</p>
                <div className="p-4 bg-white/5 rounded-full">
                    {getSentimentIcon(a.sentiment_score || 0)}
                </div>
                <div>
                    <p className={`text-xl font-bold ${ (a.sentiment_score || 0) > 10 ? 'text-teal' : (a.sentiment_score || 0) < -10 ? 'text-terracotta' : 'text-white'}`}>
                        {getSentimentLabel(a.sentiment_score || 0)}
                    </p>
                    <p className="text-xs font-mono text-gray-500 mt-1">{a.sentiment_score || 0} pts</p>
                </div>
            </div>
          </div>
        ))}

        {avis.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500 opacity-30">
                <MessageSquare className="w-16 h-16 mb-4" />
                <p>Aucun avis client pour le moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};
