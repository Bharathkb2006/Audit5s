export const DEFAULT_CHECKPOINTS = [
  '1. Check free from Dust, Unwanted item, Components',
  '2. Check tables, dryers, racks are clean & items are in place - All required things on the Table - Demarcated',
  '3. Check free Components or any Items in the office - All required things on the floor in the Office - Demarcated',
  '4. Check record room items are clean & in place',
  '5. Check conference hall are clean & chairs are in place',
];

export const ZONE_CHECKPOINTS = {
  groupA: DEFAULT_CHECKPOINTS,
  groupB: [
    '1. Gangway markings, cleanliness, free from hindrance, Check floors, Mats, Shoe racks, Conveyer free from Dust',
    '2. Check Free from oil, Spillage, Unwanted items, Fixture stands, Bins, Trolly, Grease & Oil Stand are in place & clean',
    '3. Assy,Sub assy tables, Filter test table, Fixture racks free from Dust. Floor, Walls, Windows etc are maintained at High Level of Cleanliness -  All required Things on the shop floor - Demarcated',
    '4. Check rejection / Rework item are isolated, All Cables, Wires, Pipes etc are neatly clamped & straight with colour code',
    '5. All operators wear uniform, safety shoes & tucked in, Display boards, Cell management board, TPM activity boards are updated',
  ],
  groupC: [
    '1. Gangway markings, cleanliness, free from hindrance, Free from spillage of waste, Oil, Dust, Unwanted item',
    '2.Floor, Walls, Windows etc are maintained at High Level of Cleanliness, bins, trolleys, stands, garbage bins, etc are in place',
    '3. Work in progress, packed boxes, empty trays are in place Switches, Control boots etc are labelled - All required Things on the floor - Demarcated',
    '4.Record, tools, instruments other items are clean & in place, All cables , wires, pipes etc are neatly clamped & straight with colour code',
    '5.  All operators wear uniform, safety shoes & tucked in, Display boards, Cell management board, TPM activity boards are updated',
  ],
  zone10: [
    '1. Check office tables & workstations are clutter free',
    '2. Check files & documents are arranged and labeled properly',
    '3. Check common areas (pantry, meeting rooms) are clean & tidy',
    '4. Check computers, cables & peripherals are routed neatly',
    '5. Check display boards & notice areas are updated and neat',
  ],
};

export const DEFAULT_LOCATION = 'Unit office, Main lobby & server room';

export function emptyScoreWeek(weekNo) {
  return {
    weekNo,
    date: '',
    dailyScores: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    total: 0,
    checkedBy: '',
  };
}

export function computeTotalFromDaily(dailyScores) {
  let sum = 0;
  for (let r = 0; r < 5; r++) {
    for (let d = 0; d < 5; d++) {
      sum += Number((dailyScores[r] || [])[d]) || 0;
    }
  }
  return Math.min(25, Math.max(0, sum));
}

export function getCheckpointsForZone(zoneId) {
  const z = Number(zoneId);
  if (z === 1 || z === 2) return ZONE_CHECKPOINTS.groupA;
  if (z === 3 || z === 9 || z === 13 || z === 15) return ZONE_CHECKPOINTS.groupB;
  if ([4, 5, 6, 7, 8, 11, 12, 14, 16].includes(z)) return ZONE_CHECKPOINTS.groupC;
  if (z === 10) return ZONE_CHECKPOINTS.zone10;
  return DEFAULT_CHECKPOINTS;
}

export function ensureZoneMeta(zoneId, zoneData) {
  const z = { ...zoneData };
  z.meta = z.meta && typeof z.meta === 'object' ? { ...z.meta } : {};
  if (!z.meta.title) z.meta.title = `ZONE - ${zoneId}`;
  if (typeof z.meta.location !== 'string') z.meta.location = DEFAULT_LOCATION;
  if (typeof z.meta.championName !== 'string') z.meta.championName = '';
  if (typeof z.meta.leaderName !== 'string') z.meta.leaderName = '';
  if (typeof z.meta.championPhotoUrl !== 'string') z.meta.championPhotoUrl = '';
  if (typeof z.meta.leaderPhotoUrl !== 'string') z.meta.leaderPhotoUrl = '';
  z.meta.championPhotoStored = Boolean(z.meta.championPhotoStored);
  z.meta.leaderPhotoStored = Boolean(z.meta.leaderPhotoStored);
  if (!z.meta.updatedAt) z.meta.updatedAt = Date.now();
  return z;
}

export function getZoneDataFromStore(zonesRoot, zoneId) {
  const zones = zonesRoot.zones || {};
  const z = String(zoneId);
  if (!zones[z]) {
    const scores = [];
    for (let w = 1; w <= 52; w++) scores.push(emptyScoreWeek(w));
    return { scoreWindowStart: 1, scores, observations: [], meta: {} };
  }
  return JSON.parse(JSON.stringify(zones[z]));
}

export function setZoneInStore(zonesRoot, zoneId, zoneData) {
  const next = { ...zonesRoot, zones: { ...(zonesRoot.zones || {}) } };
  next.zones[String(zoneId)] = zoneData;
  return next;
}
