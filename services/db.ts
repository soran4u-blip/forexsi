import { TradingSignal, AdData, AssetType, SignalType, SignalStatus, Timeframe } from '../types';
import { db as firestoreDb, isFirebaseConfigured } from './firebase';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, limit } from 'firebase/firestore';

const KEYS = {
  SIGNALS: 'alphasignal_db_signals',
  ADS: 'alphasignal_db_ads',
  INIT: 'alphasignal_db_initialized'
};

// --- SEED DATA ---

const MOCK_HISTORY_SEED: TradingSignal[] = [
  {
    id: 'mock-1',
    asset: 'BTC/USD',
    assetType: AssetType.CRYPTO,
    type: SignalType.LONG,
    entryPrice: 42500,
    currentPrice: 42500,
    stopLoss: 41000,
    takeProfit: 45000,
    support: 41200,
    resistance: 44800,
    pattern: "Bull Flag Breakout",
    timeframe: Timeframe.H4,
    status: SignalStatus.CLOSED,
    openTime: new Date(Date.now() - 86400000 * 2).toISOString(),
    realizedPnL: 5.8,
    realizedPnLValue: 2500,
    confidenceScore: 88,
    technicalAnalysis: "Bull flag breakout on the 4H chart confirmed by volume spike.",
    fundamentalAnalysis: "Spot ETF inflows remain strong, creating supply shock.",
    chartData: Array.from({length: 20}, (_, i) => ({ time: `${i}:00`, price: 41500 + Math.random() * 2000 }))
  },
  {
    id: 'mock-2',
    asset: 'XAU/USD',
    assetType: AssetType.COMMODITY,
    type: SignalType.SHORT,
    entryPrice: 2050,
    currentPrice: 2050,
    stopLoss: 2065,
    takeProfit: 2010,
    support: 2015,
    resistance: 2060,
    pattern: "Double Top",
    timeframe: Timeframe.H1,
    status: SignalStatus.CLOSED,
    openTime: new Date(Date.now() - 86400000 * 5).toISOString(),
    realizedPnL: -0.7, // Loss
    realizedPnLValue: -150,
    confidenceScore: 72,
    technicalAnalysis: "Double top formation at resistance with RSI divergence.",
    fundamentalAnalysis: "Stronger than expected CPI data pushed yields higher.",
    chartData: Array.from({length: 20}, (_, i) => ({ time: `${i}:00`, price: 2040 + Math.random() * 30 }))
  }
];

