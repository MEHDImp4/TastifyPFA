import { api } from './axios';

export interface SentimentStats {
  total: number;
  positif_pct: number;
  negatif_pct: number;
  neutre_pct: number;
}

export interface DashboardData {
  todayRevenue: number;
  activeTables: number;
  pendingOrders: number;
  avgPrepTime: number;
  revenue7Days: { date: string; revenue: number }[];
  topDishes: { name: string; quantity: number }[];
  liveFeed?: { id: string, type: string, message: string, time: string }[];
  sentimentStats?: SentimentStats;
}

export const analyticsApi = {
  getDashboardData: () => api.get<DashboardData>('/analytics/dashboard/'),
};
