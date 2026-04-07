import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { useResolvedSrc } from '../hooks/useResolvedSrc';

const CONFIG = {
  1: {
    title: '1S - Sort',
    desc: 'The first step, Sort, involves evaluating all items in the workplace and removing unnecessary ones. This process helps to eliminate clutter and ensures that only essential items remain, which can improve efficiency and safety',
    videoLegacy: 's1Video',
    videoStored: 's1VideoStored',
    idbVideo: 's1Video',
    imageLegacy: 's1Image',
    imageStored: 's1ImageStored',
    idbImage: 's1Image',
    imageAlt: '1S Sort image',
    videoLabel: '1S video',
  },
  2: {
    title: '2S - Set in Order',
    desc: 'Set in Order focuses on organizing necessary items so they are easily accessible. This step is crucial for minimizing time spent searching for tools and materials, thereby enhancing workflow.',
    videoLegacy: 's2Video',
    videoStored: 's2VideoStored',
    idbVideo: 's2Video',
    imageLegacy: 's2Image',
    imageStored: 's2ImageStored',
    idbImage: 's2Image',
    imageAlt: '2S Set in Order image',
    videoLabel: '2S video',
  },
  3: {
    title: '3S - Shine',
    desc: 'The Shine step involves cleaning the workplace and equipment regularly. This not only maintains a clean environment but also helps in identifying potential issues like leaks or wear and tear.',
    videoLegacy: 's3Video',
    videoStored: 's3VideoStored',
    idbVideo: 's3Video',
    imageLegacy: 's3Image',
    imageStored: 's3ImageStored',
    idbImage: 's3Image',
    imageAlt: '3S Shine image',
    videoLabel: '3S video',
  },
  4: {
    title: '4S - Standardize',
    desc: 'Standardize is about creating consistent practices and procedures to maintain the first three S’s. This ensures that the improvements made are sustainable over time',
    videoLegacy: 's4Video',
    videoStored: 's4VideoStored',
    idbVideo: 's4Video',
    imageLegacy: 's4Image',
    imageStored: 's4ImageStored',
    idbImage: 's4Image',
    imageAlt: '4S Standardize image',
    videoLabel: '4S video',
  },
  5: {
    title: '5S - Sustain',
    desc: 'The final step, Sustain, focuses on maintaining and reviewing standards. This involves cultivating a culture of continuous improvement and discipline',
    videoLegacy: 's5Video',
    videoStored: 's5VideoStored',
    idbVideo: 's5Video',
    imageLegacy: 's5Image',
    imageStored: 's5ImageStored',
    idbImage: 's5Image',
    imageAlt: '5S Sustain image',
    videoLabel: '5S video',
  },
};

export default function SPage({ n }) {
  const c = CONFIG[n];
  const { siteContent } = useApp();
  const assets = siteContent?.assets || {};
  const videoSrc = useResolvedSrc(assets, c.videoLegacy, c.videoStored, c.idbVideo);
  const imageSrc = useResolvedSrc(assets, c.imageLegacy, c.imageStored, c.idbImage);
  const hasVideo = Boolean(videoSrc);
  const hasImage = Boolean(imageSrc);

  return (
    <div className="s-page-body">
      <main className="s-main">
        <div className="s-shell">
          <Link to="/about5s" className="s-back-btn" aria-label="Back to About 5S">
            <span className="s-back-btn-icon" />
          </Link>
          <div className="s-header-row">
            <div className="s-text-block">
              <h1 className="about5s-title">{c.title}</h1>
              <p className="about5s-desc">{c.desc}</p>
            </div>
            <div className="s-image-frame" aria-label={`${n}S reference image`}>
              <div
                className="s-image-fallback"
                id={`s${n}ImageFallback`}
                style={{ display: hasImage ? 'none' : 'grid' }}
              >
                IMAGE
              </div>
              <img
                id={`s${n}Image`}
                className="s-image"
                alt={c.imageAlt}
                src={imageSrc || ''}
                style={{ display: hasImage ? 'block' : 'none' }}
              />
            </div>
          </div>
          <div className="s-video-stage">
            <div className="s-video-frame" aria-label={c.videoLabel}>
              <video
                className="s-video"
                autoPlay
                muted
                loop
                playsInline
                id={`s${n}Video`}
                style={{ display: hasVideo ? 'block' : 'none' }}
              >
                {hasVideo ? <source id={`s${n}VideoSource`} src={videoSrc} type="video/mp4" /> : null}
              </video>
              <div
                className="s-video-fallback"
                id={`s${n}VideoFallbackVideo`}
                style={{ display: hasVideo ? 'none' : 'grid' }}
              >
                VIDEO PLAYBACK
              </div>
            </div>
            <div className="about5s-graphic" aria-label="5S cycle illustration">
              <img
                src="/assets/5s-wheel.png"
                alt="5S cycle showing Sort, Set in Order, Shine, Standardize and Sustain"
                className="about5s-graphic-img"
                onError={(e) => {
                  e.currentTarget.src = '/5s wheel diagram.jpg';
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
