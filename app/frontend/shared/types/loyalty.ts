export interface LoyaltyTransaction {
  id: number;
  points: string;
  type: 'GAIN' | 'DEPENSE';
  description: string;
  created_at: string;
}

export interface LoyaltyProfile {
  points: string;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  transactions: LoyaltyTransaction[];
}

export interface Reward {
  id: number;
  nom: string;
  description: string;
  points_requis: string;
  est_actif: boolean;
}
