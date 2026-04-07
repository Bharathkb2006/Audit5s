import { useEffect, useState } from 'react';
import { useApp } from '../context/AppProvider';

function normalizePath(p) {
  if (!p) return '';
  if (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')) return p;
  return p.startsWith('/') ? p : `/${p}`;
}

export function useResolvedSrc(assets, legacyKey, storedFlag, idbKey) {
  const { getBiMedia } = useApp();
  const [url, setUrl] = useState('');

  useEffect(() => {
    let revokeUrl;
    let cancelled = false;
    (async () => {
      const a = assets || {};
      const legacy = typeof a[legacyKey] === 'string' ? a[legacyKey].trim() : '';
      if (legacy) {
        if (!cancelled) setUrl(normalizePath(legacy));
        return;
      }
      if (a[storedFlag]) {
        const blob = await getBiMedia(idbKey);
        if (cancelled) return;
        if (blob) {
          revokeUrl = URL.createObjectURL(blob);
          setUrl(revokeUrl);
          return;
        }
      }
      if (!cancelled) setUrl('');
    })();
    return () => {
      cancelled = true;
      if (revokeUrl) URL.revokeObjectURL(revokeUrl);
    };
  }, [assets, legacyKey, storedFlag, idbKey, getBiMedia]);

  return url;
}
