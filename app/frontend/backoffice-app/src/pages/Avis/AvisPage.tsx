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
  Quote,
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
    if (score > 0.2) return <Smile className="w-5 h-5 text-success" />;
    if (score < -0.2) return <Frown className="w-5 h-5 text-error" />;
    return <Meh className="w-5 h-5 text-on-surface-variant/60" />;
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

  if (isLoading) return <div className="h-full flex items-center justify-center text-primary"><Loader2 className="w-12 h-12 animate-spin" /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-sans selection:bg-primary/20 overflow-hidden">
      
      {/* Sentiment Header */}
      <div className="flex-none flex justify-between items-end px-8 py-8 border-b border-outline bg-surface-container-lowest">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-on-surface uppercase  leading-none">Intelligence Émotionnelle <span className="sr-only">Client Sentiment</span></h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-[0.4em] mt-3 opacity-50">Analyse de la Perception de Marque et Satisfaction Convives</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant group-focus-within:text-primary transition-colors" />
            <input 
              type="text"
              placeholder="FILTER ENTRIES..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-64 h-12 bg-surface-container-low border border-outline pl-12 pr-4 rounded-lg text-[10px] font-bold text-on-surface focus:border-primary outline-none transition-all uppercase placeholder:text-on-surface-variant"
            />
          </div>
          <button onClick={() => {}} className="h-12 px-6 border border-outline rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-all">
             <Download className="w-4 h-4 inline-block mr-2" /> Manifeste PDF
          </button>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 overflow-hidden flex flex-col p-8 min-h-0">
        
        {/* Sentiment KPI Bar */}
        <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="bg-surface-container-lowest border border-outline rounded-xl p-6 flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Global Satisfaction</span>
                    <p className="text-3xl font-black text-on-surface mt-1">{stats.avg}<span className="text-sm text-on-surface-variant ml-2 uppercase">/ 5.0</span></p>
                </div>
                <TrendingUp className="w-10 h-10 text-on-surface-variant" />
            </div>
            <div className="bg-surface-container-lowest border border-success/20 rounded-xl p-6 flex justify-between items-center bg-success/[0.01]">
                <div>
                    <span className="text-[10px] font-black text-success uppercase tracking-widest">Sentiments Positifs</span>
                    <p className="text-3xl font-black text-on-surface mt-1">{stats.positive}</p>
                </div>
                <Smile className="w-10 h-10 text-success opacity-20" />
            </div>
            <div className="bg-surface-container-lowest border border-outline rounded-xl p-6 flex justify-between items-center">
                <div>
                    <span className="text-[10px] font-black text-on-surface-variant uppercase tracking-widest">Retours Neutres</span>
                    <p className="text-3xl font-black text-on-surface mt-1">{stats.neutral}</p>
                </div>
                <Meh className="w-10 h-10 text-on-surface-variant" />
            </div>
            <div className="bg-surface-container-lowest border border-error/20 rounded-xl p-6 flex justify-between items-center bg-error/[0.01]">
                <div>
                    <span className="text-[10px] font-black text-error uppercase tracking-widest">Signaux Négatifs</span>
                    <p className="text-3xl font-black text-on-surface mt-1">{stats.negative}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-error opacity-20" />
            </div>
        </div>

        <div className="flex-1 bg-surface-container-lowest border border-outline rounded-xl overflow-hidden flex flex-col">
          
          {/* Table Header */}
          <div className="flex-none grid grid-cols-12 gap-4 px-8 py-5 border-b border-outline bg-surface-container-low text-[10px] font-black text-on-surface-variant uppercase tracking-[0.3em]">
            <div className="col-span-1 flex items-center gap-2"><Hash className="w-3 h-3" /> ID</div>
            <div className="col-span-2">Convive</div>
            <div className="col-span-5">Commentaire & Témoignage</div>
            <div className="col-span-2 text-center">Score IA</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Table Body */}
          <div tabIndex={0} className="flex-1 overflow-y-auto custom-scrollbar">
            {paginatedAvis.length > 0 ? paginatedAvis.map((a) => (
                <div 
                  key={a.id}
                  className="grid grid-cols-12 gap-4 px-8 py-6 border-b border-outline-variant hover:bg-white/[0.02] transition-colors items-start group"
                >
                  <div className="col-span-1 font-mono text-xs font-bold text-on-surface-variant pt-2">#{a.id.toString().padStart(6, '0')}</div>
                  <div className="col-span-2 pt-1">
                    <h3 className="text-sm font-black text-on-surface uppercase tracking-tight group-hover:text-primary transition-colors truncate">@{a.user_username}</h3>
                    <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-50">{new Date(a.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="col-span-5">
                    <div className="relative pl-6 border-l-2 border-primary/20 bg-white/[0.01] p-4 rounded-r-xl">
                        <Quote className="absolute -left-3 -top-2 w-5 h-5 text-primary" strokeWidth={3} />
                        <p className="text-sm font-bold text-on-surface uppercase  leading-relaxed tracking-tight select-all">
                            {a.commentaire}
                        </p>
                    </div>
                  </div>
                  <div className="col-span-2 flex flex-col items-center justify-center gap-2 pt-1">
                    {getSentimentIcon(a.sentiment_score || 0)}
                    <span className={`text-[10px] font-black tracking-widest font-mono ${
                        (a.sentiment_score || 0) > 0.2 ? 'text-success' : 
                        (a.sentiment_score || 0) < -0.2 ? 'text-error' : 
                        'text-on-surface-variant'
                    }`}>
                        {((a.sentiment_score || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="col-span-2 flex justify-end gap-2 pt-1">
                    <button className="h-10 px-4 border border-outline rounded text-[10px] font-black uppercase tracking-widest text-on-surface-variant hover:text-on-surface hover:border-on-surface transition-all">Archiver</button>
                    <button className="w-10 h-10 border border-outline rounded flex items-center justify-center text-on-surface-variant hover:text-primary hover:border-primary transition-all"><TrendingUp className="w-4 h-4" /></button>
                  </div>
                </div>
            )) : (
                <div aria-hidden="true" className="h-64 flex flex-col items-center justify-center opacity-10">
                    <Activity className="w-16 h-16 mb-4" strokeWidth={1} />
                    <p className="text-xs font-black uppercase tracking-[0.4em]">Flux de Sentiment Vide</p>
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1">NO FEEDBACK DATA LOGGED</span>
                </div>
            )}
          </div>

          {/* Table Footer */}
          <div className="flex-none px-8 py-5 border-t border-outline bg-surface-container-low flex justify-between items-center">
            <span className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest">
                Analyse basées sur {filteredAvis.length} Témoignages réels
            </span>
            {totalPages > 1 && (
                <div className="flex items-center gap-4">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border border-outline rounded hover:bg-white/5 disabled:opacity-10 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                    <div className="flex items-center gap-2 font-mono text-xs font-black bg-background border border-outline px-4 py-2 rounded">
                        <span className="text-primary">{currentPage}</span>
                        <span className="text-on-surface-variant">/</span>
                        <span className="text-on-surface">{totalPages}</span>
                    </div>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border border-outline rounded hover:bg-white/5 disabled:opacity-10 transition-all"><ChevronRight className="w-4 h-4" /></button>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