const INITIAL_ADS_SEED: AdData[] = [
  { id: 'ad-1', company: "BitVault", text: "Secure Cold Storage", color: "bg-orange-500/10 border-orange-500/20 text-orange-400", status: 'ACTIVE', timestamp: new Date().toISOString() },
  { id: 'ad-2', company: "ForexPro", text: "0 Pip Spreads", color: "bg-blue-500/10 border-blue-500/20 text-blue-400", status: 'ACTIVE', timestamp: new Date().toISOString() },
  { id: 'ad-3', company: "GoldRush", text: "Buy Physical Gold", color: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400", status: 'ACTIVE', timestamp: new Date().toISOString() },
  { id: 'ad-4', company: "AlphaBets", text: "AI Trading Signals", color: "bg-purple-500/10 border-purple-500/20 text-purple-400", status: 'ACTIVE', timestamp: new Date().toISOString() },
  { id: 'ad-5', company: "SecureWallet", text: "Hardware Wallet Sale", color: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400", status: 'ACTIVE', timestamp: new Date().toISOString() },
];

// --- DATABASE SERVICE FACTORY ---

const createLocalStorageService = () => ({
  type: 'local',
  async init(): Promise<void> {
    const isInitialized = localStorage.getItem(KEYS.INIT);
    if (!isInitialized) {
      console.log('Local DB: Seeding data...');
      localStorage.setItem(KEYS.SIGNALS, JSON.stringify(MOCK_HISTORY_SEED));
      localStorage.setItem(KEYS.ADS, JSON.stringify(INITIAL_ADS_SEED));
      localStorage.setItem(KEYS.INIT, 'true');
    }
  },
  signals: {
    async getAll(): Promise<TradingSignal[]> {
      const data = localStorage.getItem(KEYS.SIGNALS);
      return data ? JSON.parse(data) : [];
    },
    async add(signal: TradingSignal): Promise<void> {
      const signals = await this.getAll();
      signals.unshift(signal);
      localStorage.setItem(KEYS.SIGNALS, JSON.stringify(signals));
    },
    async update(updatedSignal: TradingSignal): Promise<void> {
      const signals = await this.getAll();
      const index = signals.findIndex(s => s.id === updatedSignal.id);
      if (index !== -1) {
        signals[index] = updatedSignal;
        localStorage.setItem(KEYS.SIGNALS, JSON.stringify(signals));
      }
    },
    async delete(id: string): Promise<void> {
      const signals = await this.getAll();
      const filtered = signals.filter(s => s.id !== id);
      localStorage.setItem(KEYS.SIGNALS, JSON.stringify(filtered));
    }
  },
  ads: {
    async getAll(): Promise<AdData[]> {
      const data = localStorage.getItem(KEYS.ADS);
      return data ? JSON.parse(data) : [];
    },
    async add(ad: AdData): Promise<void> {
      const ads = await this.getAll();
      ads.unshift(ad);
      localStorage.setItem(KEYS.ADS, JSON.stringify(ads));
    },
    async update(updatedAd: AdData): Promise<void> {
      const ads = await this.getAll();
      const index = ads.findIndex(a => a.id === updatedAd.id);
      if (index !== -1) {
        ads[index] = updatedAd;
        localStorage.setItem(KEYS.ADS, JSON.stringify(ads));
      }
    },
    async delete(id: string): Promise<void> {
      const ads = await this.getAll();
      const filtered = ads.filter(a => a.id !== id);
      localStorage.setItem(KEYS.ADS, JSON.stringify(filtered));
    }
  }
});

const createFirebaseService = () => ({
  type: 'firebase',
  async init(): Promise<void> {
    if (!firestoreDb) return;
    
    // Safety Timeout: If Firebase takes too long (e.g. firewall), we resolve to avoid blocking UI
    const timeoutPromise = new Promise<void>((resolve) => {
      setTimeout(() => {
        console.warn("Firebase Init Timeout - Proceeding");
        resolve();
      }, 2000);
    });

    const initLogic = async () => {
      try {
        const signalsRef = collection(firestoreDb, 'signals');
        const q = query(signalsRef, limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log('Firebase: Seeding initial data...');
          for (const signal of MOCK_HISTORY_SEED) {
            await setDoc(doc(firestoreDb, 'signals', signal.id), signal);
          }
          for (const ad of INITIAL_ADS_SEED) {
            await setDoc(doc(firestoreDb, 'ads', ad.id), ad);
          }
        }
      } catch (e) {
        console.error("Firebase Init Error (Check Rules/Keys):", e);
      }
    };

    await Promise.race([initLogic(), timeoutPromise]);
  },
  signals: {
    async getAll(): Promise<TradingSignal[]> {
      if (!firestoreDb) return [];
      try {
        const querySnapshot = await getDocs(collection(firestoreDb, 'signals'));
        const signals: TradingSignal[] = [];
        querySnapshot.forEach((doc) => {
          signals.push(doc.data() as TradingSignal);
        });
        return signals.sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
      } catch (e) {
        console.error("Error fetching signals:", e);
        return [];
      }
    },
    async add(signal: TradingSignal): Promise<void> {
      if (!firestoreDb) return;
      await setDoc(doc(firestoreDb, 'signals', signal.id), signal);
    },
    async update(updatedSignal: TradingSignal): Promise<void> {
      if (!firestoreDb) return;
      await updateDoc(doc(firestoreDb, 'signals', updatedSignal.id), { ...updatedSignal });
    },
    async delete(id: string): Promise<void> {
      if (!firestoreDb) return;
      await deleteDoc(doc(firestoreDb, 'signals', id));
    }
  },
  ads: {
    async getAll(): Promise<AdData[]> {
      if (!firestoreDb) return [];
      try {
        const querySnapshot = await getDocs(collection(firestoreDb, 'ads'));
        const ads: AdData[] = [];
        querySnapshot.forEach((doc) => {
          ads.push(doc.data() as AdData);
        });
        return ads.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      } catch (e) {
        console.error("Error fetching ads:", e);
        return [];
      }
    },
    async add(ad: AdData): Promise<void> {
      if (!firestoreDb) return;
      await setDoc(doc(firestoreDb, 'ads', ad.id), ad);
    },
    async update(updatedAd: AdData): Promise<void> {
      if (!firestoreDb) return;
      await updateDoc(doc(firestoreDb, 'ads', updatedAd.id), { ...updatedAd });
    },
    async delete(id: string): Promise<void> {
      if (!firestoreDb) return;
      await deleteDoc(doc(firestoreDb, 'ads', id));
    }
  }
});

export const db = isFirebaseConfigured() ? createFirebaseService() : createLocalStorageService();