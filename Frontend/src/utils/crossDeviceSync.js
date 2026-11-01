/**
 * ClimaYield-X Cross-Device Real-Time Synchronization Engine
 * Ensures 100% live synchronization between Developer actions on PC and Farmer views on Mobile Phone / Browser:
 * 1. Datasets input in Developer -> immediately reflected on Farmer Side (Vegetables, Growth Stages, Harvest Alerts)
 * 2. Model training completed in Developer (SARIMA, LSTM, Hybrid) -> immediately reflected on Farmer Side (Projected Yield, Predictions, Recommendations, Weather Monitor)
 * 3. Dataset clearing / resets in Developer -> immediately cleaned on Farmer Side
 */
import { sanitizeDatasetCrops } from './cropDatasetParser';

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
      if (localStorage.getItem('climayield_dataset_crops_cleared') === 'true') {
        return;
      }

      const { sanitized } = sanitizeDatasetCrops(statusData.detectedCrops);
      const rawValidCrops = sanitized && sanitized.length > 0 ? sanitized : statusData.detectedCrops;

      // Respect any vegetables deleted or updated by the farmer on the dashboard
      let deletedIds = [];
      let updatedMap = {};
      try {
        deletedIds = JSON.parse(localStorage.getItem('climayield_deleted_crop_ids') || '[]');
      } catch {}
      try {
        updatedMap = JSON.parse(localStorage.getItem('climayield_updated_crops_map') || '{}');
      } catch {}

      const deletedSet = new Set(deletedIds.map((x) => String(x).toLowerCase()));
      const validCrops = rawValidCrops
        .filter((c) => {
          const cid = String(c.id || '').toLowerCase();
          const cname = String(c.name || '').toLowerCase();
          return !deletedSet.has(cid) && !deletedSet.has(cname);
        })
        .map((c) => {
          const override = updatedMap[c.id] || updatedMap[c.name];
          return override ? { ...c, ...override } : c;
        });

      const currentCropsStr = localStorage.getItem('climayield_dataset_crops');
      const incomingCropsStr = JSON.stringify(validCrops);

      if (currentCropsStr !== incomingCropsStr) {
        localStorage.setItem('climayield_dataset_crops', incomingCropsStr);
        window.dispatchEvent(new CustomEvent('cropDatasetUpdated', { detail: validCrops }));
        console.log(`[CrossDeviceSync] Synced ${validCrops.length} crops from Developer to Farmer frontend.`);
      }
    } else if (!hasCrops) {
      if (localStorage.getItem('climayield_dataset_crops')) {
        localStorage.removeItem('climayield_dataset_crops');
        localStorage.removeItem('climayield_custom_crops');
        localStorage.removeItem('climayield_deleted_crop_ids');
        localStorage.removeItem('climayield_updated_crops_map');
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

      let trainingChanged = !wasLstmTrained;

      if (statusData.latestTraining) {
        const latestStr = JSON.stringify(statusData.latestTraining);
        if (localStorage.getItem('climayield_latest_training') !== latestStr) {
          localStorage.setItem('climayield_latest_training', latestStr);
          trainingChanged = true;
        }
      }

      if (statusData.allForecasts && Object.keys(statusData.allForecasts).length > 0) {
        const mergedForecasts = {
          ...statusData.allForecasts,
          _latest: statusData.latestTraining || Object.values(statusData.allForecasts)[0]
        };
        const forecastsStr = JSON.stringify(mergedForecasts);
        if (localStorage.getItem('climayield_ai_forecasts') !== forecastsStr) {
          localStorage.setItem('climayield_ai_forecasts', forecastsStr);
          trainingChanged = true;
        }
      }

      if (trainingChanged) {
        window.dispatchEvent(new CustomEvent('lstmTrainingUpdated', { 
          detail: { trained: true, payload: statusData.latestTraining } 
        }));
        window.dispatchEvent(new CustomEvent('aiTrainingCompleted', { 
          detail: statusData.latestTraining 
        }));
        window.dispatchEvent(new CustomEvent('cropModelTrainedUpdated', { 
          detail: { trained: true } 
        }));
        console.log('[CrossDeviceSync] Synced newly trained AI models from Developer to Farmer Portal.');
      }
    } else if (
      statusData.trainingStatus &&
      statusData.trainingStatus.lstm === 'Not Trained' &&
      statusData.trainingStatus.hybrid === 'Not Trained' &&
      statusData.trainingStatus.sarima === 'Not Trained'
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
