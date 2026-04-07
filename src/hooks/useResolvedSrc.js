import { useEffect, useState } from 'react';

function normalizePath(p) {
  if (!p) return '';
  if (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')) return p;
  return p.startsWith('/') ? p : `/${p}`;
}

/**
 * Resolves media URL from site content assets (Firebase Storage URLs or static paths).
 * Legacy parameters storedFlag / idbKey are unused; kept for call-site compatibility.
 */
export function useResolvedSrc(assets, legacyKey, _storedFlag, _idbKey) {
  const [url, setUrl] = useState('');

  useEffect(() => {
    const a = assets || {};
    const legacy = typeof a[legacyKey] === 'string' ? a[legacyKey].trim() : '';
    if (legacy) {
      setUrl(normalizePath(legacy));
      return;
    }
    setUrl('');
  }, [assets, legacyKey]);

  return url;
}
