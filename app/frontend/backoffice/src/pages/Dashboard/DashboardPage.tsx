import React, { useEffect, useState } from 'react';
import axiosInstance from '@shared/auth/axiosInstance';
import KpiCard from './components/KpiCard';
import RevenueChart from './components/RevenueChart';
import TopDishesChart from './components/TopDishesChart';
import { useStaffWebSocket } from '@shared/websocket/WebSocketProvider';
import {
  DollarSign,
  Table,
  ClipboardList,
  Clock
} from 'lucide-react';

interface DashboardData {
  todayRevenue: number;
  activeTables: number;
  pendingOrders: number;
  avgPrepTime: number;
  revenue7Days: { date: string; revenue: number }[];
  topDishes: { name: string; quantity: number }[];
}

const DashboardPage: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { lastEvent } = useStaffWebSocket();

  const fetchDashboardData = async () => {
    try {
      const response = await axiosInstance.get('/analytics/dashboard/');
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Impossible de charger les données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (lastEvent?.type === 'dashboard_update') {
      fetchDashboardData();
    }
  }, [lastEvent]);

  if (loading) {
    return <div className="p-6">Chargement du tableau de bord...</div>;
  }

  if (error || !data) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Tableau de bord</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Revenus du jour"
          value={`${data.todayRevenue.toFixed(2)} MAD`}
          colorClass="border-teal-500"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KpiCard
          title="Tables Actives"
          value={data.activeTables}
          colorClass="border-amber-500"
          icon={<Table className="h-6 w-6" />}
        />
        <KpiCard
          title="Commandes en cours"
          value={data.pendingOrders}
          colorClass="border-orange-500"
          icon={<ClipboardList className="h-6 w-6" />}
        />
        <KpiCard
          title="Temps moy. de prép."
          value={`${data.avgPrepTime} min`}
          colorClass="border-slate-500"
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RevenueChart data={data.revenue7Days} />
        <TopDishesChart data={data.topDishes} />
      </div>
    </div>
  );
};

export default DashboardPage;
