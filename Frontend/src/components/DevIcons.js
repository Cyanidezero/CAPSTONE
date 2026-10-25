import React from 'react';

/**
 * ClimaYield-X Professional Developer Suite Icons & Badges
 * High-precision, enterprise-grade vector SVG logos tailored for AI/ML dashboards.
 */

// 1. Dev Dashboard / AI Models Telemetry Logo
export const DevDashboardLogo = ({ size = 20, isActive = false, className = '' }) => {
  const strokeColor = isActive ? '#030712' : '#38bdf8';
  const fillGradientId = isActive ? 'devDashGradActive' : 'devDashGrad';
  const accentColor = isActive ? '#030712' : '#06b6d4';
  const glowColor = isActive ? 'rgba(0, 0, 0, 0.3)' : 'rgba(6, 182, 212, 0.6)';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`dev-icon dev-icon-dashboard ${className}`}
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={fillGradientId} x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isActive ? '#030712' : '#38bdf8'} />
          <stop offset="100%" stopColor={isActive ? '#0f172a' : '#0284c7'} />
        </linearGradient>
        <filter id="dashGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor={glowColor} floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Hexagonal / Squircle Precision Outer Frame */}
      <rect 
        x="2.5" 
        y="2.5" 
        width="19" 
        height="19" 
        rx="5.5" 
        stroke={strokeColor} 
        strokeWidth="1.6" 
        strokeOpacity={isActive ? '0.9' : '0.45'}
        fill={isActive ? 'rgba(0, 0, 0, 0.08)' : 'rgba(6, 182, 212, 0.08)'}
      />

      {/* Telemetry Matrix Grid Lines */}
      <line x1="2.5" y1="8" x2="21.5" y2="8" stroke={strokeColor} strokeWidth="0.8" strokeOpacity={isActive ? '0.35' : '0.2'} />
      <line x1="8" y1="2.5" x2="8" y2="21.5" stroke={strokeColor} strokeWidth="0.8" strokeOpacity={isActive ? '0.35' : '0.2'} />

      {/* AI Precision Telemetry Bars & Waveform */}
      <rect x="5" y="13" width="2.4" height="6" rx="1.2" fill={strokeColor} fillOpacity={isActive ? '0.8' : '0.6'} />
      <rect x="9.5" y="10" width="2.4" height="9" rx="1.2" fill={strokeColor} fillOpacity={isActive ? '0.95' : '0.9'} />
      <rect x="14" y="6" width="2.4" height="13" rx="1.2" fill={`url(#${fillGradientId})`} filter="url(#dashGlow)" />
      
      {/* Predictive Target Node & Spark */}
      <circle cx="17.5" cy="5.5" r="2.2" fill={accentColor} />
      <circle cx="17.5" cy="5.5" r="1" fill={isActive ? '#ffffff' : '#e0f2fe'} />
      <path 
        d="M6 13L10.5 10L15 6L17.5 5.5" 
        stroke={strokeColor} 
        strokeWidth="1.3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeDasharray={isActive ? 'none' : '2 1.5'}
      />
    </svg>
  );
};

// 2. Dev Data Management Logo
export const DevDataManagementLogo = ({ size = 20, isActive = false, className = '' }) => {
  const primaryStroke = isActive ? '#030712' : '#10b981';
  const secondaryStroke = isActive ? '#0f172a' : '#34d399';
  const accentFill = isActive ? '#030712' : '#059669';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`dev-icon dev-icon-data ${className}`}
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={isActive ? 'dataGradAct' : 'dataGrad'} x1="4" y1="3" x2="20" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isActive ? '#030712' : '#34d399'} />
          <stop offset="100%" stopColor={isActive ? '#0f172a' : '#059669'} />
        </linearGradient>
      </defs>

      {/* Top Database Tier Cylinder */}
      <ellipse cx="12" cy="6" rx="8" ry="3" stroke={primaryStroke} strokeWidth="1.6" fill={isActive ? 'rgba(0,0,0,0.12)' : 'rgba(16, 185, 129, 0.16)'} />
      
      {/* Middle Cylinder Tier with Synced Data Packets */}
      <path d="M4 6V11C4 12.6569 7.58172 14 12 14C16.4183 14 20 12.6569 20 11V6" stroke={primaryStroke} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M4 11V16C4 17.6569 7.58172 19 12 19C16.4183 19 20 17.6569 20 16V11" stroke={primaryStroke} strokeWidth="1.6" strokeLinecap="round" />
      
      {/* Dynamic Data Stream Nodes / Pipeline Ingestion Markers */}
      <circle cx="12" cy="6" r="1.3" fill={accentFill} />
      <circle cx="7" cy="11.2" r="1.1" fill={secondaryStroke} />
      <circle cx="17" cy="11.2" r="1.1" fill={secondaryStroke} />
      
      {/* Ingestion Stream Arrow Indicator */}
      <path d="M18 16L20 18L18 20" stroke={secondaryStroke} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 18H20" stroke={secondaryStroke} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
};

