import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import SiteShell from '../components/SiteShell';

export default function LayoutsPage() {
  useEffect(() => {
    document.body.classList.add('layout-page-body');
    return () => document.body.classList.remove('layout-page-body');
  }, []);

  return (
    <SiteShell>
      <main className="main-content">
        <div className="page-inner">
          <section className="about-section">
            <h1 className="about5s-title">LAYOUTS</h1>
            <p className="about5s-desc">Select a layout from the buttons below to view the corresponding layout images.</p>

            <div className="about5s-tabs" role="navigation" aria-label="Layout pages">
              <Link className="about5s-tab" to="/barcutting-layout">
                Barcutting Layout
              </Link>
              <Link className="about5s-tab" to="/ground-floor-layout">
                Ground Floor Layout
              </Link>
              <Link className="about5s-tab" to="/first-floor-layout">
                First Floor Layout
              </Link>
              <Link className="about5s-tab" to="/second-floor-layout">
                Second Floor Layout
              </Link>
            </div>
            <div className="about-gallery-marquee">
              <div className="about-gallery-track">
                <div className="about-gallery-group">
                  <div className="upload-placeholder">
                    <img src="/unit18.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/bar cutting.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/abs.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/catridge assembly.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/bracket line.jpg" alt="Description" />
                  </div>
                </div>
                <div className="about-gallery-group">
                  <div className="upload-placeholder">
                    <img src="/unit18.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/bar cutting.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/abs.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/catridge assembly.jpg" alt="Description" />
                  </div>
                  <div className="upload-placeholder">
                    <img src="/bracket line.jpg" alt="Description" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </SiteShell>
  );
}
