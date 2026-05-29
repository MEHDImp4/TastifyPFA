import { create } from 'zustand';

interface KdsTicket {
  id: number;
  statut: string;
  table_numero?: number;
  type: 'SUR_PLACE';
  client_nom?: string;
  lignes: {
    id: number;
    plat_nom: string;
    quantite: number;
    statut: string;
    notes: string;
    heure_lancement: string | null;
  }[];
  created_at: string;
}

interface KdsState {
  tickets: KdsTicket[];
  setTickets: (tickets: KdsTicket[]) => void;
  addTicket: (ticket: KdsTicket) => void;
  updateTicket: (ticket: KdsTicket) => void;
  upsertTicket: (ticket: KdsTicket) => void;
  removeTicket: (id: number) => void;
  updateLigneStatut: (ligneId: number, statut: string) => void;
}

const KITCHEN_STATUTS = ['EN_CUISINE', 'PRETE'];

export const useKdsStore = create<KdsState>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets }),
  addTicket: (ticket) => set((state) => ({
    tickets: [ticket, ...state.tickets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  })),
  updateTicket: (ticket) => set((state) => ({
    tickets: state.tickets.map(t => t.id === ticket.id ? ticket : t)
  })),
  upsertTicket: (ticket) => set((state) => {
    const exists = state.tickets.some(t => t.id === ticket.id);
    if (exists) {
      return { tickets: state.tickets.map(t => t.id === ticket.id ? ticket : t) };
    }
    if (KITCHEN_STATUTS.includes(ticket.statut)) {
      const updated = [ticket, ...state.tickets];
      updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      return { tickets: updated };
    }
    return state;
  }),
  removeTicket: (id) => set((state) => ({
    tickets: state.tickets.filter(t => t.id !== id),
  })),
  updateLigneStatut: (ligneId, statut) => set((state) => ({
    tickets: state.tickets.map(t => ({
      ...t,
      lignes: t.lignes.map(l => l.id === ligneId ? { ...l, statut } : l)
    }))
  })),
}));
