import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { biMediaClear } from '../lib/biMediaIdb';
import { fppClearAll } from '../lib/fppIdb';
import { defaultFppContent, defaultSiteContent } from '../lib/defaults';
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

const ADMIN_SESSION_KEY = 'bi_admin_authed_v1';
const ZONES_CACHE_KEY = 'bi_zones_cache_v1';

function safeJsonParse(raw, fallback) {
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadZonesCache() {
  try {
    const raw = localStorage.getItem(ZONES_CACHE_KEY);
    const parsed = raw ? safeJsonParse(raw, null) : null;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function saveZonesCache(next) {
  try {
    localStorage.setItem(ZONES_CACHE_KEY, JSON.stringify(next || { zones: {} }));
  } catch {
    /* ignore */
  }
}

let zoneChannel = null;
try {
  if (typeof BroadcastChannel !== 'undefined') zoneChannel = new BroadcastChannel('bi_5s_zone_updates');
} catch {
  zoneChannel = null;
}

export function AppProvider({ children }) {
  const [siteContent, setSiteContentState] = useState(() => defaultSiteContent());

  const [zonesData, setZonesDataState] = useState(() => loadZonesCache() || { zones: {} });

  const [fppData, setFppDataState] = useState(() => defaultFppContent());

  const [adminAuthed, setAdminAuthed] = useState(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useFirestoreSubscriptions(setSiteContentState, setZonesDataState, setFppDataState);

  const persistContent = useCallback((next) => {
    setSiteContentState(next);
    saveSiteContentDoc(next).catch(() => {});
  }, []);

  const persistZones = useCallback((next) => {
    setZonesDataState(next);
    saveZonesCache(next);
    saveZonesDoc(next).catch((e) => {
      // Don't silently fail in production; this is what causes "reset to 0/25 after refresh".
      console.error('Failed to save zones data to Firestore.', e);
    });
  }, []);

  const persistFpp = useCallback((next) => {
    setFppDataState(next);
    saveFppDoc(next).catch(() => {});
  }, []);

  const patchSiteContent = useCallback((updater) => {
    setSiteContentState((prev) => {
      const base = prev && typeof prev === 'object' ? prev : defaultSiteContent();
      const next = typeof updater === 'function' ? updater(base) : { ...base, ...updater };
      saveSiteContentDoc(next).catch(() => {});
      return next;
    });
  }, []);

  const putBiMedia = useCallback(async (storageKey, file) => {
    const safePath = String(storageKey).replace(/[^a-zA-Z0-9/_:-]/g, '_');
    const url = await uploadPublicFile(`site/${safePath}`, file);
    if (!String(storageKey).startsWith('zone:') && SITE_MEDIA_KEY_MAP[storageKey]) {
      setSiteContentState((prev) => {
        const next = applyFirebaseUrlToSiteContent(prev, storageKey, url);
        saveSiteContentDoc(next).catch(() => {});
        return next;
      });
    }
    return url;
  }, []);

  const notifyZoneUpdated = useCallback((zoneId) => {
    try {
      zoneChannel?.postMessage({ type: 'zoneDataUpdated', zoneId });
    } catch {
      /* ignore */
    }
  }, []);

  const loginAdmin = useCallback(async (username, password) => {
    const user = String(username || '').trim();
    if (user === 'admin' && String(password || '') === 'admin123') {
      setAdminAuthed(true);
      try {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch {
        /* ignore */
      }
      return true;
    }
    return false;
  }, []);

  const logoutAdmin = useCallback(async () => {
    setAdminAuthed(false);
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const clearAllMediaStorage = useCallback(async () => {
    await Promise.all([biMediaClear().catch(() => {}), fppClearAll().catch(() => {})]);
    const freshSite = defaultSiteContent();
    const freshZones = { zones: {} };
    const freshFpp = defaultFppContent();
    setSiteContentState(freshSite);
    setZonesDataState(freshZones);
    setFppDataState(freshFpp);
    await Promise.all([
      saveSiteContentDoc(freshSite).catch(() => {}),
      saveZonesDoc(freshZones).catch(() => {}),
      saveFppDoc(freshFpp).catch(() => {}),
    ]);
  }, []);

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
      notifyZoneUpdated,
      clearAllMediaStorage,
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
      notifyZoneUpdated,
      clearAllMediaStorage,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function useFirestoreSubscriptions(setSite, setZones, setFpp) {
  React.useEffect(() => {
    const unsubs = [
      subscribeSiteContent((payload) => {
        setSite(payload);
      }, (e) => console.error('Failed to subscribe site content.', e)),
      subscribeZonesData((payload) => {
        setZones(payload);
        saveZonesCache(payload);
      }, (e) => console.error('Failed to subscribe zones data.', e)),
      subscribeFppData((payload) => {
        setFpp(payload);
      }, (e) => console.error('Failed to subscribe FPP data.', e)),
    ];
    return () => unsubs.forEach((u) => u());
  }, [setSite, setZones, setFpp]);
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
    const ch =
      typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('bi_5s_zone_updates') : null;
    const onBc = (ev) => {
      if (!ev?.data || ev.data.type !== 'zoneDataUpdated') return;
      if (ev.data.zoneId && Number(ev.data.zoneId) !== Number(zoneId)) return;
      onMessageRef.current?.();
    };
    ch?.addEventListener('message', onBc);
    return () => {
      ch?.close();
    };
  }, [zoneId]);
}
