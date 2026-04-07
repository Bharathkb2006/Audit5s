import React, { useEffect } from 'react';
import SiteShell from '../components/SiteShell';
import { useApp } from '../context/AppProvider';
import { useResolvedSrc } from '../hooks/useResolvedSrc';

const PLACEHOLDER_SVG = `data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20width%3D%271200%27%20height%3D%27680%27%20viewBox%3D%270%200%201200%20680%27%3E%3Crect%20width%3D%271200%27%20height%3D%27680%27%20fill%3D%27%23ffffff%27/%3E%3Ctext%20x%3D%27600%27%20y%3D%27340%27%20text-anchor%3D%27middle%27%20font-family%3D%27Inter%2C%20Segoe%20UI%2C%20Arial%27%20font-size%3D%2726%27%20fill%3D%27%23666%27%3EUpload%20Organogram%20Image%20in%20Admin%3C/text%3E%3C/svg%3E`;

export default function OrganogramPage() {
  const { siteContent } = useApp();
  const assets = siteContent?.assets || {};
  const resolved = useResolvedSrc(assets, 'organogramImage', 'organogramImageStored', 'organogramImage');
  const src = resolved || PLACEHOLDER_SVG;

  useEffect(() => {
    document.documentElement.classList.add('organogram-html');
    document.body.classList.add('organogram-page-body');
    return () => {
      document.documentElement.classList.remove('organogram-html');
      document.body.classList.remove('organogram-page-body');
    };
  }, []);

  return (
    <SiteShell>
      <main className="organogram-main">
        <div className="organogram-topbar">
          <div className="organogram-pill">5S ORGANOGRAM</div>
        </div>
        <div className="organogram-stage">
          <div className="organogram-frame">
            <img id="organogramImage" className="organogram-image" alt="5S Organogram" src={src} />
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
