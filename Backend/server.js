const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const { v4: uuidv4 } = require('uuid');

// Import routes
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const trainingRoutes = require('./routes/training');
const predictionRoutes = require('./routes/prediction');
const { initDatabase, pool } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
fs.ensureDirSync(uploadsDir);

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', uploadRoutes);
app.use('/api', trainingRoutes);
app.use('/api', predictionRoutes);

// Global state
global.weatherDataset = null;
global.cropDataset = null;
global.currentDataset = null;
global.detectedCrops = [];
global.trainedModels = {
    sarima: null,
    lstm: null,
    hybrid: null
};
global.trainingStatus = {
    sarima: 'Not Trained',
    lstm: 'Not Trained',
    hybrid: 'Not Trained',
    cropModelTrained: false
};
global.latestForecasts = {};
global.lastTrainedResult = null;

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'ClimaYield-X Backend Running',
        timestamp: new Date().toISOString()
    });
});

// System status endpoint
app.get('/api/status', (req, res) => {
    res.json({
        datasetLoaded: global.currentDataset !== null,
        weatherDatasetLoaded: Boolean(global.weatherDataset && global.weatherDataset.length > 0),
        cropDatasetLoaded: Boolean(global.cropDataset && global.cropDataset.length > 0),
        weatherCount: global.weatherDataset?.length || 0,
        cropCount: global.cropDataset?.length || 0,
        combinedCount: global.currentDataset?.length || 0,
        trainingStatus: global.trainingStatus,
        detectedCrops: global.detectedCrops || [],
        latestTraining: global.lastTrainedResult || null,
        allForecasts: global.latestForecasts || {},
        datasetShape: global.currentDataset ? {
            rows: global.currentDataset.length,
            columns: Object.keys(global.currentDataset[0] || {})
        } : null
    });
});

// Crops Endpoint: Returns crops detected in active dataset
app.get('/api/crops', (req, res) => {
    res.json({
        success: true,
        count: (global.detectedCrops || []).length,
        crops: global.detectedCrops || []
    });
});

app.post('/api/crops', (req, res) => {
    global.detectedCrops = req.body.crops || [];
    res.json({
        success: true,
        count: global.detectedCrops.length,
        crops: global.detectedCrops
    });
});

// Preview endpoint for Dashboard
app.get('/api/preview', (req, res) => {
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

// Live Weather Endpoint for Quezon City
let cachedWeather = null;
let lastWeatherFetch = 0;

app.get('/api/weather', async (req, res) => {
    const now = Date.now();
    if (cachedWeather && now - lastWeatherFetch < 3 * 60 * 1000) {
        return res.json({ success: true, source: 'cache', data: cachedWeather });
    }

    const QC_LAT = 14.6760;
    const QC_LON = 121.0437;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${QC_LAT}&longitude=${QC_LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure,cloud_cover&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset&timezone=Asia%2FManila&forecast_days=7`;

    try {
        const fetchRes = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!fetchRes.ok) throw new Error(`Open-Meteo error: ${fetchRes.status}`);
        const data = await fetchRes.json();
        cachedWeather = data;
        lastWeatherFetch = now;
        return res.json({ success: true, source: 'live', data });
    } catch (err) {
        console.warn('Backend weather fetch warning:', err.message);
        if (cachedWeather) {
            return res.json({ success: true, source: 'stale-cache', data: cachedWeather });
        }
        return res.json({ success: false, error: err.message });
    }
});

// Reset endpoint
app.post('/api/reset', async (req, res) => {
    global.weatherDataset = null;
    global.cropDataset = null;
    global.currentDataset = null;
    global.detectedCrops = [];
    global.trainedModels = {
        sarima: null,
        lstm: null,
        hybrid: null
    };
    global.trainingStatus = {
        sarima: 'Not Trained',
        lstm: 'Not Trained',
        hybrid: 'Not Trained',
        cropModelTrained: false
    };
    global.latestForecasts = {};
    global.lastTrainedResult = null;
    try {
        const stateFile = path.join(__dirname, 'data/model_state.json');
        if (fs.existsSync(stateFile)) fs.removeSync(stateFile);
        await pool.query('TRUNCATE TABLE weather_data');
        await pool.query('TRUNCATE TABLE crop_yield_data');
        await pool.query('TRUNCATE TABLE agricultural_data');
        await pool.query('TRUNCATE TABLE predictions');
        console.log('🧹 Truncated weather_data, crop_yield_data, agricultural_data and predictions tables in MySQL.');
    } catch (err) {
        console.warn('MySQL truncate warning:', err.message);
    }
    res.json({
        success: true,
        message: 'Backend datasets (weather & crops) and models reset successfully. System is clean and ready for new dataset uploads.'
    });
});

// Global error handling middleware
app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed' || err.status === 400) {
        return res.status(400).json({
            success: false,
            error: 'Malformed JSON payload in request: ' + err.message
        });
    }
    console.error('Server error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

app.listen(PORT, async () => {
    console.log(`🚀 ClimaYield-X Backend running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}`);
    
    // Connect to and verify MySQL in XAMPP
    const dbReady = await initDatabase();
    if (dbReady) {
        try {
            // Auto-load weather datasets storage from MySQL
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
                console.log(`🌦️ Loaded ${global.weatherDataset.length} records from XAMPP MySQL 'weather_data' (Weather Storage) into active memory.`);
            }

            if (uploadRoutes.initAndLoadDatasets) {
                await uploadRoutes.initAndLoadDatasets();
            } else {
                const [rows] = await pool.query('SELECT date_recorded AS Date, rainfall AS Rainfall, max_temp AS Max_Temp, min_temp AS Min_Temp, humidity AS Humidity, crop_yield AS Crop_Yield FROM agricultural_data ORDER BY id ASC');
                if (rows && rows.length > 0) {
                    global.currentDataset = rows.map(r => ({
                        Date: r.Date,
                        Rainfall: Number(r.Rainfall),
                        Max_Temp: Number(r.Max_Temp),
                        Min_Temp: Number(r.Min_Temp),
                        Humidity: Number(r.Humidity),
                        Crop_Yield: Number(r.Crop_Yield)
                    }));
                    console.log(`🌾 Loaded ${global.currentDataset.length} records from XAMPP MySQL 'agricultural_data' into active memory.`);
                }
            }
        } catch (loadErr) {
            console.warn('Could not auto-load records from MySQL:', loadErr.message);
        }
    }

    // Auto-restore persistent model training state if present
    const stateFile = path.join(__dirname, 'data/model_state.json');
    if (fs.existsSync(stateFile)) {
        try {
            const saved = fs.readJsonSync(stateFile);
            if (saved?.trainingStatus) global.trainingStatus = saved.trainingStatus;
            if (saved?.lastTrainedResult) global.lastTrainedResult = saved.lastTrainedResult;
            if (saved?.latestForecasts) global.latestForecasts = saved.latestForecasts;
            console.log('🧠 Restored AI training state and forecasts from persistent storage.');
        } catch (e) {
            console.warn('Could not restore model state:', e.message);
        }
    }
});