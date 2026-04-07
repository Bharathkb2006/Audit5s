import React, { useCallback, useState } from 'react';
import { NavLink } from 'react-router-dom';

function SubMenuParent({ label, children, defaultOpen }) {
  const [open, setOpen] = useState(Boolean(defaultOpen));
  return (
    <li className={`menu-parent${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="menu-link menu-parent-toggle"
        aria-expanded={open ? 'true' : 'false'}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
      >
        {label}
      </button>
      <ul className="submenu" hidden={!open}>
        {children}
      </ul>
    </li>
  );
}

export default function SideMenu({ open, onClose, onNavigate }) {
  const closeOnLink = useCallback(() => {
    onNavigate?.();
    onClose();
  }, [onClose, onNavigate]);

  const linkClass = ({ isActive }) => `menu-link${isActive ? ' active' : ''}`;
  const subClass = ({ isActive }) => `menu-link submenu-link${isActive ? ' active' : ''}`;

  return (
    <nav className={`side-menu${open ? ' is-open' : ''}`} id="sideMenu" aria-hidden={open ? 'false' : 'true'}>
      <div className="menu-overlay" id="menuOverlay" onClick={onClose} role="presentation" />
      <div className="menu-panel">
        <div className="menu-panel-scroll">
          <ul className="menu-list">
            <li>
              <NavLink to="/" end className={linkClass} onClick={closeOnLink}>
                Home
              </NavLink>
            </li>
            <SubMenuParent label="> 5S Gallery">
              <li>
                <NavLink to="/about5s" className={subClass} onClick={closeOnLink}>
                  About 5S
                </NavLink>
              </li>
              <li>
                <NavLink to="/5sornogram" className={subClass} onClick={closeOnLink}>
                  5S Ornogram
                </NavLink>
              </li>
              <li>
                <NavLink to="/layouts" className={subClass} onClick={closeOnLink}>
                  Layouts
                </NavLink>
              </li>
              <li>
                <NavLink to="/fpp" className={subClass} onClick={closeOnLink}>
                  FPP
                </NavLink>
              </li>
              <SubMenuParent label="> 5S Plan">
                <li>
                  <NavLink to="/summary" className={subClass} onClick={closeOnLink}>
                    Summary
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/5szones" className={subClass} onClick={closeOnLink}>
                    5s Zones
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/bestzone" className={subClass} onClick={closeOnLink}>
                    Best Zone
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/worstzone" className={subClass} onClick={closeOnLink}>
                    Worst Zone
                  </NavLink>
                </li>
              </SubMenuParent>
            </SubMenuParent>
          </ul>
        </div>
      </div>
    </nav>
  );
}
