/**
 * Fixed Firebase config for this project.
 * Intentionally avoids env overrides to prevent Vercel bucket/project mismatch.
 */
const FIREBASE_FIXED = {
  apiKey: 'AIzaSyBaGp7iu6vD7HHbed-q9kNZ_QONC1L8mEk',
  authDomain: 'sauddit.firebaseapp.com',
  projectId: 'sauddit',
  storageBucket: 'sauddit.firebasestorage.app',
  messagingSenderId: '912653801013',
  appId: '1:912653801013:web:5b17bc6b013d76cf5f837c',
};

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
  return false;
}

export function firebaseOptions() {
  const measurementId =
    typeof import.meta.env.VITE_FIREBASE_MEASUREMENT_ID === 'string'
      ? import.meta.env.VITE_FIREBASE_MEASUREMENT_ID.trim()
      : '';
  return {
    ...FIREBASE_FIXED,
    ...(measurementId ? { measurementId } : {}),
  };
}
