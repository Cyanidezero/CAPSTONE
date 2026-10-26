const express = require('express');
const { trainSARIMA } = require('../models/sarima');
const { trainLSTM } = require('../models/lstm');
const { trainHybrid } = require('../models/hybrid');

const path = require('path');
const fs = require('fs-extra');
const { pool } = require('../db');

const STATE_FILE = path.join(__dirname, '../data/model_state.json');

function persistTrainingState() {
    try {
        fs.ensureDirSync(path.dirname(STATE_FILE));
        fs.writeJsonSync(STATE_FILE, {
            trainingStatus: global.trainingStatus,
            lastTrainedResult: global.lastTrainedResult,
            latestForecasts: global.latestForecasts
        });
        console.log('[Training] Synchronized and saved model training state to persistent storage.');
    } catch (err) {
        console.warn('Could not persist training state:', err.message);
    }
}

const router = express.Router();

// Helper to retrieve the appropriate dataset from memory or MySQL storage.
// For weather targets (Rainfall, Temperatures, Humidity), strictly prioritize the weather datasets storage.
async function getTrainingDataset(target) {
    const isWeather = ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity', 'Wind_Speed'].includes(target);
    if (isWeather) {
        if (global.weatherDataset && global.weatherDataset.length > 0) {
            return global.weatherDataset;
        }
        try {
            const [wRows] = await pool.query('SELECT date_recorded AS Date, rainfall AS Rainfall, max_temp AS Max_Temp, min_temp AS Min_Temp, humidity AS Humidity, wind_speed AS Wind_Speed FROM weather_data ORDER BY id ASC');
            if (wRows && wRows.length > 0) {
                global.weatherDataset = wRows.map(r => ({
                    Date: r.Date,
                    Rainfall: Number(r.Rainfall),
                    Max_Temp: Number(r.Max_Temp),
                    Min_Temp: Number(r.Min_Temp),
                    Humidity: Number(r.Humidity),
                    Wind_Speed: Number(r.Wind_Speed)
                }));
                console.log(`[Training] Synced ${global.weatherDataset.length} rows from weather datasets storage (weather_data table).`);
                return global.weatherDataset;
            }
        } catch (dbErr) {
            console.warn('[Training] Could not read weather_data table from MySQL:', dbErr.message);
        }
    }
    return global.currentDataset;
}

