import React from 'react';
import { Plat } from './types';
import { PlatStatusControls } from './PlatStatusControls';
import { PlatRowActions } from './PlatRowActions';

interface PlatListTableProps {
  plats: Plat[];
  onEdit: (plat: Plat) => void;
  onDelete: (plat: Plat) => void;
  onToggleStatus: (plat: Plat, field: 'est_active' | 'est_disponible') => void;
  isProcessing?: number | null;
}

export const PlatListTable: React.FC<PlatListTableProps> = ({
  plats,
  onEdit,
  onDelete,
  onToggleStatus,
  isProcessing = null
}) => {
  if (plats.length === 0) {
    return (
      <div className="p-20 text-center">
        <p className="text-foreground-muted">Aucun plat trouvé dans cette catégorie.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/5 text-foreground-muted text-sm uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold">Plat</th>
            <th className="px-6 py-4 font-semibold">Catégorie</th>
            <th className="px-6 py-4 font-semibold">Prix</th>
            <th className="px-6 py-4 font-semibold">Statut</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {plats.map((plat) => (
            <tr 
              key={plat.id} 
              className={`group transition-colors hover:bg-white/[0.02] ${
                !plat.est_active ? 'opacity-60 grayscale-[0.5]' : ''
              }`}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-elevated overflow-hidden border border-white/5 shrink-0">
                    {plat.image ? (
                      <img 
                        src={plat.image} 
                        alt={plat.nom} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-foreground-muted text-xs">
                        No image
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-teal-400 transition-colors">
                      {plat.nom}
                    </div>
                    <div className="text-xs text-foreground-muted truncate max-w-[200px]">
                      {plat.description}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="px-2 py-1 rounded-md bg-surface-elevated text-xs font-medium text-foreground-muted">
                  {plat.categorie_detail?.nom || 'Sans catégorie'}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="font-mono font-bold text-teal-500">
                  {Number(plat.prix).toFixed(2)} €
                </span>
              </td>
              <td className="px-6 py-4">
                <PlatStatusControls
                  disponible={plat.est_disponible}
                  actif={plat.est_active}
                  onToggleDisponible={() => onToggleStatus(plat, 'est_disponible')}
                  onToggleActif={() => onToggleStatus(plat, 'est_active')}
                  disabled={isProcessing === plat.id}
                />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end">
                  <PlatRowActions
                    onEdit={() => onEdit(plat)}
                    onDelete={() => onDelete(plat)}
                    isDeleting={isProcessing === plat.id}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
