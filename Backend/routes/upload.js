const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');
const csv = require('csv-parser');
const XLSX = require('xlsx');
const { validateDataset } = require('../utils/datavalidation');
const { preprocessData } = require('../utils/datapreprocessing');
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

// Helper to save dataset records into XAMPP MySQL
async function saveRecordsToDatabase(records) {
    if (!records || !Array.isArray(records) || records.length === 0) return 0;
    try {
        const connection = await pool.getConnection();
        try {
            await connection.query('TRUNCATE TABLE agricultural_data');
            const insertQuery = 'INSERT INTO agricultural_data (date_recorded, rainfall, max_temp, min_temp, humidity, crop_yield) VALUES ?';
            const values = records.map(r => [
                r.Date || r.date || r.date_recorded || new Date().toISOString().split('T')[0],
                parseFloat(r.Rainfall || r.rainfall || 0) || 0,
                parseFloat(r.Max_Temp || r.max_temp || r.maxtemp || 0) || 0,
                parseFloat(r.Min_Temp || r.min_temp || r.mintemp || 0) || 0,
                parseFloat(r.Humidity || r.humidity || 0) || 0,
                parseFloat(r.Crop_Yield || r.crop_yield || r.yield || 0) || 0
            ]);
            await connection.query(insertQuery, [values]);
            console.log(`[Database] Persisted ${values.length} agricultural rows to MySQL 'agricultural_data' table.`);
            return values.length;
        } finally {
            connection.release();
        }
    } catch (err) {
        console.error('[Database] Error saving records to MySQL:', err.message);
        return 0;
    }
}

// Helper to load records from MySQL if memory state is empty
async function loadDatasetFromDatabase() {
    try {
        const [rows] = await pool.query('SELECT date_recorded, rainfall, max_temp, min_temp, humidity, crop_yield FROM agricultural_data ORDER BY id ASC');
        if (rows && rows.length > 0) {
            return rows.map(r => ({
                Date: r.date_recorded,
                Rainfall: Number(r.rainfall),
                Max_Temp: Number(r.max_temp),
                Min_Temp: Number(r.min_temp),
                Humidity: Number(r.humidity),
                Crop_Yield: Number(r.crop_yield)
            }));
        }
    } catch (err) {
        console.error('[Database] Could not fetch dataset from DB:', err.message);
    }
    return null;
}

// GET /api/preview
router.get('/preview', async (req, res) => {
    if (!global.currentDataset || global.currentDataset.length === 0) {
        const fromDb = await loadDatasetFromDatabase();
        if (fromDb && fromDb.length > 0) {
            global.currentDataset = fromDb;
        } else {
            return res.json(null);
        }
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

// GET /api/data (All stored records from MySQL)
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

// POST /api/upload
router.post('/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {
        if (err) {
            return res.status(400).json({ success: false, error: err.message });
        }

        let filePath = null;
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, error: 'No file uploaded' });
            }

            filePath = req.file.path;
            const ext = path.extname(req.file.originalname).toLowerCase();
            let data = [];

            // Read file based on extension
            if (ext === '.csv') {
                data = await readCSV(filePath);
            } else if (ext === '.xlsx' || ext === '.xls') {
                data = readExcel(filePath);
            }

            // Cleanup uploaded temp file from disk
            fs.remove(filePath).catch(() => {});

            if (!data || data.length === 0) {
                return res.status(400).json({ success: false, error: 'File is empty or could not be read' });
            }

            // Validate dataset
            const validationReport = validateDataset(data);
            
            if (validationReport.isValid) {
                // Preprocess data (impute missing values, remove duplicates, normalize dates)
                const processedData = preprocessData(data);
                global.currentDataset = processedData;

                // Persist records into XAMPP MySQL database
                await saveRecordsToDatabase(processedData);
                
                // Get preview
                const preview = processedData.slice(0, 10);
                
                res.json({
                    success: true,
                    message: 'Dataset uploaded, validated, and saved to XAMPP MySQL database successfully!',
                    preview: preview,
                    columns: Object.keys(processedData[0] || {}),
                    shape: {
                        rows: processedData.length,
                        columns: Object.keys(processedData[0] || {}).length
                    },
                    validationReport: validationReport
                });
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Dataset validation failed: ' + (validationReport.warnings?.[0] || 'Invalid dataset structure'),
                    validationReport: validationReport
                });
            }
        } catch (error) {
            if (filePath) fs.remove(filePath).catch(() => {});
            console.error('Upload error:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    });
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
    // Normalize headers
    return rawData.map(row => {
        const cleanRow = {};
        for (const key of Object.keys(row)) {
            const cleanKey = key.replace(/^\uFEFF/, '').trim();
            cleanRow[cleanKey] = row[key];
        }
        return cleanRow;
    });
}

module.exports = router;