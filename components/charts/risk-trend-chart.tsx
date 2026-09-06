'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface RiskDataPoint {
  time: string;
  riskScore: number;
  rainfall: number;
  waterLevel: number;
}

interface RiskTrendChartProps {
  data?: RiskDataPoint[];
}

const defaultData: RiskDataPoint[] = [
  { time: '00:00', riskScore: 25, rainfall: 8.5, waterLevel: 2.1 },
  { time: '04:00', riskScore: 32, rainfall: 14.2, waterLevel: 2.8 },
  { time: '08:00', riskScore: 58, rainfall: 42.0, waterLevel: 3.9 },
  { time: '12:00', riskScore: 78, rainfall: 85.0, waterLevel: 4.8 },
  { time: '16:00', riskScore: 82, rainfall: 92.4, waterLevel: 5.1 },
  { time: '20:00', riskScore: 64, rainfall: 45.0, waterLevel: 4.3 },
  { time: '24:00', riskScore: 45, rainfall: 22.0, waterLevel: 3.5 },
];

export function RiskTrendChart({ data = defaultData }: RiskTrendChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="riskGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0c8ce9" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#0c8ce9" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="rainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} stroke="#888888" />
          <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#888888" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '0.5rem',
              color: '#fff',
            }}
          />
          <Area
            type="monotone"
            dataKey="riskScore"
            name="Flood Risk Index"
            stroke="#0c8ce9"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#riskGradient)"
          />
          <Area
            type="monotone"
            dataKey="rainfall"
            name="Rainfall (mm)"
            stroke="#38bdf8"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#rainGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
