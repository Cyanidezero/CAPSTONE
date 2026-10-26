import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './components/App.css';
import App from './components/App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register Progressive Web App (PWA) Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('🌾 ClimaYield-X PWA Service Worker registered:', reg.scope);
      })
      .catch((err) => {
        console.log('Service Worker registration skipped/failed:', err);
      });
  });
}