import React, { useCallback, useEffect, useState } from 'react';
import SiteHeader from './SiteHeader';
import SideMenu from './SideMenu';

export default function SiteShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  const toggleMenu = useCallback(() => {
    setMenuOpen((o) => {
      const next = !o;
      document.body.style.overflow = next ? 'hidden' : '';
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && menuOpen) closeMenu();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen, closeMenu]);

  return (
    <>
      <SiteHeader menuOpen={menuOpen} onMenuToggle={toggleMenu} />
      <SideMenu open={menuOpen} onClose={closeMenu} />
      {children}
    </>
  );
}
