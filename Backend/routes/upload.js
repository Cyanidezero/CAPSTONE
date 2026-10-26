const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { validateDataset } = require('../utils/datavalidation');
const { 
    preprocessData, 
    preprocessWeatherData, 
    preprocessCropData, 
    mergeWeatherAndCropData 
} = require('../utils/datapreprocessing');
const { pool } = require('../db');

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
fs.ensureDirSync(uploadDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.ensureDirSync(uploadDir);
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported file format. Please upload CSV or Excel (.xlsx, .xls) files.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 16 * 1024 * 1024 } // 16MB limit
});

// Helper to save Weather records into MySQL weather_data table without touching crop yields
async function saveWeatherRecordsToDatabase(records) {
    if (!records || !Array.isArray(records) || records.length === 0) return 0;
    try {
        const connection = await pool.getConnection();
        try {
            await connection.query('TRUNCATE TABLE weather_data');
            const insertQuery = 'INSERT INTO weather_data (date_recorded, rainfall, max_temp, min_temp, humidity, wind_speed, source) VALUES ?';
            const values = records.map(r => [
                r.Date || r.date || r.date_recorded || new Date().toISOString().split('T')[0],
                parseFloat(r.Rainfall || r.rainfall || 0) || 0,
                parseFloat(r.Max_Temp || r.max_temp || r.maxtemp || 0) || 0,
                parseFloat(r.Min_Temp || r.min_temp || r.mintemp || 0) || 0,
                parseFloat(r.Humidity || r.humidity || 0) || 0,
                parseFloat(r.Wind_Speed || r.wind_speed || r.windspeed || 1.5) || 1.5,
                r.source || 'upload'
            ]);
            await connection.query(insertQuery, [values]);
            console.log(`[Database] Persisted ${values.length} records to 'weather_data' table.`);
            return values.length;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('[Database] Error saving weather records to MySQL:', err.message);
        return 0;
    }
}

// Helper to save Crop Yield records into MySQL crop_yield_data table without touching weather
async function saveCropRecordsToDatabase(records) {
    if (!records || !Array.isArray(records) || records.length === 0) return 0;
    try {
        const connection = await pool.getConnection();
        try {
            await connection.query('TRUNCATE TABLE crop_yield_data');
            const insertQuery = 'INSERT INTO crop_yield_data (date_recorded, crop_name, crop_yield, unit, source) VALUES ?';
            const values = records.map(r => [
                r.Date || r.date || r.date_recorded || new Date().toISOString().split('T')[0],
                r.Crop || r.crop || r.crop_name || 'Pechay',
                parseFloat(r.Crop_Yield || r.crop_yield || r.yield || 0) || 0,
                r.Unit || r.unit || 'tons/ha',
                r.source || 'upload'
            ]);
            await connection.query(insertQuery, [values]);
            console.log(`[Database] Persisted ${values.length} records to 'crop_yield_data' table.`);
            return values.length;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('[Database] Error saving crop yield records to MySQL:', err.message);
        return 0;
    }
}

// Synchronize and merge active Weather + Crop Yield datasets into agricultural_data
async function syncCombinedDataset() {
    try {
        // 1. Fetch current weather records from memory or DB
        if (!global.weatherDataset || global.weatherDataset.length === 0) {
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
                }
            } catch (err) {
                console.warn('[Sync] Could not read weather_data table:', err.message);
            }
        }

        // 2. Fetch current crop records from memory or DB
        if (!global.cropDataset || global.cropDataset.length === 0) {
            try {
                const [cRows] = await pool.query('SELECT date_recorded AS Date, crop_name AS Crop, crop_yield AS Crop_Yield FROM crop_yield_data ORDER BY id ASC');
                if (cRows && cRows.length > 0) {
                    global.cropDataset = cRows.map(r => ({
                        Date: r.Date,
                        Crop: r.Crop,
                        Crop_Yield: Number(r.Crop_Yield)
                    }));
                }
            } catch (err) {
                console.warn('[Sync] Could not read crop_yield_data table:', err.message);
            }
        }

        // 3. Merge weather and crop records
        const combined = mergeWeatherAndCropData(global.weatherDataset || [], global.cropDataset || []);

        if (combined.length > 0) {
            global.currentDataset = combined;
            
            // Persist merged data to agricultural_data for backward compatibility with ML models
            try {
                const connection = await pool.getConnection();
                try {
                    await connection.query('TRUNCATE TABLE agricultural_data');
                    const insertQuery = 'INSERT INTO agricultural_data (date_recorded, crop_name, rainfall, max_temp, min_temp, humidity, crop_yield) VALUES ?';
                    const values = combined.map(r => [
                        r.Date,
                        r.Crop || 'Pechay',
                        r.Rainfall,
                        r.Max_Temp,
                        r.Min_Temp,
                        r.Humidity,
                        r.Crop_Yield
                    ]);
                    await connection.query(insertQuery, [values]);
                    console.log(`[Sync] Updated 'agricultural_data' table with ${values.length} synchronized records.`);
                } finally {
                    connection.release();
                }
            } catch (dbErr) {
                console.warn('[Sync] Failed to persist merged records to agricultural_data:', dbErr.message);
            }

            // Extract detected crops
            const detected = detectCrops(global.cropDataset && global.cropDataset.length > 0 ? global.cropDataset : combined);
            global.detectedCrops = detected;
        } else {
            global.currentDataset = null;
        }

        return global.currentDataset;
    } catch (err) {
        console.error('[Sync] Error synchronizing datasets:', err);
        return null;
    }
}

// Initial loader to populate memory from MySQL on startup
async function initAndLoadDatasets() {
    await syncCombinedDataset();
    if (global.currentDataset) {
        console.log(`🌾 Synchronized dataset loaded: ${global.currentDataset.length} rows.`);
    }
}

// GET /api/datasets - Status of Weather, Crop Yield, and Merged Repositories
router.get('/datasets', async (req, res) => {
    // If memory is empty, try syncing from MySQL
    if (!global.weatherDataset || !global.cropDataset || !global.currentDataset) {
        await syncCombinedDataset();
    }

    const weatherData = global.weatherDataset || [];
    const cropData = global.cropDataset || [];
    const combinedData = global.currentDataset || [];

    res.json({
        success: true,
        weather: {
            loaded: weatherData.length > 0,
            count: weatherData.length,
            columns: weatherData.length > 0 ? Object.keys(weatherData[0]) : [],
            preview: weatherData.slice(0, 10),
            dateRange: weatherData.length > 0 ? {
                start: weatherData[0].Date,
                end: weatherData[weatherData.length - 1].Date
            } : null
        },
        crops: {
            loaded: cropData.length > 0,
            count: cropData.length,
            columns: cropData.length > 0 ? Object.keys(cropData[0]) : [],
            preview: cropData.slice(0, 10),
            detectedCrops: global.detectedCrops || [],
            dateRange: cropData.length > 0 ? {
                start: cropData[0].Date,
                end: cropData[cropData.length - 1].Date
            } : null
        },
        combined: {
            loaded: combinedData.length > 0,
            count: combinedData.length,
            columns: combinedData.length > 0 ? Object.keys(combinedData[0]) : [],
            preview: combinedData.slice(0, 10),
            readyForTraining: combinedData.length >= 10
        }
    });
});

