import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase config is read from environment variables to avoid committing secrets to source.
// See .env.example for expected EXPO_PUBLIC_* variables.
const env = process.env as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
  measurementId: env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID ?? '',
};

// Basic validation to help developers notice missing env vars early.
const missing = Object.entries(firebaseConfig).filter(([_, v]) => !v);
if (missing.length > 0) {
  console.warn('[FIREBASE] Missing Firebase config values:', missing.map(([k]) => k).join(', '));
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);
export default app;
