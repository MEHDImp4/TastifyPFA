import React from 'react';
import { Switch } from '../../components/ui/Switch';

interface PlatStatusControlsProps {
  disponible: boolean;
  actif: boolean;
  onToggleDisponible: () => void;
  onToggleActif: () => void;
  disabled?: boolean;
}

export const PlatStatusControls: React.FC<PlatStatusControlsProps> = ({
  disponible,
  actif,
  onToggleDisponible,
  onToggleActif,
  disabled = false
}) => {
  return (
    <div className="flex flex-col gap-3">
      <Switch 
        label="Disponible" 
        checked={disponible} 
        onToggle={onToggleDisponible}
        disabled={disabled || !actif}
        aria-label="Changer la disponibilité du plat"
      />
      <Switch 
        label="Affiché (Actif)" 
        checked={actif} 
        onToggle={onToggleActif}
        disabled={disabled}
        aria-label="Activer ou désactiver le plat"
      />
      {!actif && (
        <span className="text-[10px] text-red-400 font-medium">
          Désactivé : Invisible pour les clients
        </span>
      )}
    </div>
  );
};
