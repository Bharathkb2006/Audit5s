/**
 * Create React App reads env vars prefixed with REACT_APP_.
 * Copy .env.example to .env.local and fill values from Firebase Console → Project settings.
 */

export function isFirebaseConfigured() {
  return Boolean(
    typeof process.env.REACT_APP_FIREBASE_API_KEY === 'string' &&
      process.env.REACT_APP_FIREBASE_API_KEY &&
      process.env.REACT_APP_FIREBASE_PROJECT_ID
  );
}

export function isFirebaseAuthEnabled() {
  return process.env.REACT_APP_FIREBASE_USE_AUTH === 'true';
}

export function firebaseOptions() {
  const measurementId = process.env.REACT_APP_FIREBASE_MEASUREMENT_ID;
  return {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    ...(measurementId ? { measurementId } : {}),
  };
}
