import { describe, expect, it } from 'vitest';
import { getPaginationItems, isPaginatedResponse, mapPaginatedData, toPaginatedResponse } from './pagination';

describe('pagination helpers', () => {
  it('keeps array payloads compatible', () => {
    const payload = [{ id: 1, label: 'A' }];

    expect(isPaginatedResponse(payload)).toBe(false);
    expect(getPaginationItems(payload)).toEqual(payload);
    expect(mapPaginatedData(payload, item => item.label)).toEqual(['A']);
    expect(toPaginatedResponse(payload)).toEqual({
      count: 1,
      next: null,
      previous: null,
      results: payload,
    });
  });

  it('maps paginated envelopes without losing metadata', () => {
    const payload = {
      count: 2,
      next: '/api/plats/?page=2',
      previous: null,
      results: [{ id: 1, label: 'A' }],
    };

    const mapped = mapPaginatedData(payload, item => item.label);

    expect(isPaginatedResponse(payload)).toBe(true);
    expect(toPaginatedResponse(payload)).toBe(payload);
    expect(mapped).toEqual({
      count: 2,
      next: '/api/plats/?page=2',
      previous: null,
      results: ['A'],
    });
  });
});