// 3. Dev Model Training Pipeline Logo
export const DevPipelineLogo = ({ size = 20, isActive = false, className = '' }) => {
  const primaryColor = isActive ? '#030712' : '#8b5cf6';
  const nodeColor = isActive ? '#030712' : '#c084fc';
  const synapseColor = isActive ? '#1e293b' : '#38bdf8';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`dev-icon dev-icon-pipeline ${className}`}
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={isActive ? 'pipeGradAct' : 'pipeGrad'} x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={isActive ? '#030712' : '#c084fc'} />
          <stop offset="100%" stopColor={isActive ? '#1e1b4b' : '#6366f1'} />
        </linearGradient>
      </defs>

      {/* Multi-Layer Neural Synaptic Links */}
      <path d="M5 6L12 4L19 7" stroke={synapseColor} strokeWidth="1.3" strokeOpacity={isActive ? '0.7' : '0.6'} strokeDasharray="2 1.5" />
      <path d="M5 6L12 12L19 7" stroke={synapseColor} strokeWidth="1.3" strokeOpacity={isActive ? '0.7' : '0.7'} />
      <path d="M5 18L12 12L19 17" stroke={synapseColor} strokeWidth="1.3" strokeOpacity={isActive ? '0.7' : '0.7'} />
      <path d="M5 18L12 20L19 17" stroke={synapseColor} strokeWidth="1.3" strokeOpacity={isActive ? '0.7' : '0.6'} strokeDasharray="2 1.5" />
      <path d="M12 4V20" stroke={primaryColor} strokeWidth="1.2" strokeOpacity={isActive ? '0.5' : '0.4'} />

      {/* Layer 1: Input Tensor Nodes */}
      <circle cx="5" cy="6" r="2.3" fill={primaryColor} />
      <circle cx="5" cy="18" r="2.3" fill={primaryColor} />

      {/* Layer 2: Deep Hidden Recurrent / LSTM Nodes */}
      <circle cx="12" cy="4" r="2.2" fill={nodeColor} />
      <circle cx="12" cy="12" r="3.2" fill={`url(#${isActive ? 'pipeGradAct' : 'pipeGrad'})`} stroke={synapseColor} strokeWidth="1.2" />
      <circle cx="12" cy="12" r="1.3" fill={isActive ? '#ffffff' : '#38bdf8'} />
      <circle cx="12" cy="20" r="2.2" fill={nodeColor} />

      {/* Layer 3: Ensembled Forecast Output Nodes */}
      <circle cx="19" cy="7" r="2.4" fill={primaryColor} />
      <circle cx="19" cy="17" r="2.4" fill={primaryColor} />
    </svg>
  );
};

