import React, { useState, useEffect } from 'react';
import { api } from '../../api/axios';
import { 
  Star, 
  MessageSquare, 
  Loader2, 
  Search, 
  Calendar, 
  Download,
  Smile,
  Meh,
  Frown,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const AvisPage: React.FC = () => {
  const [avis, setAvis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchAvis = async () => {
    try {
      const res = await api.get('/avis/');
      setAvis(res.data);
    } catch (err) {
      console.error('Failed to fetch avis', err);
      toast.error('Feedback record load failed');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvis();
  }, []);

  const getSentimentIcon = (score: number) => {
    if (score > 10) return <Smile className="w-5 h-5 text-primary" />;
    if (score < -10) return <Frown className="w-5 h-5 text-error" />;
    return <Meh className="w-5 h-5 text-on-surface-variant/40" />;
  };

  const getSentimentLabel = (score: number) => {
    if (score > 10) return "POSITIVE";
    if (score < -10) return "NEGATIVE";
    return "NEUTRAL";
  };

  const stats = {
    avg: (avis.reduce((sum, a) => sum + a.note, 0) / (avis.length || 1)).toFixed(1),
    positive: avis.filter(a => (a.sentiment_score || 0) > 10).length,
    neutral: avis.filter(a => Math.abs(a.sentiment_score || 0) <= 10).length,
    negative: avis.filter(a => (a.sentiment_score || 0) < -10).length,
  };

  const filteredAvis = avis.filter(a => 
    a.commentaire.toLowerCase().includes(search.toLowerCase()) ||
    a.user_username.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" strokeWidth={2.5}/></div>;

  return (
    <div className="h-full flex flex-col -m-4 bg-surface-main overflow-hidden font-body selection:bg-primary/20">
      
      {/* Page Header */}
      <header className="flex-none flex items-end justify-between px-staff-margin py-unit-lg border-b border-outline-variant bg-surface-main">
        <div>
          <h1 className="font-serif text-3xl font-black text-on-surface tracking-tighter uppercase">Client Sentiment</h1>
          <p className="font-sans text-[11px] font-black text-on-surface-variant uppercase tracking-[0.2em] mt-1">Real-time feedback and review analysis</p>
        </div>
        <div className="flex gap-unit-md items-center">
          <button className="flex items-center gap-2 px-4 py-2 border border-outline-variant rounded font-sans text-xs font-bold text-on-surface-variant hover:bg-surface-container-high transition-all">
            <Calendar className="w-3.5 h-3.5" /> Last 30 Days
          </button>
          <button className="flex items-center gap-2 px-5 py-2 bg-primary text-on-primary rounded font-sans text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-staff-margin bg-surface-container-lowest custom-scrollbar space-y-staff-margin">
        
        {/* KPI Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-staff-gutter">
          {/* Average Rating */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Avg Rating</span>
              <Star className="w-5 h-5 text-primary fill-primary/20" />
            </div>
            <div className="mt-6 z-10 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">{stats.avg}</span>
              <span className="font-sans text-[11px] text-on-surface-variant font-bold opacity-60">/ 5.0</span>
            </div>
          </div>

          {/* Volume */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col justify-between relative overflow-hidden group">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Total Reviews</span>
              <MessageSquare className="w-5 h-5 text-on-surface-variant/30" />
            </div>
            <div className="mt-6 z-10">
              <span className="font-serif text-3xl font-black text-on-surface tabular-nums">{avis.length}</span>
              <span className="block font-sans text-[9px] text-primary font-black uppercase tracking-widest mt-1">+15% volume this week</span>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="bg-surface-container border border-outline-variant rounded-xl p-6 flex flex-col gap-4 relative overflow-hidden">
            <div className="flex justify-between items-start z-10">
              <span className="font-sans text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Sentiment Split</span>
              <Activity className="w-5 h-5 text-on-surface-variant/30" />
            </div>
            <div className="space-y-3 z-10 relative">
               <div>
                  <div className="flex justify-between font-sans text-[9px] font-black mb-1">
                    <span className="text-primary uppercase tracking-widest">Positive</span>
                    <span className="text-on-surface">{Math.round((stats.positive / (avis.length || 1)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(stats.positive / (avis.length || 1)) * 100}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between font-sans text-[9px] font-black mb-1">
                    <span className="text-on-surface-variant uppercase tracking-widest opacity-60">Neutral</span>
                    <span className="text-on-surface">{Math.round((stats.neutral / (avis.length || 1)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-on-surface-variant/40 rounded-full" style={{ width: `${(stats.neutral / (avis.length || 1)) * 100}%` }} />
                  </div>
               </div>
               <div>
                  <div className="flex justify-between font-sans text-[9px] font-black mb-1">
                    <span className="text-error uppercase tracking-widest">Negative</span>
                    <span className="text-on-surface">{Math.round((stats.negative / (avis.length || 1)) * 100)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-error rounded-full" style={{ width: `${(stats.negative / (avis.length || 1)) * 100}%` }} />
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Search & List */}
        <div className="bg-surface-main border border-outline-variant rounded-xl overflow-hidden flex flex-col shadow-2xl mb-8">
          <div className="p-6 border-b border-outline-variant bg-surface-container flex items-center justify-between">
            <h3 className="font-sans text-[12px] font-black text-on-surface uppercase tracking-[0.2em]">Recent Feedback Index</h3>
            <div className="relative group w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary" />
              <input 
                type="text"
                placeholder="FILTER ENTRIES..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 bg-surface-main border border-outline-variant pl-9 pr-3 rounded font-sans text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex flex-col divide-y divide-outline-variant/30 bg-surface-container-lowest/50">
            <AnimatePresence mode="popLayout">
              {filteredAvis.map((a) => (
                <motion.div 
                  key={a.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-6 hover:bg-surface-container-low transition-colors flex flex-col md:flex-row gap-6"
                >
                  <div className="flex-shrink-0 w-36 flex flex-col gap-2">
                    <div className="flex items-center gap-0.5 text-primary">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < a.note ? 'fill-current' : 'opacity-10'}`} />
                      ))}
                    </div>
                    <span className="font-sans text-[13px] font-black text-on-surface uppercase truncate">{a.user_username}</span>
                    <span className="font-sans text-[10px] text-on-surface-variant uppercase tracking-widest opacity-60">{new Date(a.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    <div className="mt-1 flex items-center gap-2">
                       {getSentimentIcon(a.sentiment_score || 0)}
                       <span className={`font-sans text-[9px] font-black tracking-widest ${(a.sentiment_score || 0) > 10 ? 'text-primary' : (a.sentiment_score || 0) < -10 ? 'text-error' : 'text-on-surface-variant opacity-60'}`}>
                          {getSentimentLabel(a.sentiment_score || 0)}
                       </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="relative p-6 bg-surface-container border border-outline-variant rounded-lg italic font-body text-base text-on-surface selection:bg-primary/30">
                       <span className="absolute top-2 left-3 text-4xl text-primary/10 font-serif leading-none select-none">“</span>
                       <p className="relative z-10 leading-relaxed uppercase tracking-tight">{a.commentaire}</p>
                       <span className="absolute bottom-2 right-3 text-4xl text-primary/10 font-serif leading-none select-none">”</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <span className="font-mono text-[9px] text-on-surface-variant/40">NEURAL_ID: {a.id.toString().padStart(6, '0')}</span>
                          <div className="w-1 h-1 rounded-full bg-outline-variant" />
                          <span className="font-sans text-[9px] font-black text-primary uppercase tracking-widest">{a.sentiment_score || 0} UNITS</span>
                       </div>
                       <button className="font-sans text-[10px] font-black text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">Dispatch Response</button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredAvis.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant/10 gap-4">
                  <MessageSquare className="w-16 h-16 stroke-[1]" />
                  <p className="font-sans text-[10px] font-black uppercase tracking-[0.5em]">Aucun avis client pour le moment.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

