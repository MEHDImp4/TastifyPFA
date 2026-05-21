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
    if (score > 10) return <TrendingUp className="w-8 h-8 text-[#ffceaf]" strokeWidth={2.5}/>;
    if (score < -10) return <TrendingDown className="w-8 h-8 text-[#ffdad6]" strokeWidth={2.5}/>;
    return <Minus className="w-8 h-8 text-background/40" strokeWidth={2.5}/>;
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
    <div className="max-w-[1200px] mx-auto animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div>
          <h1 className="text-display-lg text-[32px] text-on-surface leading-none">Sentiment Analytics</h1>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-secondary"></div>
            <span className="text-ui-data-dense uppercase tracking-widest text-on-surface-variant font-bold">AI-Powered Guest Feedback Surveillance</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {avis.map((a) => (
          <div key={a.id} className="bg-surface-container border-2 border-on-surface p-6 flex flex-col md:flex-row gap-8 items-stretch shadow-[6px_6px_0px_#301400]">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 border-2 border-on-surface bg-background flex items-center justify-center text-on-surface">
                            <MessageSquare className="w-5 h-5"  strokeWidth={2.5}/>
                        </div>
                        <h3 className="text-ui-label-bold text-sm text-on-surface font-black uppercase">FEEDBACK ID-{a.id}</h3>
                    </div>
                    <div className="flex gap-1.5 bg-background border-2 border-on-surface px-3 py-1 shadow-[3px_3px_0px_#301400]">
                        {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i < a.note ? 'text-primary fill-current' : 'text-on-surface/10'}`}  strokeWidth={2.5}/>
                        ))}
                    </div>
                </div>
                <div className="p-6 bg-background border-2 border-on-surface italic text-base font-body text-on-surface relative uppercase">
                    <span className="absolute top-2 left-2 text-4xl text-primary/10 font-serif leading-none">“</span>
                    {a.commentaire}
                    <span className="absolute bottom-2 right-2 text-4xl text-primary/10 font-serif leading-none">”</span>
                </div>
              </div>
              <p className="text-[9px] mt-6 font-black uppercase tracking-[0.25em] text-on-surface-variant opacity-60">
                OPERATOR LOG: {a.user_username.toUpperCase()} • {new Date(a.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
              </p>
            </div>

            <div className="w-full md:w-72 bg-on-surface text-background p-6 flex flex-col items-center justify-center text-center gap-4">
                <p className="text-ui-label-bold text-[9px] tracking-[0.25em]">AI NEURAL SCORE</p>
                <div className="w-16 h-16 border-2 border-background flex items-center justify-center bg-background/5">
                    {getSentimentIcon(a.sentiment_score || 0)}
                </div>
                <div>
                    <p className="text-display-lg text-2xl" style={{ color: (a.sentiment_score || 0) > 10 ? '#ffceaf' : (a.sentiment_score || 0) < -10 ? '#ffdad6' : '#ffffff' }}>
                        {getSentimentLabel(a.sentiment_score || 0).toUpperCase()}
                    </p>
                    <p className="text-ui-data-dense font-black mt-2 opacity-50 tracking-widest">{a.sentiment_score || 0} METRIC UNITS</p>
                </div>
            </div>
          </div>
        ))}

        {avis.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center text-on-surface-variant opacity-20">
                <MessageSquare className="w-16 h-10 mb-6"  strokeWidth={2.5}/>
                <p className="text-display-lg text-3xl italic uppercase tracking-tighter">No Feedback Logged</p>
                <p className="text-ui-label-bold text-[11px] mt-4 tracking-[0.3em]">Communication channels clear</p>
            </div>
        )}
      </div>
    </div>
  );
};
