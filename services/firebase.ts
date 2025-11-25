import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// --------------------------------------------------------
// TODO: PASTE YOUR FIREBASE CONFIGURATION HERE
// --------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyBMdty-SL1t0kaig8TvBzSmHI7MLljsLIA",
  authDomain: "forexsignal-13f7f.firebaseapp.com",
  projectId: "forexsignal-13f7f",
  storageBucket: "forexsignal-13f7f.firebasestorage.app",
  messagingSenderId: "703458452684",
  appId: "1:703458452684:web:9cf9a8bacce6f1a9844e69",
  measurementId: "G-SK7FV3BSL3"
};

// Check if config is set
export const isFirebaseConfigured = () => {
  return firebaseConfig.apiKey !== "YOUR_API_KEY";
};

let app;
let dbInstance;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    dbInstance = getFirestore(app);
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase not configured. Using LocalStorage fallback.");
}

export const db = dbInstance;