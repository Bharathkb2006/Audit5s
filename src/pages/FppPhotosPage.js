import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { fppGetBlob } from '../lib/fppIdb';

export default function FppPhotosPage() {
  const [searchParams] = useSearchParams();
  const rowId = searchParams.get('row') || '1';
  const { fppData } = useApp();
  const [mainUrl, setMainUrl] = useState('');
  const [snapUrl, setSnapUrl] = useState('');

  const titleText = useMemo(() => {
    const rows = fppData?.fpp?.rows;
    if (!Array.isArray(rows)) return '';
    const row = rows.find((r) => String(r.id || '') === String(rowId));
    if (!row) return '';
    const parts = [];
    if (row.fppNo) parts.push(row.fppNo);
    if (row.fppDesc) parts.push(row.fppDesc);
    return parts.join(' – ');
  }, [fppData, rowId]);

  useEffect(() => {
    let r1;
    let r2;
    let cancelled = false;
    (async () => {
      const photos = fppData?.fppPhotos?.[rowId];
      if (!photos) {
        if (!cancelled) {
          setMainUrl('');
          setSnapUrl('');
        }
        return;
      }
      if (photos.mainUrl) {
        if (!cancelled) setMainUrl(photos.mainUrl);
      } else if (photos.mainKey) {
        const b = await fppGetBlob(photos.mainKey);
        if (!cancelled && b) {
          r1 = URL.createObjectURL(b);
          setMainUrl(r1);
        } else if (!cancelled) setMainUrl('');
      } else if (!cancelled) setMainUrl('');
      if (photos.snapshotUrl) {
        if (!cancelled) setSnapUrl(photos.snapshotUrl);
      } else if (photos.snapshotKey) {
        const b2 = await fppGetBlob(photos.snapshotKey);
        if (!cancelled && b2) {
          r2 = URL.createObjectURL(b2);
          setSnapUrl(r2);
        } else if (!cancelled) setSnapUrl('');
      } else if (!cancelled) setSnapUrl('');
    })();
    return () => {
      cancelled = true;
      if (r1) URL.revokeObjectURL(r1);
      if (r2) URL.revokeObjectURL(r2);
    };
  }, [fppData, rowId]);

  return (
    <>
      <Link className="s-back-btn" to="/fpp" aria-label="Back to FPP master list">
        <span className="s-back-btn-icon" aria-hidden="true" />
      </Link>
      <main className="full-shell">
        <div style={{ width: 'min(1400px,100%)', display: 'grid', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.03em' }}>FPP PHOTOS</h1>
            <div id="fppPhotoTitle" style={{ fontWeight: 800, color: 'rgba(0,0,0,.65)' }}>
              {titleText}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }} className="photos-grid">
            <section>
              <div style={{ fontWeight: 900, marginBottom: '8px' }}>Fixed point photograph</div>
              <div className="full-frame" style={{ height: 'min(60vh,620px)' }}>
                <div
                  className="full-fallback"
                  id="fppMainFallback"
                  style={{ display: mainUrl ? 'none' : 'grid' }}
                >
                  NO IMAGE
                </div>
                <img
                  id="fppMainImage"
                  className="full-img"
                  alt="Fixed point photograph"
                  style={{ display: mainUrl ? 'block' : 'none' }}
                  src={mainUrl}
                />
              </div>
            </section>
            <section>
              <div style={{ fontWeight: 900, marginBottom: '8px' }}>Actual snapshot on shop floor</div>
              <div className="full-frame" style={{ height: 'min(60vh,620px)' }}>
                <div
                  className="full-fallback"
                  id="fppSnapshotFallback"
                  style={{ display: snapUrl ? 'none' : 'grid' }}
                >
                  NO IMAGE
                </div>
                <img
                  id="fppSnapshotImage"
                  className="full-img"
                  alt="Actual snapshot"
                  style={{ display: snapUrl ? 'block' : 'none' }}
                  src={snapUrl}
                />
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
