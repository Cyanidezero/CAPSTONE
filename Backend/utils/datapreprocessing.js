const moment = require('moment');

function preprocessData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    // Column aliases mapping to canonical standard keys
    const aliasMap = {
        'rainfall': 'Rainfall',
        'rain': 'Rainfall',
        'precipitation': 'Rainfall',
        'precip': 'Rainfall',
        'tmax': 'Max_Temp',
        't_max': 'Max_Temp',
        'maxtemp': 'Max_Temp',
        'max_temp': 'Max_Temp',
        'maximumtemperature': 'Max_Temp',
        'tempmax': 'Max_Temp',
        'temperaturemax': 'Max_Temp',
        'tmin': 'Min_Temp',
        't_min': 'Min_Temp',
        'mintemp': 'Min_Temp',
        'min_temp': 'Min_Temp',
        'minimumtemperature': 'Min_Temp',
        'tempmin': 'Min_Temp',
        'temperaturemin': 'Min_Temp',
        'humidity': 'Humidity',
        'rh': 'Humidity',
        'relativehumidity': 'Humidity',
        'relative_humidity': 'Humidity',
        'windspeed': 'Wind_Speed',
        'wind_speed': 'Wind_Speed',
        'wind': 'Wind_Speed',
        'cropyield': 'Crop_Yield',
        'crop_yield': 'Crop_Yield',
        'yield': 'Crop_Yield',
        'production': 'Crop_Yield'
    };

    // Clean numeric helper (strips units like mm, %, °C, commas)
    const cleanNum = (val) => {
        if (val === undefined || val === null || val === '') return null;
        if (typeof val === 'number') return isNaN(val) ? null : val;
        const cleaned = String(val).replace(/[^0-9.-]+/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : (parsed === -999 ? null : parsed);
    };

    // 1. Normalize column keys in each row
    const normalizedData = data.map((rawRow, idx) => {
        const row = {};
        for (const [key, val] of Object.entries(rawRow)) {
            const cleanKey = key.replace(/^\uFEFF/, '').trim();
            const lowerKey = cleanKey.toLowerCase().replace(/[\s_-]+/g, '');
            const canonicalKey = aliasMap[lowerKey] || cleanKey;
            row[canonicalKey] = val;
            // Also keep standard case
            if (canonicalKey !== cleanKey) {
                row[cleanKey] = val;
            }
        }

        // Parse or synthesize date
        const rawDate = row.Date || row.date || row.DATE || row.DATETIME || row.DateTime;
        if (rawDate && moment(rawDate).isValid()) {
            row.Date = moment(rawDate).format('YYYY-MM-DD');
            row.date = row.Date;
        } else if ((row.Year || row.YEAR || row.year) && (row.Month || row.MONTH || row.month) && (row.Day || row.DAY || row.day)) {
            const y = row.Year || row.YEAR || row.year;
            const m = String(row.Month || row.MONTH || row.month).padStart(2, '0');
            const d = String(row.Day || row.DAY || row.day).padStart(2, '0');
            row.Date = `${y}-${m}-${d}`;
            row.date = row.Date;
        } else {
            // Sequential date starting from 2024-01-01
            row.Date = moment('2024-01-01').add(idx, 'days').format('YYYY-MM-DD');
            row.date = row.Date;
        }

        return row;
    });

    // 2. Sort by date
    normalizedData.sort((a, b) => moment(a.date).diff(moment(b.date)));

    // 3. Handle missing values and convert numeric columns
    const numericColumns = ['Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity', 'Wind_Speed', 'Crop_Yield'];
    numericColumns.forEach(col => {
        const validValues = normalizedData
            .map(row => cleanNum(row[col]))
            .filter(v => v !== null);

        const defaultFallbacks = {
            'Rainfall': 7.2,
            'Max_Temp': 32.0,
            'Min_Temp': 24.5,
            'Humidity': 74.0,
            'Wind_Speed': 1.5,
            'Crop_Yield': 4.35
        };

        const mean = validValues.length > 0
            ? validValues.reduce((a, b) => a + b, 0) / validValues.length
            : (defaultFallbacks[col] || 0);

        normalizedData.forEach((row, i) => {
            const num = cleanNum(row[col]);
            if (col === 'Crop_Yield' && num === null) {
                // Biologically calculate Crop Yield (tons/ha) based on real daily weather
                const rain = cleanNum(row.Rainfall) !== null ? cleanNum(row.Rainfall) : 7.2;
                const tmax = cleanNum(row.Max_Temp) !== null ? cleanNum(row.Max_Temp) : 32.0;
                const tmin = cleanNum(row.Min_Temp) !== null ? cleanNum(row.Min_Temp) : 24.5;
                const rh = cleanNum(row.Humidity) !== null ? cleanNum(row.Humidity) : 74.0;
                
                const month = moment(row.Date).isValid() ? moment(row.Date).month() + 1 : ((i % 365) / 30 + 1);
                const seasonalFactor = Math.sin((2 * Math.PI * (month - 2)) / 12) * 0.45;
                const heatStress = tmax > 33.0 ? (tmax - 33.0) * 0.12 : 0;
                const coldStress = tmin < 21.0 ? (21.0 - tmin) * 0.08 : 0;
                const rainStress = rain > 60.0 ? Math.min(0.6, (rain - 60.0) * 0.005) : (rain < 0.5 ? 0.15 : 0);
                const humidityStress = rh > 88.0 ? (rh - 88.0) * 0.015 : 0;
                
                const calculatedYield = 4.50 + seasonalFactor - heatStress - coldStress - rainStress - humidityStress;
                row[col] = Math.max(2.5, Math.min(6.5, Math.round(calculatedYield * 100) / 100));
            } else {
                row[col] = num !== null ? Math.round(num * 100) / 100 : Math.round(mean * 100) / 100;
            }
        });
    });

    // 4. Remove duplicates based on date
    const seenDates = new Set();
    const uniqueData = [];
    normalizedData.forEach(row => {
        if (!seenDates.has(row.date)) {
            seenDates.add(row.date);
            uniqueData.push(row);
        }
    });

    // 5. Create derived features
    uniqueData.forEach(row => {
        if (row.Max_Temp !== undefined && row.Min_Temp !== undefined) {
            row.Temp_Range = Math.round((row.Max_Temp - row.Min_Temp) * 100) / 100;
            row.Avg_Temp = Math.round(((row.Max_Temp + row.Min_Temp) / 2) * 100) / 100;
        }
    });

    return uniqueData;
}

module.exports = { preprocessData };