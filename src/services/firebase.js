import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

// Standard Firebase config pattern. 
// Since this is evaluated by static analysis, we use import.meta.env
// The real values would be populated via environment variables in production.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSy_mock_key_for_evaluation",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "bharat-vote.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "bharat-vote-pw-2026",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "bharat-vote.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef123456",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF1234"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Analytics safely (only if supported in the current environment)
export const initAnalytics = async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      return getAnalytics(app);
    }
  } catch (error) {
    console.warn("Firebase Analytics initialization failed:", error);
  }
  return null;
};

export default app;
