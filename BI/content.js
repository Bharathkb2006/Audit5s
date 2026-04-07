/* global document, localStorage */
(function () {
  'use strict';

  var CONTENT_KEY = 'biContent';

  function readContent() {
    try {
      return JSON.parse(localStorage.getItem(CONTENT_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function setText(el, value) {
    if (el && value) el.textContent = value;
  }

  function setImage(el, value) {
    if (el && value) el.src = value;
  }

  function setVideo(el, value) {
    if (el && value) {
      el.src = value;
      el.load();
    }
  }

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

  function loadMediaFile(key) {
    return openMediaDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readonly');
        var store = tx.objectStore('files');
        var request = store.get(key);
        request.onsuccess = function () { resolve(request.result || null); };
        request.onerror = function () { reject(request.error); };
      });
    });
  }

  function setVideoFromDb(el, key) {
    if (!el) return;
    loadMediaFile(key).then(function (file) {
      if (!file) return;
      var url = URL.createObjectURL(file);
      el.src = url;
      el.load();
    }).catch(function () {});
  }

  var content = readContent();

  var companyLogoEl = document.getElementById('guest-company-logo');
  if (companyLogoEl) {
    var logoUrl = document.body.classList.contains('guest-list-page-body')
      ? content.guestsCompanyLogo
      : content.companyLogo;
    if (logoUrl) {
      setImage(companyLogoEl, logoUrl);
      companyLogoEl.style.display = '';
    }
  }

  if (document.body.classList.contains('guest-body')) {
    var guest = content.guest || {};
    setText(document.querySelector('.guest-name'), guest.name);
    setText(document.querySelector('.guest-role'), guest.role);
    setImage(document.querySelector('.guest-profile-img'), guest.image);
    var dateEl = document.getElementById('guestDate');
    if (dateEl) {
      if (guest.date) {
        dateEl.textContent = guest.date;
      } else {
        dateEl.textContent = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    }
  }
  if (document.body.classList.contains('guest-list-page-body')) {
    var guests = Array.isArray(content.guestsMulti) ? content.guestsMulti.slice(0, 5) : [];
    var grid = document.getElementById('guestListGrid');
    var noteEl = document.getElementById('guestListNote');

    if (grid) {
      grid.innerHTML = '';
      guests = guests.filter(function (g) {
        return g && g.name && g.role && g.image;
      });

      if (guests.length >= 2) {
        guests.forEach(function (guestItem) {
          var card = document.createElement('div');
          card.className = 'guest-card';

          var photoWrap = document.createElement('div');
          photoWrap.className = 'guest-card-photo';

          var img = document.createElement('img');
          img.className = 'guest-card-img';
          img.alt = guestItem.name || 'Guest';
          img.src = guestItem.image;
          photoWrap.appendChild(img);

          var textWrap = document.createElement('div');
          var nameEl = document.createElement('div');
          nameEl.className = 'guest-card-name';
          nameEl.textContent = guestItem.name || '';
          var roleEl = document.createElement('div');
          roleEl.className = 'guest-card-role';
          roleEl.textContent = guestItem.role || '';
          textWrap.appendChild(nameEl);
          textWrap.appendChild(roleEl);

          card.appendChild(photoWrap);
          card.appendChild(textWrap);
          grid.appendChild(card);
        });

        if (noteEl) {
          noteEl.textContent = '';
        }
      } else if (noteEl) {
        noteEl.textContent = 'Configure at least two guests in the admin page to show them here.';
      }
    }
  }
  if (document.body.classList.contains('notice-page-body')) {
    var noticeImages = content.noticeImages || [];
    var noticeImgs = document.querySelectorAll('.notice-cell img');
    noticeImgs.forEach(function (img, index) {
      if (noticeImages[index]) setImage(img, noticeImages[index]);
    });
  }

  var suggestionTrack = document.getElementById('suggestionTrack');
  if (suggestionTrack) {
    var suggestionImages = content.suggestionImages || [];
    var suggestionImgs = suggestionTrack.querySelectorAll('img');
    suggestionImgs.forEach(function (img, index) {
      if (suggestionImages[index]) setImage(img, suggestionImages[index]);
    });
  }

  var suggestionChartCanvas = document.getElementById('suggestionChart');
  if (suggestionChartCanvas && window.Chart) {
    var stats = content.suggestionStats || null;
    if (stats && stats.months && stats.months.length) {
      var ctx = suggestionChartCanvas.getContext('2d');

      var chartTitle = typeof stats.chartTitle === 'string' && stats.chartTitle.trim()
        ? stats.chartTitle.trim()
        : 'SUGGESTION TREND';
      var yAxisLabel = typeof stats.yAxisLabel === 'string' && stats.yAxisLabel.trim()
        ? stats.yAxisLabel.trim()
        : 'Suggestions';

      var headerTitleEl = document.querySelector('.suggestion-chart-header span');
      if (headerTitleEl) {
        headerTitleEl.textContent = chartTitle;
      }

      if (window.ChartDataLabels && !window.Chart._biDatalabelsRegistered) {
        window.Chart.register(window.ChartDataLabels);
        window.Chart._biDatalabelsRegistered = true;
      }

      var prevLabel = (stats.previousYear && stats.previousYear.label) || '';
      var prevTotal = (stats.previousYear && Number(stats.previousYear.total)) || 0;

      var monthLabels = stats.months.map(function (m) {
        return m && m.label ? m.label : '';
      });
      var monthValues = stats.months.map(function (m) {
        var v = m && typeof m.value !== 'undefined' ? Number(m.value) : 0;
        return Number.isFinite(v) ? v : 0;
      });

      var labels = [prevLabel].concat(monthLabels);
      var yearlyBarData = [prevTotal].concat(monthLabels.map(function () { return null; }));
      var monthlyLineData = [null].concat(monthValues);

      // eslint-disable-next-line no-new

      
      new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              type: 'bar',
              label: 'Previous Total',
              data: yearlyBarData,
              backgroundColor: '#f6871f',
              datalabels: {
                display: function (context) {
                  var value = context.dataset.data[context.dataIndex];
                  return typeof value === 'number' && !Number.isNaN(value);
                },
                align: 'top',
                anchor: 'end',
                formatter: function (value) {
                  return value;
                },
                color: '#f6871f',
                font: {
                  weight: '900',
                  size: 20
                }
              }
            },
            {
              type: 'line',
              label: 'Current Monthly',
              data: monthlyLineData,
              borderColor: '#0b68c0',
              backgroundColor: 'rgba(11,104,192,0.15)',
              borderWidth: 3,
              pointRadius: 4,
              pointBackgroundColor: '#0b68c0',
              tension: 0.2,
              datalabels: {
                display: function (context) {
                  var index = context.dataIndex;
                  var value = context.dataset.data[index];
                  return index > 0 && typeof value === 'number' && !Number.isNaN(value);
                },
                align: 'top',
                anchor: 'end',
                formatter: function (value) {
                  return typeof value === 'number' && !Number.isNaN(value) ? value : '';
                },
                color: '#0b68c0',
                font: {
                  weight: '900',
                  size: 20
                },
                clamp: true
              }
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 18,
                font: {
                  size: 18,
                  weight: '700'
                }
              }
            },
            datalabels: {
              clip: false
            }
          },
          scales: {
            x: {
              grid: {
                display: false
              },
              ticks: {
                maxRotation: 0,
                minRotation: 0,
                font: {
                  size: 18,
                  weight: '700'
                }
              }
            },
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 100,
                font: {
                  size: 22,
                  weight: '800'
                }
              },
              title: {
                display: true,
              text: yAxisLabel,
                font: {
                  size: 24,
                  weight: '900'
                }
              }
            }
          }
        }
      });
    }
  }

  var pdcaTrack = document.getElementById('pdcaTrack');
  if (pdcaTrack) {
    var pdcaImages = content.pdcaImages || [];
    var pdcaImgs = pdcaTrack.querySelectorAll('img');
    pdcaImgs.forEach(function (img, index) {
      if (pdcaImages[index]) setImage(img, pdcaImages[index]);
    });
  }

  var achievementImg = document.getElementById('achievementImage');
  if (achievementImg && content.achievementImage) {
    setImage(achievementImg, content.achievementImage);
  }

  if (document.body.classList.contains('employee-page-body') && !document.querySelector('.birthday-banner')) {
    if (content.employeeOfMonth) {
      setText(document.querySelector('.employee-name'), 'NAME: ' + content.employeeOfMonth.name);
      setText(document.querySelector('.birthday-employee-id'), 'Employee ID: ' + content.employeeOfMonth.id);
      setImage(document.querySelector('.employee-photo'), content.employeeOfMonth.photo);
    }
  }

  if (document.body.classList.contains('employee-page-body') && document.querySelector('.birthday-banner')) {
    if (content.birthday) {
      setText(document.querySelector('.employee-name'), 'Name: ' + content.birthday.name);
      setText(document.querySelector('.birthday-employee-id'), 'Employee ID: ' + content.birthday.id);
      setImage(document.querySelector('.employee-photo'), content.birthday.photo);
    }
  }

  if (document.body.classList.contains('qr-page') && content.recognition) {
    setText(document.getElementById('qrName'), content.recognition.name);
    setText(document.getElementById('qrEmp'), content.recognition.id);
    setText(document.getElementById('qrDate'), content.recognition.date);
    setText(document.getElementById('qrLine'), content.recognition.line);
    setText(document.getElementById('qrDefect'), content.recognition.defect);
    setText(document.getElementById('qrBenefit'), content.recognition.benefit);
    setImage(document.querySelector('.qr-photo'), content.recognition.photo);
  }

  if (document.body.classList.contains('safety-page-body')) {
    var safetyPosters = content.safetyPosters || [];
    var posterImgs = document.querySelectorAll('.safety-poster img');
    posterImgs.forEach(function (img, index) {
      if (safetyPosters[index]) setImage(img, safetyPosters[index]);
    });
    if (content.safetyPledgeVideoStored) {
      setVideoFromDb(document.getElementById('pledgeVideo'), 'safetyPledgeVideo');
    }
    if (content.safetyAwarenessVideo1Stored) {
      setVideoFromDb(document.getElementById('safetyVideo1'), 'safetyAwarenessVideo1');
    }
    if (content.safetyAwarenessVideo2Stored) {
      setVideoFromDb(document.getElementById('safetyVideo2'), 'safetyAwarenessVideo2');
    }
  }
})();
