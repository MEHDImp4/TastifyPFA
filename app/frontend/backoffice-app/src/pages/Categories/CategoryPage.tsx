import React, { useState, useEffect } from 'react';
import { menuApi } from '../../api/menu';
import type { Categorie } from '../../types/menu';
import { 
  Plus, 
  Trash2, 
  Loader2, 
  Search,
  X,
  Edit2,
  Hash,
  ChevronLeft,
  ChevronRight,
  Package
} from 'lucide-react';
import { toast } from 'sonner';

export const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await menuApi.getCategories();
      setCategories(res.data.sort((a, b) => a.ordre_affichage - b.ordre_affichage));
    } catch (err) {
      console.error(err);
      toast.error('Erreur chargement secteurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  if (isLoading) return <div className="h-full flex items-center justify-center text-on-background"><Loader2 className="w-8 h-8 animate-spin" strokeWidth={1} /></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background font-body selection:bg-on-background/10 overflow-hidden">
      <header className="flex-none flex justify-between items-center px-8 h-20 border-b border-outline bg-surface">
        <h2 className="sr-only">Sector Management</h2>
        <div>
          <h1 className="text-sm font-bold tracking-widest text-on-background uppercase">Secteurs & Catégories</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mt-1 opacity-40">Organisation hiérarchique du menu</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-on-surface-variant group-focus-within:text-on-background transition-colors" />
            <input 
              type="text"
              placeholder="RECHERCHER..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 h-10 bg-background border border-outline pl-10 pr-4 rounded text-[10px] font-bold text-on-background focus:border-on-background outline-none transition-all uppercase placeholder:text-on-surface-variant/30"
            />
          </div>
          <button className="btn-primary h-10 px-6">
            <Plus className="w-4 h-4" /> <span>Nouveau Secteur</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.filter(c => c.nom.toLowerCase().includes(search.toLowerCase())).map(c => (
                <div key={c.id} className="atelier-card p-6 group">
                   <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded border border-outline bg-background flex items-center justify-center font-bold text-[10px]">{c.ordre_affichage}</div>
                         <h3 className="text-sm font-bold uppercase tracking-tight text-on-background">{c.nom}</h3>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 hover:bg-surface-container-high rounded text-on-surface-variant"><Edit2 className="w-3.5 h-3.5" /></button>
                         <button className="p-1.5 hover:bg-error/5 rounded text-error"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                   </div>
                   <p className="text-[10px] text-on-surface-variant leading-relaxed line-clamp-2 uppercase tracking-widest opacity-40">{c.description || 'Aucune description spécifiée.'}</p>
                </div>
            ))}
         </div>
      </main>
    </div>
  );
};
