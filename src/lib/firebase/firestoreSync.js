import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from './app';
import { CONFIG_COLLECTION, DOC_SITE, DOC_ZONES, DOC_FPP } from './paths';

function ref(id) {
  const db = getFirebaseDb();
  if (!db) return null;
  return doc(db, CONFIG_COLLECTION, id);
}

export function subscribeSiteContent(onData, onError) {
  const r = ref(DOC_SITE);
  if (!r) return () => {};
  return onSnapshot(
    r,
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d && typeof d.payload === 'object') onData(d.payload);
    },
    (e) => onError?.(e)
  );
}

export function subscribeZonesData(onData, onError) {
  const r = ref(DOC_ZONES);
  if (!r) return () => {};
  return onSnapshot(
    r,
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d && typeof d.payload === 'object') onData(d.payload);
    },
    (e) => onError?.(e)
  );
}

export function subscribeFppData(onData, onError) {
  const r = ref(DOC_FPP);
  if (!r) return () => {};
  return onSnapshot(
    r,
    (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      if (d && typeof d.payload === 'object') onData(d.payload);
    },
    (e) => onError?.(e)
  );
}

export async function saveSiteContentDoc(payload) {
  const r = ref(DOC_SITE);
  if (!r) return;
  await setDoc(r, { payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveZonesDoc(payload) {
  const r = ref(DOC_ZONES);
  if (!r) return;
  await setDoc(r, { payload, updatedAt: serverTimestamp() }, { merge: true });
}

export async function saveFppDoc(payload) {
  const r = ref(DOC_FPP);
  if (!r) return;
  await setDoc(r, { payload, updatedAt: serverTimestamp() }, { merge: true });
}
