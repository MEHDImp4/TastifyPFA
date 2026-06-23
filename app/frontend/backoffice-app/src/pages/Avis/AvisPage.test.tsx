import { describe, expect, it } from 'vitest';
import { calculateAvisStats } from './AvisPage';
import type { Avis } from '../../api/avis';

const baseAvis: Avis = {
  id: 1,
  user: 1,
  username: 'client',
  plat: 1,
  commande: 1,
  commentaire: 'Tres bon',
  note: null,
  sentiment_score: 0.7,
  lang_code: 'fr',
  created_at: '2026-06-01T10:00:00Z',
  updated_at: '2026-06-01T10:00:00Z',
};

describe('calculateAvisStats', () => {
  it('counts written reviews by sentiment without exposing an average star note', () => {
    expect(calculateAvisStats([
      baseAvis,
      { ...baseAvis, id: 2, commentaire: 'Correct', sentiment_score: 0 },
      { ...baseAvis, id: 3, commentaire: 'Froid', sentiment_score: -0.6 },
    ])).toEqual({
      total: 3,
      positive: 1,
      neutral: 1,
      negative: 1,
    });
  });
});
