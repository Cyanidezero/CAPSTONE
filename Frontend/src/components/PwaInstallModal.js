import React from 'react';
import './PwaInstallModal.css';

/**
 * PwaInstallModal Component
 * 1. Downloads/prepares the app package (0% -> 100%)
 * 2. When done (100%), automatically pops out the prompt asking the user to "Install" or "Cancel"
 */
const PwaInstallModal = ({
  isOpen,
  state, // 'downloading' | 'prompt'
  progress = 0,
  lang = 'en',
  userRole = 'farmer',
  hasNativePrompt = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !state) return null;

  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return (
    <div 
      className="pwa-modal-backdrop" 
      onClick={state === 'prompt' ? onCancel : undefined}
    >
      <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
        {state === 'downloading' ? (
          <div className="pwa-download-view">
            <div className="pwa-download-icon-wrap">
              <div className="pwa-download-spinner" />
              <span className="pwa-download-icon">📥</span>
            </div>
            <h3 className="pwa-download-title">
              {lang === 'fil' ? 'I-dinadownload ang App...' : 'Downloading App Package...'}
            </h3>
            <p className="pwa-download-desc">
              {progress < 45
                ? (lang === 'fil' ? 'Kinukuha ang application shell at offline packages...' : 'Downloading app shell & offline packages...')
                : progress < 85
                ? (lang === 'fil' ? 'I-sinasave ang mga icon at modelo sa memorya...' : 'Caching icons and offline forecast assets...')
                : (lang === 'fil' ? 'Tinatapos ang pag-download ng app...' : 'Finalizing mobile installation package...')}
            </p>

            <div className="pwa-progress-track">
              <div 
                className="pwa-progress-fill" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <div className="pwa-progress-label">
              <span>{progress}%</span>
              <span>
                {progress === 100 
                  ? (lang === 'fil' ? 'Tapos na!' : 'Complete!') 
                  : (lang === 'fil' ? 'Naglo-load...' : 'Downloading...')}
              </span>
            </div>
          </div>
        ) : (
          <div className="pwa-prompt-view">
            <div className="pwa-app-badge-icon">
              <div className="pwa-icon-glow" />
              <span className="pwa-icon-emoji">🌾</span>
            </div>

            <div className="pwa-prompt-brand">
              <span className="pwa-brand-name">ClimaYield-X</span>
              <span className="pwa-brand-sub">
                {userRole === 'dev' ? 'Dev Suite' : 'Farmer Edition'}
              </span>
            </div>

            <h3 className="pwa-prompt-title">
              {lang === 'fil' ? 'I-install ang ClimaYield-X App?' : 'Install ClimaYield-X App?'}
            </h3>

            <p className="pwa-prompt-desc">
              {lang === 'fil'
                ? 'Tapos na ang pag-download. Gusto mo bang i-install ang ClimaYield-X diretso sa iyong device?'
                : 'Download complete. Do you want to install the ClimaYield-X app onto your device?'}
            </p>

            <div className="pwa-features-list">
              <div className="pwa-feature-item">
                <span className="pwa-feat-check">✓</span>
                <span>{lang === 'fil' ? '1-Click Install sa Home Screen ng iyong device' : '1-Click Install to your device Home Screen'}</span>
              </div>
              <div className="pwa-feature-item">
                <span className="pwa-feat-check">✓</span>
                <span>{lang === 'fil' ? 'Bumubukas nang mabilis na parang native app' : 'Opens standalone like a native mobile app'}</span>
              </div>
              <div className="pwa-feature-item">
                <span className="pwa-feat-check">✓</span>
                <span>{lang === 'fil' ? '100% Libre, ligtas, at magaan sa device' : '100% Free, secure, and lightweight'}</span>
              </div>
              {!hasNativePrompt && isIOS && (
                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#334155', lineHeight: '1.4' }}>
                  <strong>iPhone/iPad:</strong> {lang === 'fil'
                    ? 'Pindutin ang Share (⎋) sa Safari at piliin ang "Add to Home Screen" (➕).'
                    : 'Tap Share (⎋) in Safari and select "Add to Home Screen" (➕).'}
                </div>
              )}
            </div>

            <div className="pwa-prompt-actions">
              <button
                type="button"
                className="pwa-btn-cancel"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pwa-btn-confirm"
                onClick={onConfirm}
              >
                <span>📲</span>
                <span>Install</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PwaInstallModal;
