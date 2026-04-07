import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import { AppProvider } from './context/AppProvider';
import { getFirebaseApp } from './lib/firebase/app';
import { initFirebaseAnalytics } from './lib/firebase/analytics';

const fbApp = getFirebaseApp();
if (fbApp) {
  initFirebaseAnalytics(fbApp).catch(() => {});
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
