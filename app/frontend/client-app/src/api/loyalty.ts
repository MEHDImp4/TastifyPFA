import { api } from './axios';

export interface LoyaltyProfile {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tier_display: string;
}

export interface Reward {
  id: number;
  nom: string;
  description: string;
  points_requis: number;
  is_available: boolean;
  image?: string;
}

export const loyaltyApi = {
  getMyStatus: () => api.get<LoyaltyProfile>('/loyalty/my_status/'),
  getRewards: () => api.get<Reward[]>('/loyalty/rewards/'),
  redeemReward: (rewardId: number) => api.post(`/loyalty/rewards/${rewardId}/redeem/`),
};
