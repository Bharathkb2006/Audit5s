import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import App from './App';
import FirebaseBootstrap from './components/FirebaseBootstrap';
import { AppProvider } from './context/AppProvider';
import { getFirebaseApp } from './lib/firebase/app';
import { initFirebaseAnalytics } from './lib/firebase/analytics';
import { isFirebaseConfigured } from './lib/firebase/config';

const fbApp = getFirebaseApp();
if (fbApp) {
  initFirebaseAnalytics(fbApp).catch(() => {});
}

function Root() {
  if (!isFirebaseConfigured()) {
    return <FirebaseBootstrap kind="missingFirebase" />;
  }
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider>
        <App />
      </AppProvider>
    </BrowserRouter>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
