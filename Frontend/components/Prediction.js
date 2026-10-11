import React, { useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Predictions() {
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState('hybrid');
  const [steps, setSteps] = useState(30);

  const generatePredictions = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/predict`, {
        modelType: modelType,
        steps: steps
      });
      
      if (response.data.success) {
        setPredictions(response.data);
        toast.success(`Predictions generated successfully via ${modelType.toUpperCase()}!`);
      } else {
        toast.error('Prediction failed: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Prediction error:', error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to generate predictions';
      toast.error('Prediction error: ' + errMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!predictions || !predictions.predictions || predictions.predictions.length === 0) return null;

    const data = {
      labels: Array.from({ length: predictions.predictions.length }, (_, i) => `Day ${i + 1}`),
      datasets: [
        {
          label: modelType === 'sarima' ? 'Forecasted Rainfall (mm)' : 'Forecasted Yield (tons/ha)',
          data: predictions.predictions,
          borderColor: modelType === 'hybrid' ? '#27ae60' : modelType === 'sarima' ? '#3498db' : '#9b59b6',
          backgroundColor: modelType === 'hybrid' ? 'rgba(39, 174, 96, 0.1)' : 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.35,
          pointRadius: predictions.predictions.length > 40 ? 1 : 3
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: `Forecast Projection (${modelType.toUpperCase()} Model - ${predictions.predictions.length} Days)`
        }
      },
      scales: {
        y: {
          beginAtZero: false
        }
      }
    };

    return (
      <div className="chart-container" style={{ marginTop: '15px' }}>
        <Line data={data} options={options} />
      </div>
    );
  };

  const renderInstability = () => {
    if (!predictions?.instabilityAnalysis) return null;
    
    const { level, mean, std, cv } = predictions.instabilityAnalysis;
    const levelClass = level === 'High' ? 'level-high' : level === 'Medium' ? 'level-medium' : 'level-low';

    return (
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>📊 Yield & Forecast Instability Analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginTop: '10px' }}>
          <div>
            <h4>Stability Index</h4>
            <span className={`level ${levelClass}`} style={{ display: 'inline-block', marginTop: '5px' }}>
              {level} Risk
            </span>
          </div>
          <div>
            <h4>Projected Average</h4>
            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50', marginTop: '5px' }}>
              {mean !== undefined ? mean.toFixed(2) : '-'}
            </p>
          </div>
          <div>
            <h4>Standard Deviation</h4>
            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50', marginTop: '5px' }}>
              ±{std !== undefined ? std.toFixed(2) : '-'}
            </p>
          </div>
          <div>
            <h4>Variation (CV)</h4>
            <p style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#2c3e50', marginTop: '5px' }}>
              {cv !== undefined ? (cv * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendationsPreview = () => {
    if (!predictions?.recommendations || predictions.recommendations.length === 0) return null;

    return (
      <div className="card" style={{ marginTop: '20px' }}>
        <h3>💡 Associated Field Recommendations</h3>
        <div style={{ display: 'grid', gap: '10px', marginTop: '10px' }}>
          {predictions.recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="category">{rec.category}</span>
                <span className={`level level-${(rec.level || 'medium').toLowerCase()}`}>{rec.level}</span>
              </div>
              <p style={{ marginTop: '8px', fontSize: '0.95rem' }}>{rec.suggestion}</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div>
      <h2>📈 Predictions & Forecasting</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        Generate time-series projections using your trained SARIMA, LSTM, or Hybrid models.
      </p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div className="control-group">
          <label>Model Engine</label>
          <select value={modelType} onChange={(e) => setModelType(e.target.value)}>
            <option value="hybrid">🔀 Hybrid (SARIMA-LSTM - Best)</option>
            <option value="lstm">🧠 LSTM Neural Network</option>
            <option value="sarima">📈 SARIMA Statistical</option>
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
            onClick={generatePredictions}
            disabled={loading}
          >
            {loading ? '⏳ Computing Forecast...' : '🚀 Generate Forecast'}
          </button>
        </div>
      </div>

      {predictions && predictions.predictions && predictions.predictions.length > 0 && (
        <div>
          <div className="card">
            <h3>📈 Visual Forecast Projection</h3>
            {renderChart()}
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <h4>Quick Metrics</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px', marginTop: '10px' }}>
                <div>
                  <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Minimum:</span>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{Math.min(...predictions.predictions).toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Maximum:</span>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{Math.max(...predictions.predictions).toFixed(2)}</p>
                </div>
                <div>
                  <span style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>Average:</span>
                  <p style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    {(predictions.predictions.reduce((a, b) => a + b, 0) / predictions.predictions.length).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {renderInstability()}
          {renderRecommendationsPreview()}
        </div>
      )}
    </div>
  );
}

export default Predictions;