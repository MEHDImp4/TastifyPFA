import { api } from './axios';

export interface LoyaltyProfile {
  id?: number;
  username?: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tier_display?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Reward {
  id: number;
  nom: string;
  description: string;
  points_requis: number;
  est_actif?: boolean;
  is_available?: boolean;
  image?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoyaltyTransaction {
  id: number;
  points: number;
  type: 'GAIN' | 'DEPENSE';
  type_display: string;
  description: string;
  created_at: string;
}

export const loyaltyApi = {
  getMyStatus: () => api.get<LoyaltyProfile>('/loyalty/my_status/'),
  getTransactions: () => api.get<LoyaltyTransaction[]>('/loyalty/transactions/'),
  getRewards: () => api.get<Reward[]>('/rewards/'),
  redeemReward: (rewardId: number) => api.post<{ detail: string }>(`/rewards/${rewardId}/redeem/`),
};
