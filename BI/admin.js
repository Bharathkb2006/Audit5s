(function () {
  'use strict';

  var statusEl = document.getElementById('status');
  var logoutBtn = document.getElementById('logoutBtn');
  var organogramUpload = document.getElementById('organogramUpload');
  var organogramSave = document.getElementById('organogramSave');
  var organogramSection = document.getElementById('organogramSection');

  var layoutBarcuttingUpload = document.getElementById('layoutBarcuttingUpload');
  var layoutGroundUpload = document.getElementById('layoutGroundUpload');
  var layoutFirstUpload = document.getElementById('layoutFirstUpload');
  var layoutSecondUpload = document.getElementById('layoutSecondUpload');
  var layoutsSave = document.getElementById('layoutsSave');
  var layoutsStatusEl = document.getElementById('layoutsStatus');

  var summaryImage1Upload = document.getElementById('summaryImage1Upload');
  var summaryImage2Upload = document.getElementById('summaryImage2Upload');
  var summaryImage3Upload = document.getElementById('summaryImage3Upload');
  var summaryImagesSave = document.getElementById('summaryImagesSave');
  var summaryImagesStatusEl = document.getElementById('summaryImagesStatus');

  var bestZoneImage1Upload = document.getElementById('bestZoneImage1Upload');
  var bestZoneImage2Upload = document.getElementById('bestZoneImage2Upload');
  var bestZoneSave = document.getElementById('bestZoneSave');
  var bestZoneStatusEl = document.getElementById('bestZoneStatus');

  var worstZoneImage1Upload = document.getElementById('worstZoneImage1Upload');
  var worstZoneImage2Upload = document.getElementById('worstZoneImage2Upload');
  var worstZoneSave = document.getElementById('worstZoneSave');
  var worstZoneStatusEl = document.getElementById('worstZoneStatus');

  var about5sVideoFile = document.getElementById('about5sVideoFile');
  var s1VideoFile = document.getElementById('s1VideoFile');
  var s2VideoFile = document.getElementById('s2VideoFile');
  var s3VideoFile = document.getElementById('s3VideoFile');
  var s4VideoFile = document.getElementById('s4VideoFile');
  var s5VideoFile = document.getElementById('s5VideoFile');
  var s1ImageFile = document.getElementById('s1ImageFile');
  var s2ImageFile = document.getElementById('s2ImageFile');
  var s3ImageFile = document.getElementById('s3ImageFile');
  var s4ImageFile = document.getElementById('s4ImageFile');
  var s5ImageFile = document.getElementById('s5ImageFile');
  var mediaSave = document.getElementById('mediaSave');
  var mediaStatusEl = document.getElementById('mediaStatus');
  var clearStorageBtn = document.getElementById('clearStorageBtn');

  var STORAGE_KEY = 'bi_content_v1';
  var AUTH_KEY = 'bi_admin_authed_v1';
  // These hold the currently selected files (not Data URLs)
  var pendingOrganogramFile = null;
  var pendingLayouts = {
    barcutting: null,
    ground: null,
    first: null,
    second: null
  };
  var pendingSummaryImages = {
    one: null,
    two: null,
    three: null,
    best1: null,
    best2: null,
    worst1: null,
    worst2: null
  };
  var pendingMedia = {};

  function setMediaStatus(text, isError) {
    if (!mediaStatusEl) return;
    mediaStatusEl.textContent = text || '';
    mediaStatusEl.classList.toggle('is-error', Boolean(isError));
  }

  function setStatus(text, isError) {
    if (!statusEl) return;
    statusEl.textContent = text || '';
    statusEl.classList.toggle('is-error', Boolean(isError));
  }

  function setLayoutsStatus(text, isError) {
    if (!layoutsStatusEl) return;
    layoutsStatusEl.textContent = text || '';
    layoutsStatusEl.classList.toggle('is-error', Boolean(isError));
  }

  function setSummaryImagesStatus(text, isError) {
    if (!summaryImagesStatusEl) return;
    summaryImagesStatusEl.textContent = text || '';
    summaryImagesStatusEl.classList.toggle('is-error', Boolean(isError));
  }

  function setBestZoneStatus(text, isError) {
    if (!bestZoneStatusEl) return;
    bestZoneStatusEl.textContent = text || '';
    bestZoneStatusEl.classList.toggle('is-error', Boolean(isError));
  }

  function setWorstZoneStatus(text, isError) {
    if (!worstZoneStatusEl) return;
    worstZoneStatusEl.textContent = text || '';
    worstZoneStatusEl.classList.toggle('is-error', Boolean(isError));
  }


  function clearAllMediaStorage() {
    // Remove JSON metadata for 5S / layouts and other admin content
    try {
      localStorage.removeItem(STORAGE_KEY);  // bi_content_v1
      localStorage.removeItem('biContent');  // second admin dashboard content
    } catch (_) {}

    // Clear IndexedDB blobs used by this admin page
    openMediaDb()
      .then(function (db) {
        var tx = db.transaction('files', 'readwrite');
        var store = tx.objectStore('files');
        store.clear();
      })
      .catch(function () {
        // ignore DB errors
      })
      .finally(function () {
        setStatus('Stored media cleared. Please reload and upload fresh files.', false);
      });
  }

  function isAuthed() {
    try {
      return localStorage.getItem(AUTH_KEY) === 'true';
    } catch (_) {
      return false;
    }
  }

  function ensureAuthed() {
    if (!isAuthed()) {
      window.location.href = 'admin-login.html';
      return false;
    }
    return true;
  }

  function loadContent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function saveContent(nextContent) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextContent));
      return true;
    } catch (err) {
      throw new Error('Could not save (localStorage full). Try smaller images.');
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

  function readFileAsDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read file')); };
      reader.onload = function () { resolve(String(reader.result || '')); };
      reader.readAsDataURL(file);
    });
  }

  function setSaveReady(isReady) {
    if (!organogramSave) return;
    organogramSave.disabled = !isReady;
    organogramSave.classList.toggle('is-hidden', !isReady);
  }

  function setMediaSaveReady(isReady) {
    if (!mediaSave) return;
    mediaSave.disabled = !isReady;
    mediaSave.classList.toggle('is-hidden', !isReady);
  }

  function setLayoutsSaveReady(isReady) {
    if (!layoutsSave) return;
    layoutsSave.disabled = !isReady;
    layoutsSave.classList.toggle('is-hidden', !isReady);
  }

  function setSummaryImagesSaveReady(isReady) {
    if (!summaryImagesSave) return;
    summaryImagesSave.disabled = !isReady;
    summaryImagesSave.classList.toggle('is-hidden', !isReady);
  }

  function setBestZoneSaveReady(isReady) {
    if (!bestZoneSave) return;
    bestZoneSave.disabled = !isReady;
    bestZoneSave.classList.toggle('is-hidden', !isReady);
  }

  function setWorstZoneSaveReady(isReady) {
    if (!worstZoneSave) return;
    worstZoneSave.disabled = !isReady;
    worstZoneSave.classList.toggle('is-hidden', !isReady);
  }


  function anyPendingMedia() {
    return Object.keys(pendingMedia).some(function (k) { return Boolean(pendingMedia[k]); });
  }

  function attachMediaInput(inputEl, key) {
    if (!inputEl) return;
    inputEl.addEventListener('change', function () {
      var file = inputEl.files && inputEl.files[0] ? inputEl.files[0] : null;
      if (!file) return;
      pendingMedia[key] = file;
      setMediaStatus('Ready to save. Click “Save”.', false);
      setMediaSaveReady(true);
    });
  }

  async function boot() {
    var authed = ensureAuthed();
    if (!authed) return;

    setStatus('', false);
    setSaveReady(false);
    setMediaStatus('', false);
    setMediaSaveReady(false);
    setLayoutsStatus('', false);
    setLayoutsSaveReady(false);
    setSummaryImagesStatus('', false);
    setSummaryImagesSaveReady(false);
    setBestZoneStatus('', false);
    setBestZoneSaveReady(false);
    setWorstZoneStatus('', false);
    setWorstZoneSaveReady(false);

    if (organogramSection) organogramSection.style.display = 'block';

    if (clearStorageBtn) {
      clearStorageBtn.addEventListener('click', clearAllMediaStorage);
    }

    attachMediaInput(about5sVideoFile, 'about5sVideoFile');
    attachMediaInput(s1VideoFile, 's1VideoFile');
    attachMediaInput(s2VideoFile, 's2VideoFile');
    attachMediaInput(s3VideoFile, 's3VideoFile');
    attachMediaInput(s4VideoFile, 's4VideoFile');
    attachMediaInput(s5VideoFile, 's5VideoFile');
    attachMediaInput(s1ImageFile, 's1ImageFile');
    attachMediaInput(s2ImageFile, 's2ImageFile');
    attachMediaInput(s3ImageFile, 's3ImageFile');
    attachMediaInput(s4ImageFile, 's4ImageFile');
    attachMediaInput(s5ImageFile, 's5ImageFile');

    if (layoutBarcuttingUpload) {
      layoutBarcuttingUpload.addEventListener('change', function () {
        if (!layoutBarcuttingUpload.files || !layoutBarcuttingUpload.files[0]) return;
        pendingLayouts.barcutting = layoutBarcuttingUpload.files[0];
        setLayoutsStatus('Ready to save. Click “Save”.', false);
        setLayoutsSaveReady(true);
      });
    }

    if (layoutGroundUpload) {
      layoutGroundUpload.addEventListener('change', function () {
        if (!layoutGroundUpload.files || !layoutGroundUpload.files[0]) return;
        pendingLayouts.ground = layoutGroundUpload.files[0];
        setLayoutsStatus('Ready to save. Click “Save”.', false);
        setLayoutsSaveReady(true);
      });
    }

    if (layoutFirstUpload) {
      layoutFirstUpload.addEventListener('change', function () {
        if (!layoutFirstUpload.files || !layoutFirstUpload.files[0]) return;
        pendingLayouts.first = layoutFirstUpload.files[0];
        setLayoutsStatus('Ready to save. Click “Save”.', false);
        setLayoutsSaveReady(true);
      });
    }

    if (layoutSecondUpload) {
      layoutSecondUpload.addEventListener('change', function () {
        if (!layoutSecondUpload.files || !layoutSecondUpload.files[0]) return;
        pendingLayouts.second = layoutSecondUpload.files[0];
        setLayoutsStatus('Ready to save. Click “Save”.', false);
        setLayoutsSaveReady(true);
      });
    }

    if (summaryImage1Upload) {
      summaryImage1Upload.addEventListener('change', function () {
        if (!summaryImage1Upload.files || !summaryImage1Upload.files[0]) return;
        pendingSummaryImages.one = summaryImage1Upload.files[0];
        setSummaryImagesStatus('Ready to save. Click “Save”.', false);
        setSummaryImagesSaveReady(true);
      });
    }

    if (summaryImage2Upload) {
      summaryImage2Upload.addEventListener('change', function () {
        if (!summaryImage2Upload.files || !summaryImage2Upload.files[0]) return;
        pendingSummaryImages.two = summaryImage2Upload.files[0];
        setSummaryImagesStatus('Ready to save. Click “Save”.', false);
        setSummaryImagesSaveReady(true);
      });
    }

    if (summaryImage3Upload) {
      summaryImage3Upload.addEventListener('change', function () {
        if (!summaryImage3Upload.files || !summaryImage3Upload.files[0]) return;
        pendingSummaryImages.three = summaryImage3Upload.files[0];
        setSummaryImagesStatus('Ready to save. Click “Save”.', false);
        setSummaryImagesSaveReady(true);
      });
    }

    if (bestZoneImage1Upload) {
      bestZoneImage1Upload.addEventListener('change', function () {
        if (!bestZoneImage1Upload.files || !bestZoneImage1Upload.files[0]) return;
        pendingSummaryImages.best1 = bestZoneImage1Upload.files[0];
        setBestZoneStatus('Ready to save. Click “Save”.', false);
        setBestZoneSaveReady(true);
      });
    }

    if (bestZoneImage2Upload) {
      bestZoneImage2Upload.addEventListener('change', function () {
        if (!bestZoneImage2Upload.files || !bestZoneImage2Upload.files[0]) return;
        pendingSummaryImages.best2 = bestZoneImage2Upload.files[0];
        setBestZoneStatus('Ready to save. Click “Save”.', false);
        setBestZoneSaveReady(true);
      });
    }

    if (worstZoneImage1Upload) {
      worstZoneImage1Upload.addEventListener('change', function () {
        if (!worstZoneImage1Upload.files || !worstZoneImage1Upload.files[0]) return;
        pendingSummaryImages.worst1 = worstZoneImage1Upload.files[0];
        setWorstZoneStatus('Ready to save. Click “Save”.', false);
        setWorstZoneSaveReady(true);
      });
    }

    if (worstZoneImage2Upload) {
      worstZoneImage2Upload.addEventListener('change', function () {
        if (!worstZoneImage2Upload.files || !worstZoneImage2Upload.files[0]) return;
        pendingSummaryImages.worst2 = worstZoneImage2Upload.files[0];
        setWorstZoneStatus('Ready to save. Click “Save”.', false);
        setWorstZoneSaveReady(true);
      });
    }

    if (mediaSave) {
      mediaSave.addEventListener('click', function () {
        if (!anyPendingMedia()) {
          setMediaStatus('Choose a file first.', true);
          setMediaSaveReady(false);
          return;
        }

        setMediaStatus('Saving…', false);

        var latest = loadContent();
        var next = JSON.parse(JSON.stringify(latest || {}));
        next.assets = next.assets || {};

        var jobs = [];

        function queue(key, storageKey, assetFlagKey) {
          var file = pendingMedia[key];
          if (!file) return;
          jobs.push(storeMediaFile(storageKey, file).then(function () {
            next.assets[assetFlagKey] = true;
          }));
        }

        queue('about5sVideoFile', 'about5sVideo', 'about5sVideoStored');
        queue('s1VideoFile', 's1Video', 's1VideoStored');
        queue('s2VideoFile', 's2Video', 's2VideoStored');
        queue('s3VideoFile', 's3Video', 's3VideoStored');
        queue('s4VideoFile', 's4Video', 's4VideoStored');
        queue('s5VideoFile', 's5Video', 's5VideoStored');

        queue('s1ImageFile', 's1Image', 's1ImageStored');
        queue('s2ImageFile', 's2Image', 's2ImageStored');
        queue('s3ImageFile', 's3Image', 's3ImageStored');
        queue('s4ImageFile', 's4Image', 's4ImageStored');
        queue('s5ImageFile', 's5Image', 's5ImageStored');

        Promise.allSettled(jobs).then(function (results) {
          var failed = results.some(function (r) { return r.status === 'rejected'; });
          try {
            saveContent(next);
          } catch (err) {
            setMediaStatus(err && err.message ? err.message : 'Save failed', true);
            return;
          }

          pendingMedia = {};
          setMediaSaveReady(false);
          [about5sVideoFile, s1VideoFile, s2VideoFile, s3VideoFile, s4VideoFile, s5VideoFile, s1ImageFile, s2ImageFile, s3ImageFile, s4ImageFile, s5ImageFile]
            .forEach(function (el) { if (el) el.value = ''; });
          if (failed) {
            setMediaStatus('Saved with some errors. Try again for the failed file(s).', true);
          } else {
            setMediaStatus('Saved.', false);
          }
        }).catch(function (err) {
          setMediaStatus(err && err.message ? err.message : 'Save failed', true);
        });
      });
    }

    if (organogramUpload) {
      organogramUpload.addEventListener('change', function () {
        if (!organogramUpload.files || !organogramUpload.files[0]) return;
        pendingOrganogramFile = organogramUpload.files[0];
        setStatus('Ready to save. Click “Save”.', false);
        setSaveReady(true);
      });
    }

    if (organogramSave) {
      organogramSave.addEventListener('click', function () {
        if (!pendingOrganogramFile) {
          setStatus('Choose a file first.', true);
          setSaveReady(false);
          return;
        }
        setStatus('Saving…', false);

        // Store the image blob in IndexedDB and only keep a small flag in localStorage
        storeMediaFile('organogramImage', pendingOrganogramFile)
          .then(function () {
            var latest = loadContent();
            var next = JSON.parse(JSON.stringify(latest || {}));
            next.assets = next.assets || {};
            next.assets.organogramImageStored = true;
            if (next.assets.organogramImage) {
              delete next.assets.organogramImage;
            }
            saveContent(next);
            pendingOrganogramFile = null;
            setSaveReady(false);
            setStatus('Saved.', false);
          })
          .catch(function (err) {
            setStatus(err && err.message ? err.message : 'Save failed', true);
          });
      });
    }

    if (layoutsSave) {
      layoutsSave.addEventListener('click', function () {
        var hasAny = pendingLayouts.barcutting || pendingLayouts.ground || pendingLayouts.first || pendingLayouts.second;
        if (!hasAny) {
          setLayoutsStatus('Choose at least one layout image first.', true);
          setLayoutsSaveReady(false);
          return;
        }

        setLayoutsStatus('Saving…', false);

        var latestLayouts = loadContent();
        var nextLayouts = JSON.parse(JSON.stringify(latestLayouts || {}));
        nextLayouts.assets = nextLayouts.assets || {};

        var jobs = [];

        function queueLayout(keyName, storageKey, flagKey) {
          var file = pendingLayouts[keyName];
          if (!file) return;
          jobs.push(
            storeMediaFile(storageKey, file).then(function () {
              nextLayouts.assets[flagKey] = true;
              var legacyKey = {
                barcutting: 'barcuttingLayoutImage',
                ground: 'groundFloorLayoutImage',
                first: 'firstFloorLayoutImage',
                second: 'secondFloorLayoutImage'
              }[keyName];
              if (legacyKey && nextLayouts.assets[legacyKey]) {
                delete nextLayouts.assets[legacyKey];
              }
            })
          );
        }

        queueLayout('barcutting', 'barcuttingLayout', 'barcuttingLayoutStored');
        queueLayout('ground', 'groundFloorLayout', 'groundFloorLayoutStored');
        queueLayout('first', 'firstFloorLayout', 'firstFloorLayoutStored');
        queueLayout('second', 'secondFloorLayout', 'secondFloorLayoutStored');

        Promise.allSettled(jobs).then(function () {
          try {
            saveContent(nextLayouts);
          } catch (err) {
            setLayoutsStatus(err && err.message ? err.message : 'Save failed', true);
            return;
          }

          pendingLayouts.barcutting = null;
          pendingLayouts.ground = null;
          pendingLayouts.first = null;
          pendingLayouts.second = null;
          setLayoutsSaveReady(false);
          setLayoutsStatus('Saved.', false);
        }).catch(function (err) {
          setLayoutsStatus(err && err.message ? err.message : 'Save failed', true);
        });
      });
    }

    if (summaryImagesSave) {
      summaryImagesSave.addEventListener('click', function () {
        var hasAnySummary = pendingSummaryImages.one || pendingSummaryImages.two || pendingSummaryImages.three;
        if (!hasAnySummary) {
          setSummaryImagesStatus('Choose at least one summary image first.', true);
          setSummaryImagesSaveReady(false);
          return;
        }

        setSummaryImagesStatus('Saving…', false);

        var latest = loadContent();
        var next = JSON.parse(JSON.stringify(latest || {}));
        next.assets = next.assets || {};

        var jobs = [];

        function queueSummary(keyName, storeKey, flagKey) {
          var file = pendingSummaryImages[keyName];
          if (!file) return;
          jobs.push(
            storeMediaFile(storeKey, file).then(function () {
              next.assets[flagKey] = true;
              var legacyKey = {
                one: 'summaryImage1',
                two: 'summaryImage2',
                three: 'summaryImage3'
              }[keyName];
              if (legacyKey && next.assets[legacyKey]) {
                delete next.assets[legacyKey];
              }
            })
          );
        }

        queueSummary('one', 'summaryImage1', 'summaryImage1Stored');
        queueSummary('two', 'summaryImage2', 'summaryImage2Stored');
        queueSummary('three', 'summaryImage3', 'summaryImage3Stored');

        Promise.allSettled(jobs).then(function () {
          try {
            saveContent(next);
          } catch (err) {
            setSummaryImagesStatus(err && err.message ? err.message : 'Save failed', true);
            return;
          }

          pendingSummaryImages.one = null;
          pendingSummaryImages.two = null;
          pendingSummaryImages.three = null;
          setSummaryImagesSaveReady(false);
          setSummaryImagesStatus('Saved.', false);
        }).catch(function (err) {
          setSummaryImagesStatus(err && err.message ? err.message : 'Save failed', true);
        });
      });
    }

    if (bestZoneSave) {
      bestZoneSave.addEventListener('click', function () {
        var hasAnyBest = pendingSummaryImages.best1 || pendingSummaryImages.best2;
        if (!hasAnyBest) {
          setBestZoneStatus('Choose at least one Best Zone image first.', true);
          setBestZoneSaveReady(false);
          return;
        }

        setBestZoneStatus('Saving…', false);

        var latestBest = loadContent();
        var nextBest = JSON.parse(JSON.stringify(latestBest || {}));
        nextBest.assets = nextBest.assets || {};

        var jobsBest = [];
        function queueBest(keyName, storeKey, flagKey) {
          var file = pendingSummaryImages[keyName];
          if (!file) return;
          jobsBest.push(storeMediaFile(storeKey, file).then(function () {
            nextBest.assets[flagKey] = true;
          }));
        }

        queueBest('best1', 'bestZoneImage1', 'bestZoneImage1Stored');
        queueBest('best2', 'bestZoneImage2', 'bestZoneImage2Stored');

        Promise.allSettled(jobsBest).then(function () {
          try {
            saveContent(nextBest);
          } catch (err) {
            setBestZoneStatus(err && err.message ? err.message : 'Save failed', true);
            return;
          }

          pendingSummaryImages.best1 = null;
          pendingSummaryImages.best2 = null;
          if (bestZoneImage1Upload) bestZoneImage1Upload.value = '';
          if (bestZoneImage2Upload) bestZoneImage2Upload.value = '';
          setBestZoneSaveReady(false);
          setBestZoneStatus('Saved.', false);
        }).catch(function (err) {
          setBestZoneStatus(err && err.message ? err.message : 'Save failed', true);
        });
      });
    }

    if (worstZoneSave) {
      worstZoneSave.addEventListener('click', function () {
        var hasAnyWorst = pendingSummaryImages.worst1 || pendingSummaryImages.worst2;
        if (!hasAnyWorst) {
          setWorstZoneStatus('Choose at least one Worst Zone image first.', true);
          setWorstZoneSaveReady(false);
          return;
        }

        setWorstZoneStatus('Saving…', false);

        var latestWorst = loadContent();
        var nextWorst = JSON.parse(JSON.stringify(latestWorst || {}));
        nextWorst.assets = nextWorst.assets || {};

        var jobsWorst = [];
        function queueWorst(keyName, storeKey, flagKey) {
          var file = pendingSummaryImages[keyName];
          if (!file) return;
          jobsWorst.push(storeMediaFile(storeKey, file).then(function () {
            nextWorst.assets[flagKey] = true;
          }));
        }

        queueWorst('worst1', 'worstZoneImage1', 'worstZoneImage1Stored');
        queueWorst('worst2', 'worstZoneImage2', 'worstZoneImage2Stored');

        Promise.allSettled(jobsWorst).then(function () {
          try {
            saveContent(nextWorst);
          } catch (err) {
            setWorstZoneStatus(err && err.message ? err.message : 'Save failed', true);
            return;
          }

          pendingSummaryImages.worst1 = null;
          pendingSummaryImages.worst2 = null;
          if (worstZoneImage1Upload) worstZoneImage1Upload.value = '';
          if (worstZoneImage2Upload) worstZoneImage2Upload.value = '';
          setWorstZoneSaveReady(false);
          setWorstZoneStatus('Saved.', false);
        }).catch(function (err) {
          setWorstZoneStatus(err && err.message ? err.message : 'Save failed', true);
        });
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async function () {
        setStatus('Logging out…', false);
        try {
          localStorage.setItem(AUTH_KEY, 'false');
        } catch (_) {}
        window.location.href = 'index.html';
      });
    }
  }

  boot().catch(function (err) {
    setStatus(err && err.message ? err.message : 'Something went wrong', true);
  });
})();

