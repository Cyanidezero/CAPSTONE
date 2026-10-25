import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, signup } from '../services/api';
import { isFarmerOnlyMode } from '../utils/portalMode';
import './Login.css';

function Login({ onLoginSuccess }) {
  const isFarmerOnly = isFarmerOnlyMode();
  const [isDev, setIsDev] = useState(false);
  const [email, setEmail] = useState('farmer@agri.coop');
  const [password, setPassword] = useState('password123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);

  // Sign up modal state
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '',
    age: 28,
    email: '',
    password: '',
    role: 'farmer',
    farmName: '',
    organization: ''
  });

  const toggleMode = (targetIsDev) => {
    if (isFarmerOnly) return; // Prevent switching to dev when in dedicated farmer mode
    setIsDev(targetIsDev);
    if (targetIsDev) {
      if (email === 'farmer@agri.coop') setEmail('dev@agri.coop');
    } else {
      if (email === 'dev@agri.coop') setEmail('farmer@agri.coop');
    }
  };


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warn('Please enter both email and password.');
      return;
    }

    setLoading(true);
    const role = isFarmerOnly ? 'farmer' : (isDev ? 'dev' : 'farmer');

    try {
      // Call backend API
      const res = await login(email, password, role);
      if (res.success && res.user) {
        toast.success(res.message || `Welcome, ${res.user.name}!`);
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        toast.error(res.error || 'Authentication failed.');
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
      // Fallback demo authentication if backend is unreachable
      const cleanEmail = email.trim().toLowerCase();
      if (cleanEmail === 'farmer@agri.coop' || !isDev) {
        const fallbackUser = {
          name: cleanEmail === 'farmer@agri.coop' ? 'John Miller' : cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'farmer',
          profile: { farmName: 'Green Valley Organic Farms' }
        };
        toast.success(`Welcome, ${fallbackUser.name}! (Farmer Mode)`);
        if (onLoginSuccess) onLoginSuccess(fallbackUser);
      } else {
        const fallbackUser = {
          name: cleanEmail === 'dev@agri.coop' ? 'Alex Chen' : cleanEmail.split('@')[0],
          email: cleanEmail,
          role: 'dev',
          profile: { organization: 'AgriTech AI Labs' }
        };
        toast.success(`Welcome, ${fallbackUser.name}! (Dev & Research Mode)`);
        if (onLoginSuccess) onLoginSuccess(fallbackUser);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupForm.name || !signupForm.email || !signupForm.password) {
      toast.warn('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    try {
      const res = await signup(signupForm);
      if (res.success && res.user) {
        toast.success(`Profile created! Welcome, ${res.user.name}.`);
        setShowSignupModal(false);
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        toast.error(res.error || 'Registration failed.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errMsg = err.response?.data?.error || err.message || 'Signup failed';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page-container ${isDev ? 'theme-dev' : 'theme-farmer'}`}>
      {/* Background Pictures: Farmer on farm for farmer side, developer for dev side */}
      <div 
        className="login-bg-layer login-bg-farmer"
        style={{ opacity: isDev ? 0 : 1 }}
        aria-hidden="true"
      />
      <div 
        className="login-bg-layer login-bg-dev"
        style={{ opacity: isDev ? 1 : 0 }}
        aria-hidden="true"
      />

      <div className={`login-card ${isPeeking ? 'is-peeking' : ''}`}>
        {/* Header with Title and Mode Badge */}
        <div className="login-header">
          <div className="header-top">
            <div className="header-brand">
              <div className="header-icon-slot">
                {isDev ? '💻' : '🌾'}
              </div>
              <div>
                <h1>ClimaYield-X</h1>
                <p className="header-subtitle">
                  A Data-Driven SARIMA–LSTM Hybrid Model for Predicting Yield Instability in Short-Cycle Vegetables
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button 
                type="button" 
                className="btn-peek-bg" 
                onClick={() => setIsPeeking(!isPeeking)}
                title="Toggle background view"
                aria-label="Peek background"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px' }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
                {isPeeking ? 'Restore' : 'View BG'}
              </button>
              <span className="account-badge">
                {isFarmerOnly ? 'Farmer Portal' : (isDev ? 'Dev Portal' : 'Farmer Portal')}
              </span>
            </div>
          </div>
        </div>

        {/* Farmer vs Dev Side Interactive Switch (Only in dual-mode) */}
        {!isFarmerOnly && (
          <div className="switch-wrapper">
            <span 
              className={`switch-label ${!isDev ? 'active-farm' : ''}`}
              onClick={() => toggleMode(false)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMode(false); }}
            >
              🌾 FarmerSide
            </span>

            <div 
              className={`toggle-track ${isDev ? 'is-dev' : ''}`}
              onClick={() => toggleMode(!isDev)}
              title="Toggle between Farmer and Dev login modes"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMode(!isDev); }}
            >
              <div className="toggle-knob">
                {isDev ? '💻' : '🌾'}
              </div>
            </div>

            <span 
              className={`switch-label ${isDev ? 'active-dev' : ''}`}
              onClick={() => toggleMode(true)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') toggleMode(true); }}
            >
              💻 DevSide
            </span>
          </div>
        )}

        {/* Active Panel Form */}
        <div className="panel">
          <div className="panel-title">
            <span>{isDev ? '💻 Dev & Pipeline Access' : '🌾 Field Operations & Weather Access'}</span>
          </div>
            <div className="panel-sub">
              {isDev 
                ? 'Hyperparameter tuning, residual learning analysis, and model retraining controls.'
                : 'Local field forecasting, rainfall alerts, irrigation timing, and crop yield projections.'}
            </div>


            <form onSubmit={handleLoginSubmit}>
              {/* Email Field */}
              <div className="login-input-group">
                <label>{isDev ? 'Engineering ID / Email' : 'Farm ID / Email Address'}</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">{isDev ? '📧' : '🧑‍🌾'}</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isDev ? 'dev@agri.coop' : 'farmer@agri.coop'}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="login-input-group">
                <label>Password</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6, fontSize: '0.9rem' }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? '👁️' : '🙈'}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="login-options-row">
                <label className="remember-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember terminal
                </label>
                <span 
                  className="forgot-link"
                  onClick={() => toast.info('Default demo password is: password123')}
                >
                  Forgot password?
                </span>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="btn-auth-submit"
                disabled={loading}
              >
                {loading 
                  ? '⏳ Verifying Credentials...' 
                  : isDev 
                    ? '💻 Enter Dev & Research Suite' 
                    : '🌾 Enter Field Dashboard'}
              </button>
            </form>

            {/* Signup Trigger */}
            <div className="auth-switch-prompt">
              Don't have an account yet?{' '}
              <button 
                type="button" 
                className="auth-switch-btn"
                onClick={() => {
                  setSignupForm(prev => ({ ...prev, role: isDev ? 'dev' : 'farmer' }));
                  setShowSignupModal(true);
                }}
              >
                Create {isDev ? 'Dev Profile' : 'Farm Profile'}
              </button>
            </div>
          </div>
        </div>

      {/* Signup Modal */}
      {showSignupModal && (
        <div className="auth-modal-overlay" onClick={() => setShowSignupModal(false)}>
          <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>
                {signupForm.role === 'dev' ? '💻 Create Dev & Research Account' : '🌾 Register New Farm Profile'}
              </h3>
              <button 
                onClick={() => setShowSignupModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSignupSubmit}>
              <div className="login-input-group">
                <label>Full Name</label>
                <div className="login-input-wrapper">
                  <input
                    type="text"
                    value={signupForm.name}
                    onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                    placeholder={signupForm.role === 'dev' ? 'Alex Chen' : 'John Miller'}
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Age</label>
                <div className="login-input-wrapper">
                  <input
                    type="number"
                    min="18"
                    max="99"
                    value={signupForm.age}
                    onChange={(e) => setSignupForm({ ...signupForm, age: e.target.value })}
                    placeholder="e.g. 30"
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Email Address</label>
                <div className="login-input-wrapper">
                  <input
                    type="email"
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    placeholder="user@organization.com"
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Password</label>
                <div className="login-input-wrapper">
                  <input
                    type="password"
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="Create a secure password"
                    required
                  />
                </div>
              </div>

              {signupForm.role === 'farmer' && (
                <div className="login-input-group">
                  <label>Farm Name</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">🏡</span>
                    <input
                      type="text"
                      value={signupForm.farmName}
                      onChange={(e) => setSignupForm({ ...signupForm, farmName: e.target.value })}
                      placeholder="e.g. Green Valley Organic Farm"
                    />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn-auth-submit btn-modal-cancel" 
                  style={{ flex: 1 }}
                  onClick={() => setShowSignupModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-auth-submit btn-modal-register" 
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