// GET /api/preview (Backward compatibility)
router.get('/preview', async (req, res) => {
    if (!global.currentDataset || global.currentDataset.length === 0) {
        await syncCombinedDataset();
    }
    if (!global.currentDataset || global.currentDataset.length === 0) {
        return res.json(null);
    }
    res.json({
        preview: global.currentDataset.slice(0, 10),
        columns: Object.keys(global.currentDataset[0] || {}),
        shape: {
            rows: global.currentDataset.length,
            columns: Object.keys(global.currentDataset[0] || {}).length
        }
    });
});

// GET /api/data (All stored records from MySQL agricultural_data)
router.get('/data', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM agricultural_data ORDER BY id ASC');
        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Core upload processor helper
async function processUpload(req, res, targetType = 'auto') {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        let data = [];

        if (ext === '.csv') {
            data = await readCSV(filePath);
        } else if (ext === '.xlsx' || ext === '.xls') {
            data = readExcel(filePath);
        }

        fs.remove(filePath).catch(() => {});

        if (!data || data.length === 0) {
            return res.status(400).json({ success: false, error: 'File is empty or could not be read' });
        }

        const specifiedType = (req.body.datasetType || req.query.type || targetType || 'auto').toLowerCase();
        const headers = Object.keys(data[0] || {}).map(h => h.toLowerCase().replace(/[\s_-]+/g, ''));
        
        const hasWeatherCols = headers.some(h => /^(rainfall|rain|maxtemp|mintemp|humidity|rh|windspeed)$/.test(h));
        const hasCropCols = headers.some(h => /^(crop|cropyield|yield|production|cropname|vegetable|pananim)$/.test(h));

        let effectiveType = specifiedType;
        if (effectiveType === 'auto') {
            if (hasCropCols && !hasWeatherCols) effectiveType = 'crops';
            else if (hasWeatherCols && !hasCropCols) effectiveType = 'weather';
            else effectiveType = 'combined';
        }

        // Validate
        const validationReport = validateDataset(data, effectiveType);
        if (!validationReport.isValid) {
            return res.status(400).json({
                success: false,
                error: 'Dataset validation failed: ' + (validationReport.warnings?.[0] || 'Invalid dataset structure'),
                validationReport: validationReport
            });
        }

        let savedCount = 0;
        let responseMessage = '';

        if (effectiveType === 'crops') {
            // Process as Crop Yield Dataset (DO NOT OVERWRITE WEATHER DATA!)
            const cleanCrops = preprocessCropData(data);
            global.cropDataset = cleanCrops;
            savedCount = await saveCropRecordsToDatabase(cleanCrops);
            await syncCombinedDataset();
            responseMessage = `Crop yield dataset (${cleanCrops.length} records) stored in Crop Repository successfully. Existing weather datasets were preserved!`;
        } else if (effectiveType === 'weather') {
            // Process as Weather Dataset (DO NOT OVERWRITE CROP DATA!)
            const cleanWeather = preprocessWeatherData(data);
            global.weatherDataset = cleanWeather;
            savedCount = await saveWeatherRecordsToDatabase(cleanWeather);
            await syncCombinedDataset();
            responseMessage = `Weather dataset (${cleanWeather.length} records) stored in Weather Repository successfully. Existing crop yield datasets were preserved!`;
        } else {
            // Combined dataset containing both weather and crop columns
            const cleanWeather = preprocessWeatherData(data);
            const cleanCrops = preprocessCropData(data);
            global.weatherDataset = cleanWeather;
            global.cropDataset = cleanCrops;
            await saveWeatherRecordsToDatabase(cleanWeather);
            await saveCropRecordsToDatabase(cleanCrops);
            await syncCombinedDataset();
            responseMessage = `Agro-climatic combined dataset uploaded: stored ${cleanWeather.length} weather records and ${cleanCrops.length} crop harvest records.`;
        }

        const previewData = global.currentDataset || data;
        const detectedCrops = detectCrops(global.cropDataset && global.cropDataset.length > 0 ? global.cropDataset : data, req.file.originalname);
        global.detectedCrops = detectedCrops;

        res.json({
            success: true,
            datasetType: effectiveType,
            message: responseMessage,
            savedCount: savedCount,
            preview: previewData.slice(0, 10),
            columns: Object.keys(previewData[0] || {}),
            shape: {
                rows: previewData.length,
                columns: Object.keys(previewData[0] || {}).length
            },
            weatherCount: global.weatherDataset?.length || 0,
            cropCount: global.cropDataset?.length || 0,
            combinedCount: global.currentDataset?.length || 0,
            detectedCrops: detectedCrops,
            validationReport: validationReport
        });

    } catch (error) {
        if (filePath) fs.remove(filePath).catch(() => {});
        console.error('Upload error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

// POST /api/upload - Unified Upload Endpoint with datasetType support
router.post('/upload', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        processUpload(req, res, req.body.datasetType || 'auto');
    });
});

// POST /api/upload/weather - Dedicated Weather Upload Endpoint
router.post('/upload/weather', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        processUpload(req, res, 'weather');
    });
});

// POST /api/upload/crops - Dedicated Crop Yield Upload Endpoint
router.post('/upload/crops', (req, res) => {
    upload.single('file')(req, res, (err) => {
        if (err) return res.status(400).json({ success: false, error: err.message });
        processUpload(req, res, 'crops');
    });
});

