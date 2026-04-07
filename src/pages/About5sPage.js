import React from 'react';
import { Link } from 'react-router-dom';
import SiteShell from '../components/SiteShell';
import { useApp } from '../context/AppProvider';
import { useResolvedSrc } from '../hooks/useResolvedSrc';

export default function About5sPage() {
  const { siteContent } = useApp();
  const assets = siteContent?.assets || {};
  const videoSrc = useResolvedSrc(assets, 'about5sVideo', 'about5sVideoStored', 'about5sVideo');
  const hasVideo = Boolean(videoSrc);

  return (
    <SiteShell>
      <main className="about5s-main">
        <div className="about5s-shell">
          <h1 className="about5s-title">ABOUT 5S</h1>
          <p className="about5s-desc" id="about5sDescription">
            5S is a workplace organization method used in industries to improve efficiency, safety, and productivity while
            reducing waste. It consists of five steps: Sort, Set in Order, Shine, Standardize, and Sustain.Originating in Japan
            and popularized through the Toyota Production System, it focuses on creating clean and well-organized
            workspaces.5S ensures every item has a designated place, making problems, missing tools, and inefficiencies easy
            to identify.
          </p>

          <div className="about5s-tabs" role="navigation" aria-label="5S pages">
            <Link className="about5s-tab" to="/1s">
              1S - Sort
            </Link>
            <Link className="about5s-tab" to="/2s">
              2S - Set in Order
            </Link>
            <Link className="about5s-tab" to="/3s">
              3S - Shine
            </Link>
            <Link className="about5s-tab" to="/4s">
              4S - Standarize
            </Link>
            <Link className="about5s-tab" to="/5s">
              5S - Sustain
            </Link>
          </div>

          <div className="about5s-video-stage">
            <div className="about5s-video-frame" aria-label="About 5S video">
              <video
                className="about5s-video"
                autoPlay
                muted
                loop
                playsInline
                id="about5sVideo"
                style={{ display: hasVideo ? 'block' : 'none' }}
              >
                {hasVideo ? <source id="about5sVideoSource" src={videoSrc} type="video/mp4" /> : null}
              </video>
              <div
                className="about5s-video-fallback"
                id="about5sVideoFallback"
                style={{ display: hasVideo ? 'none' : 'grid' }}
              >
                VIDEO PLAYBACK
              </div>
            </div>

            <div className="about5s-graphic" aria-label="5S cycle illustration">
              <img
                src="/5s wheel diagram.jpg"
                alt="5S cycle showing Sort, Set in Order, Shine, Standardize and Sustain"
                className="about5s-graphic-img"
              />
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
