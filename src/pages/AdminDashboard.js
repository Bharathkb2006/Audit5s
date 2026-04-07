import React, { useCallback, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppProvider';
import { defaultFppContent } from '../lib/defaults';
import { uploadPublicFile } from '../lib/firebase/storageUpload';
import AdminZonePanel from '../admin/AdminZonePanel';

const MEDIA_KEYS = [
  ['about5sVideoFile', 'about5sVideo', 'about5sVideoStored'],
  ['s1VideoFile', 's1Video', 's1VideoStored'],
  ['s2VideoFile', 's2Video', 's2VideoStored'],
  ['s3VideoFile', 's3Video', 's3VideoStored'],
  ['s4VideoFile', 's4Video', 's4VideoStored'],
  ['s5VideoFile', 's5Video', 's5VideoStored'],
  ['s1ImageFile', 's1Image', 's1ImageStored'],
  ['s2ImageFile', 's2Image', 's2ImageStored'],
  ['s3ImageFile', 's3Image', 's3ImageStored'],
  ['s4ImageFile', 's4Image', 's4ImageStored'],
  ['s5ImageFile', 's5Image', 's5ImageStored'],
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { adminAuthed, logoutAdmin, putBiMedia, clearAllMediaStorage, fppData, setFppData } = useApp();

  const [pendingMedia, setPendingMedia] = useState({});
  const [mediaStatus, setMediaStatus] = useState('');
  const [orgPending, setOrgPending] = useState(null);
  const [orgStatus, setOrgStatus] = useState('');
  const [layoutPending, setLayoutPending] = useState({});
  const [layoutStatus, setLayoutStatus] = useState('');
  const [sumPending, setSumPending] = useState({});
  const [sumStatus, setSumStatus] = useState('');
  const [bestPending, setBestPending] = useState({});
  const [bestStatus, setBestStatus] = useState('');
  const [worstPending, setWorstPending] = useState({});
  const [worstStatus, setWorstStatus] = useState('');
  const [fppTableStatus, setFppTableStatus] = useState('');
  const [monthWiseStatus, setMonthWiseStatus] = useState('');
  const [photosStatus, setPhotosStatus] = useState('');

  const saveMedia = async () => {
    if (!Object.keys(pendingMedia).length) {
      setMediaStatus('Choose a file first.');
      return;
    }
    setMediaStatus('Saving…');
    try {
      for (const [fileKey, storeKey] of MEDIA_KEYS) {
        const file = pendingMedia[fileKey];
        if (file) await putBiMedia(storeKey, file);
      }
      setPendingMedia({});
      setMediaStatus('Saved.');
    } catch {
      setMediaStatus('Save failed.');
    }
  };

  const saveOrganogram = async () => {
    if (!orgPending) {
      setOrgStatus('Choose a file first.');
      return;
    }
    setOrgStatus('Saving…');
    try {
      await putBiMedia('organogramImage', orgPending);
      setOrgPending(null);
      setOrgStatus('Saved.');
    } catch {
      setOrgStatus('Save failed.');
    }
  };

  const saveLayouts = async () => {
    const map = [
      ['barcutting', 'barcuttingLayout', 'barcuttingLayoutStored', 'barcuttingLayoutImage'],
      ['ground', 'groundFloorLayout', 'groundFloorLayoutStored', 'groundFloorLayoutImage'],
      ['first', 'firstFloorLayout', 'firstFloorLayoutStored', 'firstFloorLayoutImage'],
      ['second', 'secondFloorLayout', 'secondFloorLayoutStored', 'secondFloorLayoutImage'],
    ];
    const hasAny = map.some(([k]) => layoutPending[k]);
    if (!hasAny) {
      setLayoutStatus('Choose at least one layout image first.');
      return;
    }
    setLayoutStatus('Saving…');
    try {
      for (const [keyName, storageKey] of map) {
        const file = layoutPending[keyName];
        if (file) await putBiMedia(storageKey, file);
      }
      setLayoutPending({});
      setLayoutStatus('Saved.');
    } catch {
      setLayoutStatus('Save failed.');
    }
  };

  const saveSummaryImages = async () => {
    const items = [
      ['one', 'summaryImage1', 'summaryImage1Stored', 'summaryImage1'],
      ['two', 'summaryImage2', 'summaryImage2Stored', 'summaryImage2'],
      ['three', 'summaryImage3', 'summaryImage3Stored', 'summaryImage3'],
    ];
    const hasAny = items.some(([k]) => sumPending[k]);
    if (!hasAny) {
      setSumStatus('Choose at least one summary image first.');
      return;
    }
    setSumStatus('Saving…');
    try {
      for (const [pk, storeKey] of items) {
        const file = sumPending[pk];
        if (file) await putBiMedia(storeKey, file);
      }
      setSumPending({});
      setSumStatus('Saved.');
    } catch {
      setSumStatus('Save failed.');
    }
  };

  const saveBest = async () => {
    if (!bestPending.best1 && !bestPending.best2) {
      setBestStatus('Choose at least one Best Zone image first.');
      return;
    }
    setBestStatus('Saving…');
    try {
      if (bestPending.best1) await putBiMedia('bestZoneImage1', bestPending.best1);
      if (bestPending.best2) await putBiMedia('bestZoneImage2', bestPending.best2);
      setBestPending({});
      setBestStatus('Saved.');
    } catch {
      setBestStatus('Save failed.');
    }
  };

  const saveWorst = async () => {
    if (!worstPending.w1 && !worstPending.w2) {
      setWorstStatus('Choose at least one Worst Zone image first.');
      return;
    }
    setWorstStatus('Saving…');
    try {
      if (worstPending.w1) await putBiMedia('worstZoneImage1', worstPending.w1);
      if (worstPending.w2) await putBiMedia('worstZoneImage2', worstPending.w2);
      setWorstPending({});
      setWorstStatus('Saved.');
    } catch {
      setWorstStatus('Save failed.');
    }
  };

  const saveFppTable = useCallback(() => {
    try {
      const base = fppData && typeof fppData === 'object' ? JSON.parse(JSON.stringify(fppData)) : defaultFppContent();
      base.fpp = base.fpp || {};
      base.fpp.unit = '18';
      base.fpp.rows = [];
      for (let i = 1; i <= 16; i++) {
        const id = String(i);
        const z1 = document.getElementById(`zoneNo${id}`);
        const z2 = document.getElementById(`zoneDesc${id}`);
        const z3 = document.getElementById(`fppNo${id}`);
        const z4 = document.getElementById(`fppDesc${id}`);
        base.fpp.rows.push({
          id,
          slNo: i,
          zoneNo: z1?.value?.trim() || '',
          zoneDesc: z2?.value?.trim() || '',
          fppNo: z3?.value?.trim() || '',
          fppDesc: z4?.value?.trim() || '',
        });
      }
      setFppData(base);
      setFppTableStatus('Saved.');
    } catch (e) {
      setFppTableStatus(e?.message || 'Save failed');
    }
  }, [fppData, setFppData]);

  const saveMonthWise = async () => {
    const inp = document.getElementById('monthWiseInput');
    const file = inp?.files?.[0];
    if (!file) {
      setMonthWiseStatus('Choose an image first.');
      return;
    }
    setMonthWiseStatus('Saving…');
    try {
      const next = JSON.parse(JSON.stringify(fppData || defaultFppContent()));
      next.assets = next.assets || {};
      const url = await uploadPublicFile('fpp/month-wise', file);
      next.assets.monthWiseLayoutUrl = url;
      delete next.assets.monthWiseLayoutKey;
      setFppData(next);
      inp.value = '';
      setMonthWiseStatus('Saved.');
    } catch {
      setMonthWiseStatus('Save failed.');
    }
  };

  const saveFppPhotos = async () => {
    setPhotosStatus('Saving…');
    try {
      const next = JSON.parse(JSON.stringify(fppData || defaultFppContent()));
      next.fppPhotos = next.fppPhotos && typeof next.fppPhotos === 'object' ? { ...next.fppPhotos } : {};
      let any = false;
      for (let i = 1; i <= 16; i++) {
        const id = String(i);
        const main = document.getElementById(`main${id}`);
        const snap = document.getElementById(`snap${id}`);
        const mainFile = main?.files?.[0];
        const snapFile = snap?.files?.[0];
        if (!mainFile && !snapFile) continue;
        any = true;
        const photos = { ...(next.fppPhotos[id] || {}) };
        if (mainFile) {
          photos.mainUrl = await uploadPublicFile(`fpp/row-${id}/main`, mainFile);
          delete photos.mainKey;
        }
        if (snapFile) {
          photos.snapshotUrl = await uploadPublicFile(`fpp/row-${id}/snapshot`, snapFile);
          delete photos.snapshotKey;
        }
        next.fppPhotos[id] = photos;
      }
      if (!any) {
        setPhotosStatus('Choose at least one photo to upload.');
        return;
      }
      setFppData(next);
      for (let c = 1; c <= 16; c++) {
        const m = document.getElementById(`main${c}`);
        const s = document.getElementById(`snap${c}`);
        if (m) m.value = '';
        if (s) s.value = '';
      }
      setPhotosStatus('Saved.');
    } catch {
      setPhotosStatus('Save failed.');
    }
  };

  if (!adminAuthed) {
    return <Navigate to="/admin-login" replace />;
  }

  const fpp = fppData?.fpp || { rows: [] };

  return (
    <div className="admin-page-body">
      <header className="admin-header">
        <div className="admin-title">
          <h1>Admin Dashboard</h1>
          <p>Admin area.</p>
        </div>
        <div className="admin-actions">
          <button
            className="admin-secondary-btn"
            id="clearStorageBtn"
            type="button"
            onClick={() => clearAllMediaStorage()}
          >
            Clear Media Storage
          </button>
          <button
            className="admin-secondary-btn"
            id="logoutBtn"
            type="button"
            onClick={async () => {
              await logoutAdmin();
              navigate('/');
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <main className="admin-dashboard">
        <section className="admin-section">
          <h2>About 5S / 1S–5S (Media)</h2>
          <p className="admin-note">Choose media files (1920×1080 recommended). Videos play autoplay+loop on the pages.</p>
          <div className="admin-form admin-media-grid">
            {[
              ['about5sVideoFile', 'About 5S video'],
              ['s1VideoFile', '1S video'],
              ['s1ImageFile', '1S image'],
              ['s2VideoFile', '2S video'],
              ['s2ImageFile', '2S image'],
              ['s3VideoFile', '3S video'],
              ['s3ImageFile', '3S image'],
              ['s4VideoFile', '4S video'],
              ['s4ImageFile', '4S image'],
              ['s5VideoFile', '5S video'],
              ['s5ImageFile', '5S image'],
            ].map(([id, label]) => (
              <label key={id} className="admin-field">
                {label}
                <input
                  id={id}
                  type="file"
                  accept={id.includes('Video') ? 'video/*' : 'image/*'}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setPendingMedia((p) => ({ ...p, [id]: f }));
                      setMediaStatus('Ready to save. Click “Save”.');
                    }
                  }}
                />
              </label>
            ))}
            <div className="admin-actions admin-media-actions">
              <button
                className="admin-primary-btn admin-save"
                id="mediaSave"
                type="button"
                disabled={!Object.keys(pendingMedia).length}
                onClick={saveMedia}
              >
                Save
              </button>
            </div>
            <span id="mediaStatus" className="admin-status" aria-live="polite">
              {mediaStatus}
            </span>
          </div>
        </section>

        <section className="admin-section" id="organogramSection">
          <h2>5S Organogram</h2>
          <p className="admin-note">Upload the Organogram image. It will show in `5sornogram.html`.</p>
          <div className="admin-form">
            <label className="admin-field">
              Choose file
              <input
                id="organogramUpload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setOrgPending(f || null);
                  if (f) setOrgStatus('Ready to save. Click “Save”.');
                }}
              />
            </label>
            <div className="admin-actions">
              <button
                className="admin-primary-btn admin-save"
                id="organogramSave"
                type="button"
                disabled={!orgPending}
                onClick={saveOrganogram}
              >
                Save
              </button>
            </div>
            <span id="status" className="admin-status" aria-live="polite">
              {orgStatus}
            </span>
          </div>
        </section>

        <section className="admin-section" id="layoutsSection">
          <h2>Layouts (1920×1080 images)</h2>
          <p className="admin-note">Upload one image for each layout. They will show on the full-screen layout pages.</p>
          <div className="admin-form">
            {[
              ['layoutBarcuttingUpload', 'barcutting', 'Barcutting layout image'],
              ['layoutGroundUpload', 'ground', 'Ground floor layout image'],
              ['layoutFirstUpload', 'first', 'First floor layout image'],
              ['layoutSecondUpload', 'second', 'Second floor layout image'],
            ].map(([inpId, key, label]) => (
              <label key={inpId} className="admin-field">
                {label}
                <input
                  id={inpId}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setLayoutPending((p) => ({ ...p, [key]: f }));
                      setLayoutStatus('Ready to save. Click “Save”.');
                    }
                  }}
                />
              </label>
            ))}
            <div className="admin-actions">
              <button
                className="admin-primary-btn admin-save"
                id="layoutsSave"
                type="button"
                disabled={!Object.keys(layoutPending).length}
                onClick={saveLayouts}
              >
                Save
              </button>
            </div>
            <span id="layoutsStatus" className="admin-status" aria-live="polite">
              {layoutStatus}
            </span>
          </div>
        </section>

        <section className="admin-section" id="summaryImagesSection">
          <h2>Summary Page Images</h2>
          <p className="admin-note">
            Upload up to three images for the Summary page carousel. All images will display at the same size as the
            current layout image.
          </p>
          <div className="admin-form">
            {[
              ['summaryImage1Upload', 'one', 'Summary image 1'],
              ['summaryImage2Upload', 'two', 'Summary image 2'],
              ['summaryImage3Upload', 'three', 'Summary image 3'],
            ].map(([id, pk, label]) => (
              <label key={id} className="admin-field">
                {label}
                <input
                  id={id}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSumPending((p) => ({ ...p, [pk]: f }));
                      setSumStatus('Ready to save. Click “Save”.');
                    }
                  }}
                />
              </label>
            ))}
            <div className="admin-actions">
              <button
                className="admin-primary-btn admin-save"
                id="summaryImagesSave"
                type="button"
                disabled={!Object.keys(sumPending).length}
                onClick={saveSummaryImages}
              >
                Save
              </button>
            </div>
            <span id="summaryImagesStatus" className="admin-status" aria-live="polite">
              {sumStatus}
            </span>
          </div>
        </section>

        <AdminZonePanel />

        <section className="admin-section" id="bestWorstZoneSection">
          <h2>Best Zone (2 Slides)</h2>
          <p className="admin-note">Upload 2 images for Best Zone. These show on `bestzone.html` (2-slide carousel like Summary).</p>
          <div className="admin-form">
            <div className="admin-subsection">
              <h3 className="admin-subtitle-h3">Best Zone</h3>
              <label className="admin-field">
                Best zone image 1
                <input
                  id="bestZoneImage1Upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setBestPending((p) => ({ ...p, best1: f }));
                      setBestStatus('Ready to save. Click “Save”.');
                    }
                  }}
                />
              </label>
              <label className="admin-field">
                Best zone image 2
                <input
                  id="bestZoneImage2Upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setBestPending((p) => ({ ...p, best2: f }));
                      setBestStatus('Ready to save. Click “Save”.');
                    }
                  }}
                />
              </label>
              <div className="admin-actions">
                <button
                  className="admin-primary-btn admin-save"
                  id="bestZoneSave"
                  type="button"
                  disabled={!bestPending.best1 && !bestPending.best2}
                  onClick={saveBest}
                >
                  Save
                </button>
              </div>
              <span id="bestZoneStatus" className="admin-status" aria-live="polite">
                {bestStatus}
              </span>
            </div>
          </div>
        </section>

        <section className="admin-section" id="worstZoneSection">
          <h2>Worst Zone (2 Slides)</h2>
          <p className="admin-note">Upload 2 images for Worst Zone (same carousel behavior as Best Zone).</p>
          <div className="admin-form">
            <label className="admin-field">
              Worst zone image 1
              <input
                id="worstZoneImage1Upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setWorstPending((p) => ({ ...p, w1: f }));
                    setWorstStatus('Ready to save. Click “Save”.');
                  }
                }}
              />
            </label>
            <label className="admin-field">
              Worst zone image 2
              <input
                id="worstZoneImage2Upload"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setWorstPending((p) => ({ ...p, w2: f }));
                    setWorstStatus('Ready to save. Click “Save”.');
                  }
                }}
              />
            </label>
            <div className="admin-actions">
              <button
                className="admin-primary-btn admin-save"
                id="worstZoneSave"
                type="button"
                disabled={!worstPending.w1 && !worstPending.w2}
                onClick={saveWorst}
              >
                Save
              </button>
            </div>
            <span id="worstZoneStatus" className="admin-status" aria-live="polite">
              {worstStatus}
            </span>
          </div>
        </section>

        <section className="admin-section" id="fppSection">
          <h2>FPP Management</h2>
          <p className="admin-note">Edit 16 rows and upload month wise + row photos.</p>
          <div className="admin-form admin-grid">
            <div>
              <h3 style={{ fontSize: 16, margin: '6px 0 10px' }}>FPP Table (16 rows)</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Sl</th>
                    <th>5S Zone No</th>
                    <th>5S Zone Desc</th>
                    <th>FPP No</th>
                    <th>FPP Desc</th>
                  </tr>
                </thead>
                <tbody id="tableBody">
                  {Array.from({ length: 16 }, (_, i) => {
                    const id = String(i + 1);
                    const row = fpp.rows?.find((r) => String(r.id) === id) || {};
                    return (
                      <tr key={id}>
                        <td>{i + 1}</td>
                        <td>
                          <input id={`zoneNo${id}`} type="text" defaultValue={row.zoneNo || ''} />
                        </td>
                        <td>
                          <input id={`zoneDesc${id}`} type="text" defaultValue={row.zoneDesc || ''} />
                        </td>
                        <td>
                          <input id={`fppNo${id}`} type="text" defaultValue={row.fppNo || ''} />
                        </td>
                        <td>
                          <input id={`fppDesc${id}`} type="text" defaultValue={row.fppDesc || ''} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="admin-actions">
                <button className="admin-primary-btn" id="saveTableBtn" type="button" onClick={saveFppTable}>
                  Save Table
                </button>
                <span id="tableStatus" className="admin-status">
                  {fppTableStatus}
                </span>
              </div>
              <div style={{ marginTop: 20 }}>
                <h3 style={{ fontSize: 16, margin: '6px 0 10px' }}>Month Wise Layout</h3>
                <label className="admin-field">
                  Upload image
                  <input id="monthWiseInput" type="file" accept="image/*" />
                </label>
                <div className="admin-actions">
                  <button className="admin-primary-btn" id="saveMonthWiseBtn" type="button" onClick={saveMonthWise}>
                    Save Month Wise
                  </button>
                  <span id="monthWiseStatus" className="admin-status">
                    {monthWiseStatus}
                  </span>
                </div>
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 16, margin: '6px 0 10px' }}>Row Photos (2 photos each)</h3>
              <div className="photos-block" id="photosBlock">
                {Array.from({ length: 16 }, (_, i) => {
                  const id = String(i + 1);
                  return (
                    <div key={id} className="photo-row">
                      <h3>Row {id}</h3>
                      <label className="admin-field">
                        Fixed point photograph
                        <input id={`main${id}`} type="file" accept="image/*" />
                      </label>
                      <label className="admin-field">
                        Actual snapshot on shop floor
                        <input id={`snap${id}`} type="file" accept="image/*" />
                      </label>
                    </div>
                  );
                })}
              </div>
              <div className="admin-actions">
                <button className="admin-primary-btn" id="savePhotosBtn" type="button" onClick={saveFppPhotos}>
                  Save Photos
                </button>
                <span id="photosStatus" className="admin-status">
                  {photosStatus}
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