// POST /api/datasets/clear - Clear specific repository
router.post('/datasets/clear', async (req, res) => {
    const { type = 'all' } = req.body;
    try {
        if (type === 'weather') {
            await pool.query('TRUNCATE TABLE weather_data');
            global.weatherDataset = [];
            if (global.trainingStatus) {
                global.trainingStatus.sarima = 'Not Trained';
                global.trainingStatus.lstm = 'Not Trained';
                global.trainingStatus.hybrid = 'Not Trained';
            }
            await syncCombinedDataset();
            return res.json({ success: true, message: 'Weather dataset repository cleared. Crop yields were preserved.' });
        } else if (type === 'crops') {
            await pool.query('TRUNCATE TABLE crop_yield_data');
            global.cropDataset = [];
            global.detectedCrops = [];
            if (global.trainingStatus) {
                global.trainingStatus.cropModelTrained = false;
            }
            await syncCombinedDataset();
            return res.json({ success: true, message: 'Crop yield repository cleared. Weather records were preserved.' });
        } else {
            await pool.query('TRUNCATE TABLE weather_data');
            await pool.query('TRUNCATE TABLE crop_yield_data');
            await pool.query('TRUNCATE TABLE agricultural_data');
            global.weatherDataset = [];
            global.cropDataset = [];
            global.currentDataset = null;
            global.detectedCrops = [];
            global.latestForecasts = {};
            global.lastTrainedResult = null;
            global.trainingStatus = {
                sarima: 'Not Trained',
                lstm: 'Not Trained',
                hybrid: 'Not Trained',
                cropModelTrained: false
            };
            try {
                const stateFile = path.join(__dirname, '../data/model_state.json');
                if (fs.existsSync(stateFile)) fs.removeSync(stateFile);
            } catch (e) {}
            return res.json({ success: true, message: 'All dataset repositories and model forecasts cleared.' });
        }
    } catch (err) {
        console.error('Clear dataset error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/datasets/preset/crops - Input & Load Calibrated Crop Yield Dataset
router.post('/datasets/preset/crops', async (req, res) => {
    try {
        let cropSampleRecords = [];
        const datasetFilePath = path.join(__dirname, '../data/philippine_crops_dataset.csv');
        if (fs.existsSync(datasetFilePath)) {
            try {
                const csvData = fs.readFileSync(datasetFilePath, 'utf8');
                const lines = csvData.split(/\r?\n/).filter(l => l.trim().length > 0);
                if (lines.length > 1) {
                    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                    for (let i = 1; i < lines.length; i++) {
                        const line = lines[i];
                        // Basic CSV value parser handling quotes
                        const values = [];
                        let inQuote = false;
                        let cur = '';
                        for (let j = 0; j < line.length; j++) {
                            const ch = line[j];
                            if (ch === '"') inQuote = !inQuote;
                            else if (ch === ',' && !inQuote) {
                                values.push(cur.trim().replace(/^"|"$/g, ''));
                                cur = '';
                            } else cur += ch;
                        }
                        values.push(cur.trim().replace(/^"|"$/g, ''));
                        const row = {};
                        headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
                        cropSampleRecords.push(row);
                    }
                }
            } catch (readErr) {
                console.warn('Could not read philippine_crops_dataset.csv, falling back:', readErr.message);
            }
        }

        if (cropSampleRecords.length === 0) {
            cropSampleRecords = [
                { Date: '2024-01-01', Crop: 'Alugbati', Crop_Yield: 12.11 },
                { Date: '2024-01-02', Crop: 'Ampalaya', Crop_Yield: 8.83 },
                { Date: '2024-01-03', Crop: 'Cabbage', Crop_Yield: 15.21 },
                { Date: '2024-01-04', Crop: 'Carrot', Crop_Yield: 13.59 },
                { Date: '2024-01-05', Crop: 'Cucumber', Crop_Yield: 7.62 },
                { Date: '2024-01-06', Crop: 'Eggplant', Crop_Yield: 11.1 },
                { Date: '2024-01-07', Crop: 'Pechay', Crop_Yield: 9.77 },
                { Date: '2024-01-08', Crop: 'Tomato', Crop_Yield: 14.97 },
                { Date: '2024-01-09', Crop: 'Water Spinach', Crop_Yield: 10.6 },
                { Date: '2024-01-10', Crop: 'String Beans', Crop_Yield: 7.84 },
                { Date: '2024-01-11', Crop: 'Okra', Crop_Yield: 7.45 },
                { Date: '2024-01-12', Crop: 'White Radish', Crop_Yield: 6.25 }
            ];
        }

        const processedCrops = preprocessCropData(cropSampleRecords);
        global.cropDataset = processedCrops;
        await saveCropRecordsToDatabase(processedCrops);
        await syncCombinedDataset();

        const detected = detectCrops(processedCrops, 'philippine_crops_dataset.csv');
        global.detectedCrops = detected;

        res.json({
            success: true,
            message: `🌾 Input Crop Yield Dataset loaded (${processedCrops.length} records, ${detected.length} crops detected). Existing weather datasets were kept intact!`,
            count: processedCrops.length,
            detectedCrops: detected,
            preview: processedCrops.slice(0, 10),
            weatherCount: global.weatherDataset?.length || 0,
            cropCount: processedCrops.length,
            combinedCount: global.currentDataset?.length || 0
        });
    } catch (err) {
        console.error('Preset crops error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// POST /api/datasets/preset/weather - Load Weather Scenario Preset without overwriting crops
router.post('/datasets/preset/weather', async (req, res) => {
    try {
        const { scenario = 'baseline' } = req.body;
        let weatherRecords = [];

        if (scenario === 'elnino') {
            weatherRecords = [
                { Date: '2024-01-01', Rainfall: 0.0, Max_Temp: 34.8, Min_Temp: 26.2, Humidity: 46, Wind_Speed: 1.8 },
                { Date: '2024-01-02', Rainfall: 0.0, Max_Temp: 35.4, Min_Temp: 26.8, Humidity: 42, Wind_Speed: 2.1 },
                { Date: '2024-01-03', Rainfall: 0.0, Max_Temp: 36.2, Min_Temp: 27.1, Humidity: 39, Wind_Speed: 1.9 },
                { Date: '2024-01-04', Rainfall: 0.0, Max_Temp: 36.8, Min_Temp: 27.5, Humidity: 41, Wind_Speed: 2.3 },
                { Date: '2024-01-05', Rainfall: 0.0, Max_Temp: 35.9, Min_Temp: 26.9, Humidity: 44, Wind_Speed: 1.7 },
                { Date: '2024-01-06', Rainfall: 1.2, Max_Temp: 34.2, Min_Temp: 26.0, Humidity: 49, Wind_Speed: 1.6 },
                { Date: '2024-01-07', Rainfall: 0.0, Max_Temp: 36.5, Min_Temp: 27.3, Humidity: 38, Wind_Speed: 2.0 },
                { Date: '2024-01-08', Rainfall: 0.0, Max_Temp: 37.1, Min_Temp: 27.8, Humidity: 36, Wind_Speed: 2.2 },
                { Date: '2024-01-09', Rainfall: 0.0, Max_Temp: 36.4, Min_Temp: 27.0, Humidity: 40, Wind_Speed: 1.9 },
                { Date: '2024-01-10', Rainfall: 0.0, Max_Temp: 35.8, Min_Temp: 26.5, Humidity: 43, Wind_Speed: 1.8 },
                { Date: '2024-01-11', Rainfall: 0.5, Max_Temp: 34.9, Min_Temp: 26.1, Humidity: 47, Wind_Speed: 1.5 },
                { Date: '2024-01-12', Rainfall: 0.0, Max_Temp: 36.7, Min_Temp: 27.4, Humidity: 39, Wind_Speed: 2.4 },
                { Date: '2024-01-13', Rainfall: 0.0, Max_Temp: 37.3, Min_Temp: 28.0, Humidity: 35, Wind_Speed: 2.1 },
                { Date: '2024-01-14', Rainfall: 0.0, Max_Temp: 36.9, Min_Temp: 27.6, Humidity: 38, Wind_Speed: 1.9 },
                { Date: '2024-01-15', Rainfall: 0.0, Max_Temp: 35.7, Min_Temp: 26.7, Humidity: 42, Wind_Speed: 1.8 },
                { Date: '2024-01-16', Rainfall: 0.0, Max_Temp: 36.1, Min_Temp: 27.0, Humidity: 40, Wind_Speed: 2.0 },
                { Date: '2024-01-17', Rainfall: 0.8, Max_Temp: 34.5, Min_Temp: 26.2, Humidity: 48, Wind_Speed: 1.6 },
                { Date: '2024-01-18', Rainfall: 0.0, Max_Temp: 36.8, Min_Temp: 27.5, Humidity: 39, Wind_Speed: 2.2 },
                { Date: '2024-01-19', Rainfall: 0.0, Max_Temp: 37.4, Min_Temp: 28.1, Humidity: 36, Wind_Speed: 2.5 },
                { Date: '2024-01-20', Rainfall: 0.0, Max_Temp: 36.2, Min_Temp: 27.2, Humidity: 41, Wind_Speed: 1.7 }
            ];
        } else if (scenario === 'lanina') {
            weatherRecords = [
                { Date: '2024-01-01', Rainfall: 42.5, Max_Temp: 28.1, Min_Temp: 23.5, Humidity: 89, Wind_Speed: 2.8 },
                { Date: '2024-01-02', Rainfall: 68.0, Max_Temp: 27.4, Min_Temp: 23.0, Humidity: 94, Wind_Speed: 3.2 },
                { Date: '2024-01-03', Rainfall: 85.2, Max_Temp: 26.8, Min_Temp: 22.8, Humidity: 96, Wind_Speed: 3.5 },
                { Date: '2024-01-04', Rainfall: 54.6, Max_Temp: 27.6, Min_Temp: 23.2, Humidity: 92, Wind_Speed: 2.6 },
                { Date: '2024-01-05', Rainfall: 92.4, Max_Temp: 26.5, Min_Temp: 22.5, Humidity: 98, Wind_Speed: 3.9 },
                { Date: '2024-01-06', Rainfall: 78.1, Max_Temp: 27.0, Min_Temp: 22.9, Humidity: 95, Wind_Speed: 3.1 },
                { Date: '2024-01-07', Rainfall: 38.2, Max_Temp: 28.5, Min_Temp: 23.8, Humidity: 88, Wind_Speed: 2.4 },
                { Date: '2024-01-08', Rainfall: 64.7, Max_Temp: 27.2, Min_Temp: 23.1, Humidity: 93, Wind_Speed: 2.9 },
                { Date: '2024-01-09', Rainfall: 112.5, Max_Temp: 25.9, Min_Temp: 22.1, Humidity: 99, Wind_Speed: 4.2 },
                { Date: '2024-01-10', Rainfall: 88.0, Max_Temp: 26.6, Min_Temp: 22.6, Humidity: 97, Wind_Speed: 3.4 },
                { Date: '2024-01-11', Rainfall: 45.3, Max_Temp: 28.0, Min_Temp: 23.4, Humidity: 90, Wind_Speed: 2.5 },
                { Date: '2024-01-12', Rainfall: 58.9, Max_Temp: 27.5, Min_Temp: 23.0, Humidity: 92, Wind_Speed: 2.7 },
                { Date: '2024-01-13', Rainfall: 76.4, Max_Temp: 26.9, Min_Temp: 22.7, Humidity: 95, Wind_Speed: 3.0 },
                { Date: '2024-01-14', Rainfall: 95.0, Max_Temp: 26.2, Min_Temp: 22.3, Humidity: 98, Wind_Speed: 3.8 },
                { Date: '2024-01-15', Rainfall: 62.1, Max_Temp: 27.3, Min_Temp: 23.1, Humidity: 93, Wind_Speed: 2.9 },
                { Date: '2024-01-16', Rainfall: 35.4, Max_Temp: 28.7, Min_Temp: 24.0, Humidity: 87, Wind_Speed: 2.2 },
                { Date: '2024-01-17', Rainfall: 82.8, Max_Temp: 26.7, Min_Temp: 22.6, Humidity: 96, Wind_Speed: 3.3 },
                { Date: '2024-01-18', Rainfall: 104.2, Max_Temp: 26.0, Min_Temp: 22.2, Humidity: 99, Wind_Speed: 4.0 },
                { Date: '2024-01-19', Rainfall: 69.5, Max_Temp: 27.1, Min_Temp: 22.9, Humidity: 94, Wind_Speed: 3.0 },
                { Date: '2024-01-20', Rainfall: 48.0, Max_Temp: 27.9, Min_Temp: 23.3, Humidity: 91, Wind_Speed: 2.6 }
            ];
        } else {
            // Baseline Climatology
            weatherRecords = [
                { Date: '2024-01-01', Rainfall: 12.5, Max_Temp: 28.3, Min_Temp: 22.1, Humidity: 65, Wind_Speed: 1.5 },
                { Date: '2024-01-02', Rainfall: 8.2, Max_Temp: 29.1, Min_Temp: 23.4, Humidity: 58, Wind_Speed: 1.6 },
                { Date: '2024-01-03', Rainfall: 0.0, Max_Temp: 31.2, Min_Temp: 24.8, Humidity: 45, Wind_Speed: 1.4 },
                { Date: '2024-01-04', Rainfall: 15.8, Max_Temp: 27.5, Min_Temp: 21.9, Humidity: 72, Wind_Speed: 1.8 },
                { Date: '2024-01-05', Rainfall: 5.3, Max_Temp: 30.4, Min_Temp: 23.7, Humidity: 55, Wind_Speed: 1.5 },
                { Date: '2024-01-06', Rainfall: 2.1, Max_Temp: 32.0, Min_Temp: 25.1, Humidity: 48, Wind_Speed: 1.3 },
                { Date: '2024-01-07', Rainfall: 0.0, Max_Temp: 33.1, Min_Temp: 25.5, Humidity: 42, Wind_Speed: 1.7 },
                { Date: '2024-01-08', Rainfall: 18.4, Max_Temp: 26.8, Min_Temp: 21.2, Humidity: 78, Wind_Speed: 2.0 },
                { Date: '2024-01-09', Rainfall: 10.2, Max_Temp: 28.0, Min_Temp: 22.5, Humidity: 68, Wind_Speed: 1.6 },
                { Date: '2024-01-10', Rainfall: 4.5, Max_Temp: 29.5, Min_Temp: 23.0, Humidity: 60, Wind_Speed: 1.5 },
                { Date: '2024-01-11', Rainfall: 0.0, Max_Temp: 31.8, Min_Temp: 24.2, Humidity: 50, Wind_Speed: 1.4 },
                { Date: '2024-01-12', Rainfall: 7.6, Max_Temp: 28.9, Min_Temp: 22.8, Humidity: 62, Wind_Speed: 1.7 },
                { Date: '2024-01-13', Rainfall: 14.1, Max_Temp: 27.2, Min_Temp: 21.5, Humidity: 74, Wind_Speed: 1.9 },
                { Date: '2024-01-14', Rainfall: 3.2, Max_Temp: 30.1, Min_Temp: 23.6, Humidity: 56, Wind_Speed: 1.4 },
                { Date: '2024-01-15', Rainfall: 0.0, Max_Temp: 32.5, Min_Temp: 24.9, Humidity: 46, Wind_Speed: 1.6 },
                { Date: '2024-01-16', Rainfall: 9.5, Max_Temp: 28.4, Min_Temp: 22.3, Humidity: 64, Wind_Speed: 1.5 },
                { Date: '2024-01-17', Rainfall: 16.2, Max_Temp: 26.9, Min_Temp: 21.0, Humidity: 76, Wind_Speed: 2.1 },
                { Date: '2024-01-18', Rainfall: 6.8, Max_Temp: 29.8, Min_Temp: 23.2, Humidity: 58, Wind_Speed: 1.6 },
                { Date: '2024-01-19', Rainfall: 1.5, Max_Temp: 31.5, Min_Temp: 24.5, Humidity: 52, Wind_Speed: 1.3 },
                { Date: '2024-01-20', Rainfall: 0.0, Max_Temp: 33.0, Min_Temp: 25.3, Humidity: 44, Wind_Speed: 1.5 }
            ];
        }

        const cleanWeather = preprocessWeatherData(weatherRecords);
        global.weatherDataset = cleanWeather;
        await saveWeatherRecordsToDatabase(cleanWeather);
        await syncCombinedDataset();

        res.json({
            success: true,
            scenario,
            message: `🌦️ Weather Scenario [${scenario.toUpperCase()}] loaded (${cleanWeather.length} records). Stored in Weather Repository; existing crop yields were kept intact!`,
            count: cleanWeather.length,
            preview: cleanWeather.slice(0, 10),
            weatherCount: cleanWeather.length,
            cropCount: global.cropDataset?.length || 0,
            combinedCount: global.currentDataset?.length || 0
        });
    } catch (err) {
        console.error('Preset weather error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Helper functions to read files
function readCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv({
                mapHeaders: ({ header }) => header.replace(/^\uFEFF/, '').trim()
            }))
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (error) => reject(error));
    });
}

function readExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    return rawData.map(row => {
        const cleanRow = {};
        for (const key of Object.keys(row)) {
            const cleanKey = key.replace(/^\uFEFF/, '').trim();
            cleanRow[cleanKey] = row[key];
        }
        return cleanRow;
    });
}

function detectCrops(data, filename = '') {
    const cropsMap = {
        alugbati: { id: 'alugbati', name: 'Alugbati', filipinoName: 'Alugbati', icon: '🌿', daysToGrowEn: '30–45 days', daysToGrowFil: '30–45 araw', stageEn: 'Vegetative Vine & Leaf Growth', stageFil: 'Paglaki ng Baging at Dahon', stageStep: 2, progressPercent: 45, aliases: ['alugbati', 'malabar spinach'] },
        ampalaya: { id: 'ampalaya', name: 'Ampalaya', filipinoName: 'Ampalaya', icon: '🥒', daysToGrowEn: '60–75 days', daysToGrowFil: '60–75 araw', stageEn: 'Fruit & Tendril Development', stageFil: 'Paglaki ng Bunga at Gapang sa Balag', stageStep: 4, progressPercent: 75, aliases: ['ampalaya', 'ampalaya fruit', 'ampalaya fruit [bitter gourd]', 'bitter gourd', 'bitter melon'] },
        asparagus: { id: 'asparagus', name: 'Asparagus', filipinoName: 'Asparagus (Espárago)', icon: '🌱', daysToGrowEn: '70–90 days', daysToGrowFil: '70–90 araw', stageEn: 'Spear Emergence & Harvest', stageFil: 'Pagsibol ng mga Talbos ng Asparagus', stageStep: 5, progressPercent: 90, aliases: ['asparagus', 'esparago'] },
        basil: { id: 'basil', name: 'Basil', filipinoName: 'Balanoy (Basil)', icon: '🌿', daysToGrowEn: '30–40 days', daysToGrowFil: '30–40 araw', stageEn: 'Foliage & Branching Growth', stageFil: 'Pagsasanga ng Mababangong Dahon', stageStep: 2, progressPercent: 50, aliases: ['basil', 'balanoy', 'sweet basil'] },
        beets: { id: 'beets', name: 'Beets', filipinoName: 'Remolatsa (Beetroot)', icon: '🥔', daysToGrowEn: '50–65 days', daysToGrowFil: '50–65 araw', stageEn: 'Root Bulbing & Swelling', stageFil: 'Pagbilog ng Mapulang Ugat sa Lupa', stageStep: 3, progressPercent: 60, aliases: ['beets', 'beet', 'beetroot', 'remolatsa'] },
        broccoli: { id: 'broccoli', name: 'Broccoli', filipinoName: 'Brokoli', icon: '🥦', daysToGrowEn: '60–75 days', daysToGrowFil: '60–75 araw', stageEn: 'Head & Floret Formation', stageFil: 'Pagbuo ng Berdeng Kumpol ng Bulaklak', stageStep: 3, progressPercent: 70, aliases: ['broccoli', 'brokoli'] },
        cabbage: { id: 'cabbage', name: 'Cabbage', filipinoName: 'Repolyo', icon: '🥬', daysToGrowEn: '65–80 days', daysToGrowFil: '65–80 araw', stageEn: 'Firm Head Cupping & Maturation', stageFil: 'Pagbuo at Pagbilog ng Makapal na Ulo', stageStep: 4, progressPercent: 80, aliases: ['cabbage', 'repolyo'] },
        carrot: { id: 'carrot', name: 'Carrot', filipinoName: 'Karot', icon: '🥕', daysToGrowEn: '65–75 days', daysToGrowFil: '65–75 araw', stageEn: 'Taproot Elongation & Sweetening', stageFil: 'Paghaba at Pagtamis ng Kulay Kahel na Ugat', stageStep: 4, progressPercent: 75, aliases: ['carrot', 'karot'] },
        cauliflower: { id: 'cauliflower', name: 'Cauliflower', filipinoName: 'Koliplor', icon: '🥦', daysToGrowEn: '60–75 days', daysToGrowFil: '60–75 araw', stageEn: 'Curd Blanching & Formation', stageFil: 'Pagbuo ng Puting Curd o Kumpol', stageStep: 3, progressPercent: 70, aliases: ['cauliflower', 'koliplor'] },
        celery: { id: 'celery', name: 'Celery', filipinoName: 'Kintsay Malalapad (Seleri)', icon: '🌿', daysToGrowEn: '80–95 days', daysToGrowFil: '80–95 araw', stageEn: 'Petiole Stalk Thickening', stageFil: 'Pagkapal ng Malutong na Tangkay', stageStep: 3, progressPercent: 65, aliases: ['celery', 'kintsay malalapad', 'seleri'] },
        chinese_cabbage: { id: 'chinese_cabbage', name: 'Chinese Cabbage (Wongbok)', filipinoName: 'Pechay Baguio (Wongbok)', icon: '🥬', daysToGrowEn: '50–65 days', daysToGrowFil: '50–65 araw', stageEn: 'Elongated Head Tightening', stageFil: 'Paghaba at Pagkumpol ng Pechay Baguio', stageStep: 3, progressPercent: 70, aliases: ['chinese cabbage', 'wongbok', 'pechay baguio', 'chinese cabbage (wongbok, pechay baguio)', 'napa cabbage'] },
        chives: { id: 'chives', name: 'Chives', filipinoName: 'Kutsay', icon: '🌱', daysToGrowEn: '30–45 days', daysToGrowFil: '30–45 araw', stageEn: 'Slender Hollow Leaf Growth', stageFil: 'Pagtubo ng Matutulis na Dahon ng Kutsay', stageStep: 2, progressPercent: 50, aliases: ['chives', 'kutsay'] },
        coriander: { id: 'coriander', name: 'Coriander / Cilantro', filipinoName: 'Wansoy', icon: '🌿', daysToGrowEn: '30–40 days', daysToGrowFil: '30–40 araw', stageEn: 'Feathery Foliage Emergence', stageFil: 'Pag-usbong ng Mabangong Dahon ng Wansoy', stageStep: 2, progressPercent: 45, aliases: ['coriander', 'wansoy', 'cilantro'] },
        cowpea: { id: 'cowpea', name: 'Cowpea (Green)', filipinoName: 'Paayap', icon: '🫛', daysToGrowEn: '45–55 days', daysToGrowFil: '45–55 araw', stageEn: 'Pod Filling & Maturation', stageFil: 'Pamumunga at Paghaba ng Pod ng Paayap', stageStep: 4, progressPercent: 80, aliases: ['cowpea, green', 'cowpea', 'paayap'] },
        cucumber: { id: 'cucumber', name: 'Cucumber', filipinoName: 'Pipino', icon: '🥒', daysToGrowEn: '45–50 days', daysToGrowFil: '45–50 araw', stageEn: 'Fruit Development', stageFil: 'Paglaki ng Bunga', stageStep: 4, progressPercent: 75, aliases: ['cucumber', 'pipino'] },
        eggplant: { id: 'eggplant', name: 'Eggplant', filipinoName: 'Talong', icon: '🍆', daysToGrowEn: '65–75 days', daysToGrowFil: '65–75 araw', stageEn: 'Vegetative & Stalk Growth', stageFil: 'Paglaki ng Sangay at Tangkay', stageStep: 2, progressPercent: 50, aliases: ['eggplant', 'talong', 'aubergine'] },
        gisantes: { id: 'gisantes', name: 'Garden Pea', filipinoName: 'Gisantes', icon: '🫛', daysToGrowEn: '55–65 days', daysToGrowFil: '55–65 araw', stageEn: 'Pod Swelling & Sugar Filling', stageFil: 'Pagbilog at Pagtamis ng Buto sa Pod', stageStep: 4, progressPercent: 75, aliases: ['gisantes', 'gisantes [garden pea]', 'garden pea'] },
        habitchuelas: { id: 'habitchuelas', name: 'Snap Beans', filipinoName: 'Habitchuelas / Baguio Beans', icon: '🫛', daysToGrowEn: '45–55 days', daysToGrowFil: '45–55 araw', stageEn: 'Crisp Tender Pod Elongation', stageFil: 'Paghaba ng Malulutong na Baguio Beans', stageStep: 4, progressPercent: 75, aliases: ['habitchuelas', 'habitchuelas [snap beans]', 'snap beans', 'baguio beans'] },
        kangkong: { id: 'kangkong', name: 'Water Spinach', filipinoName: 'Kangkong', icon: '🌿', daysToGrowEn: '20–25 days', daysToGrowFil: '20–25 araw', stageEn: 'Vegetative Shoot Growth', stageFil: 'Paglaki ng Dahon at Tangkay', stageStep: 2, progressPercent: 45, aliases: ['kangkong', 'kangkong [swamp cabbage]', 'water spinach', 'swamp cabbage'] },
        kinchay: { id: 'kinchay', name: 'Chinese Celery', filipinoName: 'Kinchay', icon: '🌿', daysToGrowEn: '40–50 days', daysToGrowFil: '40–50 araw', stageEn: 'Aromatic Leaf Clump Development', stageFil: 'Mabangong Pagsibol ng Kinchay', stageStep: 2, progressPercent: 55, aliases: ['kinchay', 'chinese celery'] },
        kulitis: { id: 'kulitis', name: 'Amaranth Greens', filipinoName: 'Kulitis / Uray', icon: '🌿', daysToGrowEn: '25–35 days', daysToGrowFil: '25–35 araw', stageEn: 'Leafy Foliage Flurry', stageFil: 'Mabilis na Pagsibol ng Masustansyang Dahon', stageStep: 2, progressPercent: 45, aliases: ['kulitis', 'amaranth', 'uray'] },
        lettuce: { id: 'lettuce', name: 'Lettuce', filipinoName: 'Letsugas', icon: '🥗', daysToGrowEn: '25–35 days', daysToGrowFil: '25–35 araw', stageEn: 'Head Formation', stageFil: 'Pagbuo ng Kumpol ng Dahon', stageStep: 3, progressPercent: 65, aliases: ['lettuce', 'letsugas'] },
        mustasa: { id: 'mustasa', name: 'Mustard Greens', filipinoName: 'Mustasa', icon: '🥬', daysToGrowEn: '25–32 days', daysToGrowFil: '25–32 araw', stageEn: 'Ready for Harvest', stageFil: 'Handa nang Anihin', stageStep: 5, progressPercent: 100, aliases: ['mustard', 'mustasa', 'mustard greens'] },
        okra: { id: 'okra', name: 'Okra', filipinoName: 'Okra', icon: '🌱', daysToGrowEn: '45–50 days', daysToGrowFil: '45–50 araw', stageEn: 'Pod Setting', stageFil: 'Pamumunga ng Daliri ng Okra', stageStep: 3, progressPercent: 70, aliases: ['okra', 'okra [lady\'s finger]', 'lady finger', 'ladyfinger'] },
        onion_leeks: { id: 'onion_leeks', name: 'Onion Leeks', filipinoName: 'Dahon ng Sibuyas / Leeks', icon: '🌱', daysToGrowEn: '60–75 days', daysToGrowFil: '60–75 araw', stageEn: 'Stem Thickening & Blanched Sheaths', stageFil: 'Pagkapal ng Puting Tangkay', stageStep: 3, progressPercent: 65, aliases: ['onion leeks', 'leeks', 'leek'] },
        parsley: { id: 'parsley', name: 'Parsley', filipinoName: 'Pasli (Parsley)', icon: '🌿', daysToGrowEn: '45–60 days', daysToGrowFil: '45–60 araw', stageEn: 'Bushy Herb Clustering', stageFil: 'Makapal na Kumpol ng Dahon ng Parsley', stageStep: 2, progressPercent: 50, aliases: ['parsley'] },
        patola: { id: 'patola', name: 'Sponge Gourd', filipinoName: 'Patola', icon: '🥒', daysToGrowEn: '50–65 days', daysToGrowFil: '50–65 araw', stageEn: 'Tender Gourd Hanging & Sizing', stageFil: 'Lumalaking Bunga sa Balag', stageStep: 4, progressPercent: 75, aliases: ['patola', 'sponge gourd', 'luffa'] },
        pechay: { id: 'pechay', name: 'Pechay', filipinoName: 'Pechay', icon: '🥬', daysToGrowEn: '25–30 days', daysToGrowFil: '25–30 araw', stageEn: 'Vegetative Foliage Growth', stageFil: 'Paglaki ng Dahon at Tangkay', stageStep: 2, progressPercent: 40, aliases: ['pechay', 'petsay', 'bok choy', 'bokchoy'] },
        pechay_native: { id: 'pechay_native', name: 'Native Pechay', filipinoName: 'Pechay Tagalog', icon: '🥬', daysToGrowEn: '25–30 days', daysToGrowFil: '25–30 araw', stageEn: 'Crisp Petiole & Leaf Spread', stageFil: 'Paglapad ng Puting Tangkay ng Pechay Tagalog', stageStep: 2, progressPercent: 45, aliases: ['pechay, native', 'native pechay', 'pechay tagalog'] },
        pepper: { id: 'pepper', name: 'Pepper', filipinoName: 'Sili', icon: '🌶️', daysToGrowEn: '60–70 days', daysToGrowFil: '60–70 araw', stageEn: 'Flowering & Fruiting', stageFil: 'Pamumulaklak at Pamumunga', stageStep: 3, progressPercent: 65, aliases: ['pepper', 'sili'] },
        bell_pepper: { id: 'bell_pepper', name: 'Bell Pepper', filipinoName: 'Siling Atsara (Bell Pepper)', icon: '🫑', daysToGrowEn: '65–80 days', daysToGrowFil: '65–80 araw', stageEn: 'Blocky Fruit Expansion & Color Turn', stageFil: 'Paglaki at Pagkapal ng Bunga ng Bell Pepper', stageStep: 4, progressPercent: 75, aliases: ['pepper, bell', 'bell pepper', 'sweet pepper', 'siling atsara'] },
        finger_pepper: { id: 'finger_pepper', name: 'Finger Pepper', filipinoName: 'Siling Haba (Espada)', icon: '🌶️', daysToGrowEn: '55–65 days', daysToGrowFil: '55–65 araw', stageEn: 'Long Slender Pod Maturation', stageFil: 'Paghaba ng Makinis na Siling Pangsigang', stageStep: 4, progressPercent: 70, aliases: ['pepper, finger', 'finger pepper', 'siling haba', 'espada'] },
        radish: { id: 'radish', name: 'Radish', filipinoName: 'Labanos', icon: '🥕', daysToGrowEn: '30–35 days', daysToGrowFil: '30–35 araw', stageEn: 'Root Bulbing & Thickening', stageFil: 'Paglapad ng Ugat sa Lupa', stageStep: 3, progressPercent: 60, aliases: ['radish', 'labanos', 'white radish'] },
        saluyot: { id: 'saluyot', name: 'Jute Mallow', filipinoName: 'Saluyot', icon: '🌿', daysToGrowEn: '30–40 days', daysToGrowFil: '30–40 araw', stageEn: 'Branching Shoot & Leaf Harvest', stageFil: 'Pagsasanga ng Malalambot na Talbos ng Saluyot', stageStep: 2, progressPercent: 50, aliases: ['saluyot', 'jute mallow'] },
        sigarilyas: { id: 'sigarilyas', name: 'Winged Beans', filipinoName: 'Sigarilyas / Kalamismis', icon: '🫛', daysToGrowEn: '60–75 days', daysToGrowFil: '60–75 araw', stageEn: 'Four-Cornered Pod Setting', stageFil: 'Pamumunga ng May-Pakpak na Pod ng Sigarilyas', stageStep: 4, progressPercent: 80, aliases: ['sigarilyas', 'sigarilyas [winged beans]', 'winged beans', 'kalamismis'] },
        singkamas: { id: 'singkamas', name: 'Jicama / Turnip', filipinoName: 'Singkamas', icon: '🥔', daysToGrowEn: '75–90 days', daysToGrowFil: '75–90 araw', stageEn: 'Tuberous Root Enlarging', stageFil: 'Paglaki at Pagtubig ng Matamis na Singkamas', stageStep: 3, progressPercent: 65, aliases: ['singkamas', 'singkamas [turnip]', 'jicama'] },
        sitao: { id: 'sitao', name: 'Yardlong String Beans', filipinoName: 'Sitaw', icon: '🫛', daysToGrowEn: '45–55 days', daysToGrowFil: '45–55 araw', stageEn: 'Pod Development', stageFil: 'Paglaki ng Pod', stageStep: 4, progressPercent: 80, aliases: ['sitao', 'sitao [stringbeans]', 'sitaw', 'string beans', 'stringbeans', 'yardlong bean'] },
        spinach: { id: 'spinach', name: 'Spinach', filipinoName: 'Espinaka (Spinach)', icon: '🥬', daysToGrowEn: '30–40 days', daysToGrowFil: '30–40 araw', stageEn: 'Rosette Foliage Formation', stageFil: 'Pagdami ng Malalambot na Dahon ng Espinaka', stageStep: 2, progressPercent: 50, aliases: ['spinach', 'espinaka'] },
        spring_onion: { id: 'spring_onion', name: 'Spring Onion / Scallion', filipinoName: 'Dahon ng Sibuyas (Mura)', icon: '🌱', daysToGrowEn: '40–50 days', daysToGrowFil: '40–50 araw', stageEn: 'Tubular Stalk Elongation', stageFil: 'Paghaba ng Berdeng Dahon ng Sibuyas', stageStep: 2, progressPercent: 55, aliases: ['spring onion', 'scallion', 'green onion', 'dahon ng sibuyas'] },
        squash: { id: 'squash', name: 'Squash / Kabocha', filipinoName: 'Kalabasa', icon: '🎃', daysToGrowEn: '80–95 days', daysToGrowFil: '80–95 araw', stageEn: 'Fruit Swelling & Golden Flesh Matures', stageFil: 'Paglaki at Pagdilaw ng Bunga ng Kalabasa', stageStep: 4, progressPercent: 80, aliases: ['squash fruit', 'squash', 'kalabasa'] },
        sweet_peas: { id: 'sweet_peas', name: 'Snow Peas / Sweet Peas', filipinoName: 'Sitsaro (Chicharo)', icon: '🫛', daysToGrowEn: '50–60 days', daysToGrowFil: '50–60 araw', stageEn: 'Flat Edible Pod Development', stageFil: 'Paglapad ng Malutong na Sitsaro', stageStep: 4, progressPercent: 75, aliases: ['sweet peas', 'sweet pea', 'sitsaro', 'chicharo', 'snow peas'] },
        talinum: { id: 'talinum', name: 'Philippine Spinach (Waterleaf)', filipinoName: 'Talinum', icon: '🌿', daysToGrowEn: '20–30 days', daysToGrowFil: '20–30 araw', stageEn: 'Succulent Leaf Emergence', stageFil: 'Pagsibol ng Makatas na Dahon ng Talinum', stageStep: 2, progressPercent: 45, aliases: ['talinum', 'waterleaf', 'philippine spinach'] },
        tomato: { id: 'tomato', name: 'Tomato', filipinoName: 'Kamatis', icon: '🍅', daysToGrowEn: '60–70 days', daysToGrowFil: '60–70 araw', stageEn: 'Fruit Development', stageFil: 'Lumalaking Bunga', stageStep: 4, progressPercent: 75, aliases: ['tomato', 'kamatis', 'tomatoes'] },
        upo: { id: 'upo', name: 'Bottle Gourd', filipinoName: 'Upo', icon: '🥒', daysToGrowEn: '60–75 days', daysToGrowFil: '60–75 araw', stageEn: 'Fruit Elongation on Overhead Trellis', stageFil: 'Paglaki at Paghaba ng Upo sa Balag', stageStep: 4, progressPercent: 75, aliases: ['upo', 'upo [bottle gourd]', 'bottle gourd'] },
        watercress: { id: 'watercress', name: 'Watercress', filipinoName: 'Kress (Watercress)', icon: '🌿', daysToGrowEn: '30–40 days', daysToGrowFil: '30–40 araw', stageEn: 'Running Stolon & Leaf Rosettes', stageFil: 'Pagsanga sa Tubig ng Masustansyang Watercress', stageStep: 2, progressPercent: 50, aliases: ['watercress', 'kress'] },
        young_corn: { id: 'young_corn', name: 'Baby Corn / Young Corn', filipinoName: 'Batang Mais (Baby Corn)', icon: '🌽', daysToGrowEn: '45–55 days', daysToGrowFil: '45–55 araw', stageEn: 'Silking & Early Ear Emergence', stageFil: 'Pagsibol ng Bunga bago Magkabutol', stageStep: 4, progressPercent: 75, aliases: ['young corn', 'baby corn', 'batang mais'] },
        zucchini: { id: 'zucchini', name: 'Zucchini', filipinoName: 'Kalabasang Zucchini', icon: '🥒', daysToGrowEn: '45–55 days', daysToGrowFil: '45–55 araw', stageEn: 'Bush Blossom & Fruit Setting', stageFil: 'Pamumunga ng Makinis na Zucchini', stageStep: 4, progressPercent: 75, aliases: ['zucchini', 'kalabasang zucchini', 'courgette'] }
    };

    const detected = new Map();

    if (Array.isArray(data) && data.length > 0) {
        const headers = Object.keys(data[0] || {});
        const cropColKey = headers.find(h => /^(crop|vegetable|commodity|pananim|plant|product|crop_name|cropname)$/i.test(h.trim()));

        if (cropColKey) {
            data.forEach(r => {
                const val = String(r[cropColKey] || '').toLowerCase().trim();
                for (const [key, crop] of Object.entries(cropsMap)) {
                    if (val === key || val.includes(key) || crop.aliases.some(a => val.includes(a))) {
                        if (!detected.has(crop.id)) detected.set(crop.id, crop);
                    }
                }
            });
        }

        // Header check
        headers.forEach(h => {
            const clean = h.toLowerCase().replace(/[\s_-]+/g, ' ');
            for (const [key, crop] of Object.entries(cropsMap)) {
                if (clean.includes(key) || crop.aliases.some(a => clean.includes(a))) {
                    if (!detected.has(crop.id)) detected.set(crop.id, crop);
                }
            }
        });

        // Cell scan if none yet
        if (detected.size === 0) {
            for (const row of data.slice(0, 100)) {
                for (const val of Object.values(row)) {
                    if (typeof val === 'string' && val.length > 2 && val.length < 30) {
                        const low = val.toLowerCase();
                        for (const [key, crop] of Object.entries(cropsMap)) {
                            if (low === key || low.includes(key) || crop.aliases.some(a => low.includes(a))) {
                                if (!detected.has(crop.id)) detected.set(crop.id, crop);
                            }
                        }
                    }
                }
            }
        }
        // Fallback: If agricultural dataset has crop yield columns but no explicit crop names, default to standard urban crops
        if (detected.size === 0) {
            const hasYield = headers.some(h => /^(crop_yield|yield|production|cropyield)$/i.test(h.trim()));
            if (hasYield) {
                const standardKeys = ['tomato', 'eggplant', 'pechay', 'bell_pepper', 'mustasa', 'cucumber'];
                standardKeys.forEach(k => {
                    if (cropsMap[k]) detected.set(cropsMap[k].id, cropsMap[k]);
                });
            }
        }
    }

    if (filename) {
        const lowFn = filename.toLowerCase();
        for (const [key, crop] of Object.entries(cropsMap)) {
            if (lowFn.includes(key) || crop.aliases.some(a => lowFn.includes(a))) {
                if (!detected.has(crop.id)) detected.set(crop.id, crop);
            }
        }
    }

    const parseDays = (daysStr) => {
        const nums = String(daysStr || '').match(/\d+/g);
        const val = nums ? parseInt(nums[nums.length - 1], 10) : NaN;
        return Number.isFinite(val) && val >= 10 ? val : 45;
    };

    return Array.from(detected.values()).map(crop => {
        const totalDays = parseDays(crop.daysToGrowEn);
        const autoAge = Math.max(1, Math.min(totalDays, Math.round(totalDays * ((crop.progressPercent || 50) / 100))));
        return {
            ...crop,
            totalDays,
            plantAgeDays: autoAge,
            isAutoCalibrated: true
        };
    });
}

module.exports = router;
module.exports.syncCombinedDataset = syncCombinedDataset;
module.exports.initAndLoadDatasets = initAndLoadDatasets;