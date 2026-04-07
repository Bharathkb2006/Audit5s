(function () {
  'use strict';

  var tableBody = document.getElementById('fppTableBody');
  var unitSpan = document.getElementById('fppUnit');

  function createIconButton(rowId) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fpp-link-icon';
    btn.setAttribute('aria-label', 'Open photos for this FPP');

    var inner = document.createElement('span');
    inner.className = 'fpp-link-icon-inner';
    btn.appendChild(inner);

    btn.addEventListener('click', function () {
      window.location.href = 'fpp-photos.html?row=' + encodeURIComponent(String(rowId));
    });
    return btn;
  }

  function renderRows(fpp) {
    if (!tableBody) return;
    tableBody.innerHTML = '';
    if (!fpp || !Array.isArray(fpp.rows)) return;

    fpp.rows.forEach(function (row, index) {
      var tr = document.createElement('tr');
      tr.className = index % 2 === 0 ? 'fpp-row-even' : 'fpp-row-odd';

      function addCell(text) {
        var td = document.createElement('td');
        td.textContent = text || '';
        tr.appendChild(td);
      }

      var slNo = typeof row.slNo === 'number' ? row.slNo : (index + 1);
      addCell(slNo);
      addCell(row.zoneNo || '');
      addCell(row.zoneDesc || '');
      addCell(row.fppNo || '');

      var descTd = document.createElement('td');
      var descSpan = document.createElement('span');
      descSpan.textContent = row.fppDesc || '';
      descTd.appendChild(descSpan);
      descTd.appendChild(createIconButton(row.id || String(slNo)));
      tr.appendChild(descTd);
      tableBody.appendChild(tr);
    });
  }

  function openMonthWise() {
    window.location.href = 'fpp-month-layout.html';
  }

  var monthWiseBtn = document.getElementById('monthWiseLayoutBtn');
  if (monthWiseBtn) monthWiseBtn.addEventListener('click', openMonthWise);

  function load() {
    try {
      var content = window.OfflineStore ? window.OfflineStore.load() : null;
      var fpp = content && content.fpp ? content.fpp : null;
      if (unitSpan && fpp && typeof fpp.unit === 'string') unitSpan.textContent = fpp.unit;
      renderRows(fpp);
    } catch (_) {}
  }

  load();
})();

