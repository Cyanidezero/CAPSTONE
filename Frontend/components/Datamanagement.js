import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

function DataManagement({ onDataUpload }) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [validationReport, setValidationReport] = useState(null);

  const handleUploadFile = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadResult(null);

    try {
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setUploadResult(response.data);
        setValidationReport(response.data.validationReport);
        toast.success('Dataset uploaded and validated successfully!');
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
    }
  }, [onDataUpload]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;
    await handleUploadFile(file);
  }, [handleUploadFile]);

  const loadSampleData = async () => {
    const csvContent = `Date,Rainfall,Max_Temp,Min_Temp,Humidity,Crop_Yield
2024-01-01,12.5,28.3,22.1,65,4.2
2024-01-02,8.2,29.1,23.4,58,4.5
2024-01-03,0.0,31.2,24.8,45,4.8
2024-01-04,15.8,27.5,21.9,72,3.9
2024-01-05,5.3,30.4,23.7,55,4.6
2024-01-06,2.1,32.0,25.1,48,4.9
2024-01-07,0.0,33.1,25.5,42,5.1
2024-01-08,18.4,26.8,21.2,78,3.8
2024-01-09,10.2,28.0,22.5,68,4.3
2024-01-10,4.5,29.5,23.0,60,4.7
2024-01-11,0.0,31.8,24.2,50,4.9
2024-01-12,7.6,28.9,22.8,62,4.4
2024-01-13,14.1,27.2,21.5,74,4.0
2024-01-14,3.2,30.1,23.6,56,4.7
2024-01-15,0.0,32.5,24.9,46,5.0
2024-01-16,9.5,28.4,22.3,64,4.5
2024-01-17,16.2,26.9,21.0,76,3.9
2024-01-18,6.8,29.8,23.2,58,4.6
2024-01-19,1.5,31.5,24.5,52,4.8
2024-01-20,0.0,33.0,25.3,44,5.2`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const file = new File([blob], 'sample_agricultural_data.csv', { type: 'text/csv' });
    await handleUploadFile(file);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxSize: 16 * 1024 * 1024,
    multiple: false
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2>📁 Data Management</h2>
          <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
            Upload your weather and crop yield dataset in CSV or Excel format.
          </p>
        </div>
        <button 
          className="btn-secondary" 
          onClick={loadSampleData}
          disabled={uploading}
          style={{ padding: '8px 16px', borderRadius: '10px' }}
        >
          ✨ Load Sample Agricultural Data
        </button>
      </div>

      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'dragging' : ''}`}>
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <div>
            <p style={{ fontSize: '3rem', marginBottom: '10px' }}>📤</p>
            <p style={{ fontSize: '1.2rem', fontWeight: '600' }}>
              Drag & drop your dataset here
            </p>
            <p style={{ color: '#7f8c8d' }}>
              or click to browse (CSV, XLSX, XLS)
            </p>
            <p style={{ color: '#95a5a6', fontSize: '0.8rem', marginTop: '10px' }}>
              Max file size: 16MB · Expected: Rainfall, Max_Temp, Min_Temp, Humidity, Crop_Yield
            </p>
          </div>
        )}
      </div>

      {uploading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Uploading and validating dataset with backend...</p>
          <div className="loading-spinner">⏳</div>
        </div>
      )}

      {validationReport && (
        <div style={{ marginTop: '20px' }}>
          <h3>📋 Validation Report</h3>
          <div className="card">
            {validationReport.warnings && validationReport.warnings.length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <h4 style={{ color: '#e67e22' }}>ℹ️ Observations & Warnings</h4>
                <ul>
                  {validationReport.warnings.map((warning, idx) => (
                    <li key={idx} style={{ marginTop: '4px' }}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {Object.keys(validationReport.missingValues || {}).length > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <h4 style={{ color: '#e74c3c' }}>🔍 Missing Values (Imputed with Column Means)</h4>
                <ul>
                  {Object.entries(validationReport.missingValues).map(([col, count]) => (
                    <li key={col}>{col}: {count} missing values</li>
                  ))}
                </ul>
              </div>
            )}

            {validationReport.duplicates > 0 && (
              <div style={{ marginBottom: '10px' }}>
                <h4 style={{ color: '#e67e22' }}>🔄 Duplicates Handled</h4>
                <p>Found and cleaned {validationReport.duplicates} duplicate rows</p>
              </div>
            )}

            {validationReport.isValid && (
              <div style={{ color: '#27ae60', fontWeight: '600', marginTop: '5px' }}>
                ✅ Dataset passed validation & successfully saved to backend
              </div>
            )}
          </div>
        </div>
      )}

      {uploadResult && (
        <div style={{ marginTop: '20px' }}>
          <h3>📊 Dataset Preview ({uploadResult.shape?.rows} rows × {uploadResult.shape?.columns} columns)</h3>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  {uploadResult.columns?.slice(0, 8).map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {uploadResult.preview?.slice(0, 10).map((row, idx) => (
                  <tr key={idx}>
                    {uploadResult.columns?.slice(0, 8).map(col => (
                      <td key={col}>
                        {row[col] !== undefined && row[col] !== null 
                          ? String(row[col]).substring(0, 15) 
                          : '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ marginTop: '10px', color: '#7f8c8d' }}>
              Showing first {Math.min(10, uploadResult.preview?.length || 0)} rows
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default DataManagement;