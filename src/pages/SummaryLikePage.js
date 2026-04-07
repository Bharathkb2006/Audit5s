import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { useResolvedSrc } from '../hooks/useResolvedSrc';
import { useSummaryCarousel } from '../hooks/useSummaryCarousel';

export default function SummaryLikePage({ mode, backTo, ariaBack, titleAlt }) {
  const { siteContent } = useApp();
  const assets = siteContent?.assets || {};
  const barcuttingFallback = useResolvedSrc(assets, 'barcuttingLayoutImage', 'barcuttingLayoutStored', 'barcuttingLayout');
  const { currentUrl } = useSummaryCarousel(mode, assets, barcuttingFallback || undefined);

  return (
    <div className="layout-full-page">
      <Link to={backTo} className="s-back-btn" aria-label={ariaBack}>
        <span className="s-back-btn-icon" />
      </Link>
      <main className="layout-full-main">
        <img id="barcuttingLayoutImage" className="layout-full-image" alt={titleAlt} src={currentUrl || ''} />
      </main>
    </div>
  );
}
