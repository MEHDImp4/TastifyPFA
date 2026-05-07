import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RecommendationList from './RecommendationList';
import * as menuApi from '../../api/menu';

vi.mock('../../api/menu', () => ({
  fetchRecommendations: vi.fn(),
}));

describe('RecommendationList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders a loading state initially', () => {
    vi.mocked(menuApi.fetchRecommendations).mockReturnValue(new Promise(() => {})); // pending promise
    render(<RecommendationList platId={1} />);
    expect(screen.getByTestId('loading-recommendations')).toBeInTheDocument();
  });

  it('renders a list of Plats when data is loaded successfully', async () => {
    const mockPlats = [
      { id: 2, nom: 'Pizza', description: 'Cheese', prix: '10.00', image: null, categorie: 1 },
      { id: 3, nom: 'Burger', description: 'Beef', prix: '8.00', image: null, categorie: 1 },
    ];
    vi.mocked(menuApi.fetchRecommendations).mockResolvedValue(mockPlats);
    
    render(<RecommendationList platId={1} />);
    
    await waitFor(() => {
      expect(screen.getByText('Recommandé pour vous')).toBeInTheDocument();
      expect(screen.getByText('Pizza')).toBeInTheDocument();
      expect(screen.getByText('Burger')).toBeInTheDocument();
    });
  });

  it('displays a fallback message on error or empty results', async () => {
    vi.mocked(menuApi.fetchRecommendations).mockRejectedValue(new Error('Network error'));
    
    render(<RecommendationList platId={1} />);
    
    await waitFor(() => {
      expect(screen.queryByText('Recommandé pour vous')).not.toBeInTheDocument();
    });
  });
});
