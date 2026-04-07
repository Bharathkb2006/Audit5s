export const KEY_CONTENT = 'bi_content_v1';
export const KEY_ZONES = 'bi_5s_zones_v1';
export const KEY_FPP = 'fpp_only_content_v1';
export const KEY_ADMIN = 'bi_admin_authed_v1';

export function defaultFppContent() {
  const rows = [];
  for (let i = 1; i <= 16; i++) {
    rows.push({ id: String(i), slNo: i, zoneNo: '', zoneDesc: '', fppNo: '', fppDesc: '' });
  }
  return {
    assets: { monthWiseLayoutKey: '' },
    fpp: { unit: '18', rows },
    fppPhotos: {},
  };
}

export function defaultSiteContent() {
  return {
    home: {
      title: 'ABOUT US',
      description:
        "Brakes India Private Limited, founded in 1962 and part of the TVS Group, is India's largest manufacturer of automotive braking systems and a major global supplier. Headquartered in Chennai, it operates over 21 manufacturing locations, offering braking solutions for passenger vehicles, commercial vehicles.",
    },
    assets: {
      logoImage: '/brakes india pagr.png',
      homeVideo: '/video/absvideo.mp4',
    },
  };
}

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const p = JSON.parse(raw);
    return p && typeof p === 'object' ? p : fallback;
  } catch {
    return fallback;
  }
}

export function loadSiteContentFromStorage() {
  return loadJson(KEY_CONTENT, null);
}

export function loadZonesFromStorage() {
  const z = loadJson(KEY_ZONES, {});
  return z && z.zones ? z : { zones: {} };
}

export function loadFppFromStorage() {
  const raw = loadJson(KEY_FPP, null);
  if (!raw || typeof raw !== 'object') return defaultFppContent();
  const base = defaultFppContent();
  const next = {
    assets: { ...base.assets, ...(raw.assets || {}) },
    fpp: { ...base.fpp, ...(raw.fpp || {}) },
    fppPhotos: raw.fppPhotos && typeof raw.fppPhotos === 'object' ? { ...raw.fppPhotos } : {},
  };
  const byId = {};
  (Array.isArray(next.fpp.rows) ? next.fpp.rows : []).forEach((r) => {
    if (r && r.id != null) byId[String(r.id)] = r;
  });
  next.fpp.rows = base.fpp.rows.map((def, idx) => {
    const id = String(idx + 1);
    const ex = byId[id];
    return ex ? { ...def, ...ex, id, slNo: idx + 1 } : { ...def };
  });
  if (!next.fpp.unit) next.fpp.unit = '18';
  return next;
}

export function seedSiteContentIfMissing() {
  if (!localStorage.getItem(KEY_CONTENT)) {
    localStorage.setItem(KEY_CONTENT, JSON.stringify(defaultSiteContent()));
  }
}
