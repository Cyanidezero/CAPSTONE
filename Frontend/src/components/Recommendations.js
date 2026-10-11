import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './Recommendations.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Recommendations({ lang = 'en' }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState('hybrid');
  const [steps, setSteps] = useState(30);
  const isFil = lang === 'fil';

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/predict`, {
        modelType: modelType,
        steps: steps
      });
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations || []);
        toast.success(isFil ? 'Nagawa ang mga payo sa bukid mula sa direktang ulat panahon!' : 'Field recommendations generated from live forecast!');
      } else {
        toast.error((isFil ? 'Bigo sa paggawa ng payo: ' : 'Failed to generate recommendations: ') + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to generate recommendations';
      toast.error('Error: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const getLevelClass = (level) => {
    const levelMap = {
      'High': 'level-high',
      'Medium': 'level-medium',
      'Low': 'level-low',
      'Unstable': 'level-high',
      'Moderate': 'level-medium',
      'Stable': 'level-low',
      'Normal': 'level-low',
      'Info': 'level-low'
    };
    return levelMap[level] || 'level-medium';
  };

  const MONTH_FILIPINO = {
    'January': 'Enero',
    'February': 'Pebrero',
    'March': 'Marso',
    'April': 'Abril',
    'May': 'Mayo',
    'June': 'Hunyo',
    'July': 'Hulyo',
    'August': 'Agosto',
    'September': 'Setyembre',
    'October': 'Oktubre',
    'November': 'Nobyembre',
    'December': 'Disyembre'
  };

  const TIPS_FILIPINO = {
    'January': 'Ihanda ang lupa para sa tag-araw; ayusin ang patubig para hindi matuyuan ang mga tanim.',
    'February': 'Pumili ng mga pananim na kaya ang init; maglagay ng mulch o dayami para hindi agad matuyo ang lupa.',
    'March': 'Magpatubig nang regular (drip irrigation); bantayan kung may uod o insekto sa mga tanim.',
    'April': 'Maglagay ng balanseng abono; mag-ingat sa amag sa dahon pagkatapos ng mahamog na umaga.',
    'May': 'Linisin ang mga kanal at daluyan ng tubig bago dumating ang panahon ng tag-ulan.',
    'June': 'Bantayan ang malalakas na ulan; siguruhing mabilis umagos ang tubig para hindi mabaha ang taniman.',
    'July': 'Mag-spray ng organikong gamot sa amag kapag sunod-sunod ang maulap at maulang araw.',
    'August': 'Simulan ang pag-ani ng mga hinog na gulay; linisin at patuyuin ang bilaran at taguan ng ani.',
    'September': 'Magtanim ng mga gulay na mabilis anihin tulad ng pechay at sitaw.',
    'October': 'Ihanda ang punlaan para sa bagong tanim; suriin ang lupa kung kailangang lagyan ng apog.',
    'November': 'Maglagay ng pampatabang abono; alagaan ang mga bagong sibol na punla sa lamig o malakas na hangin.',
    'December': 'Bawasan nang kaunti ang pagdidilig; magplano ng pagpapalit ng itatanim para hindi mamugad ang mga peste.'
  };

  const getSeasonalTip = (month) => {
    const tips = {
      'January': 'Prepare land for dry season planting, monitor irrigation sources and soil moisture levels.',
      'February': 'Plant drought-resistant crop varieties; apply organic mulch to suppress soil evaporation.',
      'March': 'Begin regular drip irrigation cycles; actively monitor early-season aphid and stem borer presence.',
      'April': 'Apply balanced N-P-K soil amendments; watch for foliar fungal blights following dew spells.',
      'May': 'Continue integrated pest management; ensure drainage waterways are desilted before wet season.',
      'June': 'Regulate water inlet gates based on precipitation forecasts; clear peripheral ditches to prevent waterlogging.',
      'July': 'Apply preventive bio-fungicides during prolonged cloudy days; check soil aeration.',
      'August': 'Initiate harvesting of early-maturing varieties; clean and disinfect grain drying and storage silos.',
      'September': 'Plant short-cycle legumes or cover crops; monitor post-harvest storage humidity.',
      'October': 'Commence main-season seedbed preparation; test soil pH and adjust with lime or gypsum if needed.',
      'November': 'Apply basal fertilizer dressings; protect sensitive seedlings against sudden temperature drops.',
      'December': 'Taper off irrigation intervals; plan next season crop rotation schedules to break pest cycles.'
    };
    return tips[month] || 'Regular field inspections and soil moisture balancing recommended.';
  };

  const translateCategory = (cat) => {
    if (!isFil) return cat;
    const map = {
      'Irrigation': 'Patubig at Kanal',
      'Fertilizer': 'Abono at Pataba',
      'Crop Protection': 'Proteksyon sa Pananim',
      'Harvesting': 'Pag-aani',
      'Planting': 'Pagtatanim',
      'Soil Management': 'Pangangalaga sa Lupa',
      'Weather Alert': 'Alerto sa Panahon'
    };
    return map[cat] || cat;
  };

  const translatePriority = (lvl) => {
    if (!isFil) return lvl;
    const map = {
      'High': 'Mataas',
      'Medium': 'Katamtaman',
      'Low': 'Mababa',
      'Unstable': 'Mataas',
      'Moderate': 'Katamtaman',
      'Stable': 'Mababa'
    };
    return map[lvl] || lvl;
  };

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <div className="rec-container">
      {/* Hero Welcome Banner */}
      <div className="rec-hero-card">
        <div className="rec-hero-text">
          <h2>
            <span>💡</span>
            <span>
              {isFil ? 'Mga Payo at Gabay sa Bukid' : 'Farming Recommendations & Decision Support'}
            </span>
          </h2>
          <p>
            {isFil
              ? 'Mga praktikal na payo mula sa AI batay sa ulat panahon at ani sa Quezon City.'
              : 'Actionable, AI-driven agronomic recommendations synchronized with live Quezon City weather forecasts and short-cycle vegetable crop yield projections.'}
          </p>
        </div>
        <div className="rec-hero-badge">
          <div className="title">{isFil ? 'Katayuan ng Payo' : 'Advisory Status'}</div>
          <div className="val">{isFil ? '🌱 Payo para sa Bukid' : '🌱 Real-Time Field Advice'}</div>
        </div>
      </div>

      {/* Control Filter Bar */}
      <div className="rec-controls-card">
        <div className="rec-control-group">
          <label>{isFil ? 'Modelong Batayan (AI Model)' : 'Forecast Model Basis'}</label>
          <select value={modelType} onChange={(e) => setModelType(e.target.value)}>
            <option value="hybrid">
              {isFil ? '🔀 Hybrid (SARIMA-LSTM - Rekomendado)' : '🔀 Hybrid (SARIMA-LSTM - Recommended)'}
            </option>
            <option value="lstm">🧠 LSTM Neural Network</option>
            <option value="sarima">
              {isFil ? '📈 SARIMA Takbo ng Panahon' : '📈 SARIMA Weather Trend'}
            </option>
          </select>
        </div>

        <div className="rec-control-group">
          <label>{isFil ? 'Bilang ng Araw (Forecast Days)' : 'Forecast Horizon (Days)'}</label>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value) || 30)}
            min="7"
            max="90"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            className="btn-rec-generate" 
            onClick={fetchRecommendations}
            disabled={loading}
          >
            {loading 
              ? (isFil ? '⏳ Kinakalkula ang mga payo...' : '⏳ Generating Insights...') 
              : (isFil ? '✨ Kumuha ng mga Payo sa Bukid' : '✨ Generate Actionable Recommendations')}
          </button>
        </div>
      </div>

      {/* Recommendations Results */}
      {recommendations && recommendations.length > 0 ? (
        <div className="rec-results-card">
          <h3>
            <span>📋</span>
            <span>
              {isFil 
                ? `Mga Payo sa Bukid (${recommendations.length} Aktibong Payo)` 
                : `Tailored Field Recommendations (${recommendations.length} Active Insights)`}
            </span>
          </h3>
          <div className="rec-items-grid">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-card">
                <div className="rec-card-top">
                  <span className="rec-category-chip">🌿 {translateCategory(rec.category)}</span>
                  <span className={`rec-level-pill ${getLevelClass(rec.level)}`}>
                    {isFil ? `Priyoridad: ${translatePriority(rec.level)}` : `Priority: ${rec.level}`}
                  </span>
                </div>
                <p className="rec-suggestion-text">
                  {rec.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rec-empty-card">
          <div className="rec-empty-icon">🌾</div>
          <p className="rec-empty-text">
            {isFil ? (
              <>Pindutin ang <strong>"Kumuha ng mga Payo sa Bukid"</strong> sa itaas para makita ang mga gabay sa pagsasaka batay sa inyong modelo at datos.</>
            ) : (
              <>Click <strong>"Generate Actionable Recommendations"</strong> above to compute tailored agronomic insights from your current model and field dataset.</>
            )}
          </p>
        </div>
      )}

      {/* Seasonal Farming Guide */}
      <div className="rec-calendar-card">
        <h3>
          <span>🗓️</span>
          <span>{isFil ? 'Gabay sa Pagsasaka Buong Taon' : 'Year-Round Seasonal Farming Calendar'}</span>
        </h3>
        <p className="rec-calendar-sub">
          {isFil ? (
            <>Simpleng gabay sa pagsasaka ayon sa panahon sa Quezon City (Kasalukuyang buwan: <strong>{MONTH_FILIPINO[currentMonthName] || currentMonthName}</strong>)</>
          ) : (
            <>General agronomic guidance tailored by seasonal weather cycles in Quezon City (Current active cycle: <strong>{currentMonthName}</strong>)</>
          )}
        </p>
        <div className="rec-calendar-grid">
          {['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'].map(month => {
            const isCurrentMonth = month === currentMonthName;
            return (
              <div 
                key={month} 
                className={`rec-month-card ${isCurrentMonth ? 'active-month' : ''}`}
              >
                <div className="rec-month-top">
                  <strong className="rec-month-title">
                    {isFil ? (MONTH_FILIPINO[month] || month) : month}
                  </strong>
                  {isCurrentMonth && (
                    <span className="rec-month-badge">
                      {isFil ? 'Kasalukuyan' : 'Current'}
                    </span>
                  )}
                </div>
                <p className="rec-month-tip">
                  {isFil ? (TIPS_FILIPINO[month] || getSeasonalTip(month)) : getSeasonalTip(month)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;