import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function ModelTraining({ onTrainingComplete }) {
  const [training, setTraining] = useState({
    sarima: false,
    lstm: false,
    hybrid: false
  });
  const [params, setParams] = useState({
    epochs: 100,
    sequenceLength: 15,
    target: 'Crop_Yield'
  });
  const [trainingResults, setTrainingResults] = useState({
    sarima: null,
    lstm: null,
    hybrid: null
  });

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setParams(prev => ({
      ...prev,
      [name]: name === 'epochs' || name === 'sequenceLength' ? parseInt(value) || 10 : value
    }));
  };

  const trainSARIMA = async () => {
    setTraining(prev => ({ ...prev, sarima: true }));
    try {
      const response = await axios.post(`${API_URL}/train/sarima`, {
        target: 'Rainfall'
      });
      if (response.data.success) {
        toast.success('SARIMA model trained successfully!');
        setTrainingResults(prev => ({ ...prev, sarima: response.data }));
        if (onTrainingComplete) onTrainingComplete();
      }
    } catch (error) {
      console.error('SARIMA training error:', error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to train SARIMA model';
      toast.error('SARIMA error: ' + errMsg);
    } finally {
      setTraining(prev => ({ ...prev, sarima: false }));
    }
  };

  const trainLSTM = async () => {
    setTraining(prev => ({ ...prev, lstm: true }));
    try {
      const response = await axios.post(`${API_URL}/train/lstm`, {
        epochs: params.epochs,
        sequenceLength: params.sequenceLength,
        target: params.target
      });
      if (response.data.success) {
        toast.success('LSTM model trained successfully!');
        setTrainingResults(prev => ({ ...prev, lstm: response.data }));
        if (onTrainingComplete) onTrainingComplete();
      }
    } catch (error) {
      console.error('LSTM training error:', error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to train LSTM model';
      toast.error('LSTM error: ' + errMsg);
    } finally {
      setTraining(prev => ({ ...prev, lstm: false }));
    }
  };

  const trainHybrid = async () => {
    setTraining(prev => ({ ...prev, hybrid: true }));
    try {
      const response = await axios.post(`${API_URL}/train/hybrid`, {
        target: params.target
      });
      if (response.data.success) {
        toast.success('Hybrid SARIMA-LSTM model trained successfully!');
        setTrainingResults(prev => ({ ...prev, hybrid: response.data }));
        if (onTrainingComplete) onTrainingComplete();
      }
    } catch (error) {
      console.error('Hybrid training error:', error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to train Hybrid model';
      toast.error('Hybrid error: ' + errMsg);
    } finally {
      setTraining(prev => ({ ...prev, hybrid: false }));
    }
  };

  const renderTrainingStatus = (model) => {
    const isTraining = training[model];
    const result = trainingResults[model];
    
    if (isTraining) {
      return <span style={{ color: '#f39c12' }}>⏳ Training in progress...</span>;
    }
    if (result) {
      return <span style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Trained</span>;
    }
    return <span style={{ color: '#95a5a6' }}>⏸ Not Trained</span>;
  };

  return (
    <div>
      <h2>🤖 Model Training</h2>
      <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
        Train SARIMA, LSTM, and Hybrid models on your uploaded dataset for weather and yield forecasting.
      </p>

      <div className="training-controls">
        <div className="control-group">
          <label>Target Variable (LSTM & Hybrid)</label>
          <select name="target" value={params.target} onChange={handleParamChange}>
            <option value="Crop_Yield">Crop Yield (tons/ha)</option>
            <option value="Rainfall">Rainfall (mm)</option>
            <option value="Max_Temp">Max Temperature (°C)</option>
            <option value="Min_Temp">Min Temperature (°C)</option>
            <option value="Humidity">Humidity (%)</option>
          </select>
        </div>

        <div className="control-group">
          <label>Sequence Length (Days)</label>
          <input
            type="number"
            name="sequenceLength"
            value={params.sequenceLength}
            onChange={handleParamChange}
            min="5"
            max="60"
          />
        </div>

        <div className="control-group">
          <label>Epochs</label>
          <input
            type="number"
            name="epochs"
            value={params.epochs}
            onChange={handleParamChange}
            min="20"
            max="300"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        <div className="card">
          <h3>📈 SARIMA Model</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '15px', fontSize: '0.9rem' }}>
            Seasonal Auto-Regressive Integrated Moving Average for weather trends
          </p>
          <div style={{ marginBottom: '15px' }}>
            Status: {renderTrainingStatus('sarima')}
          </div>
          <button 
            className="btn-secondary" 
            onClick={trainSARIMA}
            disabled={training.sarima}
            style={{ width: '100%' }}
          >
            {training.sarima ? 'Training...' : 'Train SARIMA'}
          </button>
        </div>

        <div className="card">
          <h3>🧠 LSTM Neural Network</h3>
          <p style={{ color: '#7f8c8d', marginBottom: '15px', fontSize: '0.9rem' }}>
            Deep Learning sequence model learning multi-variable weather dynamics
          </p>
          <div style={{ marginBottom: '15px' }}>
            Status: {renderTrainingStatus('lstm')}
          </div>
          <button 
            className="btn-secondary" 
            onClick={trainLSTM}
            disabled={training.lstm}
            style={{ width: '100%' }}
          >
            {training.lstm ? 'Training...' : 'Train LSTM'}
          </button>
        </div>

        <div className="card" style={{ border: '2px solid #27ae60' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3>🔀 Hybrid Model</h3>
            <span style={{ fontSize: '0.75rem', background: '#e8f8f0', color: '#27ae60', padding: '2px 8px', borderRadius: '6px', fontWeight: 'bold' }}>
              RECOMMENDED
            </span>
          </div>
          <p style={{ color: '#7f8c8d', marginBottom: '15px', fontSize: '0.9rem' }}>
            Combines SARIMA linear baseline with LSTM non-linear residual compensation
          </p>
          <div style={{ marginBottom: '15px' }}>
            Status: {renderTrainingStatus('hybrid')}
          </div>
          <button 
            className="btn-primary" 
            onClick={trainHybrid}
            disabled={training.hybrid}
            style={{ width: '100%' }}
          >
            {training.hybrid ? 'Training...' : 'Train Hybrid Model'}
          </button>
        </div>
      </div>

      {/* LSTM Training Loss Graph */}
      {trainingResults.lstm?.history?.loss && (
        <div className="card" style={{ marginTop: '25px' }}>
          <h3>📉 LSTM Training Loss Curve</h3>
          <p style={{ color: '#7f8c8d', fontSize: '0.85rem', marginBottom: '10px' }}>
            Convergence history over {params.epochs} epochs
          </p>
          <div style={{ height: '220px' }}>
            <Line
              data={{
                labels: trainingResults.lstm.history.loss.map((_, i) => `E${i + 1}`),
                datasets: [
                  {
                    label: 'Training Loss',
                    data: trainingResults.lstm.history.loss,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    tension: 0.3,
                    fill: true
                  },
                  {
                    label: 'Validation Loss',
                    data: trainingResults.lstm.history.val_loss || [],
                    borderColor: '#e74c3c',
                    backgroundColor: 'transparent',
                    borderDash: [5, 5],
                    tension: 0.3
                  }
                ]
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
              }}
            />
          </div>
        </div>
      )}

      {/* SARIMA Summary */}
      {trainingResults.sarima && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3>📊 SARIMA Baseline Forecast Preview</h3>
          <p style={{ color: '#7f8c8d', fontSize: '0.85rem' }}>
            Fitted trend slope: {trainingResults.sarima.forecast?.[0]?.toFixed(2)} baseline projection
          </p>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '10px 0' }}>
            {trainingResults.sarima.forecast?.slice(0, 10).map((val, idx) => (
              <div key={idx} style={{ minWidth: '70px', padding: '8px', background: '#f8f9fa', borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#7f8c8d' }}>Day {idx + 1}</div>
                <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#2c3e50' }}>{val.toFixed(1)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelTraining;