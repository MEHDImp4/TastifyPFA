export type PaiementStatus = 'EN_ATTENTE' | 'COMPLETE' | 'ECHOUE';

export type PaiementMethod = 'ESPECES' | 'CARTE' | 'QR';

export interface PaymentSession {
  table_id: number;
  commande_id: number;
  montant_total: number;
  montant_paye: number;
  montant_restant: number;
  items: Array<{
    id: number;
    plat_nom: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
    deja_paye: number;
    reste_a_payer: number;
  }>;
}

export interface QRTokenResponse {
  token: string;
  payment_url: string;
}

export interface ManualPaymentRequest {
  commande: number;
  montant: number;
  methode: 'ESPECES' | 'CARTE';
  reference_transaction?: string;
}

export interface Paiement {
  id: number;
  commande: number;
  montant: string; // Decimal is often returned as string in JSON
  methode: PaiementMethod;
  statut: PaiementStatus;
  reference_transaction: string;
  created_at: string;
  updated_at: string;
}
