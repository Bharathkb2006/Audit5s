import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { fppGetBlob } from '../lib/fppIdb';

export default function FppMonthLayoutPage() {
  const { fppData } = useApp();
  const [url, setUrl] = useState('');
  const key = fppData?.assets?.monthWiseLayoutKey || '';
  const remoteUrl = fppData?.assets?.monthWiseLayoutUrl || '';

  useEffect(() => {
    document.documentElement.classList.add('month-layout-html');
    document.body.classList.add('month-layout-page-body');
    return () => {
      document.documentElement.classList.remove('month-layout-html');
      document.body.classList.remove('month-layout-page-body');
    };
  }, []);

  useEffect(() => {
    if (remoteUrl) {
      setUrl(remoteUrl);
      return undefined;
    }
    let revoke;
    let cancelled = false;
    (async () => {
      if (!key) {
        if (!cancelled) setUrl('');
        return;
      }
      const blob = await fppGetBlob(key);
      if (cancelled) return;
      if (blob) {
        revoke = URL.createObjectURL(blob);
        setUrl(revoke);
      } else setUrl('');
    })();
    return () => {
      cancelled = true;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [key, remoteUrl]);

  const hasImage = Boolean(url);

  return (
    <>
      <Link className="s-back-btn" to="/fpp" aria-label="Back to FPP master list">
        <span className="s-back-btn-icon" aria-hidden="true" />
      </Link>
      <main className="full-shell">
        <div style={{ width: 'min(1400px,100%)', display: 'grid', gap: '14px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.03em' }}>
            FIXED POINT PHOTOGRAPH LOCATION WISE MONTH WISE
          </h1>
          <div className="full-frame">
            <div
              className="full-fallback"
              id="monthWiseLayoutFallback"
              style={{ display: hasImage ? 'none' : 'grid' }}
            >
              UPLOAD VIA ADMIN
            </div>
            <img
              id="monthWiseLayoutImage"
              className="full-img"
              alt="Month wise layout"
              style={{ display: hasImage ? 'block' : 'none' }}
              src={url || ''}
            />
          </div>
        </div>
      </main>
    </>
  );
}
