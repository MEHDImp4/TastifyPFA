import React, { useState, useEffect } from 'react';
import { PaymentSession } from '@shared/types/paiements';
import axiosInstance from '@shared/auth/axiosInstance';

export type SplitMode = 'FULL' | 'EQUAL' | 'ITEM';

interface SplitSelectorProps {
  session: PaymentSession;
  token: string;
  onSelectionChange: (payload: {
    montant: number;
    contributions?: Array<{ commande_ligne_id: number; montant_contribue: number }>;
  }) => void;
}

export const SplitSelector: React.FC<SplitSelectorProps> = ({ session, token, onSelectionChange }) => {
  const [mode, setMode] = useState<SplitMode>('FULL');
  const [guestCount, setGuestCount] = useState(2);
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [previewAmount, setPreviewAmount] = useState<number>(session.montant_restant);

  // Reset or initialize on mode change
  useEffect(() => {
    if (mode === 'FULL') {
      setPreviewAmount(session.montant_restant);
      onSelectionChange({ montant: session.montant_restant });
    } else if (mode === 'EQUAL') {
      updateEqualSplit(guestCount);
    } else if (mode === 'ITEM') {
      updateItemSplit(selectedItemIds);
    }
  }, [mode]);

  const updateEqualSplit = async (count: number) => {
    try {
      const response = await axiosInstance.post('/paiements/session/equal-split/', {
        token,
        split_count: count
      });
      const share = response.data.share_amounts[0];
      setPreviewAmount(parseFloat(share));
      onSelectionChange({ montant: parseFloat(share) });
    } catch (err) {
      console.error("Equal split preview failed", err);
    }
  };

  const updateItemSplit = async (ids: number[]) => {
    if (ids.length === 0) {
      setPreviewAmount(0);
      onSelectionChange({ montant: 0, contributions: [] });
      return;
    }

    const contributions = ids.map(id => {
      const item = session.items.find(i => i.id === id);
      return {
        commande_ligne_id: id,
        montant_contribue: item ? item.reste_a_payer : 0
      };
    });

    try {
      const response = await axiosInstance.post('/paiements/session/item-split/', {
        token,
        contributions
      });
      setPreviewAmount(parseFloat(response.data.total_amount));
      onSelectionChange({ 
        montant: parseFloat(response.data.total_amount),
        contributions: contributions
      });
    } catch (err) {
      console.error("Item split preview failed", err);
    }
  };

  const toggleItem = (id: number) => {
    const newIds = selectedItemIds.includes(id)
      ? selectedItemIds.filter(i => i !== id)
      : [...selectedItemIds, id];
    setSelectedItemIds(newIds);
    updateItemSplit(newIds);
  };

  const cardClass = (m: SplitMode) => `
    flex-1 p-4 rounded-xl border-2 transition-all cursor-pointer text-center
    ${mode === m ? 'border-teal bg-teal/10' : 'border-white/5 bg-surface hover:border-white/20'}
  `;

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <div className={cardClass('FULL')} onClick={() => setMode('FULL')}>
          <div className="text-2xl mb-1">🏦</div>
          <div className="text-xs font-bold uppercase tracking-tight">Tout</div>
        </div>
        <div className={cardClass('EQUAL')} onClick={() => setMode('EQUAL')}>
          <div className="text-2xl mb-1">⚖️</div>
          <div className="text-xs font-bold uppercase tracking-tight">Égal</div>
        </div>
        <div className={cardClass('ITEM')} onClick={() => setMode('ITEM')}>
          <div className="text-2xl mb-1">🍕</div>
          <div className="text-xs font-bold uppercase tracking-tight">Article</div>
        </div>
      </div>

      {mode === 'EQUAL' && (
        <div className="bg-surface border border-white/10 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
          <label className="block text-sm font-medium text-foreground-muted mb-3">Nombre de personnes</label>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { if(guestCount > 1) { setGuestCount(guestCount-1); updateEqualSplit(guestCount-1); }}}
              className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl hover:bg-white/10 active:scale-95 transition-all"
            >-</button>
            <span className="text-xl font-bold w-8 text-center">{guestCount}</span>
            <button 
              onClick={() => { setGuestCount(guestCount+1); updateEqualSplit(guestCount+1); }}
              className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl hover:bg-white/10 active:scale-95 transition-all"
            >+</button>
          </div>
          <p className="mt-4 text-xs text-foreground-muted">Chaque personne paiera une part égale du reste.</p>
        </div>
      )}

      {mode === 'ITEM' && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          <p className="text-sm font-medium text-foreground-muted px-1">Sélectionnez vos articles</p>
          <div className="max-h-64 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
            {session.items.filter(i => i.reste_a_payer > 0).map(item => (
              <div 
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`
                  p-3 rounded-lg border flex justify-between items-center cursor-pointer transition-all
                  ${selectedItemIds.includes(item.id) ? 'border-teal bg-teal/5' : 'border-white/5 bg-surface/50'}
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedItemIds.includes(item.id) ? 'bg-teal border-teal' : 'border-white/20'}`}>
                    {selectedItemIds.includes(item.id) && <span className="text-[10px] text-white">✓</span>}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.plat_nom}</div>
                    <div className="text-[10px] text-foreground-muted">{item.prix_unitaire} MAD x {item.quantite}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm">{item.reste_a_payer} MAD</div>
                  {item.deja_paye > 0 && <div className="text-[9px] text-teal">Partiellement payé</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-amber/10 border border-amber/20 rounded-xl p-4 flex justify-between items-center">
        <div>
          <div className="text-[10px] uppercase font-bold text-amber tracking-wider">Montant à régler</div>
          <div className="text-lg font-bold text-amber">{previewAmount.toFixed(2)} MAD</div>
        </div>
        <div className="text-2xl opacity-50">💳</div>
      </div>
    </div>
  );
};
