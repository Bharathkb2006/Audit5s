function readEnv(primaryKey, fallbackKey) {
  const primary = import.meta.env[primaryKey];
  if (typeof primary === 'string' && primary.trim()) return primary.trim();
  const fallback = import.meta.env[fallbackKey];
  if (typeof fallback === 'string' && fallback.trim()) return fallback.trim();
  return '';
}

function normalizeStorageBucket(bucket) {
  const value = String(bucket || '').trim();
  if (!value) return '';
  // For web SDK uploads, appspot.com bucket naming is the most reliable across projects.
  if (value.endsWith('.firebasestorage.app')) {
    return `${value.replace(/\.firebasestorage\.app$/, '')}.appspot.com`;
  }
  return value;
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
  return false;
}

export function firebaseOptions() {
  const measurementId = readEnv('VITE_FIREBASE_MEASUREMENT_ID', 'REACT_APP_FIREBASE_MEASUREMENT_ID');
  const apiKey = readEnv('VITE_FIREBASE_API_KEY', 'REACT_APP_FIREBASE_API_KEY');
  const authDomain = readEnv('VITE_FIREBASE_AUTH_DOMAIN', 'REACT_APP_FIREBASE_AUTH_DOMAIN');
  const projectId = readEnv('VITE_FIREBASE_PROJECT_ID', 'REACT_APP_FIREBASE_PROJECT_ID');
  const storageBucket = normalizeStorageBucket(
    readEnv('VITE_FIREBASE_STORAGE_BUCKET', 'REACT_APP_FIREBASE_STORAGE_BUCKET')
  );
  const messagingSenderId = readEnv(
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'REACT_APP_FIREBASE_MESSAGING_SENDER_ID'
  );
  const appId = readEnv('VITE_FIREBASE_APP_ID', 'REACT_APP_FIREBASE_APP_ID');

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
    ...(measurementId ? { measurementId } : {}),
  };
}
