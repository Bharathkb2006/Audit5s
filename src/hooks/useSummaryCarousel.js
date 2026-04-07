import { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppProvider';

function normalizePath(p) {
  if (!p) return '';
  if (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')) return p;
  return p.startsWith('/') ? p : `/${p}`;
}

const CONFIG = {
  summary: [
    { legacyKey: 'summaryImage1', storedFlag: 'summaryImage1Stored', storeKey: 'summaryImage1' },
    { legacyKey: 'summaryImage2', storedFlag: 'summaryImage2Stored', storeKey: 'summaryImage2' },
    { legacyKey: 'summaryImage3', storedFlag: 'summaryImage3Stored', storeKey: 'summaryImage3' },
  ],
  best: [
    { legacyKey: 'bestZoneImage1', storedFlag: 'bestZoneImage1Stored', storeKey: 'bestZoneImage1' },
    { legacyKey: 'bestZoneImage2', storedFlag: 'bestZoneImage2Stored', storeKey: 'bestZoneImage2' },
  ],
  worst: [
    { legacyKey: 'worstZoneImage1', storedFlag: 'worstZoneImage1Stored', storeKey: 'worstZoneImage1' },
    { legacyKey: 'worstZoneImage2', storedFlag: 'worstZoneImage2Stored', storeKey: 'worstZoneImage2' },
  ],
};

export function useSummaryCarousel(mode, assets, fallbackBarcuttingUrl) {
  const { getBiMedia } = useApp();
  const [urls, setUrls] = useState([]);
  const [index, setIndex] = useState(0);
  const urlsRef = useRef([]);
  const indexRef = useRef(0);

  useEffect(() => {
    urlsRef.current = urls;
  }, [urls]);
  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    const objectUrls = [];
    let cancelled = false;
    (async () => {
      const cfg = CONFIG[mode] || CONFIG.summary;
      const out = [];
      for (const item of cfg) {
        const inline = assets && typeof assets[item.legacyKey] === 'string' ? assets[item.legacyKey].trim() : '';
        if (inline) {
          out.push(normalizePath(inline));
          continue;
        }
        if (assets && assets[item.storedFlag]) {
          const blob = await getBiMedia(item.storeKey);
          if (blob) {
            const u = URL.createObjectURL(blob);
            objectUrls.push(u);
            out.push(u);
          }
        }
      }
      if (!out.length && fallbackBarcuttingUrl) out.push(fallbackBarcuttingUrl);
      if (!cancelled) {
        setUrls(out);
        setIndex(0);
      }
    })();
    return () => {
      cancelled = true;
      objectUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [mode, assets, getBiMedia, fallbackBarcuttingUrl]);

  const showAt = useCallback((i) => {
    const list = urlsRef.current;
    if (!list.length) return;
    const n = ((i % list.length) + list.length) % list.length;
    setIndex(n);
  }, []);

  const showNext = useCallback(() => showAt(indexRef.current + 1), [showAt]);
  const showPrev = useCallback(() => showAt(indexRef.current - 1), [showAt]);

  useEffect(() => {
    if (!urls.length) return undefined;
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        showNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        showPrev();
      }
    };
    const onClick = (e) => {
      if (e.target.closest?.('.s-back-btn')) return;
      const mid = window.innerWidth / 2;
      if (e.clientX >= mid) showNext();
      else showPrev();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, [urls.length, showNext, showPrev]);

  const maxSlides = mode === 'summary' ? 3 : 2;
  const safeUrls = urls.slice(0, maxSlides);
  const currentUrl = safeUrls.length ? safeUrls[Math.min(index, safeUrls.length - 1)] : '';

  return { currentUrl, urls: safeUrls, index: Math.min(index, Math.max(0, safeUrls.length - 1)) };
}
