import React, { memo } from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  color: string;
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = memo(({ title, value, icon: Icon, color, subtext }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start justify-between hover:shadow-md transition-shadow">
    <div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{value}</h3>
      {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-xl ${color} bg-opacity-20`}>
      <Icon className={color.replace('bg-', 'text-').replace('50', '600')} size={24} />
    </div>
  </div>
));

export default StatCard;
