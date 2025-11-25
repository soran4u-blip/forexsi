import React, { useState, useEffect } from 'react';
import { ASSETS, TradingSignal, SignalStatus, AssetType, SignalType, UserPreferences, RiskLevel, TradeDuration, Timeframe, AdData } from './types';
import { generateSignal, getLatestPrices } from './services/gemini';
import { db } from './services/db';
import { SignalCard } from './components/SignalCard';
import { AdSidebar } from './components/AdSidebar';
import { AdvertiseModal } from './components/AdvertiseModal';
import { AdminDashboard } from './components/AdminDashboard';
import { Zap, BrainCircuit, RefreshCw, LayoutGrid, Filter, SlidersHorizontal, X, RotateCcw, Settings, Check, Megaphone, Database, Shield, Cloud, WifiOff } from 'lucide-react';

const AVAILABLE_INDICATORS = [
  "RSI (Relative Strength Index)",
  "MACD (Moving Average Convergence Divergence)",
  "Bollinger Bands",
  "Fibonacci Retracement",
  "Moving Averages (SMA/EMA)",
  "Volume Profile",
  "Stochastic Oscillator"
];

const DEFAULT_PREFERENCES: UserPreferences = {
  riskLevel: RiskLevel.MODERATE,
  tradeDuration: TradeDuration.INTRADAY,
  preferredIndicators: ["RSI (Relative Strength Index)", "Moving Averages (SMA/EMA)"]
};

type TabType = 'all' | 'active' | 'history';

