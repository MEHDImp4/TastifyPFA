import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { OrderingPage } from './OrderingPage';
import { salleApi } from '../../api/salle';
import { menuApi } from '../../api/menu';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => ({ tableId: '10' }),
}));

vi.mock('../../hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

vi.mock('../../api/salle', () => ({
  salleApi: {
    getTables: vi.fn(),
    getCommandes: vi.fn(),
    createCommande: vi.fn(),
    addItemsToCommande: vi.fn(),
    updateCommandeStatut: vi.fn(),
    createManualPayment: vi.fn(),
    getPaymentQr: vi.fn(),
  },
}));

vi.mock('../../api/menu', () => ({
  menuApi: {
    getPlats: vi.fn(),
    getCategories: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const table = {
  id: 10,
  numero: 4,
  capacite: 4,
  statut: 'OCCUPEE' as const,
  pos_x: 0,
  pos_y: 0,
  est_active: true,
};

const commande = {
  id: 55,
  table: 10,
  serveur: 2,
  type: 'SUR_PLACE' as const,
  client_nom: null,
  statut: 'PRETE' as const,
  montant_total: '100.00',
  lignes: [
    {
      id: 901,
      plat: 7,
      plat_nom: 'Tajine',
      quantite: 1,
      prix_unitaire: '100.00',
      statut: 'PRET' as const,
      notes: '',
    },
  ],
  created_at: '2026-06-22T12:00:00Z',
};

const axiosResponse = <T,>(data: T) => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {} as any,
});

describe('OrderingPage manual payment', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(salleApi.getTables).mockResolvedValue(axiosResponse([table]));
    vi.mocked(salleApi.getCommandes).mockResolvedValue(axiosResponse([commande]));
    vi.mocked(menuApi.getPlats).mockResolvedValue(axiosResponse([]));
    vi.mocked(menuApi.getCategories).mockResolvedValue(axiosResponse([]));
    vi.mocked(salleApi.createManualPayment).mockResolvedValue(axiosResponse({
      id: 1,
      commande: commande.id,
      montant: '100.00',
      methode: 'ESPECES',
      statut: 'COMPLETE',
    }));
  });

  it('sends ESPECES and returns to the salle after cash payment succeeds', async () => {
    render(<OrderingPage />);

    fireEvent.click(await screen.findByRole('button', { name: /encaisser 100 dh/i }));
    fireEvent.click(screen.getByRole('button', { name: /espèces/i }));

    await waitFor(() => {
      expect(salleApi.createManualPayment).toHaveBeenCalledWith({
        commande: commande.id,
        montant: '100.00',
        methode: 'ESPECES',
      });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/salle');
    });
  });

  it('sends CARTE and returns to the salle after card payment succeeds', async () => {
    render(<OrderingPage />);

    fireEvent.click(await screen.findByRole('button', { name: /encaisser 100 dh/i }));
    fireEvent.click(screen.getByRole('button', { name: /carte bancaire/i }));

    await waitFor(() => {
      expect(salleApi.createManualPayment).toHaveBeenCalledWith({
        commande: commande.id,
        montant: '100.00',
        methode: 'CARTE',
      });
    });
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/salle');
    });
  });
});
