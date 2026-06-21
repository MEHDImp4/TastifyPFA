import { api } from './axios';

export interface Reward {
  id: number;
  nom: string;
  description: string;
  points_requis: number;
  est_actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardPayload {
  nom: string;
  description: string;
  points_requis: number;
  est_actif: boolean;
}

export interface LoyaltyProfile {
  id: number;
  username: string;
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD';
  created_at: string;
  updated_at: string;
}

export const loyaltyApi = {
  getRewards: () => api.get<Reward[]>('/rewards/'),
  createReward: (data: RewardPayload) => api.post<Reward>('/rewards/', data),
  updateReward: (id: number, data: Partial<RewardPayload>) => api.patch<Reward>(`/rewards/${id}/`, data),
  deleteReward: (id: number) => api.delete(`/rewards/${id}/`),
  getProfiles: () => api.get<LoyaltyProfile[]>('/loyalty/'),
};
