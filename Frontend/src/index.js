import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/App.css';
import App from './components/App';
import { startAutoUpdater, clearCachesAndReload } from './utils/autoUpdater';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 🚀 Start continuous automatic system update detection
startAutoUpdater();

// Register Progressive Web App (PWA) Service Worker with automatic update reload
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = `${process.env.PUBLIC_URL || ''}/service-worker.js`;
    navigator.serviceWorker
      .register(swUrl)
      .then((reg) => {
        console.log('🌾 ClimaYield-X PWA Service Worker registered:', reg.scope);

        // Check for updates on every page load
        reg.update().catch(() => {});

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🌾 New version installed! Auto-refreshing for evaluator...');
                clearCachesAndReload();
              }
            });
          }
        });
      })
      .catch(() => {
        navigator.serviceWorker.register('/service-worker.js').catch(() => {});
      });
  });
}
