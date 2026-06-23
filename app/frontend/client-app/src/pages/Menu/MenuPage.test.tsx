import { describe, expect, it } from 'vitest';
import { getPlatReviewSummary } from './MenuPage';
import type { Plat } from '../../api/menu';

const plat: Plat = {
  id: 7,
  categorie: 1,
  nom: 'Couscous',
  description: null,
  prix: '90.00',
  temps_preparation: 20,
  image: null,
  est_disponible: true,
  est_active: true,
  sentiment_score: 0.6,
  top_avis: [
    { id: 1, user_username: 'client', commentaire: 'Tres bon', note: 5, sentiment_score: 0.9, created_at: '2026-06-01T10:00:00Z' },
    { id: 2, user_username: 'client2', commentaire: 'Service rapide', note: null, sentiment_score: 0.5, created_at: '2026-06-02T10:00:00Z' },
  ],
};

describe('getPlatReviewSummary', () => {
  it('summarizes written reviews without computing or fabricating a star rating', () => {
    expect(getPlatReviewSummary(plat)).toEqual({ count: 2 });
  });
});
