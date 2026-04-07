(function () {
  'use strict';

  var ZONE_STORAGE_KEY = 'bi_5s_zones_v1';
  var zoneChannel = null;
  try {
    zoneChannel = 'BroadcastChannel' in window ? new BroadcastChannel('bi_5s_zone_updates') : null;
  } catch (_) {
    zoneChannel = null;
  }
  var DEFAULT_CHECKPOINTS = [
    '1. Check free from Dust, Unwanted item, Components',
    '2. Check tables, dryers, racks are clean & items are in place - All required things on the Table - Demarcated',
    '3. Check free Components or any Items in the office - All required things on the floor in the Office - Demarcated',
    '4. Check record room items are clean & in place',
    '5. Check conference hall are clean & chairs are in place'
  ];
  // Zone-specific checkpoint sets (groups share the same wording)
  var ZONE_CHECKPOINTS = {
    // Zones 1 & 2
    groupA: DEFAULT_CHECKPOINTS,
    // Zones 3, 9, 13, 15
    groupB: [
      '1. Gangway markings, cleanliness, free from hindrance, Check floors, Mats, Shoe racks, Conveyer free from Dust',
      '2. Check Free from oil, Spillage, Unwanted items, Fixture stands, Bins, Trolly, Grease & Oil Stand are in place & clean',
      '3. Assy,Sub assy tables, Filter test table, Fixture racks free from Dust. Floor, Walls, Windows etc are maintained at High Level of Cleanliness -  All required Things on the shop floor - Demarcated',
      '4. Check rejection / Rework item are isolated, All Cables, Wires, Pipes etc are neatly clamped & straight with colour code',
      '5. All operators wear uniform, safety shoes & tucked in, Display boards, Cell management board, TPM activity boards are updated'
    ],
    // Zones 4,5,6,7,8,11,12,14,16
    groupC: [
      '1. Gangway markings, cleanliness, free from hindrance, Free from spillage of waste, Oil, Dust, Unwanted item',
      '2.Floor, Walls, Windows etc are maintained at High Level of Cleanliness, bins, trolleys, stands, garbage bins, etc are in place',
      '3. Work in progress, packed boxes, empty trays are in place Switches, Control boots etc are labelled - All required Things on the floor - Demarcated',
      '4.Record, tools, instruments other items are clean & in place, All cables , wires, pipes etc are neatly clamped & straight with colour code',
      '5.  All operators wear uniform, safety shoes & tucked in, Display boards, Cell management board, TPM activity boards are updated'
    ],
    // Zone 10 (standalone configuration)
    zone10: [
      '1. Check office tables & workstations are clutter free',
      '2. Check files & documents are arranged and labeled properly',
      '3. Check common areas (pantry, meeting rooms) are clean & tidy',
      '4. Check computers, cables & peripherals are routed neatly',
      '5. Check display boards & notice areas are updated and neat'
    ]
  };
  var DEFAULT_LOCATION = 'Unit office, Main lobby & server room';

  function loadZonesData() {
    try {
      var raw = localStorage.getItem(ZONE_STORAGE_KEY);
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && data.zones ? data : {};
    } catch (_) {
      return {};
    }
  }

  function saveZonesData(data) {
    try {
      localStorage.setItem(ZONE_STORAGE_KEY, JSON.stringify(data));
    } catch (_) {}
  }

  function emptyScoreWeek(weekNo) {
    return {
      weekNo: weekNo,
      date: '',
      dailyScores: [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
      total: 0,
      checkedBy: ''
    };
  }

  function getZoneData(zoneId) {
    var all = loadZonesData();
    var zones = all.zones || {};
    var z = String(zoneId);
    if (!zones[z]) {
      var scores = [];
      for (var w = 1; w <= 52; w++) scores.push(emptyScoreWeek(w));
      zones[z] = { scoreWindowStart: 1, scores: scores, observations: [] };
    }
    return zones[z];
  }

  function getCheckpointsForZone(zoneId) {
    var z = Number(zoneId);
    if (z === 1 || z === 2) return ZONE_CHECKPOINTS.groupA;
    if (z === 3 || z === 9 || z === 13 || z === 15) return ZONE_CHECKPOINTS.groupB;
    if (z === 4 || z === 5 || z === 6 || z === 7 || z === 8 || z === 11 || z === 12 || z === 14 || z === 16) {
      return ZONE_CHECKPOINTS.groupC;
    }
    if (z === 10) return ZONE_CHECKPOINTS.zone10;
    return DEFAULT_CHECKPOINTS;
  }

  function setZoneData(zoneId, zoneData) {
    var all = loadZonesData();
    all.zones = all.zones || {};
    all.zones[String(zoneId)] = zoneData;
    saveZonesData(all);
  }

  function notifyFrontend(zoneId) {
    try {
      if (zoneChannel) zoneChannel.postMessage({ type: 'zoneDataUpdated', zoneId: zoneId });
    } catch (_) {}
  }

  var zoneSelect = document.getElementById('zoneDataZoneSelect');
  var weekRangeSelect = document.getElementById('zoneDataWeekRange');
  var auditBody = document.getElementById('zoneAdminAuditBody');
  var totalByEl = document.getElementById('zoneAdminTotalBy');
  var zoneTableSave = document.getElementById('zoneTableSave');
  var zoneTableStatus = document.getElementById('zoneTableStatus');
  var zoneObsSave = document.getElementById('zoneObsSave');
  var zoneObsStatus = document.getElementById('zoneObsStatus');
  var obsBody = document.getElementById('zoneAdminObsBody');

  var zoneHeaderTitle = document.getElementById('zoneHeaderTitle');
  var zoneChampionName = document.getElementById('zoneChampionName');
  var zoneLeaderName = document.getElementById('zoneLeaderName');
  var zoneChampionPhoto = document.getElementById('zoneChampionPhoto');
  var zoneLeaderPhoto = document.getElementById('zoneLeaderPhoto');
  var zoneHeaderSave = document.getElementById('zoneHeaderSave');
  var zoneHeaderStatus = document.getElementById('zoneHeaderStatus');

  function openMediaDb() {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      var request = window.indexedDB.open('biMedia', 1);
      request.onupgradeneeded = function (event) {
        var db = event.target.result;
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files');
        }
      };
      request.onsuccess = function (event) { resolve(event.target.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  function storeMediaFile(key, file) {
    return openMediaDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readwrite');
        var store = tx.objectStore('files');
        store.put(file, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function setHeaderStatus(msg, err) {
    if (!zoneHeaderStatus) return;
    zoneHeaderStatus.textContent = msg || '';
    zoneHeaderStatus.classList.toggle('is-error', !!err);
  }

  function getStart() {
    return Math.min(48, Math.max(1, parseInt(weekRangeSelect && weekRangeSelect.value ? weekRangeSelect.value : '1', 10)));
  }

  function getZoneId() {
    return Math.max(1, Math.min(16, parseInt(zoneSelect && zoneSelect.value ? zoneSelect.value : '1', 10)));
  }

  function renderAdminAuditTable() {
    if (!auditBody) return;
    var zoneId = getZoneId();
    var start = getStart();
    var zoneData = ensureZoneMeta(zoneId, getZoneData(zoneId));
    var checkpoints = getCheckpointsForZone(zoneId);
    var scores = zoneData.scores || [];
    var html = '';
    for (var r = 0; r < 5; r++) {
      if (r === 0) {
        html += '<tr><td class="zone-audit-location"><input type="text" class="zone-admin-location" value="' + (zoneData.meta.location || DEFAULT_LOCATION).replace(/"/g, '&quot;') + '"></td>';
      } else {
        html += '<tr><td class="zone-audit-location"></td>';
      }
      html += '<td class="zone-audit-cp">' + (checkpoints[r] || DEFAULT_CHECKPOINTS[r] || '') + '</td>';
      for (var w = 0; w < 5; w++) {
        var idx = start + w - 1;
        var sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
        var row = (sw.dailyScores && sw.dailyScores[r]) ? sw.dailyScores[r] : [0,0,0,0,0];
        for (var d = 0; d < 5; d++) {
          html += '<td><input type="number" min="0" max="5" class="zone-admin-day" data-w="' + w + '" data-r="' + r + '" data-d="' + d + '" value="' + (row[d] || 0) + '"></td>';
        }
      }
      html += '</tr>';
    }
    auditBody.innerHTML = html;

    var weekNoIds = ['zoneAdminW1No','zoneAdminW2No','zoneAdminW3No','zoneAdminW4No','zoneAdminW5No'];
    var weekDtIds = ['zoneAdminW1Dt','zoneAdminW2Dt','zoneAdminW3Dt','zoneAdminW4Dt','zoneAdminW5Dt'];
    for (var i = 0; i < 5; i++) {
      var wi = start + i;
      var s = wi <= scores.length ? scores[wi - 1] : emptyScoreWeek(wi);
      var noEl = document.getElementById(weekNoIds[i]);
      var dtEl = document.getElementById(weekDtIds[i]);
      if (noEl) noEl.value = s.weekNo || wi;
      if (dtEl) dtEl.value = s.date || '';
    }

    if (totalByEl) {
      var tbHtml = '<table class="zone-admin-totalby-table"><tr><td class="zone-audit-cp">Total Marks</td>';
      for (var w = 0; w < 5; w++) {
        var idx = start + w - 1;
        var sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
        tbHtml += '<td><input type="number" min="0" max="25" class="zone-admin-total" data-w="' + w + '" value="' + (sw.total || 0) + '"></td>';
      }
      tbHtml += '</tr><tr><td class="zone-audit-cp">Checked By</td>';
      for (var w2 = 0; w2 < 5; w2++) {
        var idx2 = start + w2 - 1;
        var sw2 = idx2 < scores.length ? scores[idx2] : emptyScoreWeek(idx2 + 1);
        tbHtml += '<td><input type="text" class="zone-admin-by" data-w="' + w2 + '" value="' + (sw2.checkedBy || '').replace(/"/g, '&quot;') + '"></td>';
      }
      tbHtml += '</tr></table>';
      totalByEl.innerHTML = tbHtml;
    }
  }

  function ensureZoneMeta(zoneId, zoneData) {
    zoneData.meta = zoneData.meta && typeof zoneData.meta === 'object' ? zoneData.meta : {};
    if (!zoneData.meta.title) zoneData.meta.title = 'ZONE - ' + zoneId;
    if (typeof zoneData.meta.location !== 'string') zoneData.meta.location = DEFAULT_LOCATION;
    if (typeof zoneData.meta.championName !== 'string') zoneData.meta.championName = '';
    if (typeof zoneData.meta.leaderName !== 'string') zoneData.meta.leaderName = '';
    zoneData.meta.championPhotoStored = Boolean(zoneData.meta.championPhotoStored);
    zoneData.meta.leaderPhotoStored = Boolean(zoneData.meta.leaderPhotoStored);
    if (!zoneData.meta.updatedAt) zoneData.meta.updatedAt = Date.now();
    return zoneData;
  }

  function renderZoneHeaderForm() {
    var zoneId = getZoneId();
    var zoneData = ensureZoneMeta(zoneId, getZoneData(zoneId));
    if (zoneHeaderTitle) zoneHeaderTitle.value = zoneData.meta.title || ('ZONE - ' + zoneId);
    if (zoneChampionName) zoneChampionName.value = zoneData.meta.championName || '';
    if (zoneLeaderName) zoneLeaderName.value = zoneData.meta.leaderName || '';
    if (zoneChampionPhoto) zoneChampionPhoto.value = '';
    if (zoneLeaderPhoto) zoneLeaderPhoto.value = '';
    setHeaderStatus('', false);
  }

  function saveZoneHeader() {
    var zoneId = getZoneId();
    var zoneData = ensureZoneMeta(zoneId, getZoneData(zoneId));

    zoneData.meta.title = (zoneHeaderTitle && zoneHeaderTitle.value ? zoneHeaderTitle.value.trim() : '') || ('ZONE - ' + zoneId);
    zoneData.meta.championName = zoneChampionName && zoneChampionName.value ? zoneChampionName.value.trim() : '';
    zoneData.meta.leaderName = zoneLeaderName && zoneLeaderName.value ? zoneLeaderName.value.trim() : '';
    zoneData.meta.updatedAt = Date.now();

    var jobs = [];
    var champFile = zoneChampionPhoto && zoneChampionPhoto.files && zoneChampionPhoto.files[0] ? zoneChampionPhoto.files[0] : null;
    var leaderFile = zoneLeaderPhoto && zoneLeaderPhoto.files && zoneLeaderPhoto.files[0] ? zoneLeaderPhoto.files[0] : null;

    if (champFile) {
      jobs.push(
        storeMediaFile('zone:' + zoneId + ':championPhoto', champFile).then(function () {
          zoneData.meta.championPhotoStored = true;
        })
      );
    }
    if (leaderFile) {
      jobs.push(
        storeMediaFile('zone:' + zoneId + ':leaderPhoto', leaderFile).then(function () {
          zoneData.meta.leaderPhotoStored = true;
        })
      );
    }

    setZoneData(zoneId, zoneData);

    setHeaderStatus(jobs.length ? 'Saving photos…' : 'Saved.', false);

    Promise.allSettled(jobs).then(function (results) {
      var failed = results.some(function (r) { return r.status === 'rejected'; });
      // Persist any updated photo flags
      setZoneData(zoneId, zoneData);
      if (failed) {
        setHeaderStatus('Saved details, but one or more photos failed to save. Try again with smaller images.', true);
      } else {
        setHeaderStatus('Saved.', false);
      }
      notifyFrontend(zoneId);
      renderZoneHeaderForm();
    }).catch(function () {
      setHeaderStatus('Save failed.', true);
    });
  }

  function collectAdminAuditData() {
    var zoneId = getZoneId();
    var start = getStart();
    var zoneData = ensureZoneMeta(zoneId, getZoneData(zoneId));
    var scores = zoneData.scores || [];

    var locInp = document.querySelector('.zone-admin-location');
    if (locInp) {
      zoneData.meta.location = (locInp.value || '').trim() || DEFAULT_LOCATION;
      zoneData.meta.updatedAt = Date.now();
    }

    for (var w = 0; w < 5; w++) {
      var idx = start + w - 1;
      if (idx >= scores.length) scores.push(emptyScoreWeek(idx + 1));
      var sw = scores[idx];
      for (var r = 0; r < 5; r++) {
        if (!sw.dailyScores[r]) sw.dailyScores[r] = [0,0,0,0,0];
        for (var d = 0; d < 5; d++) {
          var inp = document.querySelector('.zone-admin-day[data-w="' + w + '"][data-r="' + r + '"][data-d="' + d + '"]');
          if (inp) sw.dailyScores[r][d] = parseInt(inp.value, 10) || 0;
        }
      }
      var noEl = document.getElementById('zoneAdminW' + (w + 1) + 'No');
      var dtEl = document.getElementById('zoneAdminW' + (w + 1) + 'Dt');
      if (noEl) sw.weekNo = parseInt(noEl.value, 10) || (start + w);
      if (dtEl) sw.date = dtEl.value || '';
      var totalInp = document.querySelector('.zone-admin-total[data-w="' + w + '"]');
      var byInp = document.querySelector('.zone-admin-by[data-w="' + w + '"]');
      if (totalInp) sw.total = Math.min(25, Math.max(0, parseInt(totalInp.value, 10) || 0));
      if (byInp) sw.checkedBy = byInp.value || '';
    }
    zoneData.scores = scores;
    setZoneData(zoneId, zoneData);
  }

  function renderAdminObservations() {
    if (!obsBody) return;
    var zoneData = getZoneData(getZoneId());
    var obs = zoneData.observations || [];
    var byWeek = {};
    obs.forEach(function (o) {
      var wn = o.weekNo || 1;
      if (!byWeek[wn]) byWeek[wn] = [];
      if (byWeek[wn].length < 3) byWeek[wn].push(o);
    });
    var html = '';
    for (var week = 1; week <= 52; week++) {
      var rows = byWeek[week] || [];
      for (var slot = 0; slot < 3; slot++) {
        var row = rows[slot] || { weekNo: week, location: '', observation: '', correctiveAction: '', resp: '', targetDate: '', completedDate: '' };
        html += '<tr data-week="' + week + '" data-slot="' + slot + '">';
        html += '<td>' + (slot === 0 ? week : '') + '</td>';
        html += '<td><input type="text" class="zone-admin-obs-loc" value="' + (row.location || '').replace(/"/g, '&quot;') + '"></td>';
        html += '<td><input type="text" class="zone-admin-obs-obs" value="' + (row.observation || '').replace(/"/g, '&quot;') + '"></td>';
        html += '<td><input type="text" class="zone-admin-obs-corrective" value="' + (row.correctiveAction || '').replace(/"/g, '&quot;') + '"></td>';
        html += '<td><input type="text" class="zone-admin-obs-resp" value="' + (row.resp || '').replace(/"/g, '&quot;') + '"></td>';
        html += '<td><input type="text" class="zone-admin-obs-target" value="' + (row.targetDate || '').replace(/"/g, '&quot;') + '"></td>';
        html += '<td><input type="text" class="zone-admin-obs-completed" value="' + (row.completedDate || '').replace(/"/g, '&quot;') + '"></td>';
        html += '</tr>';
      }
    }
    obsBody.innerHTML = html;
  }

  function collectAdminObservations() {
    var zoneId = getZoneId();
    var zoneData = getZoneData(zoneId);
    var rows = document.querySelectorAll('#zoneAdminObsBody tr');
    var byWeek = {};
    rows.forEach(function (tr) {
      var weekNo = parseInt(tr.getAttribute('data-week'), 10);
      var loc = (tr.querySelector('.zone-admin-obs-loc') || {}).value || '';
      var observation = (tr.querySelector('.zone-admin-obs-obs') || {}).value || '';
      var corrective = (tr.querySelector('.zone-admin-obs-corrective') || {}).value || '';
      var resp = (tr.querySelector('.zone-admin-obs-resp') || {}).value || '';
      var target = (tr.querySelector('.zone-admin-obs-target') || {}).value || '';
      var completed = (tr.querySelector('.zone-admin-obs-completed') || {}).value || '';
      if (!weekNo) return;
      if (!byWeek[weekNo]) byWeek[weekNo] = [];
      if (byWeek[weekNo].length < 3 && (loc || observation || corrective || resp || target || completed)) {
        byWeek[weekNo].push({ weekNo: weekNo, location: loc, observation: observation, correctiveAction: corrective, resp: resp, targetDate: target, completedDate: completed });
      }
    });
    var newObs = [];
    for (var w = 1; w <= 52; w++) {
      (byWeek[w] || []).forEach(function (o) { newObs.push(o); });
    }
    zoneData.observations = newObs;
    setZoneData(zoneId, zoneData);
  }

  function setTableStatus(msg, err) {
    if (zoneTableStatus) {
      zoneTableStatus.textContent = msg || '';
      zoneTableStatus.classList.toggle('is-error', !!err);
    }
  }

  function setObsStatus(msg, err) {
    if (zoneObsStatus) {
      zoneObsStatus.textContent = msg || '';
      zoneObsStatus.classList.toggle('is-error', !!err);
    }
  }

  if (zoneSelect) zoneSelect.addEventListener('change', function () { renderZoneHeaderForm(); renderAdminAuditTable(); renderAdminObservations(); });
  if (weekRangeSelect) weekRangeSelect.addEventListener('change', renderAdminAuditTable);
  if (zoneTableSave) {
    zoneTableSave.addEventListener('click', function () {
      collectAdminAuditData();
      setTableStatus('Table saved. Frontend will show this data for the selected week range.', false);
      notifyFrontend(getZoneId());
    });
  }
  if (zoneObsSave) {
    zoneObsSave.addEventListener('click', function () {
      collectAdminObservations();
      setObsStatus('Observations saved. Frontend will show this data.', false);
      notifyFrontend(getZoneId());
    });
  }
  if (zoneHeaderSave) {
    zoneHeaderSave.addEventListener('click', function () {
      saveZoneHeader();
    });
  }

  if (auditBody) {
    renderZoneHeaderForm();
    renderAdminAuditTable();
    renderAdminObservations();
  }
})();
