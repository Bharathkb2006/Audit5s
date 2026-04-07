import React, { useEffect, useRef } from 'react';
import { useApp } from '../context/AppProvider';
import SiteShell from '../components/SiteShell';

export default function HomePage() {
  const { siteContent } = useApp();
  const videoRef = useRef(null);
  const home = siteContent?.home || {};
  const assets = siteContent?.assets || {};
  const title = typeof home.title === 'string' ? home.title : 'ABOUT US';
  const desc =
    typeof home.description === 'string'
      ? home.description
      : "Brakes India Private Limited, founded in 1962 and part of the TVS Group, is India's largest manufacturer of automotive braking systems and a major global supplier. Headquartered in Chennai, it operates over 21 manufacturing locations, offering braking solutions for passenger vehicles, commercial vehicles.";

  const videoSrc = (() => {
    const v = assets.homeVideo;
    if (!v || !String(v).trim()) return '/video/absvideo.mp4';
    const s = String(v).trim();
    if (s.startsWith('/') || s.startsWith('http') || s.startsWith('blob:')) return s;
    return `/${s.replace(/^\//, '')}`;
  })();

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const onErr = () => {
      const backdrop = v.closest('.video-backdrop');
      backdrop?.classList.add('video-fallback');
    };
    v.addEventListener('error', onErr);
    return () => v.removeEventListener('error', onErr);
  }, [videoSrc]);

  return (
    <SiteShell>
      <main className="main-content home-page">
        <div className="video-backdrop">
          <video ref={videoRef} className="bg-video" autoPlay muted loop playsInline id="bgVideo">
            <source id="homeVideoSource" src={videoSrc} type="video/mp4" />
          </video>
          <div className="video-overlay" />
        </div>
        <div className="home-content">
          <h1 id="homeTitle" className="home-title about-us-heading animate-in">
            {title}
          </h1>
          <p id="homeDescription" className="home-desc animate-in delay-1">
            {desc}
          </p>
        </div>
        <audio id="bgmusic" loop>
          <source src="/audiocoffee-afternoon-tea-128802.mp3" type="audio/mp3" />
        </audio>
      </main>
    </SiteShell>
  );
}
