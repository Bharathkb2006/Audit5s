(function () {
  'use strict';

  var imgEl = document.getElementById('monthWiseLayoutImage');
  var fallbackEl = document.getElementById('monthWiseLayoutFallback');

  function setVisible(hasImage) {
    if (imgEl) imgEl.style.display = hasImage ? 'block' : 'none';
    if (fallbackEl) fallbackEl.style.display = hasImage ? 'none' : 'grid';
  }

  async function load() {
    try {
      var content = window.OfflineStore ? window.OfflineStore.load() : null;
      var key = content && content.assets ? content.assets.monthWiseLayoutKey : '';
      if (imgEl && key && window.OfflineStore) {
        var blob = await window.OfflineStore.getBlob(key);
        var url = window.OfflineStore.blobToObjectUrl(blob);
        if (url) {
          imgEl.src = url;
          setVisible(true);
          return;
        }
      }
    } catch (_) {}
    setVisible(false);
  }

  load();
})();

