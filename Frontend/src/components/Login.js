import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { login, signup, requestPasswordOtp, verifyPasswordOtp, resetPasswordWithOtp } from '../services/api';
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

  // Forgot password & OTP verification state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState('phone'); // 'phone' | 'otp' | 'password' | 'success'
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

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

  const handleOpenForgotModal = () => {
    setForgotPhone(signupForm?.phone || '');
    setForgotOtp('');
    setResetToken('');
    setNewPassword('');
    setConfirmNewPassword('');
    setForgotError('');
    setForgotNotice('');
    setForgotStep('phone');
    setShowForgotModal(true);
  };

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanPhone = forgotPhone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setForgotError('Please enter a valid mobile phone number (e.g. 09171234567 or +639171234567).');
      return;
    }

    setForgotLoading(true);
    setForgotError('');
    setForgotNotice('');

    try {
      const activeRole = isFarmerOnly ? 'farmer' : (isDevOnly || isDev ? 'dev' : 'farmer');
      const res = await requestPasswordOtp(cleanPhone, activeRole);
      if (res && (res.success || res.status === 'success')) {
        const noticeText = `A 6-digit OTP verification code has been texted to ${cleanPhone}. Please check your phone Messages.`;
        setForgotNotice(noticeText);
        toast.success(`SMS OTP sent to ${cleanPhone}. Check your phone Messages.`);
        if (res.otp) {
          console.log(`[ClimaYield OTP Debug]: Your 6-digit OTP is ${res.otp}`);
        }
        setForgotStep('otp');
        setResendCooldown(30);
        const timer = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        const errorMsg = res?.error || res?.message || 'Failed to text OTP verification code. Please check your phone number.';
        setForgotError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Error texting OTP. Please verify your phone number.';
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const cleanOtp = forgotOtp.replace(/\D/g, '');
    if (!cleanOtp || cleanOtp.length < 6) {
      setForgotError('Please enter the 6-digit OTP code.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const cleanPhone = forgotPhone.replace(/[\s\-\(\)]/g, '');
      const res = await verifyPasswordOtp(cleanPhone, cleanOtp);
      if (res.success) {
        setResetToken(res.reset_token || '');
        setForgotStep('password');
        toast.success('Phone and OTP verified successfully!');
      } else {
        setForgotError(res.error || 'Invalid or expired OTP code.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Invalid verification code.';
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 4) {
      setForgotError('Password must be at least 4 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setForgotLoading(true);
    setForgotError('');

    try {
      const cleanPhone = forgotPhone.replace(/[\s\-\(\)]/g, '');
      const res = await resetPasswordWithOtp({
        phone: cleanPhone,
        otp: forgotOtp.replace(/\D/g, ''),
        resetToken: resetToken,
        newPassword: newPassword,
        confirmPassword: confirmNewPassword
      });

      if (res.success) {
        toast.success('Password updated successfully! You can now log in.');
        setPassword(newPassword);
        setForgotStep('success');
      } else {
        setForgotError(res.error || 'Failed to reset password.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error updating password.';
      setForgotError(msg);
      toast.error(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleFinishReset = () => {
    setShowForgotModal(false);
    setForgotStep('email');
    setForgotOtp('');
    setNewPassword('');
    setConfirmNewPassword('');
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
    if (signupForm.role === 'farmer') {
      if (!signupForm.phone || signupForm.phone.trim().length < 10) {
        toast.error('Please enter a valid mobile phone number (09171234567 or +639171234567).');
        return;
      }
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
                  onClick={handleOpenForgotModal}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenForgotModal(); }}
                  title="Click to reset your password via mobile phone SMS OTP verification"
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
                href={isDev ? '/dev/register.html' : '/farmer/register.html'}
                className="auth-switch-btn"
                style={{ textDecoration: 'none', display: 'inline-block', cursor: 'pointer' }}
                onClick={(e) => {
                  e.preventDefault();
                  setSignupForm({
                    role: isDev ? 'dev' : 'farmer',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    age: '',
                    phone: '',
                    organization: ''
                  });
                  setShowSignupModal(true);
                }}
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

              {signupForm.role === 'farmer' && (
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
              )}

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

      {/* Forgot Password / OTP Email Verification Modal */}
      {showForgotModal && (
        <div className="auth-modal-overlay" onClick={() => !forgotLoading && setShowForgotModal(false)}>
          <div 
            className="auth-modal-card forgot-modal-card" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '480px' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.4rem' }}>{forgotStep === 'success' ? '🎉' : '📱'}</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: isDev ? '#38bdf8' : '#2d6a4f', fontWeight: 700 }}>
                    {forgotStep === 'phone' && 'Forgot Password'}
                    {forgotStep === 'otp' && 'SMS OTP Verification'}
                    {forgotStep === 'password' && 'Create New Password'}
                    {forgotStep === 'success' && 'Password Reset Complete'}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '2px' }}>
                    {forgotStep === 'phone' && 'Step 1 of 3: Enter mobile phone number'}
                    {forgotStep === 'otp' && 'Step 2 of 3: Enter 6-digit SMS OTP code'}
                    {forgotStep === 'password' && 'Step 3 of 3: Set your new password'}
                    {forgotStep === 'success' && 'Account credentials updated'}
                  </div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => !forgotLoading && setShowForgotModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', opacity: 0.6 }}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            {/* Error Banner */}
            {forgotError && (
              <div style={{
                background: '#fee2e2',
                color: '#991b1b',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #fca5a5'
              }}>
                <span>⚠️</span>
                <span>{forgotError}</span>
              </div>
            )}

            {/* Notice Banner */}
            {forgotNotice && (
              <div style={{
                background: '#e0f2fe',
                color: '#0369a1',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '0.88rem',
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid #bae6fd'
              }}>
                <span>📲</span>
                <span>{forgotNotice}</span>
              </div>
            )}

            {/* Step 1: Phone Verification Prompt */}
            {forgotStep === 'phone' && (
              <form onSubmit={handleSendOtp}>
                <p style={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Please enter your mobile phone number. We will immediately text the 6-digit OTP verification code directly to your phone.
                </p>

                <div className="login-input-group">
                  <label>Registered Mobile Phone Number *</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">📱</span>
                    <input
                      type="tel"
                      value={forgotPhone}
                      onChange={(e) => {
                        setForgotPhone(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      placeholder="09171234567 or +639171234567"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
                  <button 
                    type="button" 
                    className="btn-auth-submit btn-modal-cancel" 
                    style={{ flex: 1 }}
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-auth-submit btn-modal-register" 
                    style={{ flex: 1.4 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? 'Texting OTP...' : 'Text OTP to Phone 📲'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: OTP Verification Code */}
            {forgotStep === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  We texted a 6-digit verification OTP to <strong>{forgotPhone}</strong>. Please enter the code below:
                </p>

                <div className="login-input-group">
                  <label>6-Digit Verification Code (OTP) *</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">🔢</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => {
                        setForgotOtp(e.target.value.replace(/\D/g, ''));
                        if (forgotError) setForgotError('');
                      }}
                      placeholder="••••••"
                      style={{ fontSize: '1.4rem', letterSpacing: '6px', textAlign: 'center', fontWeight: 'bold' }}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 16px 0', fontSize: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('phone');
                      setForgotError('');
                      setForgotNotice('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#64748b', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
                  >
                    ← Change Phone Number
                  </button>
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={resendCooldown > 0 || forgotLoading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? '#94a3b8' : (isDev ? '#38bdf8' : '#2d6a4f'),
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                      padding: 0
                    }}
                  >
                    {resendCooldown > 0 ? `Resend SMS OTP (${resendCooldown}s)` : 'Resend SMS OTP 🔄'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn-auth-submit btn-modal-cancel" 
                    style={{ flex: 1 }}
                    onClick={() => {
                      setForgotStep('phone');
                      setForgotError('');
                    }}
                    disabled={forgotLoading}
                  >
                    Back
                  </button>
                  <button 
                    type="submit" 
                    className="btn-auth-submit btn-modal-register" 
                    style={{ flex: 1.4 }}
                    disabled={forgotLoading || forgotOtp.length < 6}
                  >
                    {forgotLoading ? 'Verifying...' : 'Verify OTP 🔑'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Create New Password */}
            {forgotStep === 'password' && (
              <form onSubmit={handleResetPassword}>
                <p style={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                  Phone successfully verified! Enter your new password for mobile account <strong>{forgotPhone}</strong>.
                </p>

                <div className="login-input-group">
                  <label>New Password *</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">🔒</span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      minLength={4}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      placeholder="Minimum 4 characters"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.6 }}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? '👁️' : '🙈'}
                    </button>
                  </div>
                </div>

                <div className="login-input-group">
                  <label>Confirm New Password *</label>
                  <div className="login-input-wrapper">
                    <span className="login-input-icon">🔒</span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      minLength={4}
                      value={confirmNewPassword}
                      onChange={(e) => {
                        setConfirmNewPassword(e.target.value);
                        if (forgotError) setForgotError('');
                      }}
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                </div>

                {/* Validation indicators */}
                <div style={{ fontSize: '0.82rem', margin: '8px 0 16px 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ color: newPassword.length >= 4 ? '#16a34a' : '#94a3b8' }}>
                    {newPassword.length >= 4 ? '✓' : '•'} At least 4 characters
                  </span>
                  <span style={{ color: (newPassword && newPassword === confirmNewPassword) ? '#16a34a' : '#94a3b8' }}>
                    {(newPassword && newPassword === confirmNewPassword) ? '✓' : '•'} Passwords match
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button 
                    type="button" 
                    className="btn-auth-submit btn-modal-cancel" 
                    style={{ flex: 1 }}
                    onClick={() => setShowForgotModal(false)}
                    disabled={forgotLoading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-auth-submit btn-modal-register" 
                    style={{ flex: 1.4 }}
                    disabled={forgotLoading || newPassword.length < 4 || newPassword !== confirmNewPassword}
                  >
                    {forgotLoading ? 'Updating...' : 'Save New Password 💾'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success Message */}
            {forgotStep === 'success' && (
              <div style={{ textAlign: 'center', padding: '12px 0 6px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#16a34a' }}>Password Reset Successful!</h4>
                <p style={{ fontSize: '0.92rem', color: '#4a5568', lineHeight: 1.5, marginBottom: '22px' }}>
                  Your password has been securely updated. You can now log into your account with your new credentials.
                </p>
                <button 
                  type="button" 
                  className="btn-auth-submit btn-modal-register" 
                  style={{ width: '100%', padding: '12px' }}
                  onClick={handleFinishReset}
                >
                  Back to Login & Sign In 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;
