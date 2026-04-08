(function () {
  'use strict';

  var STORAGE_KEY = 'bi_5s_zones_v1';
  var DEFAULT_CHECKPOINTS = [
    '1. Check free from Dust, Unwanted item, Components',
    '2. Check tables, dryers, racks are clean & items are in place - All required things on the Table - Demarcated',
    '3. Check free Components or any Items in the office - All required things on the floor in the Office - Demarcated',
    '4. Check record room items are clean & in place',
    '5. Check conference hall are clean & chairs are in place'
  ];
  var ZONE_CHECKPOINTS = {
    groupA: DEFAULT_CHECKPOINTS,
    groupB: [
     '1. Gangway markings, cleanliness, free from hindrance, Check floors, Mats, Shoe racks, Conveyer free from Dust',
      '2. Check Free from oil, Spillage, Unwanted items, Fixture stands, Bins, Trolly, Grease & Oil Stand are in place & clean',
      '3. Assy,Sub assy tables, Filter test table, Fixture racks free from Dust. Floor, Walls, Windows etc are maintained at High Level of Cleanliness -  All required Things on the shop floor - Demarcated',
      '4. Check rejection / Rework item are isolated, All Cables, Wires, Pipes etc are neatly clamped & straight with colour code',
      '5. All operators wear uniform, safety shoes & tucked in, Display boards, Cell management board, TPM activity boards are updated'
    ],
    groupC: [
      '1. Gangway markings, cleanliness, free from hindrance, Free from spillage of waste, Oil, Dust, Unwanted item',
      '2.Floor, Walls, Windows etc are maintained at High Level of Cleanliness, bins, trolleys, stands, garbage bins, etc are in place',
      '3. Work in progress, packed boxes, empty trays are in place Switches, Control boots etc are labelled - All required Things on the floor - Demarcated',
      '4.Record, tools, instruments other items are clean & in place, All cables , wires, pipes etc are neatly clamped & straight with colour code',
      '5.  All operators wear uniform, safety shoes & tucked in, Display boards, Cell management board, TPM activity boards are updated'
    ],
    zone10: [
      '1. Check office tables & workstations are clutter free',
      '2. Check files & documents are arranged and labeled properly',
      '3. Check common areas (pantry, meeting rooms) are clean & tidy',
      '4. Check computers, cables & peripherals are routed neatly',
      '5. Check display boards & notice areas are updated and neat'
    ]
  };
  var DEFAULT_LOCATION = 'Unit office, Main lobby & server room';

  function getZoneId() {
    var params = new URLSearchParams(window.location.search);
    var z = parseInt(params.get('zone'), 10);
    return (z >= 1 && z <= 16) ? z : 1;
  }

  function loadZonesData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var data = JSON.parse(raw);
      return data && data.zones ? data : {};
    } catch (_) {
      return {};
    }
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

  function computeTotalFromDaily(dailyScores) {
    var sum = 0;
    for (var r = 0; r < 5; r++) {
      for (var d = 0; d < 5; d++) {
        sum += Number((dailyScores[r] || [])[d]) || 0;
      }
    }
    return Math.min(25, Math.max(0, sum));
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

  var zoneId = getZoneId();
  var zoneData = getZoneData(zoneId);
  var scoreWindowStart = Math.max(1, Math.min(48, Number(zoneData.scoreWindowStart) || 1));
  var chartInstance = null;
  var currentSlideIndex = 0;
  var slideEls = document.querySelectorAll('.zone-detail-slide');
  var championObjectUrl = null;
  var leaderObjectUrl = null;

  try {
    if (document && document.body) {
      document.body.classList.add('zone-id-' + zoneId);
    }
  } catch (_) {}

  var PLACEHOLDER_SVG = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      '<rect width="100%" height="100%" fill="#f1f5f9"/>' +
      '<circle cx="100" cy="78" r="34" fill="#cbd5e1"/>' +
      '<path d="M40 176c10-38 34-56 60-56s50 18 60 56" fill="#cbd5e1"/>' +
    '</svg>'
  );

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

  function readMediaFile(key) {
    return openMediaDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readonly');
        var store = tx.objectStore('files');
        var req = store.get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    }).catch(function () {
      return null;
    });
  }

  function initTitle() {
    var titleEl = document.getElementById('zoneTitle');
    if (titleEl) {
      var metaTitle = zoneData && zoneData.meta && typeof zoneData.meta.title === 'string' ? zoneData.meta.title.trim() : '';
      titleEl.textContent = metaTitle || ('ZONE - ' + zoneId);
    }
  }

  function setPersonCardText(el, text) {
    if (!el) return;
    var v = (text || '').trim();
    el.textContent = v || 'Name';
    el.classList.toggle('is-empty', !v);
  }

  function setPersonImage(imgEl, objectUrl, placeholderUrl) {
    if (!imgEl) return;
    imgEl.src = objectUrl || placeholderUrl || '';
  }

  function renderZoneHeader() {
    initTitle();

    var champNameEl = document.getElementById('zoneChampionName');
    var leaderNameEl = document.getElementById('zoneLeaderName');
    var champImgEl = document.getElementById('zoneChampionImg');
    var leaderImgEl = document.getElementById('zoneLeaderImg');

    var meta = zoneData && zoneData.meta && typeof zoneData.meta === 'object' ? zoneData.meta : {};
    setPersonCardText(champNameEl, meta.championName || '');
    setPersonCardText(leaderNameEl, meta.leaderName || '');

    // Clear existing object URLs
    if (championObjectUrl) {
      try { URL.revokeObjectURL(championObjectUrl); } catch (_) {}
      championObjectUrl = null;
    }
    if (leaderObjectUrl) {
      try { URL.revokeObjectURL(leaderObjectUrl); } catch (_) {}
      leaderObjectUrl = null;
    }

    setPersonImage(champImgEl, null, PLACEHOLDER_SVG);
    setPersonImage(leaderImgEl, null, PLACEHOLDER_SVG);

    // Load photos from IndexedDB (if present)
    readMediaFile('zone:' + zoneId + ':championPhoto').then(function (file) {
      if (!file || !champImgEl) return;
      try {
        championObjectUrl = URL.createObjectURL(file);
        setPersonImage(champImgEl, championObjectUrl, PLACEHOLDER_SVG);
      } catch (_) {}
    });
    readMediaFile('zone:' + zoneId + ':leaderPhoto').then(function (file2) {
      if (!file2 || !leaderImgEl) return;
      try {
        leaderObjectUrl = URL.createObjectURL(file2);
        setPersonImage(leaderImgEl, leaderObjectUrl, PLACEHOLDER_SVG);
      } catch (_) {}
    });
  }

  function getScoresForChart() {
    var scores = zoneData.scores || [];
    var out = [];
    for (var i = 0; i < 52; i++) {
      if (i >= scores.length) {
        out.push(0);
        continue;
      }
      var sw = scores[i] || emptyScoreWeek(i + 1);
      var total = Number(sw.total) || 0;
      if (!total && sw.dailyScores) {
        total = computeTotalFromDaily(sw.dailyScores);
      }
      out.push(total);
    }
    return out;
  }

  var barValuePlugin = {
    id: 'barValueAbove',
    afterDatasetsDraw: function (chart) {
      var ctx = chart.ctx;
      if (!chart.data.datasets || !chart.data.datasets[0]) return;
      var dataset = chart.data.datasets[0];
      var meta = chart.getDatasetMeta(0);
      if (!meta || !meta.data) return;
      meta.data.forEach(function (bar, j) {
        var value = dataset.data[j];
        if (value == null || value === 0) return;
        ctx.save();
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#1a1a1a';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        // Place value label strictly above the bar.
        // We use `bar.y` (bar top) as the constraint so the label baseline never goes below the bar.
        var topY = chart.chartArea && typeof chart.chartArea.top === 'number' ? chart.chartArea.top : 0;
        var desiredY = bar.y - 6;
        var minY = topY + 4; // keep inside chart area (may clip slightly at very top)
        var maxY = bar.y - 2; // never below bar top
        var labelY = Math.min(Math.max(minY, desiredY), maxY);
        ctx.fillText(String(value), bar.x, labelY);
        ctx.restore();
      });
    }
  };

  function drawFallbackChart(canvas, data) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var w = canvas.width = canvas.clientWidth ? canvas.clientWidth : canvas.width;
    var h = canvas.height = canvas.clientHeight ? canvas.clientHeight : canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Plot area
    var padL = 44, padR = 10, padT = 18, padB = 28;
    var plotW = Math.max(10, w - padL - padR);
    var plotH = Math.max(10, h - padT - padB);
    var maxY = 25;

    // grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (var gy = 0; gy <= 6; gy++) {
      var y = padT + (plotH * gy / 6);
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + plotW, y);
      ctx.stroke();
    }

    // bars
    var n = data.length;
    var barGap = 1;
    var barW = Math.max(1, Math.floor(plotW / n) - barGap);
    ctx.fillStyle = 'rgba(26, 103, 189, 0.85)';
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (var i = 0; i < n; i++) {
      var v = Number(data[i]) || 0;
      var bh = Math.round((v / maxY) * plotH);
      var x = padL + i * (barW + barGap);
      var y0 = padT + plotH - bh;
      ctx.fillRect(x, y0, barW, bh);
      if (v) {
        ctx.fillStyle = '#111827';
        // baseline must be above bar top
        var desiredY2 = y0 - 10;
        var minY2 = padT + 6;
        var maxY2 = y0 - 2;
        var labelY2 = Math.min(Math.max(minY2, desiredY2), maxY2);
        ctx.fillText(String(v), x + barW / 2, labelY2);
        ctx.fillStyle = 'rgba(26, 103, 189, 0.85)';
      }
    }
  }

  function initChart() {
    var canvas = document.getElementById('zoneScoreChart');
    if (!canvas) return;
    try {
      if (typeof Chart === 'undefined') {
        drawFallbackChart(canvas, getScoresForChart());
        chartInstance = null;
        return;
      }
      if (!Chart.registry.getPlugin('barValueAbove')) {
        Chart.register(barValuePlugin);
      }
      var ctx = canvas.getContext('2d');
      if (chartInstance) chartInstance.destroy();
      var labels = [];
      for (var i = 1; i <= 52; i++) labels.push(i);
      chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Total',
            data: getScoresForChart(),
            // Make bars thicker and keep a small gap between them
            barThickness: 9,
            maxBarThickness: 12,
            minBarLength: 2,
            categoryPercentage: 0.9,
            barPercentage: 0.85,
            backgroundColor: 'rgba(26, 103, 189, 0.8)',
            borderColor: 'rgba(26, 103, 189, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          // Keep canvas internal resolution aligned with CSS pixels (strict 900px canvas expectation).
          devicePixelRatio: 1,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                afterLabel: function (ctx) {
                  return 'Total: ' + ctx.raw + '/25';
                }
              }
            }
          },
          scales: {
            y: {
              min: 0,
              max: 25,
              ticks: { stepSize: 5 },
              title: { display: true, text: 'Total Value' }
            },
            x: {
              ticks: { autoSkip: true, maxRotation: 0 },
              title: { display: true, text: 'Weeks' }
            }
          }
        }
      });
    } catch (_) {
      drawFallbackChart(canvas, getScoresForChart());
      chartInstance = null;
    }
  }

  function refreshFromStorage() {
    zoneData = getZoneData(zoneId);
    scoreWindowStart = Math.max(1, Math.min(48, Number(zoneData.scoreWindowStart) || scoreWindowStart || 1));
    renderZoneHeader();
    var canvas = document.getElementById('zoneScoreChart');
    if (chartInstance && chartInstance.data && chartInstance.data.datasets && chartInstance.data.datasets[0]) {
      chartInstance.data.datasets[0].data = getScoresForChart();
      chartInstance.update();
    } else if (canvas) {
      drawFallbackChart(canvas, getScoresForChart());
    }
    renderAuditBody();
    renderObservations();
  }

  function getStart() {
    return scoreWindowStart;
  }

  function renderAuditBody() {
    var tbody = document.getElementById('zoneAuditBody');
    if (!tbody) return;
    var start = getStart();
    var scores = zoneData.scores || [];
    var checkpoints = getCheckpointsForZone(zoneId);
    var html = '';
    for (var r = 0; r < 5; r++) {
      html += '<tr>';
      if (r === 0) {
        var loc = (zoneData && zoneData.meta && typeof zoneData.meta.location === 'string')
          ? zoneData.meta.location
          : DEFAULT_LOCATION;
        html += '<td class="zone-audit-location" rowspan="7">' + String(loc || DEFAULT_LOCATION).replace(/</g, '&lt;') + '</td>';
      }
      html += '<td class="zone-audit-cp">' + (checkpoints[r] || DEFAULT_CHECKPOINTS[r] || '') + '</td>';
      for (var w = 0; w < 5; w++) {
        var weekIndex = start + w - 1;
        var sw = weekIndex < scores.length ? scores[weekIndex] : emptyScoreWeek(weekIndex + 1);
        var row = sw.dailyScores[r] || [0, 0, 0, 0, 0];
        for (var d = 0; d < 5; d++) {
          html += '<td class="zone-audit-cell">' + (row[d] || 0) + '</td>';
        }
      }
      html += '</tr>';
    }
    html += '<tr><td class="zone-audit-cp">Total Marks</td>';
    for (var w2 = 0; w2 < 5; w2++) {
      var weekIndex2 = start + w2 - 1;
      var sw2 = weekIndex2 < scores.length ? scores[weekIndex2] : emptyScoreWeek(weekIndex2 + 1);
      var t = Number(sw2.total) || 0;
      if (!t && sw2.dailyScores) t = computeTotalFromDaily(sw2.dailyScores);
      html += '<td colspan="5" class="zone-audit-total-cell">' + t + '/25</td>';
    }
    html += '</tr>';
    html += '<tr><td class="zone-audit-cp">Checked By</td>';
    for (var w3 = 0; w3 < 5; w3++) {
      var weekIndex3 = start + w3 - 1;
      var sw3 = weekIndex3 < scores.length ? scores[weekIndex3] : emptyScoreWeek(weekIndex3 + 1);
      html += '<td colspan="5" class="zone-audit-by-cell">' + (sw3.checkedBy || '').replace(/</g, '&lt;') + '</td>';
    }
    html += '</tr>';
    tbody.innerHTML = html;

    var weekNoIds = ['zoneW1No', 'zoneW2No', 'zoneW3No', 'zoneW4No', 'zoneW5No'];
    var weekDtIds = ['zoneW1Dt', 'zoneW2Dt', 'zoneW3Dt', 'zoneW4Dt', 'zoneW5Dt'];
    for (var i = 0; i < 5; i++) {
      var wi = start + i;
      var s = wi <= scores.length ? scores[wi - 1] : emptyScoreWeek(wi);
      var noEl = document.getElementById(weekNoIds[i]);
      var dtEl = document.getElementById(weekDtIds[i]);
      if (noEl) noEl.textContent = s.weekNo || wi;
      if (dtEl) dtEl.textContent = s.date || '';
    }
  }

  document.querySelectorAll('.zone-range-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      scoreWindowStart = parseInt(btn.getAttribute('data-start'), 10);
      renderAuditBody();
      document.querySelectorAll('.zone-range-btn').forEach(function (b) {
        b.classList.toggle('is-active', parseInt(b.getAttribute('data-start'), 10) === scoreWindowStart);
      });
      btn.classList.add('is-active');
    });
  });

  function renderObservations() {
    var tbody = document.getElementById('zoneObsBody');
    if (!tbody) return;
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
        var row = rows[slot] || { location: '', observation: '', correctiveAction: '', resp: '', targetDate: '', completedDate: '' };
        html += '<tr>';
        html += '<td class="zone-obs-weekno">' + (slot === 0 ? week : '') + '</td>';
        html += '<td>' + (row.location || '').replace(/</g, '&lt;') + '</td>';
        html += '<td>' + (row.observation || '').replace(/</g, '&lt;') + '</td>';
        html += '<td>' + (row.correctiveAction || '').replace(/</g, '&lt;') + '</td>';
        html += '<td>' + (row.resp || '').replace(/</g, '&lt;') + '</td>';
        html += '<td>' + (row.targetDate || '').replace(/</g, '&lt;') + '</td>';
        html += '<td>' + (row.completedDate || '').replace(/</g, '&lt;') + '</td>';
        html += '</tr>';
      }
    }
    tbody.innerHTML = html;
  }

  function showSlide(index) {
    currentSlideIndex = Math.max(0, Math.min(1, index));
    slideEls.forEach(function (el, i) {
      el.classList.toggle('is-active', i === currentSlideIndex);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      showSlide(currentSlideIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      showSlide(currentSlideIndex - 1);
    }
  });

  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('.s-back-btn')) return;
    if (e.target.closest && e.target.closest('button')) return;
    var mid = window.innerWidth / 2;
    if (e.clientX >= mid) showSlide(currentSlideIndex + 1);
    else showSlide(currentSlideIndex - 1);
  });

  renderZoneHeader();
  initChart();
  renderAuditBody();
  renderObservations();
  showSlide(0);

  var firstRangeBtn = document.querySelector('.zone-range-btn[data-start="1"]');
  if (firstRangeBtn) firstRangeBtn.classList.add('is-active');

  // Refresh when admin saves in another tab/window
  window.addEventListener('storage', function (e) {
    if (e && e.key === STORAGE_KEY) {
      refreshFromStorage();
    }
  });

  // Also refresh instantly (even same-tab) via BroadcastChannel
  try {
    if ('BroadcastChannel' in window) {
      var zoneChannel = new BroadcastChannel('bi_5s_zone_updates');
      zoneChannel.onmessage = function (ev) {
        if (!ev || !ev.data || ev.data.type !== 'zoneDataUpdated') return;
        if (ev.data.zoneId && Number(ev.data.zoneId) !== zoneId) return;
        refreshFromStorage();
      };
    }
  } catch (_) {}
})();