// Train SARIMA model with Hyperparameter Grid Search & AIC
router.post('/train/sarima', async (req, res) => {
    try {
        const { target = 'Crop_Yield' } = req.body;
        const datasetToTrain = await getTrainingDataset(target);

        if (!datasetToTrain || datasetToTrain.length === 0) {
            return res.status(400).json({ success: false, error: 'Please upload a dataset in Data Management first before training.' });
        }
        
        const result = await trainSARIMA(datasetToTrain, target);
        
        global.trainedModels.sarima = result.model;
        global.trainingStatus.sarima = 'Trained';
        if (target === 'Crop_Yield' || target.toLowerCase().includes('yield') || target.toLowerCase().includes('crop')) {
            global.trainingStatus.cropModelTrained = true;
        }

        const sarimaAvg = result.forecast?.length > 0 ? Math.round((result.forecast.reduce((a, b) => a + b, 0) / result.forecast.length) * 100) / 100 : 5.9;
        const sarimaBase = result.history?.length > 0 ? Math.round((result.history.reduce((a, b) => a + b, 0) / result.history.length) * 100) / 100 : sarimaAvg;
        const sarimaDiffPct = sarimaBase > 0 ? Math.round(((sarimaAvg - sarimaBase) / sarimaBase) * 1000) / 10 : 0;

        if (!global.latestForecasts) global.latestForecasts = {};
        const forecastRecord = {
            target,
            modelType: 'SARIMA',
            forecast: result.forecast,
            history: result.history,
            historicalBaseline: sarimaBase,
            averageProjected: sarimaAvg,
            percentageVsBaseline: sarimaDiffPct,
            validation: result.validation,
            metrics: result.metrics,
            bestConfig: result.bestConfig,
            seasonalAnalysis: result.seasonalAnalysis,
            trainedAt: new Date().toISOString()
        };
        global.latestForecasts[target] = forecastRecord;
        global.lastTrainedResult = forecastRecord;
        persistTrainingState();

        res.json({
            success: true,
            message: 'SARIMA model trained successfully with Hyperparameter AIC Search!',
            target,
            forecast: result.forecast,
            history: result.history,
            historicalBaseline: sarimaBase,
            averageProjected: sarimaAvg,
            percentageVsBaseline: sarimaDiffPct,
            validation: result.validation,
            seasonalAnalysis: result.seasonalAnalysis,
            searchTable: result.searchTable,
            searchResults: result.searchTable,
            candidates: result.searchTable,
            bestConfig: result.bestConfig,
            config2: result.config2,
            metrics: result.metrics,
            forecastRecord
        });
    } catch (error) {
        console.error('SARIMA training error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Train LSTM model with Regression Metrics (RMSE, MAPE, MAE)
router.post('/train/lstm', async (req, res) => {
    try {
        const { 
            epochs = 100, 
            sequenceLength = 30, 
            target = 'Crop_Yield',
            weatherCols = ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity']
        } = req.body;

        const datasetToTrain = await getTrainingDataset(target);
        if (!datasetToTrain || datasetToTrain.length === 0) {
            return res.status(400).json({ success: false, error: 'Please upload a dataset in Data Management first before training.' });
        }

        const parsedSeq = parseInt(sequenceLength, 10);
        const validSeqLen = isNaN(parsedSeq) ? 30 : Math.max(1, Math.min(60, parsedSeq));

        const result = await trainLSTM(
            datasetToTrain,
            target,
            weatherCols,
            validSeqLen,
            parseInt(epochs) || 100
        );

        global.trainedModels.lstm = result.model;
        global.trainingStatus.lstm = 'Trained';
        if (target === 'Crop_Yield' || target.toLowerCase().includes('yield') || target.toLowerCase().includes('crop')) {
            global.trainingStatus.cropModelTrained = true;
        }

        if (!global.latestForecasts) global.latestForecasts = {};
        const forecastRecord = {
            target,
            modelType: 'LSTM',
            forecast: result.predictions,
            history: result.history,
            historicalBaseline: result.historicalBaseline,
            averageProjected: result.averageProjected,
            percentageVsBaseline: result.percentageVsBaseline,
            metrics: result.metrics,
            modelRegistryEntry: result.modelRegistryEntry,
            trainedAt: new Date().toISOString()
        };
        global.latestForecasts[target] = forecastRecord;
        global.lastTrainedResult = forecastRecord;
        persistTrainingState();

        res.json({
            success: true,
            message: 'LSTM sequence model trained successfully!',
            target,
            predictions: result.predictions,
            history: result.history,
            historicalBaseline: result.historicalBaseline,
            averageProjected: result.averageProjected,
            percentageVsBaseline: result.percentageVsBaseline,
            metrics: result.metrics,
            modelRegistryEntry: result.modelRegistryEntry,
            forecastRecord
        });
    } catch (error) {
        console.error('LSTM training error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Train Hybrid model (Full Framework: Preprocessing, Grid Search SARIMA, Residual LSTM, Model Registry)
router.post('/train/hybrid', async (req, res) => {
    try {
        const { 
            target = 'Crop_Yield',
            weatherCols = ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity']
        } = req.body;

        const datasetToTrain = await getTrainingDataset(target);
        if (!datasetToTrain || datasetToTrain.length === 0) {
            return res.status(400).json({ success: false, error: 'Please upload a dataset in Data Management first before training.' });
        }

        const result = await trainHybrid(
            datasetToTrain,
            target,
            weatherCols
        );

        global.trainedModels.hybrid = result.model;
        global.trainingStatus.hybrid = 'Trained';
        global.trainingStatus.lstm = 'Trained';
        if (target === 'Crop_Yield' || target.toLowerCase().includes('yield') || target.toLowerCase().includes('crop')) {
            global.trainingStatus.cropModelTrained = true;
        }

        if (!global.latestForecasts) global.latestForecasts = {};
        const forecastRecord = {
            target,
            modelType: 'Hybrid SARIMA–LSTM',
            forecast: result.predictions,
            historicalBaseline: result.historicalBaseline,
            averageProjected: result.averageProjected,
            percentageVsBaseline: result.percentageVsBaseline,
            metrics: result.metrics,
            sarimaResult: {
                bestConfig: result.sarimaResult?.bestConfig,
                forecast: result.sarimaResult?.forecast
            },
            lstmResult: {
                metrics: result.lstmResult?.metrics
            },
            modelRegistry: result.modelRegistry,
            modelReady: result.modelReady,
            trainedAt: new Date().toISOString()
        };
        global.latestForecasts[target] = forecastRecord;
        global.lastTrainedResult = forecastRecord;
        persistTrainingState();

        res.json({
            success: true,
            message: 'Hybrid SARIMA–LSTM architecture trained successfully!',
            target,
            predictions: result.predictions,
            historicalBaseline: result.historicalBaseline,
            averageProjected: result.averageProjected,
            percentageVsBaseline: result.percentageVsBaseline,
            metrics: result.metrics,
            sarimaResult: result.sarimaResult,
            lstmResult: result.lstmResult,
            modelRegistry: result.modelRegistry,
            modelReady: result.modelReady,
            forecastRecord
        });
    } catch (error) {
        console.error('Hybrid training error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get latest AI training results and multi-target forecasts
router.get('/training/latest', (req, res) => {
    res.json({
        success: true,
        hasTrainedModel: !!(global.trainedModels?.sarima || global.trainedModels?.lstm || global.trainedModels?.hybrid),
        trainingStatus: global.trainingStatus,
        latest: global.lastTrainedResult || null,
        allForecasts: global.latestForecasts || {}
    });
});

module.exports = router;