import React, { useState } from 'react';
import { TradingSignal, SignalType, SignalStatus } from '../types';
import { SignalChart } from './SignalChart';
import { ArrowUpCircle, ArrowDownCircle, Target, ShieldAlert, Activity, TrendingUp, TrendingDown, Globe, ScanLine, CheckCircle2, XCircle, Trophy, AlertTriangle, BarChart2, Newspaper, Zap, Clock } from 'lucide-react';

interface SignalCardProps {
  signal: TradingSignal;
  onClose?: (id: string, outcome: 'win' | 'loss') => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onClose }) => {
  const [showFundamental, setShowFundamental] = useState(false);
  
  const isLong = signal.type === SignalType.LONG;
  const isClosed = signal.status === SignalStatus.CLOSED;
  const currentPrice = signal.currentPrice || signal.entryPrice;
  
  // Calculate unrealized PnL
  let unrealizedPnL = 0;
  if (!isClosed) {
    if (isLong) {
      unrealizedPnL = ((currentPrice - signal.entryPrice) / signal.entryPrice) * 100;
    } else {
      unrealizedPnL = ((signal.entryPrice - currentPrice) / signal.entryPrice) * 100;
    }
  }
  const isProfitable = unrealizedPnL >= 0;

  // Dynamic styles based on signal type
  const typeColor = isLong ? 'text-emerald-400' : 'text-rose-400';
  const typeBg = isLong ? 'bg-emerald-500/10' : 'bg-rose-500/10';
  const borderColor = isLong ? 'border-emerald-500/20' : 'border-rose-500/20';

  // Result logic
  const isWin = (signal.realizedPnL || 0) > 0;
  const pnlColor = isWin ? 'text-emerald-400' : 'text-rose-400';
  const PnLIcon = isWin ? TrendingUp : TrendingDown;

  return (
    <div className={`relative bg-slate-800 rounded-xl border ${isClosed ? 'border-slate-700' : borderColor} shadow-xl overflow-hidden transition-all hover:shadow-2xl duration-300 flex flex-col`}>
      
      {/* Result Overlay Badge for Closed Signals */}
      {isClosed && (
        <div className="absolute top-0 right-0 z-20">
          <div className={`px-4 py-1.5 rounded-bl-xl font-bold text-xs tracking-widest uppercase flex items-center gap-1.5 shadow-lg ${isWin ? 'bg-emerald-500 text-slate-900' : 'bg-rose-500 text-white'}`}>
            {isWin ? <Trophy className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            {isWin ? 'WIN' : 'LOSS'}
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className={`px-5 py-4 flex justify-between items-center ${isClosed ? 'bg-slate-700/50' : typeBg} border-b border-slate-700/50`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${isClosed ? 'bg-slate-600' : (isLong ? 'bg-emerald-500/20' : 'bg-rose-500/20')}`}>
            {isLong ? <ArrowUpCircle className={`w-6 h-6 ${isClosed ? 'text-slate-400' : 'text-emerald-400'}`} /> : <ArrowDownCircle className={`w-6 h-6 ${isClosed ? 'text-slate-400' : 'text-rose-400'}`} />}
          </div>
          <div>
            <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg tracking-wide text-white flex items-center gap-2">
                {signal.asset}
                <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase ${isLong ? 'border-emerald-500/30 text-emerald-400' : 'border-rose-500/30 text-rose-400'}`}>
                    {signal.type}
                </span>
                </h3>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{signal.assetType}</span>
               <span className="text-[10px] text-slate-600">•</span>
               <div className="flex items-center gap-1 bg-slate-700/50 px-1.5 rounded">
                 <Clock className="w-3 h-3 text-slate-400" />
                 <span className="text-[10px] text-slate-300 font-mono font-bold">{signal.timeframe || '1H'}</span>
               </div>
            </div>
          </div>
        </div>
        
        {/* Confidence Score or Status */}
        {!isClosed ? (
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-1.5 bg-slate-900/50 px-2 py-1 rounded border border-slate-700/50">
                 <Zap className="w-3 h-3 text-yellow-500" />
                 <span className="text-xs font-bold text-white">{signal.confidenceScore}% Conf.</span>
              </div>
          </div>
        ) : (
             <div className="flex flex-col items-end mr-2 opacity-50">
                <span className="text-[10px] font-bold text-slate-400">CLOSED</span>
            </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-5 flex-1 flex flex-col">
        
        {/* Real-time Monitor for Active Signals */}
        {!isClosed && (
            <div className="mb-4 flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-slate-700/50">
                <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Last Price</div>
                    <div className="text-lg font-mono font-bold text-white tracking-tight">
                        {currentPrice.toFixed(2)}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Unrealized PnL</div>
                    <div className={`text-sm font-mono font-bold ${isProfitable ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isProfitable ? '+' : ''}{unrealizedPnL.toFixed(2)}%
                    </div>
                </div>
            </div>
        )}

        {/* Primary Levels Grid */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors"></div>
            <div className="relative">
                <div className="flex justify-center items-center gap-1 mb-1 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                <Activity className="w-3 h-3" /> Entry
                </div>
                <div className="font-mono text-sm font-bold text-white">{signal.entryPrice}</div>
            </div>
          </div>
          <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors"></div>
             <div className="relative">
                <div className="flex justify-center items-center gap-1 mb-1 text-rose-400 text-[10px] uppercase font-bold tracking-wider">
                <ShieldAlert className="w-3 h-3" /> Stop
                </div>
                <div className="font-mono text-sm font-bold text-rose-400">{signal.stopLoss}</div>
            </div>
          </div>
          <div className="bg-slate-900/40 p-2 rounded border border-slate-700/50 text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors"></div>
             <div className="relative">
                <div className="flex justify-center items-center gap-1 mb-1 text-emerald-400 text-[10px] uppercase font-bold tracking-wider">
                <Target className="w-3 h-3" /> Target
                </div>
                <div className="font-mono text-sm font-bold text-emerald-400">{signal.takeProfit}</div>
            </div>
          </div>
        </div>

        {/* Structure & Pattern Section */}
        <div className="bg-slate-900/30 rounded-lg border border-slate-700/50 p-3 mb-4">
            <div className="flex justify-between items-center mb-3">
                 <div className="flex items-center gap-2">
                    <ScanLine className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-wide">Pattern Detected</span>
                 </div>
                 <span className="text-xs font-bold text-white bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded">
                    {signal.pattern || 'Trend Continuation'}
                 </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-2">
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Support Lvl</span>
                    <span className="font-mono text-xs font-bold text-slate-300">{signal.support || '---'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Resistance Lvl</span>
                    <span className="font-mono text-xs font-bold text-slate-300">{signal.resistance || '---'}</span>
                </div>
            </div>
        </div>

        {/* Results for Closed Signals */}
        {isClosed && (
          <div className={`mb-4 p-3 rounded-lg border flex justify-between items-center ${
            isWin 
              ? 'bg-emerald-900/10 border-emerald-500/20' 
              : 'bg-rose-900/10 border-rose-500/20'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-full ${isWin ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                <PnLIcon className={`w-4 h-4 ${pnlColor}`} />
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Realized PnL</div>
                <div className={`text-lg font-bold font-mono ${pnlColor}`}>
                  {isWin ? '+' : ''}{signal.realizedPnL}%
                </div>
              </div>
            </div>
             <div className={`text-sm font-mono font-bold ${pnlColor}`}>
               {isWin ? '+' : '-'}${Math.abs(signal.realizedPnLValue || 0)}
             </div>
          </div>
        )}

        {/* Analysis Toggle & Content */}
        <div className="flex-1">
             <div className="flex gap-4 mb-2 border-b border-slate-700/50 pb-1">
                <button 
                  onClick={() => setShowFundamental(false)}
                  className={`text-[10px] uppercase font-bold tracking-wider pb-1 transition-colors ${!showFundamental ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-1.5"><BarChart2 className="w-3 h-3" /> Technical</div>
                </button>
                <button 
                  onClick={() => setShowFundamental(true)}
                  className={`text-[10px] uppercase font-bold tracking-wider pb-1 transition-colors ${showFundamental ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <div className="flex items-center gap-1.5"><Newspaper className="w-3 h-3" /> Fundamental</div>
                </button>
             </div>
             
             <div className="h-20 overflow-y-auto pr-1">
                <p className="text-xs text-slate-400 leading-relaxed">
                    {showFundamental ? signal.fundamentalAnalysis : signal.technicalAnalysis}
                </p>
             </div>
        </div>

        {/* Chart */}
        <SignalChart 
          data={signal.chartData} 
          type={signal.type} 
          entryPrice={signal.entryPrice}
          stopLoss={signal.stopLoss}
          takeProfit={signal.takeProfit}
          support={signal.support}
          resistance={signal.resistance}
          pattern={signal.pattern}
          timeframe={signal.timeframe}
        />

        {/* Action Buttons for Active Signals */}
        {!isClosed && onClose && (
          <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-3">
            <button 
              onClick={() => onClose(signal.id, 'win')}
              className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all text-xs font-bold uppercase tracking-wide group"
            >
              <CheckCircle2 className="w-4 h-4 group-hover:scale-110 transition-transform" /> Target Hit
            </button>
            <button 
              onClick={() => onClose(signal.id, 'loss')}
              className="flex items-center justify-center gap-2 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-bold uppercase tracking-wide group"
            >
              <XCircle className="w-4 h-4 group-hover:scale-110 transition-transform" /> Stop Hit
            </button>
          </div>
        )}

        {/* Sources Section Footer */}
        {signal.searchSources && signal.searchSources.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-700/50">
             <div className="flex items-center gap-1.5 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Globe className="w-3 h-3" /> Live Data Sources
             </div>
             <div className="flex flex-wrap gap-2">
                {signal.searchSources.slice(0, 3).map((source, idx) => (
                    <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block max-w-[200px] truncate text-[10px] text-indigo-400/80 hover:text-indigo-400 bg-indigo-500/5 hover:bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/10 transition-colors"
                    >
                    {source.title}
                    </a>
                ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};