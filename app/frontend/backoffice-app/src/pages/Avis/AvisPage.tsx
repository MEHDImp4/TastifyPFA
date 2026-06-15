import React, { useState, useEffect } from 'react';
import { avisApi, type Avis } from '../../api/avis';
import {
  Loader2,
  Search,
  Smile,
  Meh,
  Frown,
  ChevronLeft,
  ChevronRight,
  Hash,
  TrendingUp,
  AlertCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

export const AvisPage: React.FC = () => {
  const [avis, setAvis] = useState<Avis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [totalCount, setTotalCount] = useState(0);

  const fetchAvis = async (page = currentPage) => {
    setIsLoading(true);
    try {
      const res = await avisApi.getAvisPage({
        page,
        page_size: itemsPerPage,
        search: search.trim() || undefined,
      });
      setAvis(res.data.results);
      setTotalCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch avis', err);
      toast.error('Impossible de charger les avis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvis();
  }, [currentPage, search]);

  const getSentimentIcon = (score: number) => {
    if (score > 0.2) return <Smile className="w-4 h-4 text-success" />;
    if (score < -0.2) return <Frown className="w-4 h-4 text-error" />;
    return <Meh className="w-4 h-4 text-on-surface-variant/40" />;
  };

  const stats = {
    avg: (avis.reduce((sum, a) => sum + (a.note || 5), 0) / (avis.length || 1)).toFixed(1),
    positive: avis.filter(a => (a.sentiment_score || 0) > 0.2).length,
    neutral: avis.filter(a => Math.abs(a.sentiment_score || 0) <= 0.2).length,
    negative: avis.filter(a => (a.sentiment_score || 0) < -0.2).length,
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">

      <div className="flex-none flex flex-wrap justify-between items-center px-4 md:px-8 py-3 md:py-0 min-h-20 border-b border-outline bg-surface gap-3">
        <div>
          <h1 aria-label="Analyse des avis clients" className="text-sm font-bold tracking-widest text-on-background uppercase">Avis clients</h1>
          <p className="text-[10px] font-bold text-on-surface-variant tracking-widest mt-1 opacity-60">Commentaires et satisfaction des convives</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center md:gap-4">
           <div className="relative group w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input
              type="text"
              aria-label="Filtrer les avis"
              placeholder="Filtrer les avis..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="field-control w-full sm:w-56 pl-10 pr-4 text-[10px] uppercase"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-4 md:p-8 gap-4 md:gap-8 min-h-0">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Note moyenne', val: stats.avg, sub: '/ 5.0', icon: TrendingUp, color: 'text-on-background' },
              { label: 'Positifs', val: stats.positive, sub: '', icon: Smile, color: 'text-success' },
              { label: 'Neutres', val: stats.neutral, sub: '', icon: Meh, color: 'text-on-surface-variant' },
              { label: 'Négatifs', val: stats.negative, sub: '', icon: AlertCircle, color: 'text-error' },
            ].map((s, i) => (
              <div key={i} className="atelier-card p-6 flex justify-between items-center">
                  <div>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">{s.label}</span>
                      <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.val}<span className="text-[10px] text-on-surface-variant ml-2 uppercase">{s.sub}</span></p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-10`} strokeWidth={1} />
              </div>
            ))}
        </div>

        <div className="flex-1 atelier-card overflow-hidden flex flex-col">

          <div className="flex-1 overflow-auto custom-scrollbar">
            <div className="min-w-[700px]">
          <div className="flex-none grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-2.5 h-2.5" /> ID</div>
            <div className="col-span-2">Convive</div>
            <div className="col-span-6">Commentaire</div>
            <div className="col-span-3 text-center">Score d'avis</div>
          </div>

            {avis.length > 0 ? avis.map((a) => {
              const username = a.username ?? a.user_username ?? 'client';
              return (
                <div
                  key={a.id}
                  className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline hover:bg-background/50 transition-colors items-start group"
                >
                  <div className="col-span-1 font-mono text-[10px] font-bold text-on-surface-variant pt-1">#{a.id.toString().slice(-4)}</div>
                  <div className="col-span-2">
                    <h3 className="text-[11px] font-bold text-on-background uppercase tracking-wider">@{username}</h3>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="col-span-6">
                    <p className="text-xs text-on-surface-variant leading-relaxed select-all">
                        {a.commentaire}
                    </p>
                  </div>
                  <div className="col-span-3 flex flex-col items-center justify-center gap-1">
                    {getSentimentIcon(a.sentiment_score || 0)}
                    <span className={`text-[10px] font-bold tracking-widest font-mono opacity-60 ${
                        (a.sentiment_score || 0) > 0.2 ? 'text-success' :
                        (a.sentiment_score || 0) < -0.2 ? 'text-error' :
                        'text-on-surface-variant'
                    }`}>
                        {((a.sentiment_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              );
            }) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Activity className="w-12 h-12 mb-4" strokeWidth={1} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Aucun avis disponible</p>
                </div>
            )}
            </div>
          </div>

          <div className="flex-none px-4 md:px-8 h-14 border-t border-outline bg-surface-container-high flex justify-between items-center gap-4">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                Basé sur {totalCount} avis
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
