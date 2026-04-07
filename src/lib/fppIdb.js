const DB_NAME = 'fppOnlyMedia';
const STORE = 'blobs';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function fppPutBlob(key, blob) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(blob, key);
        tx.oncomplete = () => resolve(key);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      })
  );
}

export function fppGetBlob(key) {
  if (!key) return Promise.resolve(null);
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, 'readonly');
        const r = tx.objectStore(STORE).get(key);
        r.onsuccess = () => resolve(r.result || null);
        r.onerror = () => reject(r.error);
      })
  );
}

export function fppMakeKey(prefix) {
  return `${prefix || 'blob'}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Clears legacy IndexedDB used before Firebase Storage (optional migration cleanup). */
export function fppClearAll() {
  return new Promise((resolve) => {
    if (!('indexedDB' in window)) {
      resolve();
      return;
    }
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}
