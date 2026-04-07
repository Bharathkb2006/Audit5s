(function () {
  'use strict';

  var menuToggle = document.getElementById('menuToggle');
  var sideMenu = document.getElementById('sideMenu');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuLinks = document.querySelectorAll('.menu-link');
  var menuParentToggles = document.querySelectorAll('.menu-parent-toggle');
  var logoImage = document.getElementById('logoImage');
  var homeTitle = document.getElementById('homeTitle');
  var homeDescription = document.getElementById('homeDescription');
  var homeVideoSource = document.getElementById('homeVideoSource');
  var organogramImage = document.getElementById('organogramImage');
  var barcuttingLayoutImage = document.getElementById('barcuttingLayoutImage');
  var groundFloorLayoutImage = document.getElementById('groundFloorLayoutImage');
  var firstFloorLayoutImage = document.getElementById('firstFloorLayoutImage');
  var secondFloorLayoutImage = document.getElementById('secondFloorLayoutImage');
  var about5sVideoSource = document.getElementById('about5sVideoSource');
  var s1VideoSource = document.getElementById('s1VideoSource');
  var s2VideoSource = document.getElementById('s2VideoSource');
  var s3VideoSource = document.getElementById('s3VideoSource');
  var s4VideoSource = document.getElementById('s4VideoSource');
  var s5VideoSource = document.getElementById('s5VideoSource');

  var about5sVideo = document.getElementById('about5sVideo');
  var about5sVideoFallback = document.getElementById('about5sVideoFallback');
  var s1Video = document.getElementById('s1Video');
  var s1VideoFallback = document.getElementById('s1VideoFallbackVideo');
  var s2Video = document.getElementById('s2Video');
  var s2VideoFallback = document.getElementById('s2VideoFallbackVideo');
  var s3Video = document.getElementById('s3Video');
  var s3VideoFallback = document.getElementById('s3VideoFallbackVideo');
  var s4Video = document.getElementById('s4Video');
  var s4VideoFallback = document.getElementById('s4VideoFallbackVideo');
  var s5Video = document.getElementById('s5Video');
  var s5VideoFallback = document.getElementById('s5VideoFallbackVideo');

  var s1Image = document.getElementById('s1Image');
  var s1ImageFallback = document.getElementById('s1ImageFallback');
  var s2Image = document.getElementById('s2Image');
  var s2ImageFallback = document.getElementById('s2ImageFallback');
  var s3Image = document.getElementById('s3Image');
  var s3ImageFallback = document.getElementById('s3ImageFallback');
  var s4Image = document.getElementById('s4Image');
  var s4ImageFallback = document.getElementById('s4ImageFallback');
  var s5Image = document.getElementById('s5Image');
  var s5ImageFallback = document.getElementById('s5ImageFallback');

  var isSummaryPage = typeof window !== 'undefined' && /summary\.html$/i.test(window.location.pathname);
  var isBestZonePage = typeof window !== 'undefined' && /bestzone\.html$/i.test(window.location.pathname);
  var isWorstZonePage = typeof window !== 'undefined' && /worstzone\.html$/i.test(window.location.pathname);
  var isSummaryLikeCarouselPage = isSummaryPage || isBestZonePage || isWorstZonePage;
  var summaryCarouselInitialized = false;
  var summaryCarouselImages = [];
  var summaryCarouselIndex = 0;

  var STORAGE_KEY = 'bi_content_v1';
  var MENU_OPEN_KEY = 'bi_menu_open_v1';
  var objectUrls = {};

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

  function getMediaFile(key) {
    return openMediaDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('files', 'readonly');
        var store = tx.objectStore('files');
        var req = store.get(key);
        req.onsuccess = function () { resolve(req.result || null); };
        req.onerror = function () { reject(req.error); };
      });
    }).catch(function () { return null; });
  }

  function setObjectUrlFor(key, blob) {
    try {
      if (objectUrls[key]) {
        URL.revokeObjectURL(objectUrls[key]);
      }
      objectUrls[key] = URL.createObjectURL(blob);
      return objectUrls[key];
    } catch (_) {
      return '';
    }
  }

  function openMenu() {
    sideMenu.classList.add('is-open');
    sideMenu.setAttribute('aria-hidden', 'false');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    try { window.sessionStorage.setItem(MENU_OPEN_KEY, '1'); } catch (_) {}
  }

  function collapseAllSubmenus() {
    sideMenu.querySelectorAll('.menu-parent').forEach(function (parent) {
      parent.classList.remove('is-open');
      var sub = parent.querySelector('.submenu');
      if (sub) sub.setAttribute('hidden', 'hidden');
      var btn = parent.querySelector('.menu-parent-toggle');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  function closeMenu() {
    sideMenu.classList.remove('is-open');
    sideMenu.setAttribute('aria-hidden', 'true');
    if (menuToggle) menuToggle.setAttribute('aria-expanded', 'false');
    collapseAllSubmenus();
    document.body.style.overflow = '';
    try { window.sessionStorage.removeItem(MENU_OPEN_KEY); } catch (_) {}
  }

  function toggleMenu() {
    if (sideMenu.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (menuToggle) {
    menuToggle.addEventListener('click', toggleMenu);
  }

  if (menuOverlay) {
    menuOverlay.addEventListener('click', closeMenu);
  }

  menuLinks.forEach(function (link) {
    if (link.classList.contains('menu-parent-toggle')) {
      return;
    }
    link.addEventListener('click', function () {
      closeMenu();
    });
  });

  menuParentToggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      var parent = toggle.closest('.menu-parent');
      if (!parent) return;
      var submenu = parent.querySelector('.submenu');
      var isOpen = parent.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (submenu) {
        if (isOpen) {
          submenu.removeAttribute('hidden');
          /* Scroll opened submenu into view so full menu is visible */
          parent.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          submenu.setAttribute('hidden', 'hidden');
        }
      }
    });
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && sideMenu.classList.contains('is-open')) {
      closeMenu();
    }
  });

  // If user navigated while the menu was open, keep it open on the next page.
  // This matches the expected "menu shouldn't disappear on back" behavior.
  try {
    if (window.sessionStorage && window.sessionStorage.getItem(MENU_OPEN_KEY) === '1' && menuToggle && sideMenu) {
      openMenu();
    }
  } catch (_) {}

  // Video fallback: if no video or error, show gradient background
  var bgVideo = document.getElementById('bgVideo');
  if (bgVideo) {
    bgVideo.addEventListener('error', function () {
      var backdrop = bgVideo.closest('.video-backdrop');
      if (backdrop) {
        backdrop.classList.add('video-fallback');
      }
    });
  }

  function getDefaultContentFromPage() {
    return {
      home: {
        title: homeTitle ? homeTitle.textContent : '',
        description: homeDescription ? homeDescription.textContent : ''
      },
      assets: {
        logoImage: logoImage ? logoImage.getAttribute('src') : '',
        homeVideo: homeVideoSource ? homeVideoSource.getAttribute('src') : '',
        organogramImage: organogramImage ? organogramImage.getAttribute('src') : '',
        barcuttingLayoutImage: barcuttingLayoutImage ? barcuttingLayoutImage.getAttribute('src') : '',
        groundFloorLayoutImage: groundFloorLayoutImage ? groundFloorLayoutImage.getAttribute('src') : '',
        firstFloorLayoutImage: firstFloorLayoutImage ? firstFloorLayoutImage.getAttribute('src') : '',
        secondFloorLayoutImage: secondFloorLayoutImage ? secondFloorLayoutImage.getAttribute('src') : '',
        about5sVideo: about5sVideoSource ? about5sVideoSource.getAttribute('src') : '',
        s1Video: s1VideoSource ? s1VideoSource.getAttribute('src') : '',
        s2Video: s2VideoSource ? s2VideoSource.getAttribute('src') : '',
        s3Video: s3VideoSource ? s3VideoSource.getAttribute('src') : '',
        s4Video: s4VideoSource ? s4VideoSource.getAttribute('src') : '',
        s5Video: s5VideoSource ? s5VideoSource.getAttribute('src') : '',
        s1Image: s1Image ? s1Image.getAttribute('src') : '',
        s2Image: s2Image ? s2Image.getAttribute('src') : '',
        s3Image: s3Image ? s3Image.getAttribute('src') : '',
        s4Image: s4Image ? s4Image.getAttribute('src') : '',
        s5Image: s5Image ? s5Image.getAttribute('src') : ''
      }
    };
  }

  function updateVideoVisibility(videoEl, fallbackEl, src) {
    if (!videoEl || !fallbackEl) return;
    var hasSrc = Boolean(src && String(src).trim());
    fallbackEl.style.display = hasSrc ? 'none' : 'grid';
    videoEl.style.display = hasSrc ? 'block' : 'none';
  }

  function updateImageVisibility(imgEl, fallbackEl, src) {
    if (!imgEl || !fallbackEl) return;
    var hasSrc = Boolean(src && String(src).trim());
    imgEl.style.display = hasSrc ? 'block' : 'none';
    fallbackEl.style.display = hasSrc ? 'none' : 'grid';
  }

  function loadContentFromStorage() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) {
      return null;
    }
  }

  function applyContent(content) {
    if (!content || typeof content !== 'object') return;

    if (content.home) {
      if (homeTitle && typeof content.home.title === 'string') homeTitle.textContent = content.home.title;
      if (homeDescription && typeof content.home.description === 'string') homeDescription.textContent = content.home.description;
    }

    if (content.assets) {
      if (logoImage && typeof content.assets.logoImage === 'string' && content.assets.logoImage) {
        logoImage.src = content.assets.logoImage;
      }
      if (homeVideoSource && typeof content.assets.homeVideo === 'string' && content.assets.homeVideo) {
        var nextSrc = content.assets.homeVideo;
        if (homeVideoSource.getAttribute('src') !== nextSrc) {
          homeVideoSource.src = nextSrc;
          if (bgVideo && typeof bgVideo.load === 'function') bgVideo.load();
        }
      }
      if (organogramImage && typeof content.assets.organogramImage === 'string' && content.assets.organogramImage) {
        // Legacy inline URL/path support
        organogramImage.src = content.assets.organogramImage;
      }
      if (content.assets.organogramImageStored) {
        getMediaFile('organogramImage').then(function (file) {
          if (!file || !organogramImage) return;
          var url = setObjectUrlFor('organogramImage', file);
          if (!url) return;
          organogramImage.src = url;
        });
      }

      if (barcuttingLayoutImage && typeof content.assets.barcuttingLayoutImage === 'string' && content.assets.barcuttingLayoutImage) {
        // Legacy inline URL/path support
        barcuttingLayoutImage.src = content.assets.barcuttingLayoutImage;
      }
      if (content.assets.barcuttingLayoutStored) {
        getMediaFile('barcuttingLayout').then(function (file) {
          if (!file || !barcuttingLayoutImage) return;
          var url = setObjectUrlFor('barcuttingLayout', file);
          if (!url) return;
          barcuttingLayoutImage.src = url;
        });
      }

      if (groundFloorLayoutImage && typeof content.assets.groundFloorLayoutImage === 'string' && content.assets.groundFloorLayoutImage) {
        groundFloorLayoutImage.src = content.assets.groundFloorLayoutImage;
      }
      if (content.assets.groundFloorLayoutStored) {
        getMediaFile('groundFloorLayout').then(function (file) {
          if (!file || !groundFloorLayoutImage) return;
          var url = setObjectUrlFor('groundFloorLayout', file);
          if (!url) return;
          groundFloorLayoutImage.src = url;
        });
      }

      if (firstFloorLayoutImage && typeof content.assets.firstFloorLayoutImage === 'string' && content.assets.firstFloorLayoutImage) {
        firstFloorLayoutImage.src = content.assets.firstFloorLayoutImage;
      }
      if (content.assets.firstFloorLayoutStored) {
        getMediaFile('firstFloorLayout').then(function (file) {
          if (!file || !firstFloorLayoutImage) return;
          var url = setObjectUrlFor('firstFloorLayout', file);
          if (!url) return;
          firstFloorLayoutImage.src = url;
        });
      }

      if (secondFloorLayoutImage && typeof content.assets.secondFloorLayoutImage === 'string' && content.assets.secondFloorLayoutImage) {
        secondFloorLayoutImage.src = content.assets.secondFloorLayoutImage;
      }
      if (content.assets.secondFloorLayoutStored) {
        getMediaFile('secondFloorLayout').then(function (file) {
          if (!file || !secondFloorLayoutImage) return;
          var url = setObjectUrlFor('secondFloorLayout', file);
          if (!url) return;
          secondFloorLayoutImage.src = url;
        });
      }

      if (about5sVideoSource && typeof content.assets.about5sVideo === 'string') {
        about5sVideoSource.src = content.assets.about5sVideo || '';
        if (about5sVideo && typeof about5sVideo.load === 'function') about5sVideo.load();
        updateVideoVisibility(about5sVideo, about5sVideoFallback, content.assets.about5sVideo);
      }
      if (about5sVideoSource && content.assets.about5sVideoStored) {
        getMediaFile('about5sVideo').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('about5sVideo', file);
          if (!url) return;
          about5sVideoSource.src = url;
          if (about5sVideo && typeof about5sVideo.load === 'function') about5sVideo.load();
          updateVideoVisibility(about5sVideo, about5sVideoFallback, url);
        });
      }

      if (s1VideoSource && typeof content.assets.s1Video === 'string') {
        s1VideoSource.src = content.assets.s1Video || '';
        if (s1Video && typeof s1Video.load === 'function') s1Video.load();
        updateVideoVisibility(s1Video, s1VideoFallback, content.assets.s1Video);
      }
      if (s1VideoSource && content.assets.s1VideoStored) {
        getMediaFile('s1Video').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s1Video', file);
          if (!url) return;
          s1VideoSource.src = url;
          if (s1Video && typeof s1Video.load === 'function') s1Video.load();
          updateVideoVisibility(s1Video, s1VideoFallback, url);
        });
      }
      if (s2VideoSource && typeof content.assets.s2Video === 'string') {
        s2VideoSource.src = content.assets.s2Video || '';
        if (s2Video && typeof s2Video.load === 'function') s2Video.load();
        updateVideoVisibility(s2Video, s2VideoFallback, content.assets.s2Video);
      }
      if (s2VideoSource && content.assets.s2VideoStored) {
        getMediaFile('s2Video').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s2Video', file);
          if (!url) return;
          s2VideoSource.src = url;
          if (s2Video && typeof s2Video.load === 'function') s2Video.load();
          updateVideoVisibility(s2Video, s2VideoFallback, url);
        });
      }
      if (s3VideoSource && typeof content.assets.s3Video === 'string') {
        s3VideoSource.src = content.assets.s3Video || '';
        if (s3Video && typeof s3Video.load === 'function') s3Video.load();
        updateVideoVisibility(s3Video, s3VideoFallback, content.assets.s3Video);
      }
      if (s3VideoSource && content.assets.s3VideoStored) {
        getMediaFile('s3Video').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s3Video', file);
          if (!url) return;
          s3VideoSource.src = url;
          if (s3Video && typeof s3Video.load === 'function') s3Video.load();
          updateVideoVisibility(s3Video, s3VideoFallback, url);
        });
      }
      if (s4VideoSource && typeof content.assets.s4Video === 'string') {
        s4VideoSource.src = content.assets.s4Video || '';
        if (s4Video && typeof s4Video.load === 'function') s4Video.load();
        updateVideoVisibility(s4Video, s4VideoFallback, content.assets.s4Video);
      }
      if (s4VideoSource && content.assets.s4VideoStored) {
        getMediaFile('s4Video').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s4Video', file);
          if (!url) return;
          s4VideoSource.src = url;
          if (s4Video && typeof s4Video.load === 'function') s4Video.load();
          updateVideoVisibility(s4Video, s4VideoFallback, url);
        });
      }
      if (s5VideoSource && typeof content.assets.s5Video === 'string') {
        s5VideoSource.src = content.assets.s5Video || '';
        if (s5Video && typeof s5Video.load === 'function') s5Video.load();
        updateVideoVisibility(s5Video, s5VideoFallback, content.assets.s5Video);
      }
      if (s5VideoSource && content.assets.s5VideoStored) {
        getMediaFile('s5Video').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s5Video', file);
          if (!url) return;
          s5VideoSource.src = url;
          if (s5Video && typeof s5Video.load === 'function') s5Video.load();
          updateVideoVisibility(s5Video, s5VideoFallback, url);
        });
      }

      if (s1Image && typeof content.assets.s1Image === 'string') {
        s1Image.src = content.assets.s1Image || '';
        updateImageVisibility(s1Image, s1ImageFallback, content.assets.s1Image);
      }
      if (s1Image && content.assets.s1ImageStored) {
        getMediaFile('s1Image').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s1Image', file);
          if (!url) return;
          s1Image.src = url;
          updateImageVisibility(s1Image, s1ImageFallback, url);
        });
      }
      if (s2Image && typeof content.assets.s2Image === 'string') {
        s2Image.src = content.assets.s2Image || '';
        updateImageVisibility(s2Image, s2ImageFallback, content.assets.s2Image);
      }
      if (s2Image && content.assets.s2ImageStored) {
        getMediaFile('s2Image').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s2Image', file);
          if (!url) return;
          s2Image.src = url;
          updateImageVisibility(s2Image, s2ImageFallback, url);
        });
      }
      if (s3Image && typeof content.assets.s3Image === 'string') {
        s3Image.src = content.assets.s3Image || '';
        updateImageVisibility(s3Image, s3ImageFallback, content.assets.s3Image);
      }
      if (s3Image && content.assets.s3ImageStored) {
        getMediaFile('s3Image').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s3Image', file);
          if (!url) return;
          s3Image.src = url;
          updateImageVisibility(s3Image, s3ImageFallback, url);
        });
      }
      if (s4Image && typeof content.assets.s4Image === 'string') {
        s4Image.src = content.assets.s4Image || '';
        updateImageVisibility(s4Image, s4ImageFallback, content.assets.s4Image);
      }
      if (s4Image && content.assets.s4ImageStored) {
        getMediaFile('s4Image').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s4Image', file);
          if (!url) return;
          s4Image.src = url;
          updateImageVisibility(s4Image, s4ImageFallback, url);
        });
      }
      if (s5Image && typeof content.assets.s5Image === 'string') {
        s5Image.src = content.assets.s5Image || '';
        updateImageVisibility(s5Image, s5ImageFallback, content.assets.s5Image);
      }
      if (s5Image && content.assets.s5ImageStored) {
        getMediaFile('s5Image').then(function (file) {
          if (!file) return;
          var url = setObjectUrlFor('s5Image', file);
          if (!url) return;
          s5Image.src = url;
          updateImageVisibility(s5Image, s5ImageFallback, url);
        });
      }
    }

    if (isSummaryLikeCarouselPage) {
      initSummaryCarousel(content && content.assets ? content.assets : {});
    }
  }

  function loadSummaryCarouselImages(assets) {
    var config = isBestZonePage
      ? [
        { legacyKey: 'bestZoneImage1', storedFlag: 'bestZoneImage1Stored', storeKey: 'bestZoneImage1' },
        { legacyKey: 'bestZoneImage2', storedFlag: 'bestZoneImage2Stored', storeKey: 'bestZoneImage2' }
      ]
      : (isWorstZonePage
        ? [
          { legacyKey: 'worstZoneImage1', storedFlag: 'worstZoneImage1Stored', storeKey: 'worstZoneImage1' },
          { legacyKey: 'worstZoneImage2', storedFlag: 'worstZoneImage2Stored', storeKey: 'worstZoneImage2' }
        ]
        : [
          { legacyKey: 'summaryImage1', storedFlag: 'summaryImage1Stored', storeKey: 'summaryImage1' },
          { legacyKey: 'summaryImage2', storedFlag: 'summaryImage2Stored', storeKey: 'summaryImage2' },
          { legacyKey: 'summaryImage3', storedFlag: 'summaryImage3Stored', storeKey: 'summaryImage3' }
        ]);

    var promises = config.map(function (item) {
      var inlineSrc = assets && typeof assets[item.legacyKey] === 'string' && assets[item.legacyKey].trim()
        ? assets[item.legacyKey].trim()
        : '';

      if (inlineSrc) {
        return Promise.resolve(inlineSrc);
      }

      if (assets && assets[item.storedFlag]) {
        return getMediaFile(item.storeKey).then(function (file) {
          if (!file) return '';
          var url = setObjectUrlFor(item.storeKey, file);
          return url || '';
        }).catch(function () {
          return '';
        });
      }

      return Promise.resolve('');
    });

    return Promise.all(promises).then(function (urls) {
      var filtered = urls.filter(function (u) { return Boolean(u); });
      if (!filtered.length && barcuttingLayoutImage && barcuttingLayoutImage.src) {
        filtered.push(barcuttingLayoutImage.src);
      }
      return filtered;
    });
  }

  function initSummaryCarousel(assets) {
    if (!barcuttingLayoutImage) return;

    loadSummaryCarouselImages(assets || {}).then(function (images) {
      if (!images || !images.length) return;

      var maxSlides = (isBestZonePage || isWorstZonePage) ? 2 : 3;
      summaryCarouselImages = images.slice(0, maxSlides);
      summaryCarouselIndex = 0;
      barcuttingLayoutImage.src = summaryCarouselImages[0];

      if (summaryCarouselInitialized) {
        return;
      }
      summaryCarouselInitialized = true;

      function showImageAt(index) {
        if (!summaryCarouselImages.length) return;
        var safeIndex = ((index % summaryCarouselImages.length) + summaryCarouselImages.length) % summaryCarouselImages.length;
        summaryCarouselIndex = safeIndex;
        barcuttingLayoutImage.src = summaryCarouselImages[safeIndex];
      }

      function showNext() {
        showImageAt(summaryCarouselIndex + 1);
      }

      function showPrev() {
        showImageAt(summaryCarouselIndex - 1);
      }

      document.addEventListener('keydown', function (e) {
        if (!summaryCarouselImages.length) return;
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          showNext();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          showPrev();
        }
      });

      document.addEventListener('click', function (e) {
        if (!summaryCarouselImages.length) return;
        if (e.target.closest && e.target.closest('.s-back-btn')) {
          return;
        }
        var midpoint = window.innerWidth / 2;
        if (e.clientX >= midpoint) {
          showNext();
        } else {
          showPrev();
        }
      });
    });
  }

  // First run: seed storage so admin can edit immediately
  (function seedStorageIfMissing() {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(getDefaultContentFromPage()));
      }
    } catch (_) {}
  })();

  applyContent(loadContentFromStorage() || getDefaultContentFromPage());

  // Live update: if admin changes localStorage in another tab/window
  window.addEventListener('storage', function (e) {
    if (e && e.key === STORAGE_KEY) {
      applyContent(loadContentFromStorage());
    }
  });
})();
