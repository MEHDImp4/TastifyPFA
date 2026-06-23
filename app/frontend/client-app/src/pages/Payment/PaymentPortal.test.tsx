import { describe, expect, it } from 'vitest';
import { buildReviewPayload } from './PaymentPortal';

describe('PaymentPortal review payload', () => {
  it('submits dish reviews as written comments without a star rating', () => {
    expect(buildReviewPayload({
      commande_id: 12,
      commande_ligne_id: 34,
      plat_id: 56,
      plat_nom: 'Tajine',
      quantite: 1,
    }, 'Excellent plat')).toEqual({
      commande: 12,
      plat: 56,
      commentaire: 'Excellent plat',
    });
  });
});
