
import React, { useState } from 'react';
import { X, Lock, ShieldCheck, Trash2, Check, ExternalLink, Activity, Megaphone } from 'lucide-react';
import { TradingSignal, AdData } from '../types';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  signals: TradingSignal[];
  ads: AdData[];
  onDeleteSignal: (id: string) => void;
  onUpdateAd: (ad: AdData) => void;
  onDeleteAd: (id: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  isOpen, onClose, signals, ads, onDeleteSignal, onUpdateAd, onDeleteAd 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'ads' | 'signals'>('ads');

  if (!isOpen) return null;

  const handleLogin = () => {
    if (password === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert('Incorrect Password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md animate-in fade-in duration-200">
        <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Admin Access</h3>
            <p className="text-slate-400 text-sm mb-6">Enter secure password to continue.</p>
            <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 mb-4 text-center"
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
            <div className="flex gap-2">
                 <button 
                    onClick={onClose}
                    className="flex-1 py-3 rounded-lg border border-slate-600 text-slate-400 font-bold hover:text-white hover:bg-slate-700 transition-colors"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleLogin}
                    className="flex-1 py-3 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/20"
                >
                    Login
                </button>
            </div>
            <div className="mt-4 text-[10px] text-slate-600">Hint: admin123</div>
        </div>
      </div>
    );
  }

  const pendingAds = ads.filter(a => a.status === 'PENDING');
  const activeAds = ads.filter(a => a.status === 'ACTIVE');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 p-2 rounded-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
             </div>
             <div>
                 <h3 className="text-xl font-bold text-white">Admin Dashboard</h3>
                 <p className="text-xs text-slate-400">System Management Console</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Sidebar + Content Layout */}
        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Nav */}
            <div className="w-64 bg-slate-900/50 border-r border-slate-700 p-4 space-y-2">
                <button 
                    onClick={() => setActiveTab('ads')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'ads' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Megaphone className="w-4 h-4" /> Sponsorships
                    {pendingAds.length > 0 && (
                        <span className="ml-auto bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingAds.length}</span>
                    )}
                </button>
                <button 
                    onClick={() => setActiveTab('signals')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all text-sm ${activeTab === 'signals' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                    <Activity className="w-4 h-4" /> Signals
                    <span className="ml-auto bg-slate-700 text-slate-300 text-[10px] px-1.5 py-0.5 rounded-full">{signals.length}</span>
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-900/20">
                
                {activeTab === 'ads' && (
                    <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                        {/* Pending Requests */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-500"></span> Pending Approval ({pendingAds.length})
                            </h4>
                            {pendingAds.length === 0 ? (
                                <div className="p-8 border border-dashed border-slate-700 rounded-xl text-center text-slate-500 text-sm">
                                    No pending sponsorship requests.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {pendingAds.map(ad => (
                                        <div key={ad.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-lg border ${ad.color} w-full`}>
                                                    <div className="font-bold text-sm">{ad.company}</div>
                                                    <div className="text-xs opacity-80">{ad.text}</div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 mt-2">
                                                 <a href={ad.uri} target="_blank" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                                                    Link <ExternalLink className="w-3 h-3" />
                                                 </a>
                                                 <span className="text-[10px] text-slate-500 ml-auto">{new Date(ad.timestamp).toLocaleDateString()}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-700">
                                                <button 
                                                    onClick={() => onDeleteAd(ad.id)}
                                                    className="py-2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 text-xs font-bold"
                                                >
                                                    Reject
                                                </button>
                                                <button 
                                                    onClick={() => onUpdateAd({...ad, status: 'ACTIVE'})}
                                                    className="py-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 text-xs font-bold"
                                                >
                                                    Approve
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Active Ads */}
                        <div>
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active Campaigns ({activeAds.length})
                            </h4>
                            <div className="space-y-2">
                                {activeAds.map(ad => (
                                    <div key={ad.id} className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-slate-600 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${ad.color.split(' ')[0]}`}></div>
                                            <div>
                                                <div className="font-bold text-sm text-white">{ad.company}</div>
                                                <div className="text-xs text-slate-500 truncate max-w-xs">{ad.text}</div>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => onDeleteAd(ad.id)}
                                            className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                            title="Delete Ad"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'signals' && (
                     <div className="animate-in slide-in-from-right-4 duration-300">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Manage Signals</h4>
                        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase font-bold">
                                    <tr>
                                        <th className="p-4">Asset</th>
                                        <th className="p-4">Type</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4">Time</th>
                                        <th className="p-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700">
                                    {signals.map(signal => (
                                        <tr key={signal.id} className="hover:bg-slate-700/30 transition-colors">
                                            <td className="p-4 font-medium text-white">{signal.asset}</td>
                                            <td className="p-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase ${signal.type === 'LONG' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-rose-500/30 text-rose-400 bg-rose-500/10'}`}>
                                                    {signal.type}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <span className={`text-xs ${signal.status === 'ACTIVE' ? 'text-white' : 'text-slate-500'}`}>
                                                    {signal.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-slate-400 text-xs">
                                                {new Date(signal.openTime).toLocaleString()}
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => onDeleteSignal(signal.id)}
                                                    className="text-slate-500 hover:text-rose-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                     </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};
