import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteShell from '../components/SiteShell';

export default function FiveSZonesPage() {
  useEffect(() => {
    document.body.classList.add('layout-page-body', 'layout-page-body--zones');
    return () => document.body.classList.remove('layout-page-body', 'layout-page-body--zones');
  }, []);

  const zones = Array.from({ length: 16 }, (_, i) => i + 1);

  return (
    <SiteShell>
      <main className="main-content">
        <div className="page-inner">
          <section className="about-section">
            <h1 className="about5s-title">5S ZONES</h1>
            <p className="about5s-desc">Select a zone from the buttons below to view scores and observations.</p>
            <div className="about5s-tabs about5s-tabs--zones" role="navigation" aria-label="Zone pages">
              {zones.map((z) => (
                <Link key={z} className="about5s-tab" to={`/5szone-detail?zone=${z}`}>
                  Zone {z}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
