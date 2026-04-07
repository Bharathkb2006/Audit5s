import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Initializes Google Analytics (Firebase Analytics) when measurementId is in config.
 * Safe to call once after the Firebase app is created.
 */
export async function initFirebaseAnalytics(app) {
  if (!app || !import.meta.env.VITE_FIREBASE_MEASUREMENT_ID) return null;
  try {
    if (await isSupported()) {
      return getAnalytics(app);
    }
  } catch {
    return null;
  }
  return null;
}