// Safe ID Generator helper
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export default function App() {
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [ads, setAds] = useState<AdData[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [dbError, setDbError] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterAssetType, setFilterAssetType] = useState<string>('ALL');
  const [filterSignalType, setFilterSignalType] = useState<string>('ALL');
  const [filterTimeframe, setFilterTimeframe] = useState<string>('ALL');
  const [minConfidence, setMinConfidence] = useState<number>(0);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Initialize Database and Load Data
  useEffect(() => {
    const initData = async () => {
      try {
        await db.init();
        
        // Fetch Data concurrently
        const [loadedSignals, loadedAds] = await Promise.all([
          db.signals.getAll().catch(e => { console.error("Signals fetch error:", e); return []; }),
          db.ads.getAll().catch(e => { console.error("Ads fetch error:", e); return []; })
        ]);

        setSignals(loadedSignals);
        setAds(loadedAds);
        setDbError(false);
      } catch (e) {
        console.error("Critical Database Error during init:", e);
        setDbError(true);
      } finally {
        setIsDbLoading(false);
      }
    };

    initData();
  }, []);

  // Load preferences from local storage (safe to keep local)
  useEffect(() => {
    const saved = localStorage.getItem('alphaSignalPrefs');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse preferences", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('alphaSignalPrefs', JSON.stringify(preferences));
  }, [preferences]);

  const handleRefreshPrices = async () => {
    const activeAssets = signals
      .filter(s => s.status === SignalStatus.ACTIVE)
      .map(s => s.asset);

    if (activeAssets.length === 0) return;

    setIsRefreshing(true);
    const uniqueAssets: string[] = Array.from(new Set(activeAssets));

    try {
      const prices = await getLatestPrices(uniqueAssets);
      setSignals(prevSignals => prevSignals.map(signal => {
        if (signal.status === SignalStatus.ACTIVE && prices[signal.asset]) {
            return {
              ...signal,
              currentPrice: prices[signal.asset]
            };
        }
        return signal;
      }));
    } catch (err) {
      console.error("Price update failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleGenerateSignal = async () => {
    if (dbError) {
      setError("Cannot save signal: Database connection failed.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const partialSignal = await generateSignal(selectedAsset.symbol, selectedAsset.type, preferences);
      
      const newSignal: TradingSignal = {
        ...partialSignal as TradingSignal,
        id: generateId(),
        asset: selectedAsset.symbol,
        assetType: selectedAsset.type,
        status: SignalStatus.ACTIVE,
        openTime: new Date().toISOString(),
        currentPrice: partialSignal.entryPrice
      };

      await db.signals.add(newSignal);

      setSignals(prev => [newSignal, ...prev]);
      setActiveTab('all'); 
      setFilterAssetType('ALL');
      setFilterSignalType('ALL');
      setFilterTimeframe('ALL');
      setMinConfidence(0);
    } catch (err) {
      console.error(err);
      setError("Failed to generate signal. Check API Key or DB connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSignal = async (id: string, outcome: 'win' | 'loss') => {
    if (dbError) return;

    const signalToClose = signals.find(s => s.id === id);
    if (!signalToClose) return;

    let pnlPercent = 0;
    let pnlValue = 0;

    if (outcome === 'win') {
      pnlPercent = Math.abs((signalToClose.takeProfit - signalToClose.entryPrice) / signalToClose.entryPrice * 100);
      pnlValue = 100 * pnlPercent;
    } else {
      pnlPercent = -Math.abs((signalToClose.entryPrice - signalToClose.stopLoss) / signalToClose.entryPrice * 100);
      pnlValue = 100 * pnlPercent;
    }
    
    pnlPercent = Math.round(pnlPercent * 100) / 100;
    pnlValue = Math.round(pnlValue);

    const updatedSignal: TradingSignal = {
      ...signalToClose,
      status: SignalStatus.CLOSED,
      closeTime: new Date().toISOString(),
      realizedPnL: pnlPercent,
      realizedPnLValue: pnlValue
    };

    await db.signals.update(updatedSignal);
    setSignals(prev => prev.map(s => s.id === id ? updatedSignal : s));
  };

  const handleAdminDeleteSignal = async (id: string) => {
    if (dbError) return;
    await db.signals.delete(id);
    setSignals(prev => prev.filter(s => s.id !== id));
  };

  const handleAdminUpdateAd = async (ad: AdData) => {
    if (dbError) return;
    await db.ads.update(ad);
    setAds(prev => prev.map(a => a.id === ad.id ? ad : a));
  };

  const handleAdminDeleteAd = async (id: string) => {
    if (dbError) return;
    await db.ads.delete(id);
    setAds(prev => prev.filter(a => a.id !== id));
  };

  const handleNewAd = async (newAd: AdData) => {
    if (dbError) {
      alert("Database Error: Cannot submit ad at this time.");
      return;
    }
    await db.ads.add(newAd);
    setAds(prev => [newAd, ...prev]); 
    alert("Ad submitted successfully! It will appear after admin approval.");
  };

  const resetFilters = () => {
    setFilterAssetType('ALL');
    setFilterSignalType('ALL');
    setFilterTimeframe('ALL');
    setMinConfidence(0);
  };

  const toggleIndicator = (indicator: string) => {
    setPreferences(prev => {
      const exists = prev.preferredIndicators.includes(indicator);
      return {
        ...prev,
        preferredIndicators: exists 
          ? prev.preferredIndicators.filter(i => i !== indicator)
          : [...prev.preferredIndicators, indicator]
      };
    });
  };

  const filteredSignals = signals.filter(s => {
    if (activeTab === 'active' && s.status !== SignalStatus.ACTIVE) return false;
    if (activeTab === 'history' && s.status !== SignalStatus.CLOSED) return false;
    if (filterAssetType !== 'ALL' && s.assetType !== filterAssetType) return false;
    if (filterSignalType !== 'ALL' && s.type !== filterSignalType) return false;
    if (filterTimeframe !== 'ALL' && s.timeframe !== filterTimeframe) return false;
    if (s.confidenceScore < minConfidence) return false;
    return true;
  });

  const activeFiltersCount = (filterAssetType !== 'ALL' ? 1 : 0) + (filterSignalType !== 'ALL' ? 1 : 0) + (filterTimeframe !== 'ALL' ? 1 : 0) + (minConfidence > 0 ? 1 : 0);

  if (isDbLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Database className="w-12 h-12 text-indigo-500 animate-bounce mb-4" />
        <h2 className="text-xl font-bold">Initializing Cloud...</h2>
        <p className="text-slate-400 mt-2">Connecting to Firebase</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative flex flex-col bg-slate-900 text-slate-200">
      
      <AdvertiseModal 
        isOpen={isAdModalOpen} 
        onClose={() => setIsAdModalOpen(false)} 
        onSubmit={handleNewAd} 
      />

      <AdminDashboard 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        signals={signals}
        ads={ads}
        onDeleteSignal={handleAdminDeleteSignal}
        onUpdateAd={handleAdminUpdateAd}
        onDeleteAd={handleAdminDeleteAd}
      />

      {isSettingsOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl overflow-hidden">
             <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
               <h3 className="text-xl font-bold text-white flex items-center gap-2">
                 <Settings className="w-5 h-5 text-indigo-400" /> Signal Preferences
               </h3>
               <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                 <X className="w-6 h-6" />
               </button>
             </div>
             <div className="p-6 overflow-y-auto max-h-[70vh]">
               <div className="mb-6">
                 <label className="block text-sm font-bold text-slate-300 mb-3">Risk Profile</label>
                 <div className="grid grid-cols-3 gap-2">
                   {Object.values(RiskLevel).map(level => (
                     <button
                       key={level}
                       onClick={() => setPreferences(p => ({...p, riskLevel: level}))}
                       className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${preferences.riskLevel === level ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                     >
                       {level}
                     </button>
                   ))}
                 </div>
               </div>
               <div className="mb-6">
                 <label className="block text-sm font-bold text-slate-300 mb-3">Trade Duration</label>
                 <div className="grid grid-cols-1 gap-2">
                   {Object.values(TradeDuration).map(duration => (
                     <button
                       key={duration}
                       onClick={() => setPreferences(p => ({...p, tradeDuration: duration}))}
                       className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold border transition-all ${preferences.tradeDuration === duration ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                     >
                       {duration}
                       {preferences.tradeDuration === duration && <Check className="w-4 h-4 text-indigo-400" />}
                     </button>
                   ))}
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-bold text-slate-300 mb-3">Preferred Indicators</label>
                 <div className="space-y-2">
                   {AVAILABLE_INDICATORS.map(ind => {
                     const isSelected = preferences.preferredIndicators.includes(ind);
                     return (
                        <button
                          key={ind}
                          onClick={() => toggleIndicator(ind)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-all text-left ${isSelected ? 'bg-slate-700 border-indigo-500/50' : 'bg-slate-900 border-slate-700 hover:border-slate-600'}`}
                        >
                          <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600 bg-slate-800'}`}>
                             {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`text-sm ${isSelected ? 'text-white font-medium' : 'text-slate-400'}`}>
                            {ind}
                          </span>
                        </button>
                     );
                   })}
                 </div>
               </div>
             </div>
             <div className="p-4 bg-slate-900/50 border-t border-slate-700 flex justify-end">
               <button onClick={() => setIsSettingsOpen(false)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg">
                 Save Preferences
               </button>
             </div>
          </div>
        </div>
      )}

      <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                AlphaSignal AI
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button onClick={() => setIsAdModalOpen(true)} className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/30 text-orange-400 hover:text-orange-300 hover:border-orange-500/50 transition-all text-xs font-bold uppercase tracking-wide">
                <Megaphone className="w-3.5 h-3.5" /> Advertise
              </button>

              <div className="hidden md:flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'all' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>All Signals</button>
                <button onClick={() => setActiveTab('active')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'active' ? 'bg-slate-700 text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-white'}`}>Active</button>
                <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${activeTab === 'history' ? 'bg-slate-700 text-slate-300 shadow-sm' : 'text-slate-400 hover:text-white'}`}>History</button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex justify-center w-full max-w-[1800px] mx-auto gap-6 px-4">
        
        <div className="hidden xl:block pt-8 sticky top-16 h-fit">
          <AdSidebar side="left" ads={ads} />
        </div>

        <main className="flex-1 w-full max-w-7xl py-8">
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm mb-8">
            <div className="md:flex justify-between items-center gap-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Market Intelligence Generator</h2>
                <p className="text-slate-400 mb-1">Select an asset and let AI analyze market structure.</p>
                <div className="flex items-center gap-2 text-xs text-indigo-400 font-medium">
                  <span>Config: {preferences.riskLevel} Risk</span>
                  <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                  <span>{preferences.tradeDuration.split(' ')[0]}</span>
                </div>
              </div>
              
              <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
                <select 
                  value={selectedAsset.symbol}
                  onChange={(e) => setSelectedAsset(ASSETS.find(a => a.symbol === e.target.value) || ASSETS[0])}
                  className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:w-48 p-3"
                >
                  {ASSETS.map(asset => (
                    <option key={asset.symbol} value={asset.symbol}>{asset.name} ({asset.symbol})</option>
                  ))}
                </select>
                
                <button onClick={() => setIsSettingsOpen(true)} className="flex items-center justify-center p-3 rounded-lg bg-slate-700 border border-slate-600 hover:bg-slate-600 text-slate-300 transition-colors">
                  <Settings className="w-5 h-5" />
                </button>

                <button 
                  onClick={handleGenerateSignal}
                  disabled={isLoading || dbError}
                  className={`flex items-center justify-center gap-2 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg shadow-indigo-500/20 ${isLoading || dbError ? 'bg-slate-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95'}`}
                >
                  {isLoading ? <><RefreshCw className="w-5 h-5 animate-spin" /> Analyzing...</> : <><Zap className="w-5 h-5" /> Generate Signal</>}
                </button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" /> {error}
              </div>
            )}
            
            {dbError && (
               <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 text-sm flex items-center gap-2">
                <WifiOff className="w-4 h-4" /> Connection to Firebase failed. You are viewing cached or empty data.
              </div>
            )}
          </div>

          <div>
            <div className="flex md:hidden border-b border-slate-800 mb-6 overflow-x-auto">
              {['all', 'active', 'history'].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as TabType)} className={`flex-1 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors capitalize ${activeTab === tab ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500'}`}>{tab}</button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="hidden md:flex items-center gap-3">
                <LayoutGrid className="text-indigo-400" />
                <h3 className="text-xl font-bold text-white">
                  {activeTab === 'all' && 'Signal Feed'}
                  {activeTab === 'active' && 'Live Opportunities'}
                  {activeTab === 'history' && 'Performance Archive'}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">
                  {filteredSignals.length}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <button onClick={handleRefreshPrices} disabled={isRefreshing || dbError} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-700 text-slate-400 hover:text-white bg-slate-800 text-sm font-bold transition-all w-full md:w-auto active:scale-95 disabled:opacity-50">
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Updating...' : 'Refresh Prices'}
                </button>

                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg border text-sm font-bold transition-all w-full md:w-auto ${isFilterOpen || activeFiltersCount > 0 ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                    {isFilterOpen ? <X className="w-4 h-4" /> : <Filter className="w-4 h-4" />}
                    {isFilterOpen ? 'Close' : 'Filters'}
                    {activeFiltersCount > 0 && !isFilterOpen && <span className="bg-indigo-400 text-slate-900 text-[10px] h-5 w-5 flex items-center justify-center rounded-full ml-1">{activeFiltersCount}</span>}
                </button>
              </div>
            </div>

            {isFilterOpen && (
              <div className="mb-8 p-6 bg-slate-800/80 border border-slate-700 rounded-xl backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 text-white font-bold">
                    <SlidersHorizontal className="w-4 h-4 text-indigo-400" /> Refine Results
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asset Class</label>
                      <select value={filterAssetType} onChange={(e) => setFilterAssetType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5">
                        <option value="ALL">All Assets</option>
                        <option value={AssetType.CRYPTO}>Crypto</option>
                        <option value={AssetType.FOREX}>Forex</option>
                        <option value={AssetType.COMMODITY}>Commodity</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Direction</label>
                      <select value={filterSignalType} onChange={(e) => setFilterSignalType(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5">
                        <option value="ALL">Any Direction</option>
                        <option value={SignalType.LONG}>Long (Buy)</option>
                        <option value={SignalType.SHORT}>Short (Sell)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Timeframe</label>
                      <select value={filterTimeframe} onChange={(e) => setFilterTimeframe(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white text-sm rounded-lg p-2.5">
                        <option value="ALL">All Timeframes</option>
                        {Object.values(Timeframe).map(tf => <option key={tf} value={tf}>{tf}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                        <span>Min Confidence</span><span className="text-indigo-400">{minConfidence}%</span>
                      </label>
                      <input type="range" min="0" max="95" step="5" value={minConfidence} onChange={(e) => setMinConfidence(parseInt(e.target.value))} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500" />
                    </div>
                    <div className="col-span-1 md:col-span-4 flex justify-end">
                      <button onClick={resetFilters} className="px-6 py-2.5 rounded-lg border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-sm font-bold flex items-center justify-center gap-2">
                        <RotateCcw className="w-4 h-4" /> Reset Filters
                      </button>
                    </div>
                </div>
              </div>
            )}

            {filteredSignals.length === 0 && (
              <div className="text-center py-20 bg-slate-800/30 rounded-2xl border border-dashed border-slate-700">
                <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BrainCircuit className="w-8 h-8 text-slate-500" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No signals found</h3>
                <p className="text-slate-400 max-w-md mx-auto">
                  {activeFiltersCount > 0 ? "Try adjusting your filters to see more results." : (activeTab === 'active' ? "No active signals. Generate one to get started." : "No trade history available yet.")}
                </p>
                {activeFiltersCount > 0 && <button onClick={resetFilters} className="mt-4 text-indigo-400 text-sm font-bold hover:text-indigo-300">Clear all filters</button>}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSignals.map(signal => (
                <SignalCard key={signal.id} signal={signal} onClose={handleCloseSignal} />
              ))}
            </div>
          </div>
        </main>

        <div className="hidden xl:block pt-8 sticky top-16 h-fit">
          <AdSidebar side="right" ads={ads} />
        </div>
      </div>

      <footer className="mt-8 border-t border-slate-800 py-8 bg-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">Powered by Google Gemini AI • Trading involves risk</p>
          <div className="mt-6 flex justify-center">
             <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${!dbError ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                {!dbError ? <Cloud className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                {!dbError ? 'Cloud Database Active' : 'Connection Error'}
             </div>
          </div>
          <button onClick={() => setIsAdminOpen(true)} className="absolute bottom-4 right-4 text-slate-700 hover:text-slate-500 transition-colors">
             <Shield className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}