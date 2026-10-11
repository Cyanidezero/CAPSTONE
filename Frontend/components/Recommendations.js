import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Recommendations() {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState('hybrid');
  const [steps, setSteps] = useState(30);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/predict`, {
        modelType: modelType,
        steps: steps
      });
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations || []);
        toast.success('Field recommendations generated from live forecast!');
      } else {
        toast.error('Failed to generate recommendations: ' + (response.data.error || 'Unknown error'));
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

  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });

  return (
    <div>
      <h2>💡 Farming Recommendations & Decision Support</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        Get actionable, AI-driven farming recommendations synchronized with live weather forecasts and crop yield projections.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="control-group">
          <label>Forecast Model Basis</label>
          <select value={modelType} onChange={(e) => setModelType(e.target.value)}>
            <option value="hybrid">🔀 Hybrid (SARIMA-LSTM - Recommended)</option>
            <option value="lstm">🧠 LSTM Neural Network</option>
            <option value="sarima">📈 SARIMA Weather Trend</option>
          </select>
        </div>

        <div className="control-group">
          <label>Forecast Horizon (Days)</label>
          <input
            type="number"
            value={steps}
            onChange={(e) => setSteps(parseInt(e.target.value) || 30)}
            min="7"
            max="90"
          />
        </div>

        <div className="control-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
          <button 
            className="btn-primary" 
            onClick={fetchRecommendations}
            disabled={loading}
          >
            {loading ? '⏳ Generating...' : '💡 Generate Actionable Recommendations'}
          </button>
        </div>
      </div>

      {recommendations && recommendations.length > 0 ? (
        <div className="card">
          <h3>📋 Tailored Field Recommendations</h3>
          <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
            {recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="category">{rec.category}</span>
                  <span className={`level ${getLevelClass(rec.level)}`}>
                    {rec.level}
                  </span>
                </div>
                <p style={{ marginTop: '10px', fontSize: '1.05rem', lineHeight: '1.5', color: '#2c3e50' }}>
                  {rec.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
          <p className="info-text">
            Click <strong>"Generate Actionable Recommendations"</strong> above to compute tailored insights from your current model and dataset.
          </p>
        </div>
      )}

      {/* Seasonal Farming Guide */}
      <div className="card" style={{ marginTop: '25px' }}>
        <h3>🗓️ Year-Round Seasonal Farming Calendar</h3>
        <p style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '15px' }}>
          General agronomic guidance tailored by seasonal weather cycles (current month: <strong>{currentMonthName}</strong>)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'].map(month => {
            const isCurrentMonth = month === currentMonthName;
            return (
              <div key={month} style={{ 
                padding: '12px', 
                background: isCurrentMonth ? '#e8f8f0' : '#f8f9fa', 
                borderRadius: '10px',
                borderLeft: isCurrentMonth ? '4px solid #27ae60' : '3px solid #3498db',
                boxShadow: isCurrentMonth ? '0 2px 8px rgba(39, 174, 96, 0.2)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: isCurrentMonth ? '#27ae60' : '#2c3e50' }}>{month}</strong>
                  {isCurrentMonth && (
                    <span style={{ fontSize: '0.7rem', background: '#27ae60', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                      Current
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.85rem', marginTop: '6px', color: '#555', lineHeight: '1.4' }}>
                  {getSeasonalTip(month)}
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