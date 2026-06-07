type AuthMode = 'firebase' | 'mock';

function readEnv(name: string, fallback = '') {
  return import.meta.env[name] ?? fallback;
}

export const VITE_FIREBASE_API_KEY = readEnv('VITE_FIREBASE_API_KEY');
export const VITE_FIREBASE_AUTH_DOMAIN = readEnv('VITE_FIREBASE_AUTH_DOMAIN');
export const VITE_FIREBASE_PROJECT_ID = readEnv('VITE_FIREBASE_PROJECT_ID');
export const VITE_FIREBASE_STORAGE_BUCKET = readEnv('VITE_FIREBASE_STORAGE_BUCKET');
export const VITE_FIREBASE_MESSAGING_SENDER_ID = readEnv('VITE_FIREBASE_MESSAGING_SENDER_ID');
export const VITE_FIREBASE_APP_ID = readEnv('VITE_FIREBASE_APP_ID');

export const AUTH_MODE: AuthMode =
  readEnv('VITE_AUTH_MODE', 'firebase') === 'mock' ? 'mock' : 'firebase';

export const ALLOWED_DOMAIN = readEnv('VITE_ALLOWED_DOMAIN', 'muhayu.com');

export const firebaseConfig = {
  apiKey: VITE_FIREBASE_API_KEY,
  authDomain: VITE_FIREBASE_AUTH_DOMAIN,
  projectId: VITE_FIREBASE_PROJECT_ID,
  storageBucket: VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: VITE_FIREBASE_APP_ID,
};

export const env = {
  firebaseConfig,
  authMode: AUTH_MODE,
  allowedDomain: ALLOWED_DOMAIN,
};

export function hasFirebaseEnv() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}
