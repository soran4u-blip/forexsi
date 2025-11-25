
import React, { useState } from 'react';
import { X, CreditCard, CheckCircle2, Megaphone, LayoutTemplate, Palette, Loader2, ArrowRight } from 'lucide-react';
import { AdData } from '../types';

interface AdvertiseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ad: AdData) => void;
}

const COLOR_THEMES = [
  { name: 'Emerald', class: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
  { name: 'Blue', class: 'bg-blue-500/10 border-blue-500/20 text-blue-400' },
  { name: 'Purple', class: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  { name: 'Orange', class: 'bg-orange-500/10 border-orange-500/20 text-orange-400' },
  { name: 'Rose', class: 'bg-rose-500/10 border-rose-500/20 text-rose-400' },
  { name: 'Gold', class: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
];

export const AdvertiseModal: React.FC<AdvertiseModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Details, 2: Plan, 3: Processing
  const [formData, setFormData] = useState({
    company: '',
    text: '',
    uri: '',
    color: COLOR_THEMES[1].class // Default Blue
  });
  const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium'>('standard');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      // Safe ID generation
      const safeId = (window.crypto && window.crypto.randomUUID) 
        ? window.crypto.randomUUID() 
        : Math.random().toString(36).substring(2) + Date.now().toString(36);

      const newAd: AdData = {
        id: safeId,
        company: formData.company,
        text: formData.text,
        uri: formData.uri || '#',
        color: formData.color,
        status: 'PENDING',
        timestamp: new Date().toISOString()
      };
      onSubmit(newAd);
      setIsProcessing(false);
      onClose();
      // Reset form
      setStep(1);
      setFormData({ company: '', text: '', uri: '', color: COLOR_THEMES[1].class });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-gradient-to-r from-slate-900 to-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-indigo-400" /> Advertise with AlphaSignal
            </h3>
            <p className="text-slate-400 text-sm mt-1">Reach thousands of active traders daily.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          
          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8 text-sm font-bold">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400' : 'text-slate-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 1 ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-600'}`}>1</div>
              Ad Details
            </div>
            <div className={`h-px w-10 ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400' : 'text-slate-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 2 ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-600'}`}>2</div>
              Select Plan
            </div>
            <div className={`h-px w-10 ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>
             <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-400' : 'text-slate-600'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${step >= 3 ? 'border-indigo-500 bg-indigo-500/20' : 'border-slate-600'}`}>3</div>
              Payment
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Company Name</label>
                    <input 
                      type="text" 
                      value={formData.company}
                      onChange={e => setFormData({...formData, company: e.target.value})}
                      placeholder="e.g. CryptoVault"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Ad Text (Max 40 chars)</label>
                    <input 
                      type="text" 
                      maxLength={40}
                      value={formData.text}
                      onChange={e => setFormData({...formData, text: e.target.value})}
                      placeholder="e.g. Best Wallet for 2024"
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-300 mb-2">Target URL</label>
                    <input 
                      type="url" 
                      value={formData.uri}
                      onChange={e => setFormData({...formData, uri: e.target.value})}
                      placeholder="https://..."
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <label className="block text-sm font-bold text-slate-300 mb-2"><Palette className="inline w-4 h-4 mr-1"/> Color Theme</label>
                   <div className="grid grid-cols-2 gap-3">
                      {COLOR_THEMES.map((theme) => (
                        <button
                          key={theme.name}
                          onClick={() => setFormData({...formData, color: theme.class})}
                          className={`p-3 rounded-lg border text-left text-xs font-bold transition-all ${formData.color === theme.class ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-slate-800' : 'opacity-70 hover:opacity-100'} ${theme.class}`}
                        >
                          {theme.name}
                        </button>
                      ))}
                   </div>

                   <div className="mt-6">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Preview</label>
                      <div className={`p-4 rounded-xl border flex flex-col justify-between h-28 shadow-lg ${formData.color}`}>
                        <div>
                          <h4 className="font-bold text-sm filter brightness-125 truncate">{formData.company || 'Your Company'}</h4>
                          <p className="text-[10px] font-medium opacity-80 mt-1">{formData.text || 'Your catchy ad text goes here.'}</p>
                        </div>
                        <div className="flex justify-end items-center gap-1">
                          <span className="text-[9px] uppercase font-bold opacity-60">Sponsored</span>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-4">
                <button 
                  onClick={() => setStep(2)}
                  disabled={!formData.company || !formData.text}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next Step <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
             <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button 
                    onClick={() => setSelectedPlan('standard')}
                    className={`p-6 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${selectedPlan === 'standard' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <LayoutTemplate className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-lg font-bold text-white mb-1">Standard Rotation</h4>
                      <p className="text-slate-400 text-sm mb-4">Ad appears in the sidebar rotation.</p>
                      <div className="text-3xl font-bold text-indigo-400">$50 <span className="text-sm text-slate-500 font-normal">/ day</span></div>
                    </div>
                    {selectedPlan === 'standard' && (
                      <div className="absolute bottom-4 right-4 text-indigo-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                  </button>

                  <button 
                    onClick={() => setSelectedPlan('premium')}
                    className={`p-6 rounded-xl border-2 text-left transition-all relative overflow-hidden group ${selectedPlan === 'premium' ? 'border-yellow-500 bg-yellow-500/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'}`}
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Megaphone className="w-24 h-24" />
                    </div>
                    <div className="relative z-10">
                      <h4 className="text-lg font-bold text-white mb-1">Premium Feature</h4>
                      <p className="text-slate-400 text-sm mb-4">Higher frequency & top placement priority.</p>
                      <div className="text-3xl font-bold text-yellow-400">$200 <span className="text-sm text-slate-500 font-normal">/ week</span></div>
                    </div>
                    {selectedPlan === 'premium' && (
                      <div className="absolute bottom-4 right-4 text-yellow-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                    )}
                  </button>
               </div>

               <div className="flex justify-between pt-4">
                <button 
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-white font-bold px-4 transition-colors"
                >
                  Back
                </button>
                <button 
                  onClick={() => setStep(3)}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
                >
                  Go to Payment <CreditCard className="w-4 h-4" />
                </button>
              </div>
             </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center justify-center py-8 animate-in slide-in-from-right-4 duration-300">
               {!isProcessing ? (
                 <div className="w-full max-w-md space-y-6">
                    <div className="bg-slate-900 p-6 rounded-xl border border-slate-700">
                      <h4 className="text-slate-400 text-sm uppercase font-bold mb-4">Order Summary</h4>
                      <div className="flex justify-between mb-2">
                         <span className="text-white font-medium">{selectedPlan === 'standard' ? 'Standard Plan (24h)' : 'Premium Plan (7 Days)'}</span>
                         <span className="text-white font-bold">{selectedPlan === 'standard' ? '$50.00' : '$200.00'}</span>
                      </div>
                      <div className="flex justify-between mb-4">
                         <span className="text-slate-400 text-sm">Service Fee</span>
                         <span className="text-slate-400 text-sm">$0.00</span>
                      </div>
                      <div className="border-t border-slate-700 pt-3 flex justify-between">
                         <span className="text-white font-bold">Total</span>
                         <span className="text-indigo-400 font-bold text-xl">{selectedPlan === 'standard' ? '$50.00' : '$200.00'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 flex items-center gap-3 opacity-75">
                        <div className="bg-slate-800 p-2 rounded">
                          <CreditCard className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                           <div className="text-white font-bold text-sm">•••• •••• •••• 4242</div>
                           <div className="text-slate-500 text-xs">Mock Card for Demo</div>
                        </div>
                    </div>

                    <div className="flex justify-between pt-4 w-full">
                      <button 
                        onClick={() => setStep(2)}
                        className="text-slate-400 hover:text-white font-bold px-4 transition-colors"
                      >
                        Back
                      </button>
                      <button 
                        onClick={handleSubmit}
                        className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-bold transition-all w-full sm:w-auto shadow-lg shadow-emerald-900/20"
                      >
                        Pay & Submit Request
                      </button>
                    </div>
                 </div>
               ) : (
                 <div className="text-center py-10">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2">Processing Payment...</h3>
                    <p className="text-slate-400">Your sponsorship request is being submitted for review.</p>
                 </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
