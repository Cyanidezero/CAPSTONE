import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_URL } from '../utils/apiConfig';
import { 
  extractCropsFromDataset, 
  saveDatasetCrops,
  clearDatasetCrops 
} from '../utils/cropDatasetParser';
import { DevDataManagementLogo, DevHeroBadge } from './DevIcons';
import './Datamanagement.css';

function DataManagement({ onDataUpload }) {
  const [uploading, setUploading] = useState(false);
  const [validationReport, setValidationReport] = useState(null);
  const [activePreviewTab, setActivePreviewTab] = useState('combined'); // 'combined' | 'weather' | 'crops'

  // Dedicated Repository State
  const [datasetsStatus, setDatasetsStatus] = useState({
    weather: { loaded: false, count: 0, columns: [], preview: [], dateRange: null },
    crops: { loaded: false, count: 0, columns: [], preview: [], detectedCrops: [], dateRange: null },
    combined: { loaded: false, count: 0, columns: [], preview: [], readyForTraining: false }
  });

  const weatherFileInputRef = useRef(null);
  const cropFileInputRef = useRef(null);

  // Fetch status of both repositories from backend
  const fetchDatasetsStatus = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/datasets`);
      if (res.data.success) {
        setDatasetsStatus({
          weather: res.data.weather || { loaded: false, count: 0, columns: [], preview: [], dateRange: null },
          crops: res.data.crops || { loaded: false, count: 0, columns: [], preview: [], detectedCrops: [], dateRange: null },
          combined: res.data.combined || { loaded: false, count: 0, columns: [], preview: [], readyForTraining: false }
        });
      }
    } catch (err) {
      console.warn('Could not fetch datasets status:', err.message);
    }
  }, []);

  useEffect(() => {
    fetchDatasetsStatus();
  }, [fetchDatasetsStatus]);

  // Core file upload handler with repository targeting
  const handleUploadFile = useCallback(async (file, targetType = 'auto') => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('datasetType', targetType);

    setUploading(true);

    // Extract crops directly from file content for client-side caching
    try {
      const textContent = await file.text();
      const detectedCrops = extractCropsFromDataset(textContent, file.name);
      if (detectedCrops && detectedCrops.length > 0) {
        saveDatasetCrops(detectedCrops);
        toast.success(`🌾 Detected ${detectedCrops.length} vegetables in dataset: ${detectedCrops.map(c => c.name).join(', ')}. Synced to Farm Dashboard!`);
      }
    } catch (parseErr) {
      console.warn('Client-side crop parse note:', parseErr);
    }

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          type: targetType
        }
      });

      if (response.data.success) {
        setValidationReport(response.data.validationReport);
        if (response.data.detectedCrops && response.data.detectedCrops.length > 0) {
          saveDatasetCrops(response.data.detectedCrops);
        }
        toast.success(response.data.message || 'Dataset uploaded and saved successfully!');
        await fetchDatasetsStatus();
        if (onDataUpload) onDataUpload();
      } else {
        const msg = response.data.error || 'Unknown upload error';
        toast.error('Upload failed: ' + msg);
        setValidationReport(response.data.validationReport);
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errMsg = error.response?.data?.error || error.message || 'Failed to upload dataset';
      toast.error('Upload error: ' + errMsg);
      if (error.response?.data?.validationReport) {
        setValidationReport(error.response.data.validationReport);
      }
    } finally {
      setUploading(false);
      if (weatherFileInputRef.current) weatherFileInputRef.current.value = '';
      if (cropFileInputRef.current) cropFileInputRef.current.value = '';
    }
  }, [onDataUpload, fetchDatasetsStatus]);



  // Weather Dropzone handler
  const onWeatherDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    await handleUploadFile(file, 'weather');
  }, [handleUploadFile]);

  // Crop Yield Dropzone handler
  const onCropDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    await handleUploadFile(file, 'crops');
  }, [handleUploadFile]);

  const { getRootProps: getWeatherRootProps, getInputProps: getWeatherInputProps, isDragActive: isWeatherDragActive } = useDropzone({
    onDrop: onWeatherDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 16 * 1024 * 1024,
    multiple: false
  });

  const { getRootProps: getCropRootProps, getInputProps: getCropInputProps, isDragActive: isCropDragActive } = useDropzone({
    onDrop: onCropDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 16 * 1024 * 1024,
    multiple: false
  });

  // Action: Input Crop Yield Dataset Preset (Replaced Baseline Climatology!)
  const handleInputCropYieldPreset = async () => {
    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/datasets/preset/crops`);
      if (response.data.success) {
        toast.success(response.data.message || '🌾 Crop yield dataset loaded! Weather dataset was preserved.');
        if (response.data.detectedCrops && response.data.detectedCrops.length > 0) {
          saveDatasetCrops(response.data.detectedCrops);
        }
        await fetchDatasetsStatus();
        if (onDataUpload) onDataUpload();
      }
    } catch (err) {
      toast.error('Failed to load crop yield dataset: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Action: Load Weather Scenario (El Niño)
  const handleLoadElNinoWeather = async () => {
    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/datasets/preset/weather`, { scenario: 'elnino' });
      if (response.data.success) {
        toast.info(response.data.message || '☀️ El Niño weather scenario loaded! Existing crop yields were preserved.');
        await fetchDatasetsStatus();
        if (onDataUpload) onDataUpload();
      }
    } catch (err) {
      toast.error('Failed to load El Niño scenario: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Action: Load Weather Scenario (La Niña)
  const handleLoadLaNinaWeather = async () => {
    setUploading(true);
    try {
      const response = await axios.post(`${API_URL}/datasets/preset/weather`, { scenario: 'lanina' });
      if (response.data.success) {
        toast.info(response.data.message || '🌧️ La Niña monsoon scenario loaded! Existing crop yields were preserved.');
        await fetchDatasetsStatus();
        if (onDataUpload) onDataUpload();
      }
    } catch (err) {
      toast.error('Failed to load La Niña scenario: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  // Action: Clear Dataset Repository
  const handleClearRepository = async (type) => {
    const label = type === 'weather' ? 'Weather records' : type === 'crops' ? 'Crop yield records' : 'All datasets';
    const note = type === 'weather' ? 'Crop yield records will NOT be deleted.' : type === 'crops' ? 'Weather records will NOT be deleted.' : '';
    if (!window.confirm(`Are you sure you want to clear ${label}? ${note}`)) {
      return;
    }
    try {
      const res = await axios.post(`${API_URL}/datasets/clear`, { type });
      if (res.data.success) {
        toast.info(res.data.message);

        // Instantly synchronize and clear Farmer side state
        if (type === 'crops' || type === 'all') {
          clearDatasetCrops();
          try {
            localStorage.removeItem('climayield_custom_crops');
            localStorage.removeItem('climayield_crop_model_trained');
          } catch {}
          window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: [] }));
          window.dispatchEvent(new CustomEvent('cropModelTrainedUpdated', { detail: { trained: false } }));
        }

        if (type === 'weather' || type === 'all') {
          try {
            localStorage.removeItem('climayield_ai_forecasts');
            localStorage.removeItem('climayield_latest_training');
            localStorage.removeItem('climayield_lstm_trained');
          } catch {}
          window.dispatchEvent(new CustomEvent('aiTrainingCompleted', { detail: null }));
          window.dispatchEvent(new CustomEvent('lstmTrainingUpdated', { detail: { trained: false } }));
        }

        await fetchDatasetsStatus();
        if (onDataUpload) onDataUpload();
      }
    } catch (err) {
      toast.error('Failed to clear dataset: ' + (err.response?.data?.error || err.message));
    }
  };

  // Determine current active preview data based on selected tab
  const getActivePreviewData = () => {
    if (activePreviewTab === 'weather') {
      return {
        columns: datasetsStatus.weather.columns,
        rows: datasetsStatus.weather.preview,
        totalRows: datasetsStatus.weather.count,
        title: '🌦️ Weather Dataset Repository'
      };
    } else if (activePreviewTab === 'crops') {
      return {
        columns: datasetsStatus.crops.columns,
        rows: datasetsStatus.crops.preview,
        totalRows: datasetsStatus.crops.count,
        title: '🌾 Crop Yield Dataset Repository'
      };
    }
    // Combined / Synchronized Matrix
    return {
      columns: datasetsStatus.combined.columns,
      rows: datasetsStatus.combined.preview,
      totalRows: datasetsStatus.combined.count,
      title: '⚡ Synchronized Agro-Climatic Intelligence Matrix (Joined by Date)'
    };
  };

  const previewInfo = getActivePreviewData();

  return (
    <div className="dm-container">
      {/* Hidden File Inputs for Direct Repository Uploads */}
      <input 
        type="file" 
        ref={weatherFileInputRef} 
        style={{ display: 'none' }} 
        accept=".csv,.xlsx,.xls"
        onChange={(e) => {
          if (e.target.files?.[0]) handleUploadFile(e.target.files[0], 'weather');
        }}
      />
      <input 
        type="file" 
        ref={cropFileInputRef} 
        style={{ display: 'none' }} 
        accept=".csv,.xlsx,.xls"
        onChange={(e) => {
          if (e.target.files?.[0]) handleUploadFile(e.target.files[0], 'crops');
        }}
      />

      {/* Dev Hero Banner */}
      <div className="dm-hero-banner">
        <div className="dm-hero-text">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <DevHeroBadge gradient="emerald">
              <DevDataManagementLogo size={24} isActive={false} />
            </DevHeroBadge>
            <span>Dual Dataset Repositories &amp; Climatology Engine</span>
            <span className="dm-badge-dev">Independent Storage</span>
          </h2>
          <p>
            Upload and store <strong>Weather Datasets</strong> and <strong>Crop Yield Datasets</strong> separately. Uploading crops will <em>never overwrite</em> existing weather data, and uploading weather will preserve your crop yields. Both datasets are automatically joined by date for AI model training.
          </p>
        </div>
      </div>

      {/* SEPARATE DATASET STORAGE HUBS (Weather Bay & Crop Bay) */}
      <div className="dm-repo-section">
        <div className="dm-section-title">
          <span>🗄️</span>
          <span>Dedicated Dataset Storage Hub (Separate Storage Places)</span>
        </div>

        <div className="dm-repo-grid">
          {/* Storage Bay 1: Weather Dataset Storage */}
          <div className="dm-repo-card weather-bay">
            <div className="dm-repo-header">
              <div className="dm-repo-title-group">
                <span className="dm-repo-icon">🌦️</span>
                <div>
                  <h3 className="dm-repo-title">Weather Dataset Storage</h3>
                  <span className="dm-repo-subtitle">MySQL table: <code>weather_data</code></span>
                </div>
              </div>
              <span className={`dm-status-pill ${datasetsStatus.weather.loaded ? 'active' : 'empty'}`}>
                {datasetsStatus.weather.loaded 
                  ? `🟢 ${datasetsStatus.weather.count} Records Stored` 
                  : '⚪ Empty / Awaiting Data'}
              </span>
            </div>

            <p className="dm-repo-desc">
              Stores agro-meteorological observations: Rainfall (mm), Max Temp (°C), Min Temp (°C), Relative Humidity (%), and Wind Speed.
            </p>

            <div className="dm-repo-meta">
              <div className="dm-meta-item">
                <span className="dm-meta-label">Date Range:</span>
                <span className="dm-meta-value">
                  {datasetsStatus.weather.dateRange 
                    ? `${datasetsStatus.weather.dateRange.start} → ${datasetsStatus.weather.dateRange.end}` 
                    : 'No weather records'}
                </span>
              </div>
              <div className="dm-meta-item">
                <span className="dm-meta-label">Variables:</span>
                <span className="dm-meta-value">Rainfall, TMax, TMin, Humidity, Wind</span>
              </div>
            </div>

            {/* Weather Dropzone */}
            <div {...getWeatherRootProps()} className={`dm-mini-dropzone ${isWeatherDragActive ? 'dragging' : ''}`}>
              <input {...getWeatherInputProps()} />
              <div className="dm-mini-dropzone-content">
                <span className="dm-mini-icon">📥</span>
                <div>
                  <strong>Drop Weather CSV/Excel here</strong> or click to browse
                  <p className="dm-mini-hint">Saves directly to Weather Storage without touching crops</p>
                </div>
              </div>
            </div>

            {datasetsStatus.weather.loaded && (
              <div className="dm-repo-actions">
                <button 
                  type="button" 
                  className="dm-btn-clear"
                  style={{ width: '100%' }}
                  onClick={() => handleClearRepository('weather')}
                  disabled={uploading}
                  title="Clear only weather records"
                >
                  <span>🗑️</span> Clear Weather Records
                </button>
              </div>
            )}
          </div>

          {/* Storage Bay 2: Crop Yield Dataset Storage */}
          <div className="dm-repo-card crops-bay">
            <div className="dm-repo-header">
              <div className="dm-repo-title-group">
                <span className="dm-repo-icon">🌾</span>
                <div>
                  <h3 className="dm-repo-title">Crop Yield Dataset Storage</h3>
                  <span className="dm-repo-subtitle">MySQL table: <code>crop_yield_data</code></span>
                </div>
              </div>
              <span className={`dm-status-pill ${datasetsStatus.crops.loaded ? 'active' : 'empty'}`}>
                {datasetsStatus.crops.loaded 
                  ? `🟢 ${datasetsStatus.crops.count} Records Stored` 
                  : '⚪ Empty / Awaiting Data'}
              </span>
            </div>

            <p className="dm-repo-desc">
              Stores historical crop harvest yields (tons/ha), vegetable cultivars, and field production logs across Quezon City urban farms.
            </p>

            <div className="dm-repo-meta">
              <div className="dm-meta-item">
                <span className="dm-meta-label">Date Range:</span>
                <span className="dm-meta-value">
                  {datasetsStatus.crops.dateRange 
                    ? `${datasetsStatus.crops.dateRange.start} → ${datasetsStatus.crops.dateRange.end}` 
                    : 'No crop records'}
                </span>
              </div>
              <div className="dm-meta-item">
                <span className="dm-meta-label">Detected Vegetables:</span>
                <span className="dm-meta-value">
                  {datasetsStatus.crops.detectedCrops?.length > 0
                    ? `${datasetsStatus.crops.detectedCrops.length} varieties identified`
                    : 'Pechay, Mustard Greens, Tomato, etc.'}
                </span>
              </div>
            </div>

            {/* Detected Vegetable Chips */}
            {datasetsStatus.crops.detectedCrops?.length > 0 && (
              <div className="dm-crops-chip-row">
                {datasetsStatus.crops.detectedCrops.map(c => (
                  <span key={c.id || c.name} className="dm-crop-badge-chip">
                    {c.icon || '🥬'} {c.name}
                  </span>
                ))}
              </div>
            )}

            {/* Crop Yield Dropzone */}
            <div {...getCropRootProps()} className={`dm-mini-dropzone ${isCropDragActive ? 'dragging' : ''}`}>
              <input {...getCropInputProps()} />
              <div className="dm-mini-dropzone-content">
                <span className="dm-mini-icon">📥</span>
                <div>
                  <strong>Drop Crop Yield CSV/Excel here</strong> or click to browse
                  <p className="dm-mini-hint">Saves directly to Crop Storage without touching weather</p>
                </div>
              </div>
            </div>

            {datasetsStatus.crops.loaded && (
              <div className="dm-repo-actions">
                <button 
                  type="button" 
                  className="dm-btn-clear"
                  style={{ width: '100%' }}
                  onClick={() => handleClearRepository('crops')}
                  disabled={uploading}
                  title="Clear only crop yield records"
                >
                  <span>🗑️</span> Clear Crop Yields
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SYNCHRONIZATION STATUS BANNER */}
      <div className="dm-sync-banner">
        <div className="dm-sync-content">
          <div className="dm-sync-badge">
            <span className="dm-sync-icon">⚡</span>
            <span>AI Synchronization Status:</span>
          </div>
          <div className="dm-sync-details">
            {datasetsStatus.weather.loaded && datasetsStatus.crops.loaded ? (
              <span className="dm-sync-ready">
                ✅ <strong>Fully Synchronized &amp; Linked:</strong> {datasetsStatus.combined.count} aligned records ready for SARIMA, LSTM, and Hybrid model training.
              </span>
            ) : datasetsStatus.weather.loaded ? (
              <span className="dm-sync-partial">
                🌦️ <strong>Weather Data Active ({datasetsStatus.weather.count} records):</strong> Input crop yield records below to train yield models with full weather context.
              </span>
            ) : datasetsStatus.crops.loaded ? (
              <span className="dm-sync-partial">
                🌾 <strong>Crop Yields Active ({datasetsStatus.crops.count} records):</strong> Upload weather records to give machine learning models climate features.
              </span>
            ) : (
              <span className="dm-sync-empty">
                ⚪ <strong>Awaiting Datasets:</strong> Upload weather records and crop yield records into their respective storage places or load the calibrated presets below.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Climate & Crop Scenario Presets Grid */}
      <div className="dm-scenarios-section">
        <div className="dm-section-title">
          <span>🔬</span>
          <span>Calibrated Agricultural &amp; Climate Presets</span>
        </div>

        <div className="dm-scenarios-grid">
          {/* Card 1: INPUT CROP YIELD DATASETS (Transformed from Baseline Climatology) */}
          <div className="dm-scenario-card cropyield-preset">
            <div>
              <div className="dm-scenario-header">
                <div className="dm-scenario-icon crop-icon">🌾</div>
                <div className="dm-scenario-info">
                  <h4>Input Crop Yield Datasets</h4>
                  <span className="dm-scenario-tag crop-tag">CROP YIELDS &amp; HARVESTS</span>
                </div>
              </div>
              <p className="dm-scenario-desc" style={{ marginTop: '10px' }}>
                Standard historical urban agricultural records for Quezon City farms. Features calibrated multi-vegetable yield records (tons/ha) for Pechay, Mustard Greens, Water Spinach, Tomato, Cucumber, String Beans, Eggplant, and Chili. Stored safely in Crop Storage without touching weather data.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
              <button
                type="button"
                className="dm-scenario-btn cropyield-btn"
                onClick={handleInputCropYieldPreset}
                disabled={uploading}
              >
                <span>🌾</span> Input Crop Yield Dataset
              </button>
              <button
                type="button"
                className="dm-scenario-sub-btn"
                onClick={() => cropFileInputRef.current?.click()}
                disabled={uploading}
              >
                <span>📂</span> Upload Custom Crop File
              </button>
            </div>
          </div>

          {/* Card 2: El Niño Weather Scenario */}
          <div className="dm-scenario-card elnino">
            <div>
              <div className="dm-scenario-header">
                <div className="dm-scenario-icon">☀️</div>
                <div className="dm-scenario-info">
                  <h4>El Niño Drought Stress</h4>
                  <span className="dm-scenario-tag">Warm Phase (Weather)</span>
                </div>
              </div>
              <p className="dm-scenario-desc" style={{ marginTop: '10px' }}>
                Simulates severe dry spell conditions: prolonged heat index spikes (35–37°C), low precipitation (-48%), and root moisture deficit stress. Loads into Weather Storage; existing crop yields are preserved.
              </p>
            </div>
            <button
              type="button"
              className="dm-scenario-btn"
              onClick={handleLoadElNinoWeather}
              disabled={uploading}
            >
              <span>☀️</span> Load El Niño Weather
            </button>
          </div>

          {/* Card 3: La Niña Weather Scenario */}
          <div className="dm-scenario-card lanina">
            <div>
              <div className="dm-scenario-header">
                <div className="dm-scenario-icon">🌧️</div>
                <div className="dm-scenario-info">
                  <h4>La Niña Monsoon Deluge</h4>
                  <span className="dm-scenario-tag">Cold Phase (Weather)</span>
                </div>
              </div>
              <p className="dm-scenario-desc" style={{ marginTop: '10px' }}>
                Simulates extreme monsoon surges: heavy daily downpours (up to 112 mm), elevated relative humidity (90–99%), and soil waterlogging pressure. Loads into Weather Storage; existing crop yields are preserved.
              </p>
            </div>
            <button
              type="button"
              className="dm-scenario-btn"
              onClick={handleLoadLaNinaWeather}
              disabled={uploading}
            >
              <span>🌧️</span> Load La Niña Weather
            </button>
          </div>
        </div>
      </div>



      {/* Loading state indicator */}
      {uploading && (
        <div className="dm-loading-box">
          <div className="loading-spinner">⏳</div>
          <span>Processing, cleaning, and storing dataset in MySQL repository...</span>
        </div>
      )}

      {/* Validation Report */}
      {validationReport && (
        <div className="dm-report-card">
          <div className="dm-report-header">
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📋</span> Data Quality &amp; Validation Report
            </h3>
            {validationReport.isValid && (
              <span className="dm-report-status-badge">
                ✅ Schema Verified &amp; Stored
              </span>
            )}
          </div>

          {validationReport.warnings && validationReport.warnings.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '12px',
              color: '#fbbf24',
              fontSize: '0.88rem'
            }}>
              <strong style={{ color: '#fef3c7' }}>⚠️ Observations &amp; Warnings:</strong>
              <ul style={{ margin: '6px 0 0 18px', color: '#fde68a' }}>
                {validationReport.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(validationReport.missingValues || {}).length > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              marginBottom: '12px',
              color: '#f87171',
              fontSize: '0.88rem'
            }}>
              <strong style={{ color: '#fee2e2' }}>🔍 Missing Values Handled (Imputed via Column Mean):</strong>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                {Object.entries(validationReport.missingValues).map(([col, count]) => (
                  <span key={col} style={{ background: 'rgba(239, 68, 68, 0.25)', color: '#fecaca', border: '1px solid rgba(248, 113, 113, 0.35)', padding: '2px 8px', borderRadius: '6px', fontWeight: '600', fontSize: '0.8rem' }}>
                    {col}: {count} imputed
                  </span>
                ))}
              </div>
            </div>
          )}

          {validationReport.duplicates > 0 && (
            <div style={{ fontSize: '0.88rem', color: '#38bdf8', marginTop: '6px' }}>
              🔄 Deduplication: Cleaned {validationReport.duplicates} duplicate rows.
            </div>
          )}
        </div>
      )}

      {/* DATASET REPOSITORY PREVIEW & TABS */}
      {(datasetsStatus.weather.count > 0 || datasetsStatus.crops.count > 0 || datasetsStatus.combined.count > 0) && (
        <div className="dm-preview-card">
          <div className="dm-preview-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📊</span> {previewInfo.title}
              </h3>
              <span className="dm-shape-badge">
                {previewInfo.totalRows} records stored
              </span>
            </div>

            {/* View Switcher Tabs */}
            <div className="dm-tab-group">
              <button 
                type="button"
                className={`dm-tab-btn ${activePreviewTab === 'combined' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('combined')}
              >
                <span>⚡</span> Unified Matrix ({datasetsStatus.combined.count})
              </button>
              <button 
                type="button"
                className={`dm-tab-btn ${activePreviewTab === 'weather' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('weather')}
              >
                <span>🌦️</span> Weather Repository ({datasetsStatus.weather.count})
              </button>
              <button 
                type="button"
                className={`dm-tab-btn ${activePreviewTab === 'crops' ? 'active' : ''}`}
                onClick={() => setActivePreviewTab('crops')}
              >
                <span>🌾</span> Crop Yields Repository ({datasetsStatus.crops.count})
              </button>
            </div>
          </div>

          {previewInfo.rows && previewInfo.rows.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    {previewInfo.columns?.slice(0, 8).map(col => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewInfo.rows.slice(0, 10).map((row, idx) => (
                    <tr key={idx}>
                      {previewInfo.columns?.slice(0, 8).map(col => (
                        <td key={col} style={{ fontFamily: typeof row[col] === 'number' ? 'var(--font-mono)' : 'inherit', color: '#e2e8f0' }}>
                          {row[col] !== undefined && row[col] !== null 
                            ? String(row[col]).substring(0, 22) 
                            : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="dm-empty-preview">
              <p>No records stored in this repository yet. Upload a dataset or load a preset above.</p>
            </div>
          )}

          <p style={{ marginTop: '12px', color: '#94a3b8', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Showing sample preview rows. All stored data is persisted in XAMPP MySQL.</span>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>Active in AI Training Pipeline</span>
          </p>
        </div>
      )}
    </div>
  );
}

export default DataManagement;