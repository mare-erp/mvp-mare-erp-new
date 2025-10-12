'use client';

import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  subValue?: string;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'yellow' | 'red';
  onClick?: () => void;
  isActive?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, subValue, description, color = 'blue', onClick, isActive }) => {
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-300' },
    green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-500', ring: 'ring-green-300' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-500', ring: 'ring-purple-300' },
    yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-300' },
    red: { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-500', ring: 'ring-red-300' },
  };

  const selectedColor = colorClasses[color];

  return (
    <div 
      onClick={onClick}
      className={`bg-white p-5 rounded-lg border transition-all duration-200 ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''} ${isActive ? `${selectedColor.border} ring-2 ${selectedColor.ring}` : 'border-gray-200'}`}>
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${selectedColor.bg}`}>
          {React.cloneElement(icon as React.ReactElement, { className: `w-6 h-6 ${selectedColor.text}` })}
        </div>
        <div className="ml-4">
            <div className="flex justify-between items-start">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {subValue && <span className="text-xs font-semibold text-gray-400 ml-2">{subValue}</span>}
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
