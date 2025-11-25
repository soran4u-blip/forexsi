import { db as firestore } from './firebase';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { TradingSignal, AdData } from '../types';

const SIGNALS_COLLECTION = 'signals';
const ADS_COLLECTION = 'ads';

// Helper to check connection before every operation
const checkConnection = () => {
  if (!firestore) {
    throw new Error("Firebase is not connected. Check API keys or Network.");
  }
};

export const db = {
  type: 'firebase',

  init: async () => {
    if (!firestore) {
      console.warn("DB Init: Firebase instance is null.");
      throw new Error("Firebase Not Initialized");
    }
    console.log("Database Service: Connected to Firebase");
    return true;
  },

  signals: {
    getAll: async (): Promise<TradingSignal[]> => {
      checkConnection();
      try {
        const q = query(collection(firestore, SIGNALS_COLLECTION), orderBy('openTime', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as TradingSignal);
      } catch (e) {
        console.error("Error fetching signals:", e);
        throw e;
      }
    },
    add: async (signal: TradingSignal) => {
      checkConnection();
      await setDoc(doc(firestore, SIGNALS_COLLECTION, signal.id), signal);
    },
    update: async (signal: TradingSignal) => {
      checkConnection();
      await updateDoc(doc(firestore, SIGNALS_COLLECTION, signal.id), { ...signal });
    },
    delete: async (id: string) => {
      checkConnection();
      await deleteDoc(doc(firestore, SIGNALS_COLLECTION, id));
    }
  },

  ads: {
    getAll: async (): Promise<AdData[]> => {
      checkConnection();
      try {
        const q = query(collection(firestore, ADS_COLLECTION), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => doc.data() as AdData);
      } catch (e) {
        console.error("Error fetching ads:", e);
        throw e;
      }
    },
    add: async (ad: AdData) => {
      checkConnection();
      await setDoc(doc(firestore, ADS_COLLECTION, ad.id), ad);
    },
    update: async (ad: AdData) => {
      checkConnection();
      await updateDoc(doc(firestore, ADS_COLLECTION, ad.id), { ...ad });
    },
    delete: async (id: string) => {
      checkConnection();
      await deleteDoc(doc(firestore, ADS_COLLECTION, id));
    }
  }
};