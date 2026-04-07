import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';

export default function FppPage() {
  const { fppData } = useApp();
  const navigate = useNavigate();
  const fpp = fppData?.fpp || { unit: '18', rows: [] };

  return (
    <>
      <Link className="s-back-btn" to="/" aria-label="Back to Home">
        <span className="s-back-btn-icon" aria-hidden="true" />
      </Link>
      <main className="fpp-main">
        <div className="fpp-shell">
          <section className="fpp-left">
            <div className="fpp-titlebar">FIXED POINT PHOTOGRAPH MASTER LIST</div>
            <div className="fpp-table-wrapper">
              <table className="fpp-table">
                <thead>
                  <tr className="fpp-header-row-main">
                    <th colSpan="2" style={{ textAlign: 'left' }}>
                      FPP Master list
                    </th>
                    <th colSpan="3" style={{ textAlign: 'right' }}>
                      Unit : <span id="fppUnit">{fpp.unit || '18'}</span>
                    </th>
                  </tr>
                  <tr className="fpp-header-row-sub">
                    <th rowSpan="2">Sl. No.</th>
                    <th rowSpan="2">5S Zone No.</th>
                    <th rowSpan="2">5S Zone Desc.</th>
                    <th colSpan="2">FPP</th>
                  </tr>
                  <tr className="fpp-header-row-sub">
                    <th>FPP No.</th>
                    <th>FPP Desc.</th>
                  </tr>
                </thead>
                <tbody id="fppTableBody">
                  {(Array.isArray(fpp.rows) ? fpp.rows : []).map((row, index) => (
                    <tr key={row.id || index} className={index % 2 === 0 ? 'fpp-row-even' : 'fpp-row-odd'}>
                      <td>{row.slNo != null ? row.slNo : index + 1}</td>
                      <td>{row.zoneNo || ''}</td>
                      <td>{row.zoneDesc || ''}</td>
                      <td>{row.fppNo || ''}</td>
                      <td>
                        <span>{row.fppDesc || ''}</span>
                        <button
                          type="button"
                          className="fpp-link-icon"
                          aria-label="Open photos for this FPP"
                          onClick={() => navigate(`/fpp-photos?row=${encodeURIComponent(String(row.id || index + 1))}`)}
                        >
                          <span className="fpp-link-icon-inner" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <aside className="fpp-right" aria-label="Month wise layout and helper">
            <div className="fpp-month-layout-panel">
              <button
                className="fpp-monthwise-btn"
                id="monthWiseLayoutBtn"
                type="button"
                aria-label="Open Month Wise Layout"
                onClick={() => navigate('/fpp-month-layout')}
              >
                <span className="fpp-monthwise-btn-icon" aria-hidden="true" />
                <span className="fpp-monthwise-btn-text">MONTH WISE LAYOUT</span>
              </button>
            </div>
            <div className="fpp-helper-panel">
              <img src="/office boy.gif" alt="FPP helper animation" className="fpp-helper-img" />
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
