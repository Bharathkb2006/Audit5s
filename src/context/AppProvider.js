import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { biMediaClear, biMediaGet, biMediaPut } from '../lib/biMediaIdb';
import {
  defaultFppContent,
  defaultSiteContent,
  KEY_ADMIN,
  KEY_CONTENT,
  KEY_FPP,
  KEY_ZONES,
  loadFppFromStorage,
  loadSiteContentFromStorage,
  loadZonesFromStorage,
  seedSiteContentIfMissing,
} from '../lib/defaults';
import { getFirebaseAuth } from '../lib/firebase/app';
import { isFirebaseConfigured, isFirebaseAuthEnabled } from '../lib/firebase/config';
import {
  saveFppDoc,
  saveSiteContentDoc,
  saveZonesDoc,
  subscribeFppData,
  subscribeSiteContent,
  subscribeZonesData,
} from '../lib/firebase/firestoreSync';
import { applyFirebaseUrlToSiteContent, SITE_MEDIA_KEY_MAP } from '../lib/firebase/mediaKeyMap';
import { uploadPublicFile } from '../lib/firebase/storageUpload';

const AppContext = createContext(null);

let zoneChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') zoneChannel = new BroadcastChannel('bi_5s_zone_updates');
} catch {
  zoneChannel = null;
}

