import React from 'react';
import './PwaInstallModal.css';

/**
 * PwaInstallModal Component
 * Handles the two-phase installation UX:
 * 1. Immediate browser downloading & asset caching with progress bar (0% -> 100%)
 * 2. Install confirmation prompt asking user to Install App or Cancel
 */
const PwaInstallModal = ({
  isOpen,
  state, // 'downloading' | 'prompt'
  progress = 0,
  lang = 'en',
  userRole = 'farmer',
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !state) return null;

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
              {lang === 'fil' ? 'I-dinadownload sa Browser...' : 'Downloading to Browser...'}
            </h3>
            <p className="pwa-download-desc">
              {progress < 45
                ? (lang === 'fil' ? 'Kinukuha ang application shell at offline packages...' : 'Downloading app shell & offline packages...')
                : progress < 85
                ? (lang === 'fil' ? 'I-sinasave ang mga larawan at modelo sa browser cache...' : 'Caching produce images and AI forecast assets...')
                : (lang === 'fil' ? 'Tinatapos ang pag-download sa browser...' : 'Finalizing browser installation package...')}
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
                  : (lang === 'fil' ? 'Naglo-load...' : 'Loading...')}
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
                ? 'Nai-download na ang app sa iyong browser. Nais mo bang i-install ito sa iyong device para magamit kahit walang internet at mailagay sa iyong Home Screen?'
                : 'The app package has been downloaded to your browser. Would you like to install it on your device for fast home screen access and offline support?'}
            </p>

            <div className="pwa-features-list">
              <div className="pwa-feature-item">
                <span className="pwa-feat-check">✓</span>
                <span>{lang === 'fil' ? 'Mabilis buksan mula sa Home Screen o Desktop' : 'Instant launch from Home Screen or Desktop'}</span>
              </div>
              <div className="pwa-feature-item">
                <span className="pwa-feat-check">✓</span>
                <span>{lang === 'fil' ? 'Gumagana kahit mahina o walang internet' : 'Full offline access without continuous internet'}</span>
              </div>
              <div className="pwa-feature-item">
                <span className="pwa-feat-check">✓</span>
                <span>{lang === 'fil' ? '100% Libre at walang anunsyo o bayad' : '100% Free, secure, and lightweight for farmers'}</span>
              </div>
            </div>

            <div className="pwa-prompt-actions">
              <button
                type="button"
                className="pwa-btn-cancel"
                onClick={onCancel}
              >
                {lang === 'fil' ? 'Kanselahin' : 'Cancel'}
              </button>
              <button
                type="button"
                className="pwa-btn-confirm"
                onClick={onConfirm}
              >
                <span>📲</span>
                <span>{lang === 'fil' ? 'I-install ang App' : 'Install App'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PwaInstallModal;