// 4. Dev Header Brand Logo (Developer Suite Core Terminal)
export const DevBrandLogo = ({ size = 26, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`dev-brand-core ${className}`}
      style={{ verticalAlign: 'middle', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="brandCoreGrad" x1="2" y1="2" x2="26" y2="26" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>

      {/* Silicon Chip Substrate */}
      <rect x="4" y="4" width="20" height="20" rx="5" fill="#0b1324" stroke="url(#brandCoreGrad)" strokeWidth="1.8" />
      
      {/* Exterior Micro-Pins */}
      <line x1="8" y1="1.5" x2="8" y2="4" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="1.5" x2="14" y2="4" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="1.5" x2="20" y2="4" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />
      
      <line x1="8" y1="24" x2="8" y2="26.5" stroke="#06b6d4" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="14" y1="24" x2="14" y2="26.5" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="20" y1="24" x2="20" y2="26.5" stroke="#8b5cf6" strokeWidth="1.5" strokeLinecap="round" />

      {/* Central Neural Core Node */}
      <rect x="8.5" y="8.5" width="11" height="11" rx="3" fill="rgba(6, 182, 212, 0.15)" stroke="#38bdf8" strokeWidth="1.3" />
      <path d="M11 14L13 16L17 12" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// 5. SARIMA Model Architecture Vector Badge
export const DevSarimaIcon = ({ size = 28, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`dev-model-badge ${className}`}
    >
      <defs>
        <linearGradient id="sarimaGrad" x1="3" y1="3" x2="25" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0284c7" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="rgba(56, 189, 248, 0.12)" stroke="#38bdf8" strokeWidth="1.6" />
      {/* Grid Axes */}
      <line x1="7" y1="20" x2="21" y2="20" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.5" />
      <line x1="7" y1="8" x2="7" y2="20" stroke="#38bdf8" strokeWidth="1.2" strokeOpacity="0.5" />
      {/* Seasonal Sine Wave Decomposition */}
      <path 
        d="M7 16 C 9 11, 11 11, 13 15 C 15 19, 17 19, 19 13 C 20 10, 21 11, 22 9" 
        stroke="url(#sarimaGrad)" 
        strokeWidth="2.2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Confidence Bounds */}
      <path d="M13 11L21 8" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1.5" strokeOpacity="0.6" />
      <path d="M13 19L21 17" stroke="#38bdf8" strokeWidth="1" strokeDasharray="1.5 1.5" strokeOpacity="0.6" />
      <circle cx="21" cy="9" r="1.6" fill="#38bdf8" />
    </svg>
  );
};

// 6. LSTM Recurrent Neural Net Vector Badge
export const DevLstmIcon = ({ size = 28, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`dev-model-badge ${className}`}
    >
      <defs>
        <linearGradient id="lstmGrad" x1="3" y1="3" x2="25" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c084fc" />
          <stop offset="100%" stopColor="#9333ea" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="rgba(168, 85, 247, 0.12)" stroke="#a855f7" strokeWidth="1.6" />
      {/* Recurrent Memory Loop */}
      <path 
        d="M9 14 C 9 9.5, 19 9.5, 19 14 C 19 18.5, 9 18.5, 9 14 Z" 
        stroke="url(#lstmGrad)" 
        strokeWidth="2" 
        strokeLinejoin="round" 
      />
      {/* Input / Forget / Output Gates */}
      <circle cx="11" cy="14" r="1.8" fill="#c084fc" />
      <circle cx="17" cy="14" r="1.8" fill="#e9d5ff" />
      {/* Feedback Arrow */}
      <path d="M13.5 10.5L15 9L16.5 10.5" stroke="#c084fc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14.5 17.5L13 19L11.5 17.5" stroke="#c084fc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// 7. SARIMA–LSTM Hybrid Ensemble Architecture Vector Badge
export const DevHybridIcon = ({ size = 28, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 28 28" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`dev-model-badge ${className}`}
    >
      <defs>
        <linearGradient id="hybridGrad" x1="3" y1="3" x2="25" y2="25" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="rgba(16, 185, 129, 0.12)" stroke="url(#hybridGrad)" strokeWidth="1.6" />
      {/* Stream 1 (SARIMA Baseline) */}
      <path d="M6 10H13C15 10 16 12 18 14" stroke="#06b6d4" strokeWidth="1.8" strokeLinecap="round" />
      {/* Stream 2 (LSTM Residual Error) */}
      <path d="M6 18H13C15 18 16 16 18 14" stroke="#a855f7" strokeWidth="1.8" strokeLinecap="round" />
      {/* Ensembling Convergence Node */}
      <line x1="18" y1="14" x2="22" y2="14" stroke="#10b981" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="18" cy="14" r="2.8" fill="#10b981" stroke="#ffffff" strokeWidth="1" />
      <circle cx="22" cy="14" r="1.6" fill="#f59e0b" />
    </svg>
  );
};

// 8. Hero Banner Glowing Badge Wrapper
export const DevHeroBadge = ({ children, gradient = 'cyan' }) => {
  const gradientStyles = {
    cyan: 'linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(59, 130, 246, 0.25) 100%)',
    emerald: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
    purple: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
  };

  const borderStyles = {
    cyan: 'rgba(6, 182, 212, 0.5)',
    emerald: 'rgba(16, 185, 129, 0.5)',
    purple: 'rgba(139, 92, 246, 0.5)',
  };

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '42px',
      height: '42px',
      borderRadius: '12px',
      background: gradientStyles[gradient] || gradientStyles.cyan,
      border: `1.5px solid ${borderStyles[gradient] || borderStyles.cyan}`,
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), 0 0 12px rgba(6, 182, 212, 0.2)',
      flexShrink: 0
    }}>
      {children}
    </div>
  );
};
