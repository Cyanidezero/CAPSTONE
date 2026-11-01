import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, signup } from '../services/api';
import { isFarmerOnlyMode, isDevOnlyMode } from '../utils/portalMode';
import './Login.css';

function Login({ onLoginSuccess }) {
  const isFarmerOnly = isFarmerOnlyMode();
  const isDevOnly = isDevOnlyMode();
  const [isDev, setIsDev] = useState(isDevOnly);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPeeking, setIsPeeking] = useState(false);

  // Sign up modal state
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({
    name: '',
    age: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: isDevOnly ? 'dev' : 'farmer',
    farmName: '',
    organization: ''
  });

  const toggleMode = (targetIsDev) => {
    if (isFarmerOnly || isDevOnly) return; // Prevent switching when in dedicated portal mode
    setIsDev(targetIsDev);
  };


  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warn('Please enter both email and password.');
      return;
    }
    if (password.length < 4) {
      toast.warn('Password must be 4 characters or longer.');
      return;
    }

    setLoading(true);
    const role = isFarmerOnly ? 'farmer' : (isDevOnly || isDev ? 'dev' : 'farmer');

    try {
      // Call backend API
      const res = await login(email, password, role);
      if (res.success && res.user) {
        toast.success(res.message || `Welcome, ${res.user.name}!`);
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        toast.error(res.error || 'Invalid username or password. Please try again.');
      }
    } catch (err) {
      console.warn('Login error:', err);
      const errMsg = err.response?.data?.error || err.message;
      if (!err.response || err.response?.status === 401 || (errMsg && errMsg.toLowerCase().includes('invalid'))) {
        toast.error('Invalid username or password. Please try again.');
      } else {
        toast.error(errMsg || 'Invalid username or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = String(signupForm.name || '').trim();
    if (!trimmedName || !signupForm.email || !signupForm.password) {
      toast.warn('Please fill in all required fields.');
      return;
    }
    if (trimmedName.length < 2) {
      toast.warn('Please enter your full name (at least 2 characters).');
      return;
    }
    if (/[0-9]/.test(trimmedName)) {
      toast.error('Numbers are not allowed in the name field. Only letters, spaces, hyphens, and apostrophes are accepted.');
      return;
    }
    if (!/^[a-zA-ZÀ-ÿ\s.'-]+$/.test(trimmedName)) {
      toast.error('Invalid characters in name. Only letters, spaces, hyphens, and apostrophes are allowed.');
      return;
    }
    if (!signupForm.phone || signupForm.phone.trim().length < 10) {
      toast.error('Please enter a valid mobile phone number (09171234567 or +639171234567).');
      return;
    }
    const parsedAge = parseInt(signupForm.age, 10);
    if (signupForm.role === 'farmer') {
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 70) {
        toast.error('Farmer age must be between 18 and 70 years old.');
        return;
      }
    } else {
      if (isNaN(parsedAge) || parsedAge < 18 || parsedAge > 99) {
        toast.error('Developer age must be between 18 and 99 years old.');
        return;
      }
    }
    if (signupForm.password.length < 4) {
      toast.error('Password must be 4 characters or longer.');
      return;
    }
    const hasLetters = /[a-zA-Z]/.test(signupForm.password);
    const hasNumbers = /[0-9]/.test(signupForm.password);
    if (!hasLetters || !hasNumbers) {
      toast.error('Password must contain letters and at least one number (farm123), not numbers only like 1234.');
      return;
    }
    if (signupForm.password !== signupForm.confirmPassword) {
      toast.error('Passwords do not match. Please re-enter your password.');
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
                {isFarmerOnly ? 'Farmer Portal' : (isDevOnly || isDev ? 'Dev Portal' : 'Farmer Portal')}
              </span>
            </div>
          </div>
        </div>

        {/* Farmer vs Dev Side Interactive Switch (Only in dual-mode) */}
        {!isFarmerOnly && !isDevOnly && (
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
              <a 
                href={isDev ? '/register/dev' : '/register'}
                className="auth-switch-btn"
                style={{ textDecoration: 'none', display: 'inline-block' }}
              >
                Create {isDev ? 'Dev Profile' : 'Farm Profile'}
              </a>
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
                <label>Full Name *</label>
                <div className="login-input-wrapper">
                  <input
                    type="text"
                    value={signupForm.name}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/[0-9]/.test(val)) {
                        toast.warn('Numbers are not allowed in the name field. Only letters, spaces, hyphens, and apostrophes are accepted.');
                        setSignupForm({ ...signupForm, name: val.replace(/[0-9]/g, '') });
                      } else {
                        setSignupForm({ ...signupForm, name: val });
                      }
                    }}
                    placeholder={signupForm.role === 'dev' ? 'Alex Chen' : 'Juan Dela Cruz'}
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Age *</label>
                <div className="login-input-wrapper">
                  <input
                    type="number"
                    min="18"
                    max={signupForm.role === 'farmer' ? '70' : '99'}
                    value={signupForm.age}
                    onChange={(e) => setSignupForm({ ...signupForm, age: e.target.value })}
                    placeholder="Enter your age"
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Email Address *</label>
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
                <label>Password *</label>
                <div className="login-input-wrapper">
                  <input
                    type="password"
                    minLength={4}
                    value={signupForm.password}
                    onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                    placeholder="farm123 or dev2026"
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Confirm Password</label>
                <div className="login-input-wrapper">
                  <input
                    type="password"
                    minLength={4}
                    value={signupForm.confirmPassword}
                    onChange={(e) => setSignupForm({ ...signupForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter your password"
                    required
                  />
                </div>
              </div>

              <div className="login-input-group">
                <label>Mobile Phone Number *</label>
                <div className="login-input-wrapper">
                  <span className="login-input-icon">📱</span>
                  <input
                    type="tel"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    placeholder="09171234567 or +639171234567"
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
                      placeholder="Green Valley Organic Farm"
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
