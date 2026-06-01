import React, { useState, useEffect } from 'react';
import { api } from '../../api/axios';
import { 
  Loader2, 
  Search, 
  Download,
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
  const [avis, setAvis] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchAvis = async () => {
    try {
      const res = await api.get('/avis/');
      setAvis(res.data);
    } catch (err) {
      console.error('Failed to fetch avis', err);
      toast.error('Erreur chargement sentiments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAvis();
  }, []);

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

  const filteredAvis = avis.filter(a => 
    a.commentaire.toLowerCase().includes(search.toLowerCase()) ||
    a.user_username.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredAvis.length / itemsPerPage);
  const paginatedAvis = filteredAvis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      
      {/* Header */}
      <div className="flex-none flex justify-between items-center px-8 h-20 border-b border-outline bg-surface">
        <h2 className="sr-only">Client Sentiment</h2>
        <div>
          <h1 className="text-sm font-bold tracking-widest text-on-background uppercase">Analyse des Sentiments</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Perception de marque et satisfaction convives</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input 
              type="text"
              placeholder="FILTER ENTRIES..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-48 h-10 bg-background border border-outline pl-10 pr-4 rounded text-[10px] font-bold text-on-background focus:border-on-background outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button className="btn-ghost h-10 px-4">
             <Download className="w-3.5 h-3.5" /> <span>Rapport PDF</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 gap-8 min-h-0">
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-6">
            {[
              { label: 'Satisfaction Global', val: stats.avg, sub: '/ 5.0', icon: TrendingUp, color: 'text-on-background' },
              { label: 'Positifs', val: stats.positive, sub: '', icon: Smile, color: 'text-success' },
              { label: 'Neutres', val: stats.neutral, sub: '', icon: Meh, color: 'text-on-surface-variant' },
              { label: 'Négatifs', val: stats.negative, sub: '', icon: AlertCircle, color: 'text-error' },
            ].map((s, i) => (
              <div key={i} className="atelier-card p-6 flex justify-between items-center">
                  <div>
                      <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">{s.label}</span>
                      <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.val}<span className="text-[10px] text-on-surface-variant ml-2 uppercase opacity-40">{s.sub}</span></p>
                  </div>
                  <s.icon className={`w-8 h-8 ${s.color} opacity-10`} strokeWidth={1} />
              </div>
            ))}
        </div>

        <div className="flex-1 atelier-card overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="flex-none grid grid-cols-12 gap-4 px-8 h-12 items-center border-b border-outline bg-surface-container-high text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-2.5 h-2.5" /> ID</div>
            <div className="col-span-2">Convive</div>
            <div className="col-span-5">Commentaire</div>
            <div className="col-span-2 text-center">Score IA</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {paginatedAvis.length > 0 ? paginatedAvis.map((a) => (
                <div 
                  key={a.id}
                  className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline hover:bg-background/50 transition-colors items-start group"
                >
                  <div className="col-span-1 font-mono text-[10px] font-bold text-on-surface-variant pt-1">#{a.id.toString().slice(-4)}</div>
                  <div className="col-span-2">
                    <h3 className="text-[11px] font-bold text-on-background uppercase tracking-wider">@{a.user_username}</h3>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-30">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="col-span-5">
                    <p className="text-xs text-on-surface-variant leading-relaxed select-all">
                        {a.commentaire}
                    </p>
                  </div>
                  <div className="col-span-2 flex flex-col items-center justify-center gap-1">
                    {getSentimentIcon(a.sentiment_score || 0)}
                    <span className={`text-[10px] font-bold tracking-widest font-mono opacity-60 ${
                        (a.sentiment_score || 0) > 0.2 ? 'text-success' : 
                        (a.sentiment_score || 0) < -0.2 ? 'text-error' : 
                        'text-on-surface-variant'
                    }`}>
                        {((a.sentiment_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button className="h-8 px-3 border border-outline rounded text-[9px] font-bold uppercase tracking-widest text-on-surface-variant hover:text-on-background hover:border-on-background transition-all">Archiver</button>
                    <button className="sr-only">dispatch response</button>
                  </div>
                </div>
            )) : (
                <div className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Activity className="w-12 h-12 mb-4" strokeWidth={1} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Aucune donnée</p>
                </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-none px-8 h-14 border-t border-outline bg-surface-container-high flex justify-between items-center">
            <span className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest opacity-40">
                Analyse basées sur {filteredAvis.length} témoignages
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-3">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 border border-outline rounded hover:bg-background disabled:opacity-10 transition-all"><ChevronLeft className="w-3.5 h-3.5" /></button>
                    <div className="flex items-center gap-2 font-mono text-[10px] font-bold text-on-surface-variant">
                        <span className="text-on-background">{currentPage}</span>
                        <span>/</span>
                        <span>{totalPages}</span>
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 border border-outline rounded hover:bg-background disabled:opacity-10 transition-all"><ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
