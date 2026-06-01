import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Plat, Categorie } from '../../types/menu';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Loader2, 
  Search,
  X,
  Hash,
  Activity,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export const PlatPage: React.FC = () => {
  const [plats, setPlats] = useState<Plat[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const fetchPlats = async () => {
    try {
      const [platsRes, catsRes] = await Promise.all([
        menuApi.getPlats(),
        menuApi.getCategories(),
      ]);
      setPlats(platsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement catalogue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlats();
  }, []);

  const filteredPlats = plats.filter(p => p.nom.toLowerCase().includes(search.toLowerCase()));

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex justify-between items-center px-8 h-20 border-b border-outline bg-surface">
        <h2 className="sr-only">Menu Operations</h2>
        <div>
          <h1 className="text-sm font-bold tracking-widest text-on-background uppercase">Catalogue des Plats</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Gestion de l'offre gastronomique</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input 
              type="text"
              placeholder="SEARCH CATALOG..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 h-10 bg-background border border-outline pl-10 pr-4 rounded text-[10px] font-bold text-on-background focus:border-on-background outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Nouvelle Fiche</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {filteredPlats.map(p => (
              <div key={p.id} data-testid={`plat-card-${p.id}`} className="atelier-card p-4 group">
                  <div className="relative aspect-video rounded border border-outline overflow-hidden bg-background mb-4">
                     {p.image ? (
                        <img src={p.image} className="w-full h-full object-cover" alt={p.nom} />
                     ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10"><ImageIcon className="w-8 h-8" /></div>
                     )}
                  </div>
                  <h3 className="text-[13px] font-bold uppercase tracking-tight text-on-background truncate">{p.nom}</h3>
                  <div className="mt-4 flex justify-between items-end">
                      <span className="font-mono text-sm font-bold text-on-background">{parseFloat(p.prix).toFixed(0)} DH</span>
                      <div className="flex gap-2">
                        <button className="p-2 hover:bg-surface-container-high rounded text-on-surface-variant"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button className="p-2 hover:bg-error/5 rounded text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                  </div>
              </div>
           ))}
        </div>
      </main>
    </div>
  );
};
