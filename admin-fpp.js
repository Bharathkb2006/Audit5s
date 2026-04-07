(function () {
  'use strict';

  function requireAuth() {
    if (window.OfflineStore && window.OfflineStore.isAuthed && window.OfflineStore.isAuthed()) return true;
    window.location.href = 'admin-login.html';
    return false;
  }

  if (!requireAuth()) return;

  var tableBody = document.getElementById('tableBody');
  var photosBlock = document.getElementById('photosBlock');

  var saveTableBtn = document.getElementById('saveTableBtn');
  var tableStatus = document.getElementById('tableStatus');

  var monthWiseInput = document.getElementById('monthWiseInput');
  var saveMonthWiseBtn = document.getElementById('saveMonthWiseBtn');
  var monthWiseStatus = document.getElementById('monthWiseStatus');

  var savePhotosBtn = document.getElementById('savePhotosBtn');
  var photosStatus = document.getElementById('photosStatus');

  var logoutBtn = document.getElementById('logoutBtn');

  function setStatus(el, msg, isErr) {
    if (!el) return;
    el.textContent = msg || '';
    el.classList.toggle('is-error', Boolean(isErr));
  }

  function getContent() {
    return window.OfflineStore ? window.OfflineStore.load() : null;
  }

  function saveContent(next) {
    if (!window.OfflineStore) throw new Error('Offline storage not available');
    var ok = window.OfflineStore.save(next);
    if (!ok) throw new Error('Could not save (storage full). Try smaller images.');
  }

  function renderTable(existing) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    var rows = existing && existing.fpp && Array.isArray(existing.fpp.rows) ? existing.fpp.rows : [];
    for (var i = 1; i <= 16; i++) {
      var id = String(i);
      var row = rows.find(function (r) { return String(r.id || '') === id; }) || { id: id, slNo: i };
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + i + '</td>' +
        '<td><input id="zoneNo' + id + '" type="text" /></td>' +
        '<td><input id="zoneDesc' + id + '" type="text" /></td>' +
        '<td><input id="fppNo' + id + '" type="text" /></td>' +
        '<td><input id="fppDesc' + id + '" type="text" /></td>';
      tableBody.appendChild(tr);

      var z1 = document.getElementById('zoneNo' + id);
      var z2 = document.getElementById('zoneDesc' + id);
      var z3 = document.getElementById('fppNo' + id);
      var z4 = document.getElementById('fppDesc' + id);
      if (z1) z1.value = row.zoneNo || '';
      if (z2) z2.value = row.zoneDesc || '';
      if (z3) z3.value = row.fppNo || '';
      if (z4) z4.value = row.fppDesc || '';
    }
  }

  function renderPhotoInputs() {
    if (!photosBlock) return;
    photosBlock.innerHTML = '';
    for (var i = 1; i <= 16; i++) {
      var id = String(i);
      var box = document.createElement('div');
      box.className = 'photo-row';
      box.innerHTML =
        '<h3>Row ' + id + '</h3>' +
        '<label class="admin-field">Fixed point photograph<input id="main' + id + '" type="file" accept="image/*" /></label>' +
        '<label class="admin-field">Actual snapshot on shop floor<input id="snap' + id + '" type="file" accept="image/*" /></label>';
      photosBlock.appendChild(box);
    }
  }

  function boot() {
    var existing = getContent();
    renderTable(existing);
    renderPhotoInputs();
  }

  if (saveTableBtn) {
    saveTableBtn.addEventListener('click', function () {
      try {
        setStatus(tableStatus, 'Saving…', false);
        var content = getContent() || (window.OfflineStore ? window.OfflineStore.defaultContent() : {});
        var next = JSON.parse(JSON.stringify(content || {}));
        next.fpp = next.fpp || {};
        next.fpp.unit = '18';
        next.fpp.rows = [];
        for (var i = 1; i <= 16; i++) {
          var id = String(i);
          var z1 = document.getElementById('zoneNo' + id);
          var z2 = document.getElementById('zoneDesc' + id);
          var z3 = document.getElementById('fppNo' + id);
          var z4 = document.getElementById('fppDesc' + id);
          next.fpp.rows.push({
            id: id,
            slNo: i,
            zoneNo: z1 ? z1.value.trim() : '',
            zoneDesc: z2 ? z2.value.trim() : '',
            fppNo: z3 ? z3.value.trim() : '',
            fppDesc: z4 ? z4.value.trim() : ''
          });
        }
        saveContent(next);
        setStatus(tableStatus, 'Saved.', false);
      } catch (e) {
        setStatus(tableStatus, e && e.message ? e.message : 'Save failed', true);
      }
    });
  }

  if (saveMonthWiseBtn) {
    saveMonthWiseBtn.addEventListener('click', async function () {
      try {
        var file = monthWiseInput && monthWiseInput.files && monthWiseInput.files[0];
        if (!file) {
          setStatus(monthWiseStatus, 'Choose an image first.', true);
          return;
        }
        setStatus(monthWiseStatus, 'Saving…', false);
        var content = getContent() || (window.OfflineStore ? window.OfflineStore.defaultContent() : {});
        var next = JSON.parse(JSON.stringify(content || {}));
        next.assets = next.assets || {};
        var key = window.OfflineStore.makeKey('month-wise-layout');
        await window.OfflineStore.putBlob(key, file);
        next.assets.monthWiseLayoutKey = key;
        saveContent(next);
        if (monthWiseInput) monthWiseInput.value = '';
        setStatus(monthWiseStatus, 'Saved.', false);
      } catch (e) {
        setStatus(monthWiseStatus, e && e.message ? e.message : 'Save failed', true);
      }
    });
  }

  if (savePhotosBtn) {
    savePhotosBtn.addEventListener('click', async function () {
      try {
        setStatus(photosStatus, 'Saving…', false);
        var content = getContent() || (window.OfflineStore ? window.OfflineStore.defaultContent() : {});
        var next = JSON.parse(JSON.stringify(content || {}));
        next.fppPhotos = next.fppPhotos && typeof next.fppPhotos === 'object' ? next.fppPhotos : {};

        var any = false;
        for (var i = 1; i <= 16; i++) {
          var id = String(i);
          var main = document.getElementById('main' + id);
          var snap = document.getElementById('snap' + id);
          var mainFile = main && main.files && main.files[0];
          var snapFile = snap && snap.files && snap.files[0];
          if (!mainFile && !snapFile) continue;
          any = true;

          var photos = next.fppPhotos[id] || {};
          if (mainFile) {
            var mk = window.OfflineStore.makeKey('fpp-main-' + id);
            await window.OfflineStore.putBlob(mk, mainFile);
            photos.mainKey = mk;
          }
          if (snapFile) {
            var sk = window.OfflineStore.makeKey('fpp-snap-' + id);
            await window.OfflineStore.putBlob(sk, snapFile);
            photos.snapshotKey = sk;
          }
          next.fppPhotos[id] = photos;
        }

        if (!any) {
          setStatus(photosStatus, 'Choose at least one photo to upload.', true);
          return;
        }

        saveContent(next);

        for (var c = 1; c <= 16; c++) {
          var cid = String(c);
          var m = document.getElementById('main' + cid);
          var s = document.getElementById('snap' + cid);
          if (m) m.value = '';
          if (s) s.value = '';
        }

        setStatus(photosStatus, 'Saved.', false);
      } catch (e) {
        setStatus(photosStatus, e && e.message ? e.message : 'Save failed', true);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      try { if (window.OfflineStore) window.OfflineStore.setAuthed(false); } catch (_) {}
      window.location.href = 'index.html';
    });
  }

  boot();
})();

