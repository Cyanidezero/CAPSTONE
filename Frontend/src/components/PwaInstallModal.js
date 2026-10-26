import React from 'react';
import './PwaInstallModal.css';

/**
 * PwaInstallModal Component
 * Handles mobile and desktop PWA installation:
 * 1. Immediate browser downloading & asset caching with progress bar (0% -> 100%)
 * 2. Install confirmation prompt with native one-click install or visual mobile instructions
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
              {lang === 'fil' ? 'I-dinadownload sa Browser...' : 'Downloading to Device...'}
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
              {lang === 'fil' ? 'I-install ang ClimaYield-X sa Cellphone' : 'Install ClimaYield-X on Mobile Phone'}
            </h3>

            <p className="pwa-prompt-desc">
              {lang === 'fil'
                ? 'I-save ang ClimaYield-X diretso sa iyong cellphone bilang isang standalone app para mabilis mabuksan sa Home Screen kahit mahina ang internet.'
                : 'Install ClimaYield-X directly onto your mobile phone as a standalone app with instant Home Screen access and offline readiness.'}
            </p>

            {/* Mobile-Specific Installation Guidance */}
            <div className="pwa-features-list">
              {hasNativePrompt ? (
                <>
                  <div className="pwa-feature-item">
                    <span className="pwa-feat-check">✓</span>
                    <span>{lang === 'fil' ? '1-Click Install sa Home Screen ng cellphone' : '1-Click Install to Phone Home Screen'}</span>
                  </div>
                  <div className="pwa-feature-item">
                    <span className="pwa-feat-check">✓</span>
                    <span>{lang === 'fil' ? 'Bumubukas nang mabilis na walang browser address bar' : 'Opens standalone like a native mobile app'}</span>
                  </div>
                  <div className="pwa-feature-item">
                    <span className="pwa-feat-check">✓</span>
                    <span>{lang === 'fil' ? '100% Libre at magaan sa cellphone' : '100% Free, secure, and lightweight'}</span>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 800, color: '#15803d', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>📲</span>
                    <span>{lang === 'fil' ? 'Mga Hakbang sa Pag-install sa Cellphone:' : 'Quick Steps to Install on Phone:'}</span>
                  </div>
                  {isIOS ? (
                    <div style={{ lineHeight: '1.45', color: '#334155' }}>
                      <strong>iPhone (Safari):</strong> {lang === 'fil' ? 'Pindutin ang Share button (⎋ sa ibaba ng Safari), i-scroll at piliin ang "Add to Home Screen" (➕).' : 'Tap the Share icon (⎋ at bottom of Safari), scroll down and tap "Add to Home Screen" (➕).'}
                    </div>
                  ) : (
                    <div style={{ lineHeight: '1.45', color: '#334155' }}>
                      <strong>Android (Chrome):</strong> {lang === 'fil' ? 'Pindutin ang 3 dots (⋮) sa taas sa kanan ng Chrome, at pindutin ang "Install app" o "Add to Home screen" (📲).' : 'Tap the 3 dots (⋮) menu in Chrome, then tap "Install app" or "Add to Home screen" (📲).'}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="pwa-prompt-actions">
              <button
                type="button"
                className="pwa-btn-cancel"
                onClick={onCancel}
              >
                {lang === 'fil' ? 'Isara' : 'Close'}
              </button>
              <button
                type="button"
                className="pwa-btn-confirm"
                onClick={onConfirm}
              >
                <span>📲</span>
                <span>{hasNativePrompt ? (lang === 'fil' ? 'I-install Na' : 'Install Now') : (lang === 'fil' ? 'Naiintindihan Ko' : 'Got It')}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PwaInstallModal;
