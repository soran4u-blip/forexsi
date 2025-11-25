import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ChartPoint, SignalType, Timeframe } from '../types';

interface SignalChartProps {
  data: ChartPoint[];
  type: SignalType;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  support?: number;
  resistance?: number;
  pattern?: string;
  timeframe?: Timeframe;
}

export const SignalChart: React.FC<SignalChartProps> = ({ 
  data: initialData, type, entryPrice, stopLoss, takeProfit, support, resistance, pattern, timeframe = Timeframe.H1 
}) => {
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>(timeframe);

  const isLong = type === SignalType.LONG;
  const strokeColor = isLong ? '#10b981' : '#f43f5e'; // Green or Red
  const fillColor = isLong ? '#10b981' : '#f43f5e';

  // Memoize data generation to avoid flickering on every render
  const chartData = useMemo(() => {
    // If viewing the original timeframe, use the real AI data
    if (activeTimeframe === timeframe) {
      return initialData;
    }
    
    // Otherwise, simulate data for the selected timeframe to provide a visual cue
    // In a real app, this would fetch historical candles from an API
    return Array.from({ length: 20 }, (_, i) => {
      // Generate random noise around the entry price to simulate market movement
      const noise = (Math.random() - 0.5) * (Math.abs(takeProfit - stopLoss) * 0.5);
      return {
        time: `${i}:00`,
        price: entryPrice + noise
      };
    });
  }, [activeTimeframe, timeframe, initialData, entryPrice, takeProfit, stopLoss]);

  // Calculate domain to look nice
  const prices = chartData.map(d => d.price);
  const allValues = [...prices, stopLoss, takeProfit];
  if (support) allValues.push(support);
  if (resistance) allValues.push(resistance);
  
  const minPrice = Math.min(...allValues);
  const maxPrice = Math.max(...allValues);
  const padding = (maxPrice - minPrice) * 0.15;

  return (
    <div className="relative h-64 w-full mt-4 bg-slate-900 rounded-lg border border-slate-700 overflow-hidden group">
      {/* Chart Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-3 z-10 flex justify-between items-start pointer-events-none">
         <div>
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">Chart Snapshot</span>
            {pattern && (
              <div className="text-xs font-mono text-indigo-400 font-bold mt-0.5">{pattern}</div>
            )}
         </div>

         {/* Timeframe Selector */}
         <div className="pointer-events-auto">
            <select
              value={activeTimeframe}
              onChange={(e) => setActiveTimeframe(e.target.value as Timeframe)}
              className="bg-slate-800 border border-slate-600 text-slate-300 text-[10px] font-bold rounded px-2 py-1 outline-none focus:border-indigo-500 cursor-pointer hover:bg-slate-700 transition-colors"
            >
              {Object.values(Timeframe).map((tf) => (
                <option key={tf} value={tf}>{tf}</option>
              ))}
            </select>
         </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{
            top: 40, // Increased top margin for header
            right: 10,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id={`colorPrice-${type}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={fillColor} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={fillColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="time" 
            hide={true} 
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]} 
            hide={true} 
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9', fontSize: '12px' }}
            itemStyle={{ color: '#e2e8f0' }}
            formatter={(value: number) => [value.toFixed(2), 'Price']}
          />
          
          <ReferenceLine 
            y={entryPrice} 
            stroke="#fbbf24" 
            strokeDasharray="3 3" 
            label={{ position: 'insideRight',  value: 'ENTRY', fill: '#fbbf24', fontSize: 10, fontWeight: 'bold' }} 
          />
          <ReferenceLine 
            y={stopLoss} 
            stroke="#f43f5e" 
            label={{ position: 'insideRight', value: 'SL', fill: '#f43f5e', fontSize: 10, fontWeight: 'bold' }} 
          />
          <ReferenceLine 
            y={takeProfit} 
            stroke="#10b981" 
            label={{ position: 'insideRight', value: 'TP', fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} 
          />
          
          {support && (
             <ReferenceLine 
              y={support} 
              stroke="#60a5fa" 
              strokeDasharray="5 5" 
              opacity={0.6}
              label={{ position: 'insideLeft', value: 'SUP', fill: '#60a5fa', fontSize: 9 }} 
            />
          )}

          {resistance && (
             <ReferenceLine 
              y={resistance} 
              stroke="#f97316" 
              strokeDasharray="5 5" 
              opacity={0.6}
              label={{ position: 'insideLeft', value: 'RES', fill: '#f97316', fontSize: 9 }} 
            />
          )}

          <Area 
            type="monotone" 
            dataKey="price" 
            stroke={strokeColor} 
            fillOpacity={1} 
            fill={`url(#colorPrice-${type})`} 
            strokeWidth={2}
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};