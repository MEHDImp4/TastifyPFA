import React from 'react';

interface KpiCardProps {
    title: string;
    value: string | number;
    colorClass: string;
    icon?: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, colorClass, icon }) => {
    return (
        <div className={`p-6 rounded-lg shadow-sm border-l-4 ${colorClass} bg-white flex items-center justify-between`}>
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase">{title}</p>
                <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
            </div>
            {icon && (
                <div className={`p-3 rounded-full ${colorClass.replace('border-', 'bg-').replace('-500', '-100')} text-${colorClass.replace('border-', '')}`}>
                    {icon}
                </div>
            )}
        </div>
    );
};

export default KpiCard;
