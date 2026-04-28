import React, { useState } from 'react';
import { Edit2, Trash2, Check, X } from 'lucide-react';

interface PlatRowActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
}

export const PlatRowActions: React.FC<PlatRowActionsProps> = ({ 
  onEdit, 
  onDelete,
  isDeleting = false
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-red-400 font-medium mr-1">Confirmer?</span>
        <button
          onClick={() => {
            setShowConfirm(false);
            onDelete();
          }}
          disabled={isDeleting}
          className="p-1.5 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
          title="Confirmer la suppression"
        >
          <Check size={18} />
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={isDeleting}
          className="p-1.5 hover:bg-white/10 text-foreground-muted rounded-lg transition-colors"
          title="Annuler"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onEdit}
        className="p-2 hover:bg-teal-500/10 text-teal-500 rounded-lg transition-colors"
        title="Modifier"
      >
        <Edit2 size={18} />
      </button>
      <button
        onClick={() => setShowConfirm(true)}
        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
        title="Supprimer"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
