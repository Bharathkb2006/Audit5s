import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import About5sPage from './pages/About5sPage';
import OrganogramPage from './pages/OrganogramPage';
import LayoutsPage from './pages/LayoutsPage';
import LayoutFullPage from './pages/LayoutFullPage';
import SummaryLikePage from './pages/SummaryLikePage';
import FppPage from './pages/FppPage';
import FppMonthLayoutPage from './pages/FppMonthLayoutPage';
import FppPhotosPage from './pages/FppPhotosPage';
import FiveSZonesPage from './pages/FiveSZonesPage';
import ZoneDetailPage from './pages/ZoneDetailPage';
import SPage from './pages/SPage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/about5s" element={<About5sPage />} />
      <Route path="/About5s" element={<Navigate to="/about5s" replace />} />
      <Route path="/5sornogram" element={<OrganogramPage />} />
      <Route path="/layouts" element={<LayoutsPage />} />
      <Route path="/fpp" element={<FppPage />} />
      <Route path="/fpp-month-layout" element={<FppMonthLayoutPage />} />
      <Route path="/fpp-photos" element={<FppPhotosPage />} />
      <Route path="/summary" element={<SummaryLikePage mode="summary" backTo="/" ariaBack="Back" titleAlt="Summary" />} />
      <Route path="/5szones" element={<FiveSZonesPage />} />
      <Route path="/5szone-detail" element={<ZoneDetailPage />} />
      <Route path="/bestzone" element={<SummaryLikePage mode="best" backTo="/5szones" ariaBack="Back" titleAlt="Best Zone" />} />
      <Route
        path="/barcutting-layout"
        element={
          <LayoutFullPage
            backTo="/layouts"
            ariaBack="Back to Layouts"
            imgId="barcuttingLayoutImage"
            legacyKey="barcuttingLayoutImage"
            storedFlag="barcuttingLayoutStored"
            idbKey="barcuttingLayout"
            alt="Barcutting layout"
          />
        }
      />
      <Route
        path="/ground-floor-layout"
        element={
          <LayoutFullPage
            backTo="/layouts"
            ariaBack="Back to Layouts"
            imgId="groundFloorLayoutImage"
            legacyKey="groundFloorLayoutImage"
            storedFlag="groundFloorLayoutStored"
            idbKey="groundFloorLayout"
            alt="Ground floor layout"
          />
        }
      />
      <Route
        path="/first-floor-layout"
        element={
          <LayoutFullPage
            backTo="/layouts"
            ariaBack="Back to Layouts"
            imgId="firstFloorLayoutImage"
            legacyKey="firstFloorLayoutImage"
            storedFlag="firstFloorLayoutStored"
            idbKey="firstFloorLayout"
            alt="First floor layout"
          />
        }
      />
      <Route
        path="/second-floor-layout"
        element={
          <LayoutFullPage
            backTo="/layouts"
            ariaBack="Back to Layouts"
            imgId="secondFloorLayoutImage"
            legacyKey="secondFloorLayoutImage"
            storedFlag="secondFloorLayoutStored"
            idbKey="secondFloorLayout"
            alt="Second floor layout"
          />
        }
      />
      <Route path="/1s" element={<SPage n={1} />} />
      <Route path="/2s" element={<SPage n={2} />} />
      <Route path="/3s" element={<SPage n={3} />} />
      <Route path="/4s" element={<SPage n={4} />} />
      <Route path="/5s" element={<SPage n={5} />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
