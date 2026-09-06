'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface AlertStatsChartProps {
  distribution?: {
    LOW: number;
    MODERATE: number;
    HIGH: number;
    CRITICAL: number;
  };
}

export function AlertStatsChart({
  distribution = { LOW: 12, MODERATE: 8, HIGH: 5, CRITICAL: 3 },
}: AlertStatsChartProps) {
  const data = [
    { name: 'Low Risk', value: distribution.LOW || 1, color: '#10b981' },
    { name: 'Moderate Risk', value: distribution.MODERATE || 1, color: '#f59e0b' },
    { name: 'High Risk', value: distribution.HIGH || 1, color: '#f97316' },
    { name: 'Critical Emergency', value: distribution.CRITICAL || 1, color: '#ef4444' },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={85}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
