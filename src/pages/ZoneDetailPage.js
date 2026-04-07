import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useApp } from '../context/AppProvider';
import {
  computeTotalFromDaily,
  DEFAULT_LOCATION,
  emptyScoreWeek,
  ensureZoneMeta,
  getCheckpointsForZone,
  getZoneDataFromStore,
} from '../lib/zonesCore';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const PLACEHOLDER_SVG =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">' +
      '<rect width="100%" height="100%" fill="#f1f5f9"/>' +
      '<circle cx="100" cy="78" r="34" fill="#cbd5e1"/>' +
      '<path d="M40 176c10-38 34-56 60-56s50 18 60 56" fill="#cbd5e1"/>' +
      '</svg>'
  );

function scoresForChart(zoneData) {
  const scores = zoneData.scores || [];
  const out = [];
  for (let i = 0; i < 52; i++) {
    if (i >= scores.length) {
      out.push(0);
      continue;
    }
    const sw = scores[i] || emptyScoreWeek(i + 1);
    let total = Number(sw.total) || 0;
    if (!total && sw.dailyScores) total = computeTotalFromDaily(sw.dailyScores);
    out.push(total);
  }
  return out;
}

export default function ZoneDetailPage() {
  const [searchParams] = useSearchParams();
  const zoneId = Math.max(1, Math.min(16, parseInt(searchParams.get('zone') || '1', 10) || 1));
  const { zonesData } = useApp();
  const [windowStart, setWindowStart] = useState(1);
  const [slide, setSlide] = useState(0);
  const [champUrl, setChampUrl] = useState('');
  const [leaderUrl, setLeaderUrl] = useState('');

  const zoneData = useMemo(() => {
    const raw = getZoneDataFromStore(zonesData, zoneId);
    return ensureZoneMeta(zoneId, raw);
  }, [zonesData, zoneId]);

  useEffect(() => {
    const w = Math.max(1, Math.min(48, Number(zoneData.scoreWindowStart) || 1));
    setWindowStart(w);
  }, [zoneData.scoreWindowStart, zoneId]);

  useEffect(() => {
    document.body.classList.add('zone-detail-page', `zone-id-${zoneId}`);
    return () => {
      document.body.classList.remove('zone-detail-page', `zone-id-${zoneId}`);
    };
  }, [zoneId]);

  useEffect(() => {
    const m = zoneData.meta || {};
    setChampUrl((m.championPhotoUrl || '').trim());
    setLeaderUrl((m.leaderPhotoUrl || '').trim());
  }, [zoneId, zoneData]);

  const chartData = useMemo(() => {
    const labels = Array.from({ length: 52 }, (_, i) => String(i + 1));
    return {
      labels,
      datasets: [
        {
          label: 'Total',
          data: scoresForChart(zoneData),
          barThickness: 9,
          maxBarThickness: 12,
          minBarLength: 2,
          categoryPercentage: 0.9,
          barPercentage: 0.85,
          backgroundColor: 'rgba(26, 103, 189, 0.8)',
          borderColor: 'rgba(26, 103, 189, 1)',
          borderWidth: 1,
        },
      ],
    };
  }, [zoneData]);

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            afterLabel: (ctx) => `Total: ${ctx.raw}/25`,
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 25,
          ticks: { stepSize: 5 },
          title: { display: true, text: 'Total Value' },
        },
        x: {
          ticks: { autoSkip: true, maxRotation: 0 },
          title: { display: true, text: 'Weeks' },
        },
      },
    }),
    []
  );

  const checkpoints = getCheckpointsForZone(zoneId);
  const scores = zoneData.scores || [];
  const start = windowStart;
  const meta = zoneData.meta || {};

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSlide((s) => Math.min(1, s + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSlide((s) => Math.max(0, s - 1));
      }
    };
    const onClick = (e) => {
      if (e.target.closest?.('.s-back-btn')) return;
      if (e.target.closest?.('button')) return;
      const mid = window.innerWidth / 2;
      if (e.clientX >= mid) setSlide((s) => Math.min(1, s + 1));
      else setSlide((s) => Math.max(0, s - 1));
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('click', onClick);
    };
  }, []);

  const obsRows = useMemo(() => {
    const obs = zoneData.observations || [];
    const byWeek = {};
    obs.forEach((o) => {
      const wn = o.weekNo || 1;
      if (!byWeek[wn]) byWeek[wn] = [];
      if (byWeek[wn].length < 3) byWeek[wn].push(o);
    });
    const rows = [];
    for (let week = 1; week <= 52; week++) {
      const list = byWeek[week] || [];
      for (let slot = 0; slot < 3; slot++) {
        rows.push(
          list[slot] || {
            weekNo: week,
            location: '',
            observation: '',
            correctiveAction: '',
            resp: '',
            targetDate: '',
            completedDate: '',
          }
        );
      }
    }
    return rows;
  }, [zoneData.observations]);

  return (
    <>
      <Link to="/5szones" className="s-back-btn" aria-label="Back to 5S Zones">
        <span className="s-back-btn-icon" />
      </Link>
      <main className="zone-detail-main">
        <div className={`zone-detail-slide zone-detail-slide--scores${slide === 0 ? ' is-active' : ''}`} data-slide="0">
          <div className="zone-detail-slide-inner">
            <div className="zone-header-row">
              <aside className="zone-person-card" aria-label="Zone Champion">
                <div className="zone-person-title">Zone Champion</div>
                <div className="zone-person-photo">
                  <img id="zoneChampionImg" alt="Zone Champion" src={champUrl || PLACEHOLDER_SVG} />
                </div>
                <div className={`zone-person-name${meta.championName?.trim() ? '' : ' is-empty'}`} id="zoneChampionName">
                  {meta.championName?.trim() || 'Name'}
                </div>
              </aside>
              <div className="zone-title-wrap">
                <h1 className="zone-detail-title" id="zoneTitle">
                  {meta.title?.trim() || `ZONE - ${zoneId}`}
                </h1>
                <div className="zone-chart-wrap">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
              <aside className="zone-person-card" aria-label="Zone Leader">
                <div className="zone-person-title">Zone Leader</div>
                <div className="zone-person-photo">
                  <img id="zoneLeaderImg" alt="Zone Leader" src={leaderUrl || PLACEHOLDER_SVG} />
                </div>
                <div className={`zone-person-name${meta.leaderName?.trim() ? '' : ' is-empty'}`} id="zoneLeaderName">
                  {meta.leaderName?.trim() || 'Name'}
                </div>
              </aside>
            </div>
            <div className="zone-score-table-wrap">
              <div className="zone-week-range">
                <span>Weeks:</span>
                {[1, 6, 11, 16, 21, 26, 31, 36, 41, 48].map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`zone-range-btn${start === s ? ' is-active' : ''}`}
                    data-start={s}
                    onClick={() => setWindowStart(s)}
                  >
                    {s === 48 ? '48-52' : `${s}-${s + 4}`}
                  </button>
                ))}
              </div>
              <div className="zone-audit-table-wrap zone-audit-table-wrap--no-scroll">
                <table className="zone-audit-table zone-audit-table--readonly" id="zoneAuditTable">
                  <colgroup>
                    <col className="zone-col-location" />
                    <col className="zone-col-checkpoints" />
                    {Array.from({ length: 25 }, (_, i) => (
                      <col key={i} className="zone-col-day" />
                    ))}
                  </colgroup>
                  <thead>
                    <tr>
                      <th className="zone-audit-location" rowSpan="3">
                        Location
                      </th>
                      <th className="zone-audit-checkpoints" rowSpan="3">
                        Check Points
                      </th>
                      {[0, 1, 2, 3, 4].map((w) => {
                        const idx = start + w - 1;
                        const sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
                        return (
                          <th key={w} colSpan="5" className="zone-audit-week" data-w={w + 1}>
                            Week No: <span id={`zoneW${w + 1}No`}>{sw.weekNo || idx + 1}</span>
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="zone-audit-date-row">
                      {[0, 1, 2, 3, 4].map((w) => {
                        const idx = start + w - 1;
                        const sw = idx < scores.length ? scores[idx] : emptyScoreWeek(idx + 1);
                        return (
                          <th key={w} colSpan="5" className="zone-audit-week" data-w={w + 1}>
                            Dt: <span id={`zoneW${w + 1}Dt`}>{sw.date || ''}</span>
                          </th>
                        );
                      })}
                    </tr>
                    <tr className="zone-audit-day-row">
                      {[0, 1, 2, 3, 4].map((w) =>
                        [1, 2, 3, 4, 5].map((d) => <th key={`${w}-${d}`}>{d}</th>)
                      )}
                    </tr>
                  </thead>
                  <tbody id="zoneAuditBody">
                    {[0, 1, 2, 3, 4].map((r) => (
                      <tr key={r}>
                        {r === 0 ? (
                          <td className="zone-audit-location" rowSpan={7}>
                            {(zoneData.meta && zoneData.meta.location) || DEFAULT_LOCATION}
                          </td>
                        ) : null}
                        <td className="zone-audit-cp">{checkpoints[r] || ''}</td>
                        {[0, 1, 2, 3, 4].map((w) => {
                          const weekIndex = start + w - 1;
                          const sw = weekIndex < scores.length ? scores[weekIndex] : emptyScoreWeek(weekIndex + 1);
                          const row = sw.dailyScores[r] || [0, 0, 0, 0, 0];
                          return [0, 1, 2, 3, 4].map((d) => (
                            <td key={`${w}-${d}`} className="zone-audit-cell">
                              {row[d] || 0}
                            </td>
                          ));
                        })}
                      </tr>
                    ))}
                    <tr>
                      <td className="zone-audit-cp">Total Marks</td>
                      {[0, 1, 2, 3, 4].map((w) => {
                        const weekIndex2 = start + w - 1;
                        const sw2 = weekIndex2 < scores.length ? scores[weekIndex2] : emptyScoreWeek(weekIndex2 + 1);
                        let t = Number(sw2.total) || 0;
                        if (!t && sw2.dailyScores) t = computeTotalFromDaily(sw2.dailyScores);
                        return (
                          <td key={w} colSpan={5} className="zone-audit-total-cell">
                            {t}/25
                          </td>
                        );
                      })}
                    </tr>
                    <tr>
                      <td className="zone-audit-cp">Checked By</td>
                      {[0, 1, 2, 3, 4].map((w) => {
                        const weekIndex3 = start + w - 1;
                        const sw3 = weekIndex3 < scores.length ? scores[weekIndex3] : emptyScoreWeek(weekIndex3 + 1);
                        return (
                          <td key={w} colSpan={5} className="zone-audit-by-cell">
                            {sw3.checkedBy || ''}
                          </td>
                        );
                      })}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div
          className={`zone-detail-slide zone-detail-slide--observations${slide === 1 ? ' is-active' : ''}`}
          data-slide="1"
        >
          <div className="zone-detail-slide-inner">
            <h2 className="zone-obs-title">Observations & Corrective Actions</h2>
            <div className="zone-obs-table-scroll">
              <table className="zone-obs-table" id="zoneObsTable">
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
                <tbody id="zoneObsBody">
                  {obsRows.map((row, idx) => {
                    const weekNum = Math.floor(idx / 3) + 1;
                    const slot = idx % 3;
                    return (
                      <tr key={idx}>
                        <td className="zone-obs-weekno">{slot === 0 ? weekNum : ''}</td>
                        <td>{row.location || ''}</td>
                        <td>{row.observation || ''}</td>
                        <td>{row.correctiveAction || ''}</td>
                        <td>{row.resp || ''}</td>
                        <td>{row.targetDate || ''}</td>
                        <td>{row.completedDate || ''}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
