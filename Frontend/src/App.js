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
import Dashboard from './components/Dashboard';
import WeatherMonitor from './components/WeatherMonitor';
import DataManagement from './components/Datamanagement';
import ModelTraining from './components/Modeltraining';
import Predictions from './components/Prediction';
import Recommendations from './components/Recommendations';
import Login from './components/Login';

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

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

  const [activeTab, setActiveTab] = useState('dashboard');
  const userRole = user?.role === 'dev' ? 'dev' : 'farmer';
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
    } catch (err) {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  // Reset Backend State
  const handleReset = async () => {
    if (!window.confirm('Reset all uploaded datasets and model training state on the backend?')) {
      return;
    }
    try {
      await axios.post(`${API_URL}/reset`);
      toast.info('Backend state successfully reset.');
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

    switch (activeTab) {
      case 'dashboard':
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
      case 'weather':
        return <WeatherMonitor lang={lang} />;
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
        return <Predictions lang={lang} />;
      case 'recommendations':
        return <Recommendations lang={lang} />;
      default:
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
      {/* Top Header */}
      <header className="App-header" style={{
        background: userRole === 'dev'
          ? 'linear-gradient(135deg, #1a3b4f 0%, #2980b9 100%)'
          : 'linear-gradient(135deg, #1d341d 0%, #27ae60 100%)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 30px', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ textAlign: 'left' }}>
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
              <span>🌾</span> ClimaYield-X
            </h1>
            <p className="subtitle" style={{ margin: '5px 0 0 0' }}>
              {userRole === 'farmer' && lang === 'fil'
                ? 'AI Model (SARIMA–LSTM) para sa Pagtataya ng Ani ng mga Gulay sa Quezon City'
                : 'A Data-Driven SARIMA–LSTM Hybrid Model for Predicting Yield Instability in Short-Cycle Vegetables'}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Farmer Language Toggle (English <-> Filipino) */}
            {userRole === 'farmer' && (
              <div className="lang-toggle-group" title="Piliin ang Wika / Switch Language">
                <button 
                  type="button"
                  className={`lang-toggle-btn ${lang === 'en' ? 'active' : ''}`}
                  onClick={() => handleToggleLang('en')}
                  title="Switch interface to English"
                >
                  <span>🇺🇸</span>
                  <span>English</span>
                </button>
                <button 
                  type="button"
                  className={`lang-toggle-btn ${lang === 'fil' ? 'active' : ''}`}
                  onClick={() => handleToggleLang('fil')}
                  title="Palitan ang wika sa Filipino"
                >
                  <span>🇵🇭</span>
                  <span>Filipino</span>
                </button>
              </div>
            )}

            {/* User Profile Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '20px',
              background: 'rgba(255, 255, 255, 0.22)',
              fontSize: '0.85rem',
              color: 'white',
              fontWeight: '600',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}>
              <span>{userRole === 'dev' ? '💻' : '🧑‍🌾'}</span>
              <span>{user.name}</span>
              <span style={{
                background: 'rgba(255, 255, 255, 0.25)',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {userRole === 'dev' ? 'Developer' : 'Farmer'}
              </span>
            </div>

            {/* Backend Connection Indicator */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '0.82rem',
              fontWeight: '600',
              background: backendOnline ? 'rgba(39, 174, 96, 0.25)' : 'rgba(231, 76, 60, 0.25)',
              border: `1px solid ${backendOnline ? '#2ecc71' : '#e74c3c'}`,
              color: 'white'
            }}>
              <span>{backendOnline ? '🟢' : '🔴'}</span>
              <span>{backendOnline ? 'Backend Online' : 'Backend Offline'}</span>
            </div>

            {/* Reset Button (Only for Devs) */}
            {userRole === 'dev' && (
              <button 
                onClick={handleReset}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '600'
                }}
                title="Reset dataset and trained models on backend"
              >
                🔄 Reset Data
              </button>
            )}

            {/* Switch Role Button */}
            <button 
              onClick={() => {
                if (userRole === 'farmer') {
                  const devUser = {
                    name: 'Alex Chen',
                    email: 'dev@agri.coop',
                    role: 'dev'
                  };
                  setUser(devUser);
                  try { localStorage.setItem('climayield_user', JSON.stringify(devUser)); } catch {}
                  setActiveTab('training');
                  toast.info('💻 Switched back to Developer Environment.');
                } else {
                  handleRedirectToFarmerPredictions();
                }
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.18)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
              title={userRole === 'farmer' ? 'Switch back to Developer Environment' : 'Switch to Farmer Side'}
            >
              {userRole === 'farmer' ? '💻 Return to Dev Side' : '🌾 View Farmer Side'}
            </button>

            {/* Sign Out Button */}
            <button 
              onClick={() => {
                setUser(null);
                try { localStorage.removeItem('climayield_user'); } catch {}
                toast.info('Signed out. Returned to Front Page.');
              }}
              style={{
                background: 'rgba(231, 76, 60, 0.35)',
                border: '1px solid rgba(231, 76, 60, 0.7)',
                color: 'white',
                padding: '6px 14px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '700'
              }}
              title="Return to the Front / Login Page"
            >
              🚪 Sign Out / Login Page
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation - Kept in English as requested */}
      <nav className="nav-tabs">
        <button 
          className={activeTab === 'dashboard' ? 'active' : ''} 
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>

        {/* Farmer Navigation: Weather Monitor, Predictions, Recommendations */}
        {userRole === 'farmer' && (
          <>
            <button 
              className={activeTab === 'weather' ? 'active' : ''} 
              onClick={() => setActiveTab('weather')}
            >
              🌤️ Weather Monitor
            </button>
            <button 
              className={activeTab === 'predictions' ? 'active' : ''} 
              onClick={() => setActiveTab('predictions')}
            >
              📈 Predictions
            </button>
            <button 
              className={activeTab === 'recommendations' ? 'active' : ''} 
              onClick={() => setActiveTab('recommendations')}
            >
              💡 Recommendations
            </button>
          </>
        )}

        {/* Dev Navigation: Data Management, Model Training */}
        {userRole === 'dev' && (
          <>
            <button 
              className={activeTab === 'data' ? 'active' : ''} 
              onClick={() => setActiveTab('data')}
            >
              📁 Data Management
            </button>
            <button 
              className={activeTab === 'training' ? 'active' : ''} 
              onClick={() => setActiveTab('training')}
            >
              🤖 Model Training
            </button>
          </>
        )}
      </nav>

      {/* Main Tab Content */}
      <main className="main-content">
        {renderActiveTab()}
      </main>

      <ToastContainer position="bottom-right" autoClose={3500} />
    </div>
  );
}

export default App;