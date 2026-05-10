import { api } from './axios';

export interface DashboardData {
  todayRevenue: number;
  activeTables: number;
  pendingOrders: number;
  avgPrepTime: number;
  revenue7Days: { date: string; revenue: number }[];
  topDishes: { name: string; quantity: number }[];
}

export const analyticsApi = {
  getDashboardData: () => api.get<DashboardData>('/analytics/dashboard/'),
};
