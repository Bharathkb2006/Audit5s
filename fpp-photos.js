(function () {
  'use strict';

  var mainImg = document.getElementById('fppMainImage');
  var mainFallback = document.getElementById('fppMainFallback');
  var snapshotImg = document.getElementById('fppSnapshotImage');
  var snapshotFallback = document.getElementById('fppSnapshotFallback');
  var titleEl = document.getElementById('fppPhotoTitle');

  function getRowId() {
    try {
      var params = new URLSearchParams(window.location.search || '');
      return params.get('row') || '1';
    } catch (_) {
      return '1';
    }
  }

  function setVisibility(imgEl, fallbackEl, hasImage) {
    if (imgEl) imgEl.style.display = hasImage ? 'block' : 'none';
    if (fallbackEl) fallbackEl.style.display = hasImage ? 'none' : 'grid';
  }

  async function load() {
    var rowId = getRowId();
    try {
      var content = window.OfflineStore ? window.OfflineStore.load() : null;
      var fpp = content && content.fpp ? content.fpp : null;
      var fppPhotos = content && content.fppPhotos ? content.fppPhotos : null;

      if (fpp && Array.isArray(fpp.rows)) {
        var row = fpp.rows.find(function (r) { return String(r.id || '') === String(rowId); });
        if (row && titleEl) {
          var parts = [];
          if (row.fppNo) parts.push(row.fppNo);
          if (row.fppDesc) parts.push(row.fppDesc);
          titleEl.textContent = parts.join(' – ');
        }
      }

      var photos = fppPhotos && fppPhotos[rowId] ? fppPhotos[rowId] : null;
      if (!photos) {
        setVisibility(mainImg, mainFallback, false);
        setVisibility(snapshotImg, snapshotFallback, false);
        return;
      }

      if (photos.mainKey && window.OfflineStore) {
        var mainBlob = await window.OfflineStore.getBlob(photos.mainKey);
        var mainUrl = window.OfflineStore.blobToObjectUrl(mainBlob);
        if (mainUrl && mainImg) mainImg.src = mainUrl;
        setVisibility(mainImg, mainFallback, Boolean(mainUrl));
      } else {
        setVisibility(mainImg, mainFallback, false);
      }

      if (photos.snapshotKey && window.OfflineStore) {
        var snapBlob = await window.OfflineStore.getBlob(photos.snapshotKey);
        var snapUrl = window.OfflineStore.blobToObjectUrl(snapBlob);
        if (snapUrl && snapshotImg) snapshotImg.src = snapUrl;
        setVisibility(snapshotImg, snapshotFallback, Boolean(snapUrl));
      } else {
        setVisibility(snapshotImg, snapshotFallback, false);
      }
    } catch (_) {
      setVisibility(mainImg, mainFallback, false);
      setVisibility(snapshotImg, snapshotFallback, false);
    }
  }

  load();
})();

