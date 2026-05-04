import React from 'react';
import { Plat } from './types';
import { PlatStatusControls } from './PlatStatusControls';
import { PlatRowActions } from './PlatRowActions';
import { normalizeMediaUrl } from '@shared/media/mediaUrl';

interface PlatMobileCardProps {
  plat: Plat;
  onEdit: (plat: Plat) => void;
  onDelete: (plat: Plat) => void;
  onToggleStatus: (plat: Plat, field: 'est_active' | 'est_disponible') => void;
  isProcessing?: boolean;
}

export const PlatMobileCard: React.FC<PlatMobileCardProps> = ({
  plat,
  onEdit,
  onDelete,
  onToggleStatus,
  isProcessing = false
}) => {
  return (
    <div 
      className={`bg-surface p-4 rounded-xl border border-white/5 space-y-4 ${
        !plat.est_active ? 'opacity-60 grayscale-[0.5]' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-lg bg-surface-elevated overflow-hidden border border-white/5 shrink-0">
          {plat.image ? (
            <img 
              src={normalizeMediaUrl(plat.image)} 
              alt={plat.nom} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-foreground-muted text-xs">
              No image
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-white truncate group-hover:text-teal-400 transition-colors">
              {plat.nom}
            </h3>
            <span className="font-mono font-bold text-teal-500 shrink-0">
              {Number(plat.prix).toFixed(2)} €
            </span>
          </div>
          <p className="text-xs text-foreground-muted line-clamp-2 mt-1">
            {plat.description}
          </p>
          <div className="mt-2">
            <span className="px-2 py-0.5 rounded-md bg-surface-elevated text-[10px] font-medium text-foreground-muted">
              {plat.categorie_detail?.nom || 'Sans catégorie'}
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-white/5 flex flex-row justify-between items-end">
        <PlatStatusControls
          disponible={plat.est_disponible}
          actif={plat.est_active}
          onToggleDisponible={() => onToggleStatus(plat, 'est_disponible')}
          onToggleActif={() => onToggleStatus(plat, 'est_active')}
          disabled={isProcessing}
        />
        <div className="pb-1">
          <PlatRowActions
            onEdit={() => onEdit(plat)}
            onDelete={() => onDelete(plat)}
            isDeleting={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};
