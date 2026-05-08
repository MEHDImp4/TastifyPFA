import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TopDishData {
  name: string;
  quantity: number;
}

interface TopDishesChartProps {
  data: TopDishData[];
}

const TopDishesChart: React.FC<TopDishesChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Plats (30 Jours)</h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
            <XAxis type="number" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" stroke="#4B5563" tick={{ fontSize: 12 }} width={100} />
            <Tooltip
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            />
            <Bar dataKey="quantity" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TopDishesChart;
