import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { useResolvedSrc } from '../hooks/useResolvedSrc';

export default function LayoutFullPage({ backTo, ariaBack, imgId, legacyKey, storedFlag, idbKey, alt }) {
  const { siteContent } = useApp();
  const assets = siteContent?.assets || {};
  const src = useResolvedSrc(assets, legacyKey, storedFlag, idbKey);

  return (
    <div className="layout-full-page">
      <Link to={backTo} className="s-back-btn" aria-label={ariaBack}>
        <span className="s-back-btn-icon" />
      </Link>
      <main className="layout-full-main">
        <img id={imgId} className="layout-full-image" alt={alt} src={src || ''} />
      </main>
    </div>
  );
}
