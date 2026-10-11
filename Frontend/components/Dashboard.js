import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function Dashboard({ systemStatus = {}, setActiveTab, onRefresh }) {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPreview = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/preview`);
      setPreviewData(response.data);
    } catch (error) {
      console.error('Error fetching preview:', error);
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPreview();
  }, [fetchPreview, systemStatus.datasetLoaded]);

  const renderStatusIndicator = (status) => {
    const isTrained = status === 'Trained';
    return (
      <span className={isTrained ? 'value loaded' : 'value not-loaded'}>
        {isTrained ? '✅ Trained' : '⏳ Not Trained'}
      </span>
    );
  };

  const navigateTab = (tab) => {
    if (setActiveTab) {
      setActiveTab(tab);
    } else {
      document.querySelector(`[data-tab="${tab}"]`)?.click();
    }
  };

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📊 System Status</h3>
          {onRefresh && (
            <button 
              className="btn-secondary" 
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              onClick={() => { onRefresh(); fetchPreview(); }}
            >
              🔄 Refresh
            </button>
          )}
        </div>
        <div className="status-item">
          <span className="label">Dataset:</span>
          <span className={systemStatus?.datasetLoaded ? 'value loaded' : 'value not-loaded'}>
            {systemStatus?.datasetLoaded ? '✅ Loaded' : '❌ Not Loaded'}
          </span>
        </div>
        <div className="status-item">
          <span className="label">SARIMA Model:</span>
          {renderStatusIndicator(systemStatus?.trainingStatus?.sarima || 'Not Trained')}
        </div>
        <div className="status-item">
          <span className="label">LSTM Model:</span>
          {renderStatusIndicator(systemStatus?.trainingStatus?.lstm || 'Not Trained')}
        </div>
        <div className="status-item">
          <span className="label">Hybrid Model:</span>
          {renderStatusIndicator(systemStatus?.trainingStatus?.hybrid || 'Not Trained')}
        </div>
      </div>

      <div className="card">
        <h3>⚡ Quick Actions</h3>
        <div className="quick-actions">
          <button onClick={() => navigateTab('data')}>
            📁 Import Data
          </button>
          <button onClick={() => navigateTab('training')}>
            🤖 Train Models
          </button>
          <button onClick={() => navigateTab('predictions')}>
            📈 View Predictions
          </button>
          <button onClick={() => navigateTab('recommendations')}>
            💡 Farming Insights
          </button>
        </div>
      </div>

      <div className="card full-width">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>📋 Data Preview</h3>
          {previewData && (
            <span style={{ fontSize: '0.85rem', color: '#7f8c8d' }}>
              {previewData.shape?.rows || 0} rows × {previewData.shape?.columns || 0} columns
            </span>
          )}
        </div>

        {loading ? (
          <p style={{ color: '#7f8c8d', padding: '20px', textAlign: 'center' }}>Loading preview...</p>
        ) : previewData && previewData.preview && previewData.preview.length > 0 ? (
          <div>
            <div className="table-container" style={{ marginTop: '15px' }}>
              <table>
                <thead>
                  <tr>
                    {previewData.columns?.slice(0, 8).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview?.slice(0, 5).map((row, idx) => (
                    <tr key={idx}>
                      {previewData.columns?.slice(0, 8).map(col => (
                        <td key={col}>{row[col] !== undefined && row[col] !== null ? String(row[col]).substring(0, 15) : '-'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p style={{ marginTop: '10px', color: '#7f8c8d', fontSize: '0.85rem' }}>
              Showing first {Math.min(5, previewData.preview?.length || 0)} rows of active dataset
            </p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <p className="info-text">No dataset loaded yet.</p>
            <button 
              className="btn-primary" 
              style={{ marginTop: '10px' }}
              onClick={() => navigateTab('data')}
            >
              📤 Upload Dataset Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;