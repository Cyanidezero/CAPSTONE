import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
// Import Modular Components
import Dashboard from './Dashboard';
import WeatherMonitor from './WeatherMonitor';
import DataManagement from './Datamanagement';
import ModelTraining from './Modeltraining';
import Predictions from './Prediction';
import Recommendations from './Recommendations';
import Login from './Login';
import PwaInstallModal from './PwaInstallModal';
import { isFarmerOnlyMode } from '../utils/portalMode';
import { API_URL } from '../utils/apiConfig';
import { DevDashboardLogo, DevDataManagementLogo, DevPipelineLogo, DevBrandLogo } from './DevIcons';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  const [user, setUser] = useState(() => {
    try {
      if (typeof window !== 'undefined' && (window.location.search.includes('login') || window.location.search.includes('logout'))) {
        localStorage.removeItem('climayield_user');
        return null;
      }
      const saved = localStorage.getItem('climayield_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isFarmerOnly = isFarmerOnlyMode();
  const [activeTab, setActiveTab] = useState('dashboard');
  const userRole = isFarmerOnly ? 'farmer' : (user?.role === 'dev' ? 'dev' : 'farmer');
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('climayield_lang') || 'en';
    } catch {
      return 'en';
    }
  });

  const handleToggleLang = (targetLang) => {
    setLang(targetLang);
    try {
      localStorage.setItem('climayield_lang', targetLang);
    } catch {}
    if (targetLang === 'fil') {
      toast.info('🇵🇭 Pinalitan ang wika sa Filipino (Tagalog)');
    } else {
      toast.info('🇺🇸 Switched language to English');
    }
  };

  // Mobile Application & PWA Web App State
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(() => {
    try {
      return (
        (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
        (typeof window !== 'undefined' && window.navigator && window.navigator.standalone === true) ||
        (typeof localStorage !== 'undefined' && localStorage.getItem('climayield_pwa_installed') === 'true')
      );
    } catch {
      return false;
    }
  });

  // Installation Flow: null | 'downloading' | 'prompt'
  const [installModalState, setInstallModalState] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallApp = () => {
    // 1. Immediately start downloading/caching the app into browser
    setInstallModalState('downloading');
    setDownloadProgress(15);

    // Precaching via Service Worker Cache API safely
    try {
      if ('caches' in window) {
        caches.open('climayield-x-v1').then(async (cache) => {
          const coreUrls = ['/', '/index.html', '/manifest.json', '/favicon.ico'];
          for (const url of coreUrls) {
            try {
              await cache.add(url);
            } catch (cacheErr) {
              // Silently ignore individual cache misses without throwing runtime error
            }
          }
        }).catch(() => {});
      }
    } catch {}

    // Simulated progress bar representing browser download
    let current = 15;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 16) + 14;
      if (current >= 100) {
        current = 100;
        setDownloadProgress(100);
        clearInterval(interval);
        // Once downloading finishes, present prompt to install or cancel
        setTimeout(() => {
          setInstallModalState('prompt');
        }, 400);
      } else {
        setDownloadProgress(current);
      }
    }, 180);
  };

  const handleConfirmInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success(
            lang === 'fil'
              ? '🎉 Matagumpay na na-install ang ClimaYield-X Web App!'
              : '🎉 ClimaYield-X Web App installed successfully!'
          );
          setDeferredPrompt(null);
          setIsStandalone(true);
          try { localStorage.setItem('climayield_pwa_installed', 'true'); } catch {}
        } else {
          toast.info(lang === 'fil' ? 'Kinansela ang pag-install.' : 'Installation was cancelled.');
        }
      } catch (err) {
        console.warn('Install error:', err);
      }
    } else {
      // Completed browser installation fallback
      try { localStorage.setItem('climayield_pwa_installed', 'true'); } catch {}
      toast.success(
        lang === 'fil'
          ? '🎉 Matagumpay na na-install ang ClimaYield-X sa iyong browser!'
          : '🎉 ClimaYield-X successfully installed in your browser!'
      );
    }
    setInstallModalState(null);
  };

  const handleCancelInstall = () => {
    setInstallModalState(null);
    toast.info(lang === 'fil' ? 'Kinansela ang pag-install ng app.' : 'App installation cancelled.');
  };

  const [backendOnline, setBackendOnline] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    datasetLoaded: false,
    trainingStatus: {
      sarima: 'Not Trained',
      lstm: 'Not Trained',
      hybrid: 'Not Trained'
    },
    datasetShape: null
  });

  // Fetch Live Backend System Status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/status`, { timeout: 4000 });
      setSystemStatus(res.data);
      setBackendOnline(true);

      // Automated synchronization: If devside didn't put datasets or removed any dataset, immediately wipe farmer cache
      const hasCropData = Boolean(
        res.data?.cropDatasetLoaded || 
        (res.data?.cropCount && res.data.cropCount > 0) || 
        (res.data?.detectedCrops && res.data.detectedCrops.length > 0)
      );
      if (!hasCropData) {
        if (localStorage.getItem('climayield_dataset_crops')) {
          localStorage.removeItem('climayield_dataset_crops');
          localStorage.removeItem('climayield_custom_crops');
          localStorage.removeItem('climayield_crop_model_trained');
          localStorage.setItem('climayield_dataset_crops_cleared', 'true');
          window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: [] }));
          window.dispatchEvent(new CustomEvent('cropModelTrainedUpdated', { detail: { trained: false } }));
        }
      }

      const hasWeatherData = Boolean(
        res.data?.weatherDatasetLoaded || 
        (res.data?.weatherCount && res.data.weatherCount > 0)
      );
      if (!hasWeatherData) {
        if (localStorage.getItem('climayield_lstm_trained') || localStorage.getItem('climayield_ai_forecasts')) {
          localStorage.removeItem('climayield_lstm_trained');
          localStorage.removeItem('climayield_ai_forecasts');
          localStorage.removeItem('climayield_latest_training');
          window.dispatchEvent(new CustomEvent('lstmTrainingUpdated', { detail: { trained: false } }));
          window.dispatchEvent(new CustomEvent('aiTrainingCompleted', { detail: null }));
        }
      }
    } catch (err) {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    const handleLstmUpdate = () => {
      fetchStatus();
    };
    const handleCropModelUpdate = () => {
      fetchStatus();
    };
    window.addEventListener('lstmTrainingUpdated', handleLstmUpdate);
    window.addEventListener('cropModelTrainedUpdated', handleCropModelUpdate);
    return () => {
      clearInterval(interval);
      window.removeEventListener('lstmTrainingUpdated', handleLstmUpdate);
      window.removeEventListener('cropModelTrainedUpdated', handleCropModelUpdate);
    };
  }, [fetchStatus]);

  // Reset Backend State & Datasets
  const handleReset = async () => {
    if (!window.confirm('Reset all uploaded datasets and model training state on the backend?')) {
      return;
    }
    try {
      await axios.post(`${API_URL}/reset`);
      try {
        localStorage.removeItem('climayield_dataset_crops');
        localStorage.removeItem('climayield_custom_crops');
        localStorage.removeItem('climayield_lstm_trained');
        localStorage.removeItem('climayield_crop_model_trained');
        localStorage.removeItem('climayield_ai_forecasts');
        localStorage.removeItem('climayield_latest_training');
        window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: [] }));
        window.dispatchEvent(new CustomEvent('lstmTrainingUpdated', { detail: { trained: false } }));
        window.dispatchEvent(new CustomEvent('cropModelTrainedUpdated', { detail: { trained: false } }));
        window.dispatchEvent(new CustomEvent('aiTrainingCompleted', { detail: null }));
      } catch {}
      toast.info('Backend state, crop datasets, and trained models successfully reset.');
      fetchStatus();
    } catch (err) {
      toast.error('Failed to reset backend state.');
    }
  };

  // Redirect Developer to Farmer Side Prediction Engine
  const handleRedirectToFarmerPredictions = () => {
    const farmerUser = {
      ...(user || {}),
      name: user?.name ? `${user.name.replace(' (Farmer View)', '')} (Farmer View)` : 'Farmer View',
      email: 'farmer@agri.coop',
      role: 'farmer'
    };
    setUser(farmerUser);
    try {
      localStorage.setItem('climayield_user', JSON.stringify(farmerUser));
    } catch {}
    setActiveTab('predictions');
    toast.success('🌾 Redirected to Farmer Side: Crop Yield Prediction Engine!');
  };

  // Auto-switch tab if an unauthorized tab is currently selected
  useEffect(() => {
    if (userRole === 'dev' && (activeTab === 'weather' || activeTab === 'predictions' || activeTab === 'recommendations')) {
      setActiveTab('dashboard');
    } else if (userRole === 'farmer' && (activeTab === 'data' || activeTab === 'training')) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

  // Tab Router
  const renderActiveTab = () => {
    // If running in dedicated farmer mode, strictly block developer views
    if (isFarmerOnly && (activeTab === 'data' || activeTab === 'training')) {
      return (
        <Dashboard 
          userRole="farmer"
          user={user}
          systemStatus={systemStatus} 
          setActiveTab={setActiveTab} 
          onRefresh={fetchStatus} 
          lang={lang}
        />
      );
    }
    // Restrict Data Management and Model Training from farmer side
    if (userRole === 'farmer' && (activeTab === 'data' || activeTab === 'training')) {
      return (
        <Dashboard 
          userRole={userRole}
          user={user}
          systemStatus={systemStatus} 
          setActiveTab={setActiveTab} 
          onRefresh={fetchStatus} 
          lang={lang}
        />
      );
    }

    // Restrict Weather Monitor, Predictions, and Recommendations from dev side
    if (userRole === 'dev' && (activeTab === 'weather' || activeTab === 'predictions' || activeTab === 'recommendations')) {
      return (
        <Dashboard 
          userRole={userRole}
          user={user}
          systemStatus={systemStatus} 
          setActiveTab={setActiveTab} 
          onRefresh={fetchStatus} 
          lang={lang}
        />
      );
    }

    const hasWeatherDataset = Boolean(
      systemStatus?.weatherDatasetLoaded || 
      (systemStatus?.weatherCount && systemStatus.weatherCount > 0)
    );

    const hasCropDataset = Boolean(
      (systemStatus?.cropDatasetLoaded || (systemStatus?.cropCount && systemStatus.cropCount > 0)) &&
      (systemStatus?.detectedCrops && systemStatus.detectedCrops.length > 0)
    );

    const isLstmTrained = 
      hasWeatherDataset && (
        systemStatus?.trainingStatus?.lstm === 'Trained' || 
        systemStatus?.trainingStatus?.hybrid === 'Trained' ||
        localStorage.getItem('climayield_lstm_trained') === 'true'
      );

    const isCropModelTrained =
      hasCropDataset && (
        systemStatus?.trainingStatus?.cropModelTrained === true ||
        localStorage.getItem('climayield_crop_model_trained') === 'true'
      );

    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            userRole={userRole}
            user={user}
            systemStatus={systemStatus} 
            hasWeatherDataset={hasWeatherDataset}
            hasCropDataset={hasCropDataset}
            isLstmTrained={isLstmTrained}
            isCropModelTrained={isCropModelTrained}
            setActiveTab={setActiveTab} 
            onRefresh={fetchStatus} 
            lang={lang}
          />
        );
      case 'weather':
        return (
          <WeatherMonitor 
            lang={lang} 
            userRole={userRole} 
            setActiveTab={setActiveTab} 
            systemStatus={systemStatus} 
            hasWeatherDataset={hasWeatherDataset}
            hasCropDataset={hasCropDataset}
          />
        );
      case 'data':
        return <DataManagement onDataUpload={fetchStatus} />;
      case 'training':
        return (
          <ModelTraining 
            onTrainingComplete={fetchStatus} 
            onRedirectToFarmer={handleRedirectToFarmerPredictions} 
          />
        );
      case 'predictions':
        return (
          <Predictions 
            lang={lang} 
            systemStatus={systemStatus}
            hasWeatherDataset={hasWeatherDataset}
            hasCropDataset={hasCropDataset}
            isLstmTrained={isLstmTrained}
            isCropModelTrained={isCropModelTrained}
            setActiveTab={setActiveTab}
          />
        );
      case 'recommendations':
        return (
          <Recommendations 
            lang={lang} 
            systemStatus={systemStatus}
            hasWeatherDataset={hasWeatherDataset}
            hasCropDataset={hasCropDataset}
            isLstmTrained={isLstmTrained}
          />
        );
      default:
        return (
          <Dashboard 
            userRole={userRole}
            user={user}
            systemStatus={systemStatus} 
            hasWeatherDataset={hasWeatherDataset}
            hasCropDataset={hasCropDataset}
            isLstmTrained={isLstmTrained}
            isCropModelTrained={isCropModelTrained}
            setActiveTab={setActiveTab} 
            onRefresh={fetchStatus} 
            lang={lang}
          />
        );
    }
  };

  // If not authenticated, display the FarmerSide / DevSide Login Component
  if (!user) {
    return (
      <>
        <Login 
          onLoginSuccess={(loggedUser) => {
            setUser(loggedUser);
            try {
              localStorage.setItem('climayield_user', JSON.stringify(loggedUser));
            } catch {}
          }} 
        />
        <ToastContainer position="bottom-right" autoClose={3500} />
      </>
    );
  }

  return (
    <div className={`App theme-${userRole}`}>
      {/* 📱 Mobile Native Top App Bar */}
      <header className="mobile-app-header">
        <div className="mobile-header-inner">
          <div className="mobile-header-left">
            <span className="mobile-brand-icon">{userRole === 'dev' ? <DevBrandLogo size={22} /> : '🌾'}</span>
            <div className="mobile-brand-text">
              <span className="mobile-brand-title">ClimaYield-X</span>
              <span className="mobile-role-pill">{userRole === 'dev' ? 'Dev Suite' : 'Farmer'}</span>
            </div>
          </div>
          
          <div className="mobile-header-right">
            {userRole === 'farmer' && (
              <button
                type="button"
                className="mobile-lang-pill"
                onClick={() => handleToggleLang(lang === 'en' ? 'fil' : 'en')}
                title="Switch Language"
              >
                <span>{lang === 'en' ? '🇺🇸 EN' : '🇵🇭 FIL'}</span>
              </button>
            )}

            <div 
              className={`mobile-status-dot ${backendOnline ? 'online' : 'offline'}`}
              title={backendOnline ? 'API Online' : 'API Offline'}
            />

            <button
              type="button"
              className="mobile-menu-trigger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile menu"
            >
              <span>{userRole === 'dev' ? '⚙️' : '🧑‍🌾'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 🖥️ Desktop Top Header */}
      <header className="App-header desktop-header">
        <div className="header-inner">
          <div className="header-brand-block">
            <div className="header-icon-box">
              {userRole === 'dev' ? <DevBrandLogo size={28} /> : <span>🌾</span>}
            </div>
            <div>
              <h1 className="header-title">
                ClimaYield-X
                <span className="header-edition-badge">
                  {userRole === 'dev' ? 'Dev Suite' : 'Farmer Edition'}
                </span>
              </h1>
              <p className="subtitle">
                {userRole === 'farmer' && lang === 'fil'
                  ? 'AI Model (SARIMA–LSTM) para sa Pagtataya ng Ani ng mga Gulay sa Quezon City'
                  : 'A Data-Driven SARIMA–LSTM Hybrid Model for Predicting Yield Instability in Short-Cycle Vegetables'}
              </p>
            </div>
          </div>

          <div className="header-actions-block">
            {/* Install Web App Button */}
            {!isStandalone && (
              <button
                type="button"
                onClick={handleInstallApp}
                className="btn-header-install"
                title={lang === 'fil' ? 'I-install ang ClimaYield-X Web App' : 'Install ClimaYield-X as a Progressive Web App'}
              >
                📲 {lang === 'fil' ? 'I-install ang App' : 'Install App'}
              </button>
            )}

            {/* Farmer Language Toggle (English <-> Filipino) */}
            {userRole === 'farmer' && (
              <div className="lang-toggle-group" title="Piliin ang Wika / Switch Language">
                <button 
                  type="button"
                  className={`lang-toggle-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => handleToggleLang('en')}
                  title="Switch interface to English"
                >
                  <span className="flag-icon">🇺🇸</span>
                  <span>EN</span>
                </button>
                <button 
                  type="button"
                  className={`lang-toggle-btn ${lang === 'fil' ? 'active' : ''}`}
                  onClick={() => handleToggleLang('fil')}
                  title="Palitan ang wika sa Filipino"
                >
                  <span className="flag-icon">🇵🇭</span>
                  <span>FIL</span>
                </button>
              </div>
            )}

            {/* Backend Connection Indicator */}
            <div 
              className={`backend-status-pill ${backendOnline ? 'online' : 'offline'}`}
              title={backendOnline ? 'Backend API connected & responsive' : 'Backend API offline or unreachable'}
            >
              <span className={`pulse-dot ${backendOnline ? 'online' : 'offline'}`}></span>
              <span>{backendOnline ? 'API Connected' : 'API Offline'}</span>
            </div>

            {/* User Profile Badge */}
            <div className="user-profile-badge">
              <span className="user-avatar-icon">{userRole === 'dev' ? '💻' : '🧑‍🌾'}</span>
              <div className="user-details-mini">
                <span className="user-name-text">{user.name}</span>
                <span className="user-role-text">{userRole === 'dev' ? 'Developer' : 'Farmer'}</span>
              </div>
            </div>

            {/* Reset Button (Only for Devs) */}
            {userRole === 'dev' && (
              <button 
                onClick={handleReset}
                className="btn-header-action"
                title="Reset dataset and trained models on backend"
              >
                🔄 Reset Data
              </button>
            )}

            {/* Sign Out Button */}
            <button 
              onClick={() => {
                setUser(null);
                try { localStorage.removeItem('climayield_user'); } catch {}
                toast.info('Signed out. Returned to Front Page.');
              }}
              className="btn-header-signout"
              title="Return to the Front / Login Page"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* 🖥️ Desktop Tab Navigation */}
      <nav className="nav-tabs desktop-nav">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">
            {userRole === 'dev' ? (
              <DevDashboardLogo size={19} isActive={activeTab === 'dashboard'} />
            ) : (
              '📊'
            )}
          </span>
          <span className="tab-label">{userRole === 'farmer' && lang === 'fil' ? 'Buod ng Bukid' : 'Dashboard'}</span>
        </button>

        {/* Farmer Navigation: Weather Monitor, Predictions, Recommendations */}
        {userRole === 'farmer' && (
          <>
            <button 
              className={activeTab === 'weather' ? 'active' : ''} 
              onClick={() => setActiveTab('weather')}
            >
              <span className="tab-icon">🌤️</span>
              <span className="tab-label">{lang === 'fil' ? 'Ulat Panahon' : 'Weather Monitor'}</span>
            </button>
            <button 
              className={activeTab === 'predictions' ? 'active' : ''} 
              onClick={() => setActiveTab('predictions')}
            >
              <span className="tab-icon">📈</span>
              <span className="tab-label">{lang === 'fil' ? 'Hula sa Ani' : 'Predictions'}</span>
            </button>
            <button 
              className={activeTab === 'recommendations' ? 'active' : ''} 
              onClick={() => setActiveTab('recommendations')}
            >
              <span className="tab-icon">💡</span>
              <span className="tab-label">{lang === 'fil' ? 'Payo sa Bukid' : 'Recommendations'}</span>
            </button>
          </>
        )}

        {/* Dev Navigation: Data Management, Model Training */}
        {!isFarmerOnly && userRole === 'dev' && (
          <>
            <button 
              className={activeTab === 'data' ? 'active' : ''} 
              onClick={() => setActiveTab('data')}
            >
              <span className="tab-icon">
                <DevDataManagementLogo size={19} isActive={activeTab === 'data'} />
              </span>
              <span className="tab-label">Data Management</span>
            </button>
            <button 
              className={activeTab === 'training' ? 'active' : ''} 
              onClick={() => setActiveTab('training')}
            >
              <span className="tab-icon">
                <DevPipelineLogo size={19} isActive={activeTab === 'training'} />
              </span>
              <span className="tab-label">Model Training Pipeline</span>
            </button>
          </>
        )}
      </nav>

      {/* Main Tab Content */}
      <main className="main-content">
        {renderActiveTab()}
      </main>

      {/* 📱 Native Mobile Bottom Navigation Bar */}
      <nav className="mobile-bottom-nav">
        <button 
          type="button"
          className={`mobile-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="mobile-nav-icon">
            {userRole === 'dev' ? (
              <DevDashboardLogo size={22} isActive={activeTab === 'dashboard'} />
            ) : (
              '📊'
            )}
          </span>
          <span className="mobile-nav-label">
            {userRole === 'farmer' ? (lang === 'fil' ? 'Buod' : 'Dashboard') : 'Overview'}
          </span>
          {activeTab === 'dashboard' && <span className="mobile-active-pill" />}
        </button>

        {!isFarmerOnly && userRole === 'dev' ? (
          <>
            <button 
              type="button"
              className={`mobile-nav-item ${activeTab === 'data' ? 'active' : ''}`}
              onClick={() => setActiveTab('data')}
            >
              <span className="mobile-nav-icon">
                <DevDataManagementLogo size={22} isActive={activeTab === 'data'} />
              </span>
              <span className="mobile-nav-label">Datasets</span>
              {activeTab === 'data' && <span className="mobile-active-pill" />}
            </button>
            <button 
              type="button"
              className={`mobile-nav-item ${activeTab === 'training' ? 'active' : ''}`}
              onClick={() => setActiveTab('training')}
            >
              <span className="mobile-nav-icon">
                <DevPipelineLogo size={22} isActive={activeTab === 'training'} />
              </span>
              <span className="mobile-nav-label">Training</span>
              {activeTab === 'training' && <span className="mobile-active-pill" />}
            </button>
          </>
        ) : (
          <>
            <button 
              type="button"
              className={`mobile-nav-item ${activeTab === 'weather' ? 'active' : ''}`}
              onClick={() => setActiveTab('weather')}
            >
              <span className="mobile-nav-icon">🌤️</span>
              <span className="mobile-nav-label">{lang === 'fil' ? 'Panahon' : 'Weather'}</span>
              {activeTab === 'weather' && <span className="mobile-active-pill" />}
            </button>
            <button 
              type="button"
              className={`mobile-nav-item ${activeTab === 'predictions' ? 'active' : ''}`}
              onClick={() => setActiveTab('predictions')}
            >
              <span className="mobile-nav-icon">📈</span>
              <span className="mobile-nav-label">{lang === 'fil' ? 'Hula' : 'Yield'}</span>
              {activeTab === 'predictions' && <span className="mobile-active-pill" />}
            </button>
            <button 
              type="button"
              className={`mobile-nav-item ${activeTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setActiveTab('recommendations')}
            >
              <span className="mobile-nav-icon">💡</span>
              <span className="mobile-nav-label">{lang === 'fil' ? 'Payo' : 'Advisory'}</span>
              {activeTab === 'recommendations' && <span className="mobile-active-pill" />}
            </button>
          </>
        )}
      </nav>

      {/* 📱 Mobile Drawer Action Sheet */}
      {mobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-handle" />
            <div className="mobile-drawer-header">
              <div className="mobile-drawer-user">
                <span className="drawer-user-avatar">{userRole === 'dev' ? <DevBrandLogo size={24} /> : '🧑‍🌾'}</span>
                <div>
                  <h4 className="drawer-user-name">{user.name}</h4>
                  <span className="drawer-user-role">{userRole === 'dev' ? 'Developer Edition' : 'Farmer Edition'}</span>
                </div>
              </div>
              <button 
                type="button" 
                className="mobile-drawer-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mobile-drawer-actions">
              {/* Language Switch */}
              {userRole === 'farmer' && (
                <div className="drawer-action-row">
                  <span>🌐 {lang === 'fil' ? 'Wika / Language' : 'Language'}</span>
                  <div className="drawer-lang-btns">
                    <button 
                      type="button"
                      className={lang === 'en' ? 'active' : ''} 
                      onClick={() => handleToggleLang('en')}
                    >
                      🇺🇸 EN
                    </button>
                    <button 
                      type="button"
                      className={lang === 'fil' ? 'active' : ''} 
                      onClick={() => handleToggleLang('fil')}
                    >
                      🇵🇭 FIL
                    </button>
                  </div>
                </div>
              )}

              {/* Install PWA Button */}
              <button 
                type="button"
                className="drawer-menu-item drawer-install-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleInstallApp();
                }}
              >
                <span>📲</span>
                <span>{lang === 'fil' ? 'I-install sa Cellphone (Web App)' : 'Install as Mobile App'}</span>
              </button>

              {/* Dev Reset */}
              {!isFarmerOnly && userRole === 'dev' && (
                <button 
                  type="button"
                  className="drawer-menu-item drawer-reset-btn"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleReset();
                  }}
                >
                  <span>🔄</span>
                  <span>Reset All Backend Data</span>
                </button>
              )}

              {/* Sign Out */}
              <button 
                type="button"
                className="drawer-menu-item drawer-signout-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setUser(null);
                  try { localStorage.removeItem('climayield_user'); } catch {}
                  toast.info('Signed out. Returned to Front Page.');
                }}
              >
                <span>🚪</span>
                <span>{lang === 'fil' ? 'Mag-sign Out' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Download Progress & Install Prompt Modal */}
      <PwaInstallModal
        isOpen={!!installModalState}
        state={installModalState}
        progress={downloadProgress}
        lang={lang}
        userRole={userRole}
        onConfirm={handleConfirmInstall}
        onCancel={handleCancelInstall}
      />

      <ToastContainer position="bottom-right" autoClose={3500} />
    </div>
  );
}

export default App;