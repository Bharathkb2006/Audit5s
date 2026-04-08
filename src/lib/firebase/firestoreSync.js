import { collection, deleteDoc, doc, getDocs, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from './app';
import { CONFIG_COLLECTION, DOC_SITE, DOC_ZONES, DOC_FPP } from './paths';

function ref(id) {
  const db = getFirebaseDb();
  if (!db) return null;
  return doc(db, CONFIG_COLLECTION, id);
}

function zonesCol() {
  const db = getFirebaseDb();
  if (!db) return null;
  return collection(db, 'zones');
}

function zoneDoc(zoneId) {
  const db = getFirebaseDb();
  if (!db) return null;
  return doc(db, 'zones', String(zoneId));
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
  const col = zonesCol();
  if (!col) return () => {};

  // Store zones as one document per zoneId to avoid the 1 MiB Firestore doc size limit.
  // We still aggregate into the legacy in-memory shape: { zones: { [id]: zoneData } }.
  return onSnapshot(
    col,
    (snap) => {
      const zones = {};
      snap.forEach((d) => {
        const data = d.data();
        if (data && typeof data.payload === 'object') {
          zones[String(d.id)] = data.payload;
        }
      });
      onData({ zones });
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
  const zones = payload && typeof payload === 'object' ? payload.zones || {} : {};
  const entries = Object.entries(zones);

  // If clearing, delete existing zone docs.
  if (!entries.length) {
    const col = zonesCol();
    if (!col) return;
    const snaps = await getDocs(col);
    await Promise.all(snaps.docs.map((d) => deleteDoc(d.ref).catch(() => {})));
    return;
  }

  await Promise.all(
    entries.map(([zoneId, zoneData]) => {
      const r = zoneDoc(zoneId);
      if (!r) return Promise.resolve();
      return setDoc(r, { payload: zoneData, updatedAt: serverTimestamp() }, { merge: true });
    })
  );
}

export async function saveFppDoc(payload) {
  const r = ref(DOC_FPP);
  if (!r) return;
  await setDoc(r, { payload, updatedAt: serverTimestamp() }, { merge: true });
}
