// Offline storage for FPP-only package (file://)
(function () {
  'use strict';

  var CONTENT_KEY = 'fpp_only_content_v1';
  var AUTH_KEY = 'fpp_only_admin_authed_v1';
  var SHARED_AUTH_KEY = 'bi_admin_authed_v1';

  function safeJsonParse(raw, fallback) {
    try { return JSON.parse(raw); } catch (_) { return fallback; }
  }

  function defaultContent() {
    var rows = [];
    for (var i = 1; i <= 16; i++) {
      rows.push({ id: String(i), slNo: i, zoneNo: '', zoneDesc: '', fppNo: '', fppDesc: '' });
    }
    return {
      assets: { monthWiseLayoutKey: '' },
      fpp: { unit: '18', rows: rows },
      fppPhotos: {}
    };
  }

  function load() {
    var raw = '';
    try { raw = localStorage.getItem(CONTENT_KEY) || ''; } catch (_) {}
    var parsed = raw ? safeJsonParse(raw, null) : null;
    var base = defaultContent();
    if (!parsed || typeof parsed !== 'object') return base;

    var next = {
      assets: Object.assign({}, base.assets, parsed.assets || {}),
      fpp: Object.assign({}, base.fpp, parsed.fpp || {}),
      fppPhotos: (parsed.fppPhotos && typeof parsed.fppPhotos === 'object') ? parsed.fppPhotos : {}
    };

    var existingRows = (next.fpp && Array.isArray(next.fpp.rows)) ? next.fpp.rows : [];
    var byId = {};
    existingRows.forEach(function (r) {
      var id = r && r.id != null ? String(r.id) : '';
      if (id) byId[id] = r;
    });
    next.fpp.rows = base.fpp.rows.map(function (def, idx) {
      var id = String(idx + 1);
      var ex = byId[id];
      if (ex) return Object.assign({}, def, ex, { id: id, slNo: idx + 1 });
      return Object.assign({}, def);
    });
    if (!next.fpp.unit) next.fpp.unit = '18';
    return next;
  }

  function save(content) {
    try {
      localStorage.setItem(CONTENT_KEY, JSON.stringify(content || {}));
      return true;
    } catch (_) {
      return false;
    }
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
      var req = window.indexedDB.open('fppOnlyMedia', 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
      };
      req.onsuccess = function (e) { resolve(e.target.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function putBlob(key, blob) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('blobs', 'readwrite');
        tx.objectStore('blobs').put(blob, key);
        tx.oncomplete = function () { resolve(key); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function getBlob(key) {
    if (!key) return Promise.resolve(null);
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('blobs', 'readonly');
        var req = tx.objectStore('blobs').get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    });
  }

  function makeKey(prefix) {
    return String(prefix || 'blob') + '-' + Date.now() + '-' + Math.random().toString(16).slice(2);
  }

  function blobToObjectUrl(blob) {
    try { return blob ? URL.createObjectURL(blob) : ''; } catch (_) { return ''; }
  }

  function isAuthed() {
    try {
      // Accept either the FPP-only auth key or the shared admin auth key.
      return localStorage.getItem(AUTH_KEY) === 'true' || localStorage.getItem(SHARED_AUTH_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  function setAuthed(v) {
    try {
      if (v) {
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(SHARED_AUTH_KEY, 'true');
      } else {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(SHARED_AUTH_KEY);
      }
    } catch (_) {}
  }

  window.OfflineStore = {
    defaultContent: defaultContent,
    load: load,
    save: save,
    makeKey: makeKey,
    putBlob: putBlob,
    getBlob: getBlob,
    blobToObjectUrl: blobToObjectUrl,
    isAuthed: isAuthed,
    setAuthed: setAuthed
  };
})();

