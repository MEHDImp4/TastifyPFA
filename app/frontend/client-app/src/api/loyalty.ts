import { api } from './axios';

export interface LoyaltyProfile {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tier_display: string;
}

export const loyaltyApi = {
  getMyStatus: () => api.get<LoyaltyProfile>('/loyalty/my_status/'),
};
