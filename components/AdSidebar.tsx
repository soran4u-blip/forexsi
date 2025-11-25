

import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { AdData } from '../types';

interface AdSidebarProps {
  side: 'left' | 'right';
  ads: AdData[];
}

export const AdSidebar: React.FC<AdSidebarProps> = ({ side, ads }) => {
  // Use specific offsets so left and right sidebars don't show identical ads
  const initialOffset = side === 'left' ? 0 : 5;
  const [startIndex, setStartIndex] = useState(initialOffset);

  // Filter only active ads for display
  const activeAds = ads.filter(ad => ad.status === 'ACTIVE');

  useEffect(() => {
    // Reset index if ads array changes significantly to avoid out of bounds, though modulo handles it
    setStartIndex(prev => prev % (activeAds.length || 1));
  }, [activeAds.length]);

  useEffect(() => {
    if (activeAds.length === 0) return;
    
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 5) % activeAds.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [activeAds.length]);

  // Ensure we wrap around correctly to get 5 items
  const visibleAds = [];
  if (activeAds.length > 0) {
    for (let i = 0; i < 5; i++) {
      visibleAds.push(activeAds[(startIndex + i) % activeAds.length]);
    }
  }

  return (
    <div className={`hidden xl:flex flex-col gap-3 w-56`}>
      <div className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center mb-1">
        Sponsored
      </div>
      {visibleAds.map((ad, idx) => (
        <div 
          key={`${ad.id}-${idx}`} // Use ad.id + idx to ensure unique keys during rotation
          className={`p-3 rounded-xl border flex flex-col justify-between h-28 transition-all hover:scale-105 cursor-pointer animate-in fade-in duration-700 ${ad.color}`}
          onClick={() => ad.uri && window.open(ad.uri, '_blank')}
        >
          <div>
            <h4 className="font-bold text-sm filter brightness-125 truncate">{ad.company}</h4>
            <p className="text-[10px] font-medium opacity-80 mt-1 line-clamp-2">{ad.text}</p>
          </div>
          <div className="flex justify-end items-center gap-1">
            <span className="text-[9px] uppercase font-bold opacity-60">Open</span>
            <ExternalLink className="w-3 h-3 opacity-50" />
          </div>
        </div>
      ))}
      
      {activeAds.length === 0 && (
        <div className="p-4 rounded-xl border border-dashed border-slate-700 text-center">
            <p className="text-xs text-slate-500">No active ads</p>
        </div>
      )}
    </div>
  );
};