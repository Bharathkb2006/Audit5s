import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppProvider';

export default function SiteHeader({ menuOpen, onMenuToggle }) {
  const { siteContent } = useApp();
  const logoSrc =
    siteContent?.assets?.logoImage && String(siteContent.assets.logoImage).trim()
      ? siteContent.assets.logoImage.startsWith('/') ||
        siteContent.assets.logoImage.startsWith('data:') ||
        siteContent.assets.logoImage.startsWith('http')
        ? siteContent.assets.logoImage
        : `/${String(siteContent.assets.logoImage).replace(/^\//, '')}`
      : '/brakes india pagr.png';

  return (
    <header className="header">
      <button
        type="button"
        className="menu-toggle"
        id="menuToggle"
        aria-label="Open menu"
        aria-expanded={menuOpen ? 'true' : 'false'}
        onClick={onMenuToggle}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="logo">
        <img id="logoImage" src={logoSrc} alt="Brakes India Logo" className="site-logo" />
      </div>
      <Link to="/admin-login" className="profile-icon profile-link" aria-label="Admin Login">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
      </Link>
    </header>
  );
}
