import { create } from 'zustand';

interface KdsTicket {
  id: number;
  table_numero?: number;
  type: 'SUR_PLACE' | 'EMPORTER';
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
  updateLigneStatut: (ligneId: number, statut: string) => void;
}

export const useKdsStore = create<KdsState>((set) => ({
  tickets: [],
  setTickets: (tickets) => set({ tickets }),
  addTicket: (ticket) => set((state) => ({ 
    tickets: [ticket, ...state.tickets].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) 
  })),
  updateTicket: (ticket) => set((state) => ({
    tickets: state.tickets.map(t => t.id === ticket.id ? ticket : t)
  })),
  updateLigneStatut: (ligneId, statut) => set((state) => ({
    tickets: state.tickets.map(t => ({
      ...t,
      lignes: t.lignes.map(l => l.id === ligneId ? { ...l, statut } : l)
    }))
  })),
}));
