const express = require('express');
const { trainSARIMA } = require('../models/sarima');
const { trainLSTM } = require('../models/lstm');
const { trainHybrid } = require('../models/hybrid');

const router = express.Router();

// Train SARIMA model with Hyperparameter Grid Search & AIC
router.post('/train/sarima', async (req, res) => {
    try {
        if (!global.currentDataset || global.currentDataset.length === 0) {
            return res.status(400).json({ success: false, error: 'Please upload a dataset first before training.' });
        }

        const { target = 'Crop_Yield' } = req.body;
        
        const result = await trainSARIMA(global.currentDataset, target);
        
        global.trainedModels.sarima = result.model;
        global.trainingStatus.sarima = 'Trained';

        res.json({
            success: true,
            message: 'SARIMA model trained successfully with Hyperparameter AIC Search!',
            target,
            forecast: result.forecast,
            history: result.history,
            searchTable: result.searchTable,
            searchResults: result.searchTable,
            bestConfig: result.bestConfig,
            config2: result.config2,
            metrics: result.metrics
        });
    } catch (error) {
        console.error('SARIMA training error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Train LSTM model with Regression Metrics (RMSE, MAPE, MAE)
router.post('/train/lstm', async (req, res) => {
    try {
        if (!global.currentDataset || global.currentDataset.length === 0) {
            return res.status(400).json({ success: false, error: 'Please upload a dataset first before training.' });
        }

        const { 
            epochs = 100, 
            sequenceLength = 30, 
            target = 'Crop_Yield',
            weatherCols = ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity']
        } = req.body;

        const result = await trainLSTM(
            global.currentDataset,
            target,
            weatherCols,
            parseInt(sequenceLength) || 30,
            parseInt(epochs) || 100
        );

        global.trainedModels.lstm = result.model;
        global.trainingStatus.lstm = 'Trained';

        res.json({
            success: true,
            message: 'LSTM sequence model trained successfully!',
            target,
            predictions: result.predictions,
            history: result.history,
            metrics: result.metrics,
            modelRegistryEntry: result.modelRegistryEntry
        });
    } catch (error) {
        console.error('LSTM training error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Train Hybrid model (Full Framework: Preprocessing, Grid Search SARIMA, Residual LSTM, Model Registry)
router.post('/train/hybrid', async (req, res) => {
    try {
        if (!global.currentDataset || global.currentDataset.length === 0) {
            return res.status(400).json({ success: false, error: 'Please upload a dataset first before training.' });
        }

        const { 
            target = 'Crop_Yield',
            weatherCols = ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity']
        } = req.body;

        const result = await trainHybrid(
            global.currentDataset,
            target,
            weatherCols
        );

        global.trainedModels.hybrid = result.model;
        global.trainingStatus.hybrid = 'Trained';

        res.json({
            success: true,
            message: 'Hybrid SARIMA–LSTM architecture trained successfully!',
            target,
            predictions: result.predictions,
            metrics: result.metrics,
            sarimaResult: result.sarimaResult,
            lstmResult: result.lstmResult,
            modelRegistry: result.modelRegistry,
            modelReady: result.modelReady
        });
    } catch (error) {
        console.error('Hybrid training error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;