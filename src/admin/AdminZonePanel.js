import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppProvider';
import {
  DEFAULT_LOCATION,
  emptyScoreWeek,
  ensureZoneMeta,
  getCheckpointsForZone,
  getZoneDataFromStore,
  setZoneInStore,
} from '../lib/zonesCore';

export default function AdminZonePanel() {
  const { zonesData, setZonesData, putBiMedia, notifyZoneUpdated } = useApp();
  const [zoneId, setZoneId] = useState(1);
  const [rangeStart, setRangeStart] = useState(1);
  const [headerStatus, setHeaderStatus] = useState('');
  const [tableStatus, setTableStatus] = useState('');
  const [obsStatus, setObsStatus] = useState('');
  const auditWrapRef = useRef(null);
  const obsRef = useRef(null);

  const checkpoints = getCheckpointsForZone(zoneId);

  const getStart = () => Math.min(48, Math.max(1, rangeStart));

  const loadZone = useCallback(() => {
    return ensureZoneMeta(zoneId, getZoneDataFromStore(zonesData, zoneId));
  }, [zonesData, zoneId]);

  const persistZone = (zd) => {
    const next = setZoneInStore(zonesData, zoneId, zd);
    setZonesData(next);
    notifyZoneUpdated(zoneId);
  };

  const saveZoneHeader = async () => {
    const zd = loadZone();
    const titleEl = document.getElementById('zoneHeaderTitle');
    const cn = document.getElementById('zoneChampionName');
    const ln = document.getElementById('zoneLeaderName');
    const cp = document.getElementById('zoneChampionPhoto');
    const lp = document.getElementById('zoneLeaderPhoto');
    zd.meta.title = (titleEl?.value || '').trim() || `ZONE - ${zoneId}`;
    zd.meta.championName = (cn?.value || '').trim();
    zd.meta.leaderName = (ln?.value || '').trim();
    zd.meta.updatedAt = Date.now();
    const champFile = cp?.files?.[0];
    const leaderFile = lp?.files?.[0];
    setHeaderStatus(champFile || leaderFile ? 'Saving photos…' : 'Saved.');
    try {
      if (champFile) {
        const url = await putBiMedia(`zone:${zoneId}:championPhoto`, champFile);
        if (url) {
          zd.meta.championPhotoUrl = url;
          zd.meta.championPhotoStored = false;
        }
      }
      if (leaderFile) {
        const url = await putBiMedia(`zone:${zoneId}:leaderPhoto`, leaderFile);
        if (url) {
          zd.meta.leaderPhotoUrl = url;
          zd.meta.leaderPhotoStored = false;
        }
      }
      persistZone(zd);
      if (cp) cp.value = '';
      if (lp) lp.value = '';
      setHeaderStatus('Saved.');
    } catch {
      setHeaderStatus('Saved details, but one or more photos failed. Try smaller images.');
    }
  };

  const saveTable = () => {
    const start = getStart();
    const zd = loadZone();
    const scores = zd.scores || [];
    const locInp = auditWrapRef.current?.querySelector('.zone-admin-location');
    if (locInp) {
      zd.meta.location = (locInp.value || '').trim() || DEFAULT_LOCATION;
      zd.meta.updatedAt = Date.now();
    }
    for (let w = 0; w < 5; w++) {
      const idx = start + w - 1;
      while (idx >= scores.length) scores.push(emptyScoreWeek(scores.length + 1));
      const sw = scores[idx];
      for (let r = 0; r < 5; r++) {
        if (!sw.dailyScores[r]) sw.dailyScores[r] = [0, 0, 0, 0, 0];
        for (let d = 0; d < 5; d++) {
          const inp = auditWrapRef.current?.querySelector(
            `.zone-admin-day[data-w="${w}"][data-r="${r}"][data-d="${d}"]`
          );
          sw.dailyScores[r][d] = parseInt(inp?.value, 10) || 0;
        }
      }
      const noEl = document.getElementById(`zoneAdminW${w + 1}No`);
      const dtEl = document.getElementById(`zoneAdminW${w + 1}Dt`);
      if (noEl) sw.weekNo = parseInt(noEl.value, 10) || start + w;
      if (dtEl) sw.date = dtEl.value || '';
      const totalInp = auditWrapRef.current?.querySelector(`.zone-admin-total[data-w="${w}"]`);
      const byInp = auditWrapRef.current?.querySelector(`.zone-admin-by[data-w="${w}"]`);
      if (totalInp) sw.total = Math.min(25, Math.max(0, parseInt(totalInp.value, 10) || 0));
      if (byInp) sw.checkedBy = byInp.value || '';
    }
    zd.scores = scores;
    persistZone(zd);
    setTableStatus('Table saved. Frontend will show this data for the selected week range.');
  };

  const saveObs = () => {
    const zd = loadZone();
    const rows = obsRef.current?.querySelectorAll('tr') || [];
    const byWeek = {};
    rows.forEach((tr) => {
      const weekNo = parseInt(tr.getAttribute('data-week'), 10);
      const loc = tr.querySelector('.zone-admin-obs-loc')?.value || '';
      const observation = tr.querySelector('.zone-admin-obs-obs')?.value || '';
      const corrective = tr.querySelector('.zone-admin-obs-corrective')?.value || '';
      const resp = tr.querySelector('.zone-admin-obs-resp')?.value || '';
      const target = tr.querySelector('.zone-admin-obs-target')?.value || '';
      const completed = tr.querySelector('.zone-admin-obs-completed')?.value || '';
      if (!weekNo) return;
      if (!byWeek[weekNo]) byWeek[weekNo] = [];
      if (
        byWeek[weekNo].length < 3 &&
        (loc || observation || corrective || resp || target || completed)
      ) {
        byWeek[weekNo].push({
          weekNo,
          location: loc,
          observation,
          correctiveAction: corrective,
          resp,
          targetDate: target,
          completedDate: completed,
        });
      }
    });
    const newObs = [];
    for (let w = 1; w <= 52; w++) {
      (byWeek[w] || []).forEach((o) => newObs.push(o));
    }
    zd.observations = newObs;
    persistZone(zd);
    setObsStatus('Observations saved. Frontend will show this data.');
  };

  const start = getStart();
  const zd = loadZone();
  const scores = zd.scores || [];

  useEffect(() => {
    setHeaderStatus('');
    setTableStatus('');
    setObsStatus('');
  }, [zoneId, rangeStart]);

  return (
    <section className="admin-section" id="zoneDataSection">
      <h2>5S Zone Data (Scores &amp; Observations)</h2>
      <p className="admin-note">
        Edit the score table and observations for each zone here. Save Table updates the frontend for the selected week
        range. Observations save separately.
      </p>
      <div className="admin-form">
        <label className="admin-field">
          Zone
          <select
            id="zoneDataZoneSelect"
            value={zoneId}
            onChange={(e) => setZoneId(parseInt(e.target.value, 10) || 1)}
          >
            {Array.from({ length: 16 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Zone {i + 1}
              </option>
            ))}
          </select>
        </label>
        <div className="admin-subsection">
          <h3 className="admin-subtitle-h3">Zone Header (Title / Champion / Leader)</h3>
          <p className="admin-note">
            These details show on the zone detail page (left/right cards). Upload photos (square recommended).
          </p>
          <div className="admin-zone-header-grid">
            <label className="admin-field admin-zone-title">
              Zone display title
              <input
                id="zoneHeaderTitle"
                key={`title-${zoneId}`}
                type="text"
                placeholder="ZONE - 1"
                defaultValue={zd.meta.title || `ZONE - ${zoneId}`}
              />
            </label>
            <div className="admin-zone-person">
              <div className="admin-zone-person-title">Zone Champion</div>
              <label className="admin-field">
                Name
                <input
                  id="zoneChampionName"
                  key={`cn-${zoneId}`}
                  type="text"
                  placeholder="Name"
                  defaultValue={zd.meta.championName || ''}
                />
              </label>
              <label className="admin-field">
                Photo
                <input id="zoneChampionPhoto" type="file" accept="image/*" />
              </label>
            </div>
            <div className="admin-zone-person">
              <div className="admin-zone-person-title">Zone Leader</div>
              <label className="admin-field">
                Name
                <input
                  id="zoneLeaderName"
                  key={`ln-${zoneId}`}
                  type="text"
                  placeholder="Name"
                  defaultValue={zd.meta.leaderName || ''}
                />
              </label>
              <label className="admin-field">
                Photo
                <input id="zoneLeaderPhoto" type="file" accept="image/*" />
              </label>
            </div>
          </div>
          <div className="admin-actions">
            <button className="admin-primary-btn" id="zoneHeaderSave" type="button" onClick={saveZoneHeader}>
              Save Zone Header
            </button>
          </div>
          <span id="zoneHeaderStatus" className="admin-status" aria-live="polite">
            {headerStatus}
          </span>
        </div>
        <label className="admin-field">
          Week range (for score table)
          <select
            id="zoneDataWeekRange"
            value={rangeStart}
            onChange={(e) => setRangeStart(parseInt(e.target.value, 10) || 1)}
          >
            <option value="1">Weeks 1-5</option>
            <option value="6">Weeks 6-10</option>
            <option value="11">Weeks 11-15</option>
            <option value="16">Weeks 16-20</option>
            <option value="21">Weeks 21-25</option>
            <option value="26">Weeks 26-30</option>
            <option value="31">Weeks 31-35</option>
            <option value="36">Weeks 36-40</option>
            <option value="41">Weeks 41-45</option>
            <option value="48">Weeks 48-52</option>
          </select>
        </label>
        <div ref={auditWrapRef} key={`audit-${zoneId}-${rangeStart}`}>
          <div className="zone-admin-table-wrap">
            <table className="zone-audit-table zone-audit-table--admin" id="zoneAdminAuditTable">
              <thead>
                <tr>
                  <th className="zone-audit-location" rowSpan={3}>
                    Location
                  </th>
                  <th className="zone-audit-checkpoints" rowSpan={3}>
                    Check Points
                  </th>
                  {[1, 2, 3, 4, 5].map((w) => {
                    const idx = start + w - 1;
                    const sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
                    return (
                      <th key={w} colSpan={5} className="zone-audit-week" data-w={w}>
                        Week No:{' '}
                        <input
                          type="number"
                          min={1}
                          max={52}
                          id={`zoneAdminW${w}No`}
                          defaultValue={sw.weekNo || idx + 1}
                        />
                      </th>
                    );
                  })}
                </tr>
                <tr className="zone-audit-date-row">
                  {[1, 2, 3, 4, 5].map((w) => {
                    const idx = start + w - 1;
                    const sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
                    return (
                      <th key={w} colSpan={5} className="zone-audit-week" data-w={w}>
                        Dt:{' '}
                        <input
                          type="text"
                          id={`zoneAdminW${w}Dt`}
                          placeholder="dd/mm/yyyy"
                          defaultValue={sw.date || ''}
                        />
                      </th>
                    );
                  })}
                </tr>
              <tr className="zone-audit-day-row">
                {[1, 2, 3, 4, 5].map((w) =>
                  [1, 2, 3, 4, 5].map((d) => <th key={`${w}-${d}`}>{d}</th>)
                )}
              </tr>
            </thead>
            <tbody id="zoneAdminAuditBody">
              {[0, 1, 2, 3, 4].map((r) => (
                <tr key={r}>
                  {r === 0 ? (
                    <td className="zone-audit-location">
                      <input
                        type="text"
                        className="zone-admin-location"
                        defaultValue={zd.meta.location || DEFAULT_LOCATION}
                      />
                    </td>
                  ) : (
                    <td className="zone-audit-location" />
                  )}
                  <td className="zone-audit-cp">{checkpoints[r] || ''}</td>
                  {[0, 1, 2, 3, 4].map((w) => {
                    const idx = start + w - 1;
                    const sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
                    const row = (sw.dailyScores && sw.dailyScores[r]) || [0, 0, 0, 0, 0];
                    return [0, 1, 2, 3, 4].map((d) => (
                      <td key={`${w}-${d}`}>
                        <input
                          type="number"
                          min={0}
                          max={5}
                          className="zone-admin-day"
                          data-w={w}
                          data-r={r}
                          data-d={d}
                          defaultValue={row[d] || 0}
                        />
                      </td>
                    ));
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          <div className="zone-admin-total-by" id="zoneAdminTotalBy">
            <table className="zone-admin-totalby-table">
              <tbody>
                <tr>
                  <td className="zone-audit-cp">Total Marks</td>
                  {[0, 1, 2, 3, 4].map((w) => {
                    const idx = start + w - 1;
                    const sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
                    return (
                      <td key={w}>
                        <input
                          type="number"
                          min={0}
                          max={25}
                          className="zone-admin-total"
                          data-w={w}
                          defaultValue={sw.total || 0}
                        />
                      </td>
                    );
                  })}
                </tr>
                <tr>
                  <td className="zone-audit-cp">Checked By</td>
                  {[0, 1, 2, 3, 4].map((w) => {
                    const idx = start + w - 1;
                    const sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
                    return (
                      <td key={w}>
                        <input type="text" className="zone-admin-by" data-w={w} defaultValue={sw.checkedBy || ''} />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <p className="admin-note" style={{ marginTop: 8 }}>
          Total and Checked By appear in the free area below (one value per week).
        </p>
        <div className="admin-actions">
          <button className="admin-primary-btn" id="zoneTableSave" type="button" onClick={saveTable}>
            Save Table
          </button>
        </div>
        <span id="zoneTableStatus" className="admin-status" aria-live="polite">
          {tableStatus}
        </span>
        <h3 style={{ marginTop: 24 }}>Observations (7 columns, max 3 per week)</h3>
        <div className="zone-admin-obs-scroll">
          <table className="zone-obs-table zone-obs-table--admin" id="zoneAdminObsTable">
            <thead>
              <tr>
                <th>Week no</th>
                <th>Location</th>
                <th>Observation</th>
                <th>Corrective Action</th>
                <th>Resp</th>
                <th>Target Date</th>
                <th>Completed Date</th>
              </tr>
            </thead>
            <tbody id="zoneAdminObsBody" ref={obsRef} key={`obs-${zoneId}`}>
              {Array.from({ length: 52 }, (_, weekIdx) => {
                const week = weekIdx + 1;
                const obs = zd.observations || [];
                const byWeek = {};
                obs.forEach((o) => {
                  const wn = o.weekNo || 1;
                  if (!byWeek[wn]) byWeek[wn] = [];
                  if (byWeek[wn].length < 3) byWeek[wn].push(o);
                });
                const rows = byWeek[week] || [];
                return [0, 1, 2].map((slot) => {
                  const row =
                    rows[slot] || {
                      weekNo: week,
                      location: '',
                      observation: '',
                      correctiveAction: '',
                      resp: '',
                      targetDate: '',
                      completedDate: '',
                    };
                  return (
                    <tr key={`${week}-${slot}`} data-week={week} data-slot={slot}>
                      <td>{slot === 0 ? week : ''}</td>
                      <td>
                        <input type="text" className="zone-admin-obs-loc" defaultValue={row.location || ''} />
                      </td>
                      <td>
                        <input type="text" className="zone-admin-obs-obs" defaultValue={row.observation || ''} />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="zone-admin-obs-corrective"
                          defaultValue={row.correctiveAction || ''}
                        />
                      </td>
                      <td>
                        <input type="text" className="zone-admin-obs-resp" defaultValue={row.resp || ''} />
                      </td>
                      <td>
                        <input type="text" className="zone-admin-obs-target" defaultValue={row.targetDate || ''} />
                      </td>
                      <td>
                        <input type="text" className="zone-admin-obs-completed" defaultValue={row.completedDate || ''} />
                      </td>
                    </tr>
                  );
                });
              })}
            </tbody>
          </table>
        </div>
        <div className="admin-actions">
          <button className="admin-primary-btn" id="zoneObsSave" type="button" onClick={saveObs}>
            Save Observations
          </button>
        </div>
        <span id="zoneObsStatus" className="admin-status" aria-live="polite">
          {obsStatus}
        </span>
      </div>
    </section>
  );
}