function persistLocalContent(next) {
  try {
    localStorage.setItem(KEY_CONTENT, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function persistLocalZones(next) {
  try {
    localStorage.setItem(KEY_ZONES, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function persistLocalFpp(next) {
  try {
    localStorage.setItem(KEY_FPP, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function AppProvider({ children }) {
  const firebaseOn = isFirebaseConfigured();
  const firebaseAuthOn = firebaseOn && isFirebaseAuthEnabled();

  if (!firebaseOn) {
    seedSiteContentIfMissing();
  }

  const [siteContent, setSiteContentState] = useState(() => {
    if (firebaseOn) return defaultSiteContent();
    const s = loadSiteContentFromStorage();
    return s && typeof s === 'object' ? s : defaultSiteContent();
  });

  const [zonesData, setZonesDataState] = useState(() => {
    if (firebaseOn) return { zones: {} };
    return loadZonesFromStorage();
  });

  const [fppData, setFppDataState] = useState(() => {
    if (firebaseOn) return defaultFppContent();
    return loadFppFromStorage();
  });

  const [adminAuthed, setAdminAuthed] = useState(() => {
    if (firebaseAuthOn) return false;
    try {
      return localStorage.getItem(KEY_ADMIN) === 'true';
    } catch {
      return false;
    }
  });

  useFirebaseAuthListener(firebaseAuthOn, setAdminAuthed);
  useFirestoreSubscriptions(firebaseOn, setSiteContentState, setZonesDataState, setFppDataState);

  const persistContent = useCallback(
    (next) => {
      if (!firebaseOn) persistLocalContent(next);
      setSiteContentState(next);
      if (firebaseOn) saveSiteContentDoc(next).catch(() => {});
    },
    [firebaseOn]
  );

  const persistZones = useCallback(
    (next) => {
      if (!firebaseOn) persistLocalZones(next);
      setZonesDataState(next);
      if (firebaseOn) saveZonesDoc(next).catch(() => {});
    },
    [firebaseOn]
  );

  const persistFpp = useCallback(
    (next) => {
      if (!firebaseOn) persistLocalFpp(next);
      setFppDataState(next);
      if (firebaseOn) saveFppDoc(next).catch(() => {});
    },
    [firebaseOn]
  );

  const patchSiteContent = useCallback(
    (updater) => {
      setSiteContentState((prev) => {
        const base = prev && typeof prev === 'object' ? prev : defaultSiteContent();
        const next = typeof updater === 'function' ? updater(base) : { ...base, ...updater };
        if (!firebaseOn) persistLocalContent(next);
        if (firebaseOn) saveSiteContentDoc(next).catch(() => {});
        return next;
      });
    },
    [firebaseOn]
  );

  const putBiMedia = useCallback(
    async (storageKey, file) => {
      if (firebaseOn) {
        const safePath = String(storageKey).replace(/[^a-zA-Z0-9/_:-]/g, '_');
        const url = await uploadPublicFile(`site/${safePath}`, file);
        if (!String(storageKey).startsWith('zone:') && SITE_MEDIA_KEY_MAP[storageKey]) {
          setSiteContentState((prev) => {
            const next = applyFirebaseUrlToSiteContent(prev, storageKey, url);
            if (firebaseOn) saveSiteContentDoc(next).catch(() => {});
            return next;
          });
        }
        return url;
      }
      await biMediaPut(storageKey, file);
      return undefined;
    },
    [firebaseOn]
  );

  const getBiMedia = useCallback((key) => biMediaGet(key), []);

  const notifyZoneUpdated = useCallback((zoneId) => {
    try {
      zoneChannel?.postMessage({ type: 'zoneDataUpdated', zoneId });
    } catch {
      /* ignore */
    }
  }, []);

  const loginAdmin = useCallback(
    async (username, password) => {
      const email = String(username || '').trim();
      if (firebaseAuthOn) {
        try {
          const auth = getFirebaseAuth();
          if (!auth) return false;
          await signInWithEmailAndPassword(auth, email, password);
          return true;
        } catch {
          return false;
        }
      }
      if (email === 'admin' && password === 'admin123') {
        try {
          localStorage.setItem(KEY_ADMIN, 'true');
        } catch {
          /* ignore */
        }
        setAdminAuthed(true);
        return true;
      }
      return false;
    },
    [firebaseAuthOn]
  );

  const logoutAdmin = useCallback(async () => {
    if (firebaseAuthOn) {
      try {
        const auth = getFirebaseAuth();
        if (auth) await signOut(auth);
      } catch {
        /* ignore */
      }
    } else {
      try {
        localStorage.setItem(KEY_ADMIN, 'false');
      } catch {
        /* ignore */
      }
    }
    setAdminAuthed(false);
  }, [firebaseAuthOn]);

  const clearAllMediaStorage = useCallback(async () => {
    if (!firebaseOn) {
      try {
        localStorage.removeItem(KEY_CONTENT);
        localStorage.removeItem('biContent');
      } catch {
        /* ignore */
      }
    }
    await biMediaClear().catch(() => {});
    const freshSite = defaultSiteContent();
    const freshZones = { zones: {} };
    const freshFpp = defaultFppContent();
    setSiteContentState(freshSite);
    setZonesDataState(freshZones);
    setFppDataState(freshFpp);
    if (!firebaseOn) {
      persistLocalContent(freshSite);
      persistLocalZones(freshZones);
      persistLocalFpp(freshFpp);
    }
    if (firebaseOn) {
      await Promise.all([
        saveSiteContentDoc(freshSite).catch(() => {}),
        saveZonesDoc(freshZones).catch(() => {}),
        saveFppDoc(freshFpp).catch(() => {}),
      ]);
    }
  }, [firebaseOn]);

  const value = useMemo(
    () => ({
      siteContent,
      setSiteContent: persistContent,
      patchSiteContent,
      zonesData,
      setZonesData: persistZones,
      fppData,
      setFppData: persistFpp,
      adminAuthed,
      loginAdmin,
      logoutAdmin,
      putBiMedia,
      getBiMedia,
      notifyZoneUpdated,
      clearAllMediaStorage,
      firebaseEnabled: firebaseOn,
      firebaseAuthEnabled: firebaseAuthOn,
    }),
    [
      siteContent,
      persistContent,
      patchSiteContent,
      zonesData,
      persistZones,
      fppData,
      persistFpp,
      adminAuthed,
      loginAdmin,
      logoutAdmin,
      putBiMedia,
      getBiMedia,
      notifyZoneUpdated,
      clearAllMediaStorage,
      firebaseOn,
      firebaseAuthOn,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useFirebaseAuthListener(firebaseAuthOn, setAdminAuthed) {
  React.useEffect(() => {
    if (!firebaseAuthOn) return undefined;
    const auth = getFirebaseAuth();
    if (!auth) return undefined;
    return onAuthStateChanged(auth, (user) => {
      setAdminAuthed(Boolean(user));
    });
  }, [firebaseAuthOn, setAdminAuthed]);
}

function useFirestoreSubscriptions(firebaseOn, setSite, setZones, setFpp) {
  React.useEffect(() => {
    if (!firebaseOn) return undefined;
    const noop = () => {};
    const unsubs = [
      subscribeSiteContent((payload) => {
        setSite(payload);
      }, noop),
      subscribeZonesData((payload) => {
        setZones(payload);
      }, noop),
      subscribeFppData((payload) => {
        setFpp(payload);
      }, noop),
    ];
    return () => unsubs.forEach((u) => u());
  }, [firebaseOn, setSite, setZones, setFpp]);
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function useZoneChannel(zoneId, onMessage) {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;
  React.useEffect(() => {
    const onStorage = (e) => {
      if (e.key === KEY_ZONES) onMessageRef.current?.();
    };
    window.addEventListener('storage', onStorage);
    const ch =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bi_5s_zone_updates') : null;
    const onBc = (ev) => {
      if (!ev?.data || ev.data.type !== 'zoneDataUpdated') return;
      if (ev.data.zoneId && Number(ev.data.zoneId) !== Number(zoneId)) return;
      onMessageRef.current?.();
    };
    ch?.addEventListener('message', onBc);
    return () => {
      window.removeEventListener('storage', onStorage);
      ch?.close();
    };
  }, [zoneId]);
}
