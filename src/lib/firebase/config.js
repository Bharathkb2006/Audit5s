/**
 * Primary source: REACT_APP_* env vars.
 * Fallback source: fixed project config from Firebase console.
 * This keeps production working even if Vercel envs are missing/misconfigured.
 */

const FIREBASE_FALLBACK = {
  apiKey: 'AIzaSyBaGp7iu6vD7HHbed-q9kNZ_QONC1L8mEk',
  authDomain: 'sauddit.firebaseapp.com',
  projectId: 'sauddit',
  storageBucket: 'sauddit.firebasestorage.app',
  messagingSenderId: '912653801013',
  appId: '1:912653801013:web:5b17bc6b013d76cf5f837c',
};

function readEnv(name, fallback = '') {
  const v = process.env[name];
  if (typeof v === 'string' && v.trim()) return v.trim();
  return fallback;
}

export function isFirebaseConfigured() {
  const opts = firebaseOptions();
  return Boolean(
    typeof opts.apiKey === 'string' &&
      opts.apiKey &&
      typeof opts.projectId === 'string' &&
      opts.projectId &&
      typeof opts.storageBucket === 'string' &&
      opts.storageBucket
  );
}

export function isFirebaseAuthEnabled() {
  return process.env.REACT_APP_FIREBASE_USE_AUTH === 'true';
}

export function firebaseOptions() {
  const measurementId = readEnv('REACT_APP_FIREBASE_MEASUREMENT_ID', '');
  return {
    apiKey: readEnv('REACT_APP_FIREBASE_API_KEY', FIREBASE_FALLBACK.apiKey),
    authDomain: readEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', FIREBASE_FALLBACK.authDomain),
    projectId: readEnv('REACT_APP_FIREBASE_PROJECT_ID', FIREBASE_FALLBACK.projectId),
    storageBucket: readEnv('REACT_APP_FIREBASE_STORAGE_BUCKET', FIREBASE_FALLBACK.storageBucket),
    messagingSenderId: readEnv(
      'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
      FIREBASE_FALLBACK.messagingSenderId
    ),
    appId: readEnv('REACT_APP_FIREBASE_APP_ID', FIREBASE_FALLBACK.appId),
    ...(measurementId ? { measurementId } : {}),
  };
}
