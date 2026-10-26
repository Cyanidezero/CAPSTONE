/**
 * ClimaYield-X Cross-Device Real-Time Synchronization Engine
 * Ensures 100% live synchronization between Developer actions on PC and Farmer views on Mobile Phone:
 * 1. Datasets input in Developer -> immediately reflected on Farmer phone (Vegetables, Growth Stages, Harvest Alerts)
 * 2. Model training completed in Developer (SARIMA, LSTM, Hybrid) -> immediately reflected on Farmer phone (Projected Yield, Predictions, Recommendations)
 * 3. Dataset clearing / resets in Developer -> immediately cleaned on Farmer phone
 */

export function syncFarmerFrontendWithBackend(statusData) {
  if (!statusData || typeof statusData !== 'object') return;

  try {
    // ==========================================
    // 1. CROPS & VEGETABLES SYNCHRONIZATION
    // ==========================================
    const hasCrops = Boolean(
      statusData.cropDatasetLoaded ||
      (statusData.cropCount && statusData.cropCount > 0) ||
      (Array.isArray(statusData.detectedCrops) && statusData.detectedCrops.length > 0)
    );

    if (hasCrops && Array.isArray(statusData.detectedCrops) && statusData.detectedCrops.length > 0) {
      const currentCropsStr = localStorage.getItem('climayield_dataset_crops');
      const incomingCropsStr = JSON.stringify(statusData.detectedCrops);

      if (currentCropsStr !== incomingCropsStr) {
        localStorage.setItem('climayield_dataset_crops', incomingCropsStr);
        localStorage.removeItem('climayield_dataset_crops_cleared');
        window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: statusData.detectedCrops }));
        console.log(`[CrossDeviceSync] Synced ${statusData.detectedCrops.length} crops from Developer to Farmer frontend.`);
      }
    } else if (!hasCrops) {
      if (localStorage.getItem('climayield_dataset_crops')) {
        localStorage.removeItem('climayield_dataset_crops');
        localStorage.removeItem('climayield_custom_crops');
        localStorage.removeItem('climayield_crop_model_trained');
        localStorage.setItem('climayield_dataset_crops_cleared', 'true');
        window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: [] }));
        window.dispatchEvent(new CustomEvent('cropModelTrainedUpdated', { detail: { trained: false } }));
        console.log('[CrossDeviceSync] Wiped local crop cache because developer cleared datasets.');
      }
    }

    // ==========================================
    // 2. AI MODEL TRAINING & FORECASTS SYNC
    // ==========================================
    const isLstmOrHybridTrained = Boolean(
      statusData.trainingStatus?.lstm === 'Trained' ||
      statusData.trainingStatus?.hybrid === 'Trained' ||
      statusData.trainingStatus?.sarima === 'Trained'
    );

    if (isLstmOrHybridTrained) {
      const wasLstmTrained = localStorage.getItem('climayield_lstm_trained') === 'true';
      localStorage.setItem('climayield_lstm_trained', 'true');
      localStorage.setItem('climayield_crop_model_trained', 'true');

      if (statusData.latestTraining) {
        const latestStr = JSON.stringify(statusData.latestTraining);
        if (localStorage.getItem('climayield_latest_training') !== latestStr) {
          localStorage.setItem('climayield_latest_training', latestStr);
        }
      }

      if (statusData.allForecasts && Object.keys(statusData.allForecasts).length > 0) {
        const forecastsStr = JSON.stringify(statusData.allForecasts);
        if (localStorage.getItem('climayield_ai_forecasts') !== forecastsStr) {
          localStorage.setItem('climayield_ai_forecasts', forecastsStr);
        }
      }

      if (!wasLstmTrained) {
        window.dispatchEvent(new CustomEvent('lstmTrainingUpdated', { 
          detail: { trained: true, payload: statusData.latestTraining } 
        }));
        window.dispatchEvent(new CustomEvent('aiTrainingCompleted', { 
          detail: statusData.latestTraining 
        }));
        window.dispatchEvent(new CustomEvent('cropModelTrainedUpdated', { 
          detail: { trained: true } 
        }));
        console.log('[CrossDeviceSync] Synced newly trained AI models from Developer to Farmer phone.');
      }
    } else if (
      statusData.trainingStatus &&
      statusData.trainingStatus.lstm === 'Not Trained' &&
      statusData.trainingStatus.hybrid === 'Not Trained'
    ) {
      if (localStorage.getItem('climayield_lstm_trained') === 'true') {
        localStorage.removeItem('climayield_lstm_trained');
        localStorage.removeItem('climayield_latest_training');
        localStorage.removeItem('climayield_ai_forecasts');
        window.dispatchEvent(new CustomEvent('lstmTrainingUpdated', { detail: { trained: false } }));
        window.dispatchEvent(new CustomEvent('aiTrainingCompleted', { detail: null }));
        console.log('[CrossDeviceSync] Reset AI models locally because developer cleared models.');
      }
    }
  } catch (err) {
    console.warn('[CrossDeviceSync] Sync warning:', err);
  }
}