/* global window, document, localStorage */
(function () {
  'use strict';

  var LOGIN_KEY = 'biAdminLoggedIn';
  var CONTENT_KEY = 'biContent';

  function readContent() {
    try {
      return JSON.parse(localStorage.getItem(CONTENT_KEY)) || {};
    } catch (err) {
      return {};
    }
  }

  function writeContent(content) {
    normalizeContent(content);
    localStorage.setItem(CONTENT_KEY, JSON.stringify(content));
  }

  function normalizeContent(content) {
    if (!content || typeof content !== 'object') return;
    if (Array.isArray(content.suggestionImages)) {
      content.suggestionImages = content.suggestionImages.slice(0, 2);
    }
    if (Array.isArray(content.pdcaImages)) {
      content.pdcaImages = content.pdcaImages.slice(0, 2);
    }
    if (Array.isArray(content.noticeImages)) {
      content.noticeImages = content.noticeImages.slice(0, 6);
    }
    if (Array.isArray(content.safetyPosters)) {
      content.safetyPosters = content.safetyPosters.slice(0, 6);
    }
    if (Array.isArray(content.guestsMulti)) {
      content.guestsMulti = content.guestsMulti.slice(0, 5);
    }
    // Remove legacy safety video blobs stored in localStorage
    if (content.safetyPledgeVideo) delete content.safetyPledgeVideo;
    if (content.safetyAwarenessVideos) delete content.safetyAwarenessVideos;
  }

  function fileToDataUrl(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsDataURL(file);
    });
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

  function storeMediaFile(key, file) {
    return openMediaDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readwrite');
        var store = tx.objectStore('files');
        store.delete(key);
        store.put(file, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function clearMediaDb() {
    return openMediaDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readwrite');
        tx.objectStore('files').clear();
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { reject(tx.error); };
        tx.onabort = function () { reject(tx.error); };
      });
    });
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value + 'T00:00:00');
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function setStatus(el, message, isError) {
    if (!el) return;
    el.textContent = message;
    el.classList.toggle('is-error', Boolean(isError));
  }

  function toggleRequiredSave(saveBtn, isReady) {
    if (!saveBtn) return;
    saveBtn.disabled = !isReady;
    saveBtn.classList.toggle('is-hidden', !isReady);
  }

  function requireFields(inputs) {
    return inputs.every(function (input) {
      if (!input) return false;
      if (input.type === 'file') return input.files && input.files.length > 0;
      return input.value.trim().length > 0;
    });
  }

  function setupLogin() {
    var loginForm = document.getElementById('adminLoginForm');
    if (!loginForm) return;

    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var username = document.getElementById('adminUsername').value.trim();
      var password = document.getElementById('adminPassword').value.trim();
      var errorEl = document.getElementById('adminLoginError');

      if (username === 'admin' && password === 'admin123') {
        localStorage.setItem(LOGIN_KEY, 'true');
        window.location.href = 'admin-dashboard.html';
      } else {
        setStatus(errorEl, 'Invalid credentials.', true);
      }
    });
  }

  function setupDashboard() {
    var logoutBtn = document.getElementById('adminLogout');
    if (!logoutBtn) return;

    if (localStorage.getItem(LOGIN_KEY) !== 'true') {
      window.location.href = 'admin-login.html';
      return;
    }

    logoutBtn.addEventListener('click', function () {
      localStorage.removeItem(LOGIN_KEY);
      window.location.href = 'index.html';
    });

    var clearBtn = document.getElementById('adminClearStorage');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        clearBtn.disabled = true;
        clearBtn.textContent = 'Clearing...';
        clearMediaDb().catch(function () {})
          .then(function () {
            localStorage.removeItem(CONTENT_KEY);
            setStatus(document.getElementById('safetyStatus'), 'Stored files cleared.', false);
            setStatus(document.getElementById('noticeStatus'), '', false);
            setStatus(document.getElementById('suggestionStatus'), '', false);
            setStatus(document.getElementById('guestStatus'), '', false);
            setStatus(document.getElementById('guestsStatus'), '', false);
            setStatus(document.getElementById('employeeStatus'), '', false);
            setStatus(document.getElementById('birthdayStatus'), '', false);
            setStatus(document.getElementById('pdcaStatus'), '', false);
            setStatus(document.getElementById('recognitionStatus'), '', false);
            setStatus(document.getElementById('achievementStatus'), '', false);
          })
          .finally(function () {
            clearBtn.disabled = false;
            clearBtn.textContent = 'Clear Stored Files';
          });
      });
    }

    var content = readContent();

    var guestInputs = [
      document.getElementById('guestName'),
      document.getElementById('guestRole'),
      document.getElementById('guestDateInput'),
      document.getElementById('guestImage')
    ];
    var guestSave = document.getElementById('guestSave');
    var guestStatus = document.getElementById('guestStatus');
    guestInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        toggleRequiredSave(guestSave, requireFields(guestInputs));
      });
      input.addEventListener('change', function () {
        toggleRequiredSave(guestSave, requireFields(guestInputs));
      });
    });
    toggleRequiredSave(guestSave, requireFields(guestInputs));
    guestSave.addEventListener('click', function () {
      var file = guestInputs[3].files[0];
      var companyLogoInput = document.getElementById('guestCompanyLogo');
      var companyLogoFile = companyLogoInput && companyLogoInput.files && companyLogoInput.files[0];

      fileToDataUrl(file).then(function (dataUrl) {
        content.guest = {
          name: guestInputs[0].value.trim(),
          role: guestInputs[1].value.trim(),
          date: formatDate(guestInputs[2].value),
          image: dataUrl
        };
        if (companyLogoFile) {
          return fileToDataUrl(companyLogoFile).then(function (logoUrl) {
            content.companyLogo = logoUrl;
          }).catch(function () { /* keep existing logo on failure */ });
        }
      }).then(function () {
        writeContent(content);
        setStatus(guestStatus, 'Guest page updated.', false);
      }).catch(function () {
        setStatus(guestStatus, 'Failed to read guest image.', true);
      });
    });

    var guestsNameInputs = [
      document.getElementById('guestsName1'),
      document.getElementById('guestsName2'),
      document.getElementById('guestsName3'),
      document.getElementById('guestsName4'),
      document.getElementById('guestsName5')
    ];
    var guestsRoleInputs = [
      document.getElementById('guestsRole1'),
      document.getElementById('guestsRole2'),
      document.getElementById('guestsRole3'),
      document.getElementById('guestsRole4'),
      document.getElementById('guestsRole5')
    ];
    var guestsImageInputs = [
      document.getElementById('guestsImage1'),
      document.getElementById('guestsImage2'),
      document.getElementById('guestsImage3'),
      document.getElementById('guestsImage4'),
      document.getElementById('guestsImage5')
    ];
    var guestsDateInput = document.getElementById('guestsDateInput');
    var guestsSave = document.getElementById('guestsSave');
    var guestsStatus = document.getElementById('guestsStatus');

    function computeGuestRows() {
      var rows = [];
      var hasPartial = false;

      for (var i = 0; i < guestsNameInputs.length; i++) {
        var nameInput = guestsNameInputs[i];
        var roleInput = guestsRoleInputs[i];
        var imageInput = guestsImageInputs[i];

        if (!nameInput || !roleInput || !imageInput) continue;

        var name = nameInput.value.trim();
        var role = roleInput.value.trim();
        var hasFile = imageInput.files && imageInput.files.length > 0;
        var anyFilled = name || role || hasFile;
        var allFilled = name && role && hasFile;

        if (anyFilled && !allFilled) {
          hasPartial = true;
        }

        if (allFilled) {
          rows.push({
            name: name,
            role: role,
            file: imageInput.files[0]
          });
        }
      }

      return { rows: rows, hasPartial: hasPartial };
    }

    function updateGuestsSaveState() {
      if (!guestsSave) return;
      var result = computeGuestRows();
      var rows = result.rows;
      var hasPartial = result.hasPartial;
      var ready = !hasPartial && rows.length >= 2 && rows.length <= 5;

      toggleRequiredSave(guestsSave, ready);

      if (!guestsStatus) return;

      if (hasPartial) {
        setStatus(guestsStatus, 'For each used guest row, fill Name, Role and Image.', true);
      } else if (rows.length > 0 && rows.length < 2) {
        setStatus(guestsStatus, 'Add at least two complete guests.', true);
      } else {
        setStatus(guestsStatus, '', false);
      }
    }

    guestsNameInputs.concat(guestsRoleInputs, guestsImageInputs).forEach(function (input) {
      if (!input) return;
      input.addEventListener('input', updateGuestsSaveState);
      input.addEventListener('change', updateGuestsSaveState);
    });
    updateGuestsSaveState();

    if (guestsSave) {
      guestsSave.addEventListener('click', function () {
        var result = computeGuestRows();
        var rows = result.rows;

        if (result.hasPartial || rows.length < 2) {
          updateGuestsSaveState();
          return;
        }

        var updates = rows.map(function (row) {
          return fileToDataUrl(row.file).then(function (dataUrl) {
            return {
              name: row.name,
              role: row.role,
              image: dataUrl
            };
          });
        });

        Promise.all(updates).then(function (guestsData) {
          content.guestsMulti = guestsData;
          var guestsCompanyLogoInput = document.getElementById('guestsCompanyLogo');
          var guestsLogoFile = guestsCompanyLogoInput && guestsCompanyLogoInput.files && guestsCompanyLogoInput.files[0];
          if (guestsLogoFile) {
            return fileToDataUrl(guestsLogoFile).then(function (logoUrl) {
              content.guestsCompanyLogo = logoUrl;
            }).catch(function () { /* keep existing */ });
          }
        }).then(function () {
          writeContent(content);
          setStatus(guestsStatus, 'Guests updated.', false);
        }).catch(function () {
          setStatus(guestsStatus, 'Failed to read one or more guest images.', true);
        });
      });
    }

    var noticeInputs = [
      document.getElementById('noticeImg1'),
      document.getElementById('noticeImg2'),
      document.getElementById('noticeImg3'),
      document.getElementById('noticeImg4'),
      document.getElementById('noticeImg5'),
      document.getElementById('noticeImg6')
    ];
    var noticeSave = document.getElementById('noticeSave');
    var noticeStatus = document.getElementById('noticeStatus');

    function anyNoticeSelected() {
      return noticeInputs.some(function (input) {
        return input && input.files && input.files.length > 0;
      });
    }

    noticeInputs.forEach(function (input) {
      input.addEventListener('change', function () {
        toggleRequiredSave(noticeSave, anyNoticeSelected());
      });
    });
    toggleRequiredSave(noticeSave, anyNoticeSelected());
    noticeSave.addEventListener('click', function () {
      if (!anyNoticeSelected()) {
        setStatus(noticeStatus, 'Select at least one notice image to update.', true);
        return;
      }
      if (!content.noticeImages) content.noticeImages = [];
      var updates = [];
      noticeInputs.forEach(function (input, index) {
        var file = input.files[0];
        if (file) {
          updates.push(fileToDataUrl(file).then(function (url) {
            content.noticeImages[index] = url;
          }));
        }
      });
      Promise.all(updates).then(function () {
        writeContent(content);
        setStatus(noticeStatus, 'Notice images updated.', false);
      }).catch(function () {
        setStatus(noticeStatus, 'Failed to read notice images.', true);
      });
    });

    var suggestionSave = document.getElementById('suggestionSave');
    var suggestionStatus = document.getElementById('suggestionStatus');
    suggestionSave.addEventListener('click', function () {
      var updates = [];
      var img1 = document.getElementById('suggestionImg1').files[0];
      if (!img1) {
        setStatus(suggestionStatus, 'Select an image to update.', true);
        return;
      }
      if (!content.suggestionImages) content.suggestionImages = [];
      updates.push(fileToDataUrl(img1).then(function (url) { content.suggestionImages[0] = url; }));
      Promise.all(updates).then(function () {
        writeContent(content);
        setStatus(suggestionStatus, 'Suggestion images updated.', false);
      }).catch(function () {
        setStatus(suggestionStatus, 'Failed to read suggestion images.', true);
      });
    });

    var suggestStatsSave = document.getElementById('suggestStatsSave');
    var suggestStatsReset = document.getElementById('suggestStatsReset');
    var suggestStatsStatus = document.getElementById('suggestStatsStatus');
    if (suggestStatsSave) {
      (function initSuggestionStatsForm() {
        var existing = content.suggestionStats || null;
        if (!existing) return;

        var chartTitleInput = document.getElementById('suggestChartTitle');
        var yAxisLabelInput = document.getElementById('suggestYAxisLabel');
        var prevLabelInput = document.getElementById('suggestPrevLabel');
        var prevTotalInput = document.getElementById('suggestPrevTotal');

        if (chartTitleInput && typeof existing.chartTitle === 'string') {
          chartTitleInput.value = existing.chartTitle;
        }
        if (yAxisLabelInput && typeof existing.yAxisLabel === 'string') {
          yAxisLabelInput.value = existing.yAxisLabel;
        }

        if (existing.previousYear) {
          if (prevLabelInput) prevLabelInput.value = existing.previousYear.label || '';
          if (prevTotalInput && typeof existing.previousYear.total !== 'undefined') {
            prevTotalInput.value = existing.previousYear.total;
          }
        }
        if (existing.months && existing.months.length === 12) {
          var monthIds = [
            'suggestApr',
            'suggestMay',
            'suggestJun',
            'suggestJul',
            'suggestAug',
            'suggestSep',
            'suggestOct',
            'suggestNov',
            'suggestDec',
            'suggestJan',
            'suggestFeb',
            'suggestMar'
          ];
          monthIds.forEach(function (id, index) {
            var input = document.getElementById(id);
            if (!input) return;
            var m = existing.months[index];
            if (!m) return;
            if (typeof m.value !== 'undefined') {
              input.value = m.value;
            }
          });
        }
      })();

      suggestStatsSave.addEventListener('click', function () {
        var existingStats = content.suggestionStats || {};
        var hasExisting = Boolean(existingStats && Object.keys(existingStats).length);

        var chartTitleInput = document.getElementById('suggestChartTitle');
        var yAxisLabelInput = document.getElementById('suggestYAxisLabel');
        var prevLabelInput = document.getElementById('suggestPrevLabel');
        var prevTotalInput = document.getElementById('suggestPrevTotal');

        var chartTitleRaw = chartTitleInput ? chartTitleInput.value.trim() : '';
        var yAxisLabelRaw = yAxisLabelInput ? yAxisLabelInput.value.trim() : '';
        var prevLabelRaw = prevLabelInput ? prevLabelInput.value.trim() : '';
        var prevTotalRaw = prevTotalInput ? prevTotalInput.value : '';

        function toNumberOrNull(raw) {
          var n = Number(raw);
          return Number.isFinite(n) && n >= 0 ? n : null;
        }

        var prevTotalNew = toNumberOrNull(prevTotalRaw);

        var monthConfig = [
          { id: 'suggestApr', label: 'Apr' },
          { id: 'suggestMay', label: 'May' },
          { id: 'suggestJun', label: 'Jun' },
          { id: 'suggestJul', label: 'Jul' },
          { id: 'suggestAug', label: 'Aug' },
          { id: 'suggestSep', label: 'Sep' },
          { id: 'suggestOct', label: 'Oct' },
          { id: 'suggestNov', label: 'Nov' },
          { id: 'suggestDec', label: 'Dec' },
          { id: 'suggestJan', label: 'Jan' },
          { id: 'suggestFeb', label: 'Feb' },
          { id: 'suggestMar', label: 'Mar' }
        ];

        var existingMonths = Array.isArray(existingStats.months) ? existingStats.months.slice(0, 12) : [];

        var months = monthConfig.map(function (cfg, index) {
          var input = document.getElementById(cfg.id);
          var raw = input ? input.value : '';
          var n = toNumberOrNull(raw);
          var existingMonth = existingMonths[index] || {};
          var existingValue = typeof existingMonth.value === 'number' ? existingMonth.value : 0;
          return {
            label: cfg.label,
            value: n !== null ? n : existingValue
          };
        });

        var prevLabel = prevLabelRaw || (existingStats.previousYear && existingStats.previousYear.label) || '';
        var prevTotal = prevTotalNew !== null
          ? prevTotalNew
          : (existingStats.previousYear && typeof existingStats.previousYear.total === 'number'
            ? existingStats.previousYear.total
            : 0);

        var anyNewInput = monthConfig.some(function (cfg) {
          var el = document.getElementById(cfg.id);
          return el && el.value;
        }) || prevLabelRaw || prevTotalRaw || chartTitleRaw || yAxisLabelRaw;

        if (!anyNewInput && !hasExisting) {
          setStatus(suggestStatsStatus, 'Enter at least one value before saving.', true);
          return;
        }

        content.suggestionStats = {
          chartTitle: chartTitleRaw || existingStats.chartTitle || '',
          yAxisLabel: yAxisLabelRaw || existingStats.yAxisLabel || '',
          previousYear: {
            label: prevLabel,
            total: prevTotal,
            seriesLabel: 'Previous Total'
          },
          currentSeriesLabel: 'Current Monthly',
          months: months
        };

        writeContent(content);
        setStatus(suggestStatsStatus, 'Suggestion statistics updated.', false);
      });

      if (suggestStatsReset) {
        suggestStatsReset.addEventListener('click', function () {
          delete content.suggestionStats;
          writeContent(content);

          var idsToClear = [
            'suggestPrevLabel',
            'suggestPrevTotal',
            'suggestApr',
            'suggestMay',
            'suggestJun',
            'suggestJul',
            'suggestAug',
            'suggestSep',
            'suggestOct',
            'suggestNov',
            'suggestDec',
            'suggestJan',
            'suggestFeb',
            'suggestMar'
          ];
          idsToClear.forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.value = '';
          });

          setStatus(suggestStatsStatus, 'Suggestion statistics reset. Enter new values to start a fresh graph.', false);
        });
      }
    }

    var employeeInputs = [
      document.getElementById('employeeName'),
      document.getElementById('employeeId'),
      document.getElementById('employeePhoto')
    ];
    var employeeSave = document.getElementById('employeeSave');
    var employeeStatus = document.getElementById('employeeStatus');
    employeeInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        toggleRequiredSave(employeeSave, requireFields(employeeInputs));
      });
      input.addEventListener('change', function () {
        toggleRequiredSave(employeeSave, requireFields(employeeInputs));
      });
    });
    toggleRequiredSave(employeeSave, requireFields(employeeInputs));
    employeeSave.addEventListener('click', function () {
      var photo = employeeInputs[2].files[0];
      fileToDataUrl(photo).then(function (dataUrl) {
        content.employeeOfMonth = {
          name: employeeInputs[0].value.trim(),
          id: employeeInputs[1].value.trim(),
          photo: dataUrl
        };
        writeContent(content);
        setStatus(employeeStatus, 'Employee of the month updated.', false);
      }).catch(function () {
        setStatus(employeeStatus, 'Failed to read employee photo.', true);
      });
    });

    var birthdayInputs = [
      document.getElementById('birthdayName'),
      document.getElementById('birthdayId'),
      document.getElementById('birthdayPhoto')
    ];
    var birthdaySave = document.getElementById('birthdaySave');
    var birthdayStatus = document.getElementById('birthdayStatus');
    birthdayInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        toggleRequiredSave(birthdaySave, requireFields(birthdayInputs));
      });
      input.addEventListener('change', function () {
        toggleRequiredSave(birthdaySave, requireFields(birthdayInputs));
      });
    });
    toggleRequiredSave(birthdaySave, requireFields(birthdayInputs));
    birthdaySave.addEventListener('click', function () {
      var photo = birthdayInputs[2].files[0];
      fileToDataUrl(photo).then(function (dataUrl) {
        content.birthday = {
          name: birthdayInputs[0].value.trim(),
          id: birthdayInputs[1].value.trim(),
          photo: dataUrl
        };
        writeContent(content);
        setStatus(birthdayStatus, 'Birthday updated.', false);
      }).catch(function () {
        setStatus(birthdayStatus, 'Failed to read birthday photo.', true);
      });
    });

    var pdcaSave = document.getElementById('pdcaSave');
    var pdcaStatus = document.getElementById('pdcaStatus');
    pdcaSave.addEventListener('click', function () {
      var img1 = document.getElementById('pdcaImg1').files[0];
      var img2 = document.getElementById('pdcaImg2').files[0];
      if (!img1 && !img2) {
        setStatus(pdcaStatus, 'Select at least one image to update.', true);
        return;
      }
      if (!content.pdcaImages) content.pdcaImages = [];
      var updates = [];
      if (img1) updates.push(fileToDataUrl(img1).then(function (url) { content.pdcaImages[0] = url; }));
      if (img2) updates.push(fileToDataUrl(img2).then(function (url) { content.pdcaImages[1] = url; }));
      Promise.all(updates).then(function () {
        writeContent(content);
        setStatus(pdcaStatus, 'PDCA images updated.', false);
      }).catch(function () {
        setStatus(pdcaStatus, 'Failed to read PDCA images.', true);
      });
    });

    var recognitionInputs = [
      document.getElementById('recognitionName'),
      document.getElementById('recognitionId'),
      document.getElementById('recognitionDate'),
      document.getElementById('recognitionLine'),
      document.getElementById('recognitionDefect'),
      document.getElementById('recognitionBenefit'),
      document.getElementById('recognitionPhoto')
    ];
    var recognitionSave = document.getElementById('recognitionSave');
    var recognitionStatus = document.getElementById('recognitionStatus');
    recognitionInputs.forEach(function (input) {
      input.addEventListener('input', function () {
        toggleRequiredSave(recognitionSave, requireFields(recognitionInputs));
      });
      input.addEventListener('change', function () {
        toggleRequiredSave(recognitionSave, requireFields(recognitionInputs));
      });
    });
    toggleRequiredSave(recognitionSave, requireFields(recognitionInputs));
    recognitionSave.addEventListener('click', function () {
      var photo = recognitionInputs[6].files[0];
      fileToDataUrl(photo).then(function (dataUrl) {
        content.recognition = {
          name: recognitionInputs[0].value.trim(),
          id: recognitionInputs[1].value.trim(),
          date: formatDate(recognitionInputs[2].value),
          line: recognitionInputs[3].value.trim(),
          defect: recognitionInputs[4].value.trim(),
          benefit: recognitionInputs[5].value.trim(),
          photo: dataUrl
        };
        writeContent(content);
        setStatus(recognitionStatus, 'Recognition updated.', false);
      }).catch(function () {
        setStatus(recognitionStatus, 'Failed to read recognition photo.', true);
      });
    });

    var achievementSave = document.getElementById('achievementSave');
    var achievementStatus = document.getElementById('achievementStatus');
    achievementSave.addEventListener('click', function () {
      var file = document.getElementById('achievementImg').files[0];
      if (!file) {
        setStatus(achievementStatus, 'Select an image to update.', true);
        return;
      }
      fileToDataUrl(file).then(function (dataUrl) {
        content.achievementImage = dataUrl;
        writeContent(content);
        setStatus(achievementStatus, 'Achievement updated.', false);
      }).catch(function () {
        setStatus(achievementStatus, 'Failed to read achievement image.', true);
      });
    });

    var safetySave = document.getElementById('safetySave');
    var safetyStatus = document.getElementById('safetyStatus');
    safetySave.addEventListener('click', function () {
      var updates = [];
      if (!content.safetyPosters) content.safetyPosters = [];
      var posterInputs = [
        document.getElementById('safetyPoster1'),
        document.getElementById('safetyPoster2'),
        document.getElementById('safetyPoster3'),
        document.getElementById('safetyPoster4'),
        document.getElementById('safetyPoster5'),
        document.getElementById('safetyPoster6')
      ];
      posterInputs.forEach(function (input, index) {
        var file = input.files[0];
        if (file) {
          updates.push({
            label: 'Poster ' + (index + 1),
            promise: fileToDataUrl(file).then(function (url) { content.safetyPosters[index] = url; })
          });
        }
      });
      var pledgeVideo = document.getElementById('safetyPledgeVideo').files[0];
      if (pledgeVideo) {
        updates.push({
          label: 'Pledge Video',
          promise: storeMediaFile('safetyPledgeVideo', pledgeVideo)
        });
        content.safetyPledgeVideoStored = true;
      }
      var awareness1 = document.getElementById('safetyAwarenessVideo1').files[0];
      if (awareness1) {
        updates.push({
          label: 'Awareness Video 1',
          promise: storeMediaFile('safetyAwarenessVideo1', awareness1)
        });
        content.safetyAwarenessVideo1Stored = true;
      }
      var awareness2 = document.getElementById('safetyAwarenessVideo2').files[0];
      if (awareness2) {
        updates.push({
          label: 'Awareness Video 2',
          promise: storeMediaFile('safetyAwarenessVideo2', awareness2)
        });
        content.safetyAwarenessVideo2Stored = true;
      }

      if (!updates.length) {
        setStatus(safetyStatus, 'Select at least one poster or video to update.', true);
        return;
      }

      Promise.allSettled(updates.map(function (item) { return item.promise; }))
        .then(function (results) {
          var failed = [];
          results.forEach(function (result, index) {
            if (result.status === 'rejected') failed.push(updates[index].label);
          });

          if (results.every(function (result) { return result.status === 'rejected'; })) {
            setStatus(safetyStatus, 'Failed to read safety files.', true);
            return;
          }

          try {
            writeContent(content);
            if (failed.length) {
              setStatus(safetyStatus, 'Updated with errors: ' + failed.join(', ') + '.', true);
            } else {
              setStatus(safetyStatus, 'Safety content updated.', false);
            }
          } catch (err) {
            setStatus(safetyStatus, 'Storage full. Try smaller files (especially videos).', true);
          }
        });
    });
  }

  setupLogin();
  setupDashboard();
})();
