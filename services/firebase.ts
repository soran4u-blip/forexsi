
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBMdty-SL1t0kaig8TvBzSmHI7MLljsLIA",
  authDomain: "forexsignal-13f7f.firebaseapp.com",
  projectId: "forexsignal-13f7f",
  storageBucket: "forexsignal-13f7f.firebasestorage.app",
  messagingSenderId: "703458452684",
  appId: "1:703458452684:web:9cf9a8bacce6f1a9844e69",
  measurementId: "G-SK7FV3BSL3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
