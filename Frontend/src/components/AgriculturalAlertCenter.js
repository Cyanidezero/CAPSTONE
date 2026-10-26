import React, { useState } from 'react';
import './AgriculturalAlertCenter.css';

/**
 * AgriculturalAlertCenter Component
 * Live intelligent alerts for:
 * 1. Ready-to-harvest vegetables & Days left until harvest countdown
 * 2. Climate warnings & Drizzle rain advisories
 */
const AgriculturalAlertCenter = ({
  harvestAlerts = [],
  climateAlerts = [],
  crops = [],
  lang = 'en',
  onNavigateToWeather,
  onNavigateToPredictions
}) => {
  const isFil = lang === 'fil';
  const [filter, setFilter] = useState('all'); // 'all' | 'harvest' | 'climate'
  const [expandedAlertId, setExpandedAlertId] = useState(null);

  const allAlerts = [
    ...harvestAlerts.map(a => ({ ...a, category: 'harvest' })),
    ...climateAlerts.map(a => ({ ...a, category: 'climate' }))
  ];

  const displayedAlerts = allAlerts.filter(a => {
    if (filter === 'harvest') return a.category === 'harvest';
    if (filter === 'climate') return a.category === 'climate';
    return true;
  });

  const toggleExpand = (id) => {
    setExpandedAlertId(prev => prev === id ? null : id);
  };

  if (allAlerts.length === 0) return null;

  const readyCount = harvestAlerts.filter(a => a.type === 'harvest-ready').length;
  const hasDrizzle = climateAlerts.some(a => a.type === 'drizzle');
  const hasWeatherWarning = climateAlerts.some(a => a.severity === 'warning' || a.severity === 'danger');

  return (
    <div className="aac-container">
      {/* Alert Center Header Bar */}
      <div className="aac-header">
        <div className="aac-header-left">
          <div className="aac-pulse-badge">
            <span className="aac-pulse-dot" />
            <span className="aac-header-icon">📢</span>
          </div>
          <div>
            <h3 className="aac-title">
              {isFil ? 'Alerto sa Pag-aani at Lagay ng Panahon' : 'Harvest & Climate Alert Center'}
            </h3>
            <p className="aac-subtitle">
              {isFil 
                ? 'Real-time na gabay sa kahandaan ng gulay at babala sa klima sa Quezon City'
                : 'Real-time crop maturity countdown & Quezon City meteorological advisories'}
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="aac-filters">
          <button
            type="button"
            className={`aac-filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <span>{isFil ? 'Lahat' : 'All'} ({allAlerts.length})</span>
          </button>
          <button
            type="button"
            className={`aac-filter-btn harvest ${filter === 'harvest' ? 'active' : ''}`}
            onClick={() => setFilter('harvest')}
          >
            <span>🌾 {isFil ? 'Pag-ani' : 'Harvest'}</span>
            {readyCount > 0 && <span className="aac-counter-badge ready">{readyCount}</span>}
          </button>
          <button
            type="button"
            className={`aac-filter-btn climate ${filter === 'climate' ? 'active' : ''}`}
            onClick={() => setFilter('climate')}
          >
            <span>🌦️ {isFil ? 'Klima' : 'Climate'}</span>
            {hasDrizzle && <span className="aac-counter-badge drizzle">🌧️</span>}
            {hasWeatherWarning && !hasDrizzle && <span className="aac-counter-badge warning">⚠️</span>}
          </button>
        </div>
      </div>

      {/* Alert Cards Feed */}
      <div className="aac-feed">
        {displayedAlerts.map(alert => {
          const isExpanded = expandedAlertId === alert.id;
          const isReadyAlert = alert.type === 'harvest-ready';
          const isDrizzleAlert = alert.type === 'drizzle';
          const isNearAlert = alert.type === 'harvest-countdown';

          return (
            <div 
              key={alert.id}
              className={`aac-card severity-${alert.severity} ${alert.category} ${isReadyAlert ? 'ready-card' : ''} ${isDrizzleAlert ? 'drizzle-card' : ''}`}
              onClick={() => toggleExpand(alert.id)}
            >
              <div className="aac-card-main">
                <div className="aac-card-icon-box">
                  <span className="aac-card-icon">{alert.icon}</span>
                </div>

                <div className="aac-card-content">
                  <div className="aac-card-topline">
                    <span className={`aac-category-pill ${alert.category}`}>
                      {alert.category === 'harvest' 
                        ? (isReadyAlert ? (isFil ? '🎉 ANI NA!' : '🎉 READY') : (isFil ? '⏳ COUNTDOWN' : '⏳ COUNTDOWN'))
                        : (isDrizzleAlert ? (isFil ? '🌧️ AMBON' : '🌧️ DRIZZLE') : (isFil ? '🌦️ KLIMA' : '🌦️ CLIMATE'))
                      }
                    </span>
                    <h4 className="aac-card-title">{alert.title}</h4>
                  </div>

                  <p className="aac-card-message">{alert.message}</p>

                  {/* If Harvest Alert has crops, render interactive mini tags */}
                  {alert.crops && alert.crops.length > 0 && (
                    <div className="aac-crop-chips">
                      {alert.crops.map(c => (
                        <div key={c.id} className={`aac-crop-chip ${c.harvestInfo.status}`}>
                          <span className="chip-icon">{c.icon}</span>
                          <span className="chip-name">{c.cropName}</span>
                          <span className="chip-badge">
                            {c.harvestInfo.isReady
                              ? (isFil ? 'Ani na!' : 'Ready!')
                              : `${c.harvestInfo.daysRemaining} ${isFil ? 'araw' : 'days left'}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Expandable Action Guide */}
                  {isExpanded && (
                    <div className="aac-expanded-details">
                      {isReadyAlert && (
                        <div className="aac-guide-box success">
                          <strong>💡 {isFil ? 'Rekomendasyon sa Pag-aani:' : 'Harvesting Best Practices:'}</strong>
                          <ul>
                            <li>{isFil ? 'Mag-ani sa pagitan ng 5:30 AM hanggang 7:30 AM bago sumikat ang matinding araw.' : 'Harvest between 5:30 AM and 7:30 AM before intense sunlight causes dehydration.'}</li>
                            <li>{isFil ? 'Gumamit ng matalas na gunting o kutsilyo upang hindi mabugbog ang tangkay ng halaman.' : 'Use sharp shears to make clean cuts without bruising basal stem tissues.'}</li>
                            <li>{isFil ? 'Hugasan sa malinis na tubig at palamigin agad bago dalhin sa pamilihan.' : 'Rinse with clean, cool water and transfer immediately to shaded transport crates.'}</li>
                          </ul>
                        </div>
                      )}

                      {isNearAlert && (
                        <div className="aac-guide-box warning">
                          <strong>📦 {isFil ? 'Paghahanda bago mag-ani:' : 'Pre-Harvest Checklist:'}</strong>
                          <ul>
                            <li>{isFil ? 'Bawasan ang patubig 24 oras bago mag-ani para maiwasan ang malabsaw na gulay.' : 'Taper irrigation 24 hours prior to harvest to prevent waterlogged, fragile leaves.'}</li>
                            <li>{isFil ? 'I-coordinate ang iskedyul sa Balintawak o Mega Q-Mart trading centers.' : 'Pre-coordinate pickup or delivery slots with trading partners at Balintawak or Q-Mart.'}</li>
                          </ul>
                        </div>
                      )}

                      {isDrizzleAlert && (
                        <div className="aac-guide-box info">
                          <strong>🛡️ {isFil ? 'Agronomic Protocol sa Panahon ng Ambon:' : 'Drizzle Management Protocol:'}</strong>
                          <ul>
                            <li>{isFil ? 'HUWAG mag-spray ng foliar fertilizers habang umaambon dahil mahuhugasan lamang ang sustansya.' : 'DO NOT apply foliar nutrients during drizzle; rainfall washes active agents into runoff.'}</li>
                            <li>{isFil ? 'Mag-spray ng biological preventive fungicide (Trichoderma o baking soda solution) pagkatapos ng ambon.' : 'Apply biological Trichoderma or mild potassium bicarbonate wash once foliage dries to inhibit powdery mildew.'}</li>
                            <li>{isFil ? 'Inspeksyunin ang ilalim ng dahon ng Pechay at Mustasa laban sa snails at slug.' : 'Inspect undersides of leafy canopies for snails and slugs that thrive during light rains.'}</li>
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="aac-card-action-side">
                  <span className="aac-expand-toggle">
                    {isExpanded ? (isFil ? 'Itago ▲' : 'Hide ▲') : (isFil ? 'Detalye ▼' : 'Details ▼')}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AgriculturalAlertCenter;
