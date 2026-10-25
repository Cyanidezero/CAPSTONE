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

// Dedicated Preprocessor for Weather Datasets
function preprocessWeatherData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return [];
    
    const cleanNum = (val, fallback = 0) => {
        if (val === undefined || val === null || val === '') return fallback;
        if (typeof val === 'number') return isNaN(val) ? fallback : val;
        const cleaned = String(val).replace(/[^0-9.-]+/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? fallback : (parsed === -999 ? fallback : parsed);
    };

    const parsed = data.map((rawRow, idx) => {
        const row = {};
        for (const [key, val] of Object.entries(rawRow)) {
            const cleanKey = key.replace(/^\uFEFF/, '').trim();
            const lowerKey = cleanKey.toLowerCase().replace(/[\s_-]+/g, '');
            if (/^(date|datetime|timestamp)$/i.test(lowerKey)) row.Date = val;
            else if (/^(rainfall|rain|precip|precipitation)$/i.test(lowerKey)) row.Rainfall = cleanNum(val, 7.2);
            else if (/^(maxtemp|max_temp|tempmax|tmax|maximumtemperature)$/i.test(lowerKey)) row.Max_Temp = cleanNum(val, 32.0);
            else if (/^(mintemp|min_temp|tempmin|tmin|minimumtemperature)$/i.test(lowerKey)) row.Min_Temp = cleanNum(val, 24.5);
            else if (/^(humidity|rh|relativehumidity)$/i.test(lowerKey)) row.Humidity = cleanNum(val, 74.0);
            else if (/^(windspeed|wind_speed|wind)$/i.test(lowerKey)) row.Wind_Speed = cleanNum(val, 1.5);
            else row[cleanKey] = val;
        }

        const rawDate = row.Date;
        if (rawDate && moment(rawDate).isValid()) {
            row.Date = moment(rawDate).format('YYYY-MM-DD');
        } else {
            row.Date = moment('2024-01-01').add(idx, 'days').format('YYYY-MM-DD');
        }
        row.date = row.Date;

        if (row.Rainfall === undefined) row.Rainfall = 7.2;
        if (row.Max_Temp === undefined) row.Max_Temp = 32.0;
        if (row.Min_Temp === undefined) row.Min_Temp = 24.5;
        if (row.Humidity === undefined) row.Humidity = 74.0;
        if (row.Wind_Speed === undefined) row.Wind_Speed = 1.5;

        row.Rainfall = Math.round(row.Rainfall * 100) / 100;
        row.Max_Temp = Math.round(row.Max_Temp * 100) / 100;
        row.Min_Temp = Math.round(row.Min_Temp * 100) / 100;
        row.Humidity = Math.round(row.Humidity * 100) / 100;
        row.Wind_Speed = Math.round(row.Wind_Speed * 100) / 100;
        row.Temp_Range = Math.round((row.Max_Temp - row.Min_Temp) * 100) / 100;
        row.Avg_Temp = Math.round(((row.Max_Temp + row.Min_Temp) / 2) * 100) / 100;

        return row;
    });

    parsed.sort((a, b) => moment(a.Date).diff(moment(b.Date)));

    // Deduplicate by date
    const seen = new Set();
    const unique = [];
    parsed.forEach(r => {
        if (!seen.has(r.Date)) {
            seen.add(r.Date);
            unique.push(r);
        }
    });

    return unique;
}

// Dedicated Preprocessor for Crop Yield Datasets
function preprocessCropData(data) {
    if (!data || !Array.isArray(data) || data.length === 0) return [];

    const cleanNum = (val, fallback = 4.2) => {
        if (val === undefined || val === null || val === '') return fallback;
        if (typeof val === 'number') return isNaN(val) ? fallback : val;
        const cleaned = String(val).replace(/[^0-9.-]+/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? fallback : (parsed === -999 ? fallback : parsed);
    };

    const parsed = data.map((rawRow, idx) => {
        const row = {};
        for (const [key, val] of Object.entries(rawRow)) {
            const cleanKey = key.replace(/^\uFEFF/, '').trim();
            const lowerKey = cleanKey.toLowerCase().replace(/[\s_-]+/g, '');
            if (/^(date|datetime|timestamp)$/i.test(lowerKey)) row.Date = val;
            else if (/^(crop|cropname|crop_name|vegetable|variety|pananim)$/i.test(lowerKey)) row.Crop = String(val).trim();
            else if (/^(cropyield|yield|crop_yield|yieldmtperha|yieldperha|production|harvest|harvestyield|elninoyield|laninayield)$/i.test(lowerKey)) row.Crop_Yield = cleanNum(val, 4.2);
            else row[cleanKey] = val;
        }

        const rawDate = row.Date;
        if (rawDate && moment(rawDate).isValid()) {
            row.Date = moment(rawDate).format('YYYY-MM-DD');
        } else if (rawRow.year && String(rawRow.year).length === 4) {
            const yr = String(rawRow.year).trim();
            const periodStr = String(rawRow.period || rawRow.period_type || '').toLowerCase();
            let monthDay = '12-31';
            if (periodStr.includes('quarter1')) monthDay = '03-31';
            else if (periodStr.includes('quarter2')) monthDay = '06-30';
            else if (periodStr.includes('quarter3')) monthDay = '09-30';
            else if (periodStr.includes('quarter4')) monthDay = '12-31';
            else if (periodStr.includes('semester1')) monthDay = '06-30';
            else if (periodStr.includes('semester2')) monthDay = '12-31';
            row.Date = `${yr}-${monthDay}`;
        } else {
            row.Date = moment('2024-01-01').add(idx, 'days').format('YYYY-MM-DD');
        }

        if (!row.Crop) row.Crop = 'Pechay';
        if (row.Crop_Yield === undefined) {
            if (row.yield_mt_per_ha !== undefined) row.Crop_Yield = cleanNum(row.yield_mt_per_ha, 4.2);
            else if (row.volume_mt && row.area_ha) {
                const vol = cleanNum(row.volume_mt, 0);
                const area = cleanNum(row.area_ha, 1);
                row.Crop_Yield = area > 0 ? Math.round((vol / area) * 100) / 100 : 4.2;
            } else {
                row.Crop_Yield = 4.2;
            }
        }
        row.Crop_Yield = Math.round(row.Crop_Yield * 100) / 100;

        return row;
    });

    parsed.sort((a, b) => moment(a.Date).diff(moment(b.Date)));
    return parsed;
}

// Merge Weather and Crop Datasets into unified training dataset
function mergeWeatherAndCropData(weatherRecords = [], cropRecords = []) {
    const hasWeather = Array.isArray(weatherRecords) && weatherRecords.length > 0;
    const hasCrops = Array.isArray(cropRecords) && cropRecords.length > 0;

    if (!hasWeather && !hasCrops) return [];

    // Map weather by date
    const weatherMap = new Map();
    if (hasWeather) {
        weatherRecords.forEach(w => {
            const d = w.Date || w.date_recorded || w.date;
            if (d) weatherMap.set(d, w);
        });
    }

    // Map crops by date
    const cropMap = new Map();
    let avgYield = 4.2;
    if (hasCrops) {
        const totalYield = cropRecords.reduce((sum, c) => sum + (Number(c.Crop_Yield || c.crop_yield) || 4.2), 0);
        avgYield = Math.round((totalYield / cropRecords.length) * 100) / 100;
        cropRecords.forEach(c => {
            const d = c.Date || c.date_recorded || c.date;
            if (d) {
                if (!cropMap.has(d)) cropMap.set(d, []);
                cropMap.get(d).push(c);
            }
        });
    }

    const merged = [];
    const processedDates = new Set();

    // 1. If we have weather records, use them as base timeline
    if (hasWeather) {
        weatherRecords.forEach(w => {
            const d = w.Date || w.date_recorded || w.date;
            processedDates.add(d);
            const cropsOnDate = cropMap.get(d);

            if (cropsOnDate && cropsOnDate.length > 0) {
                cropsOnDate.forEach(c => {
                    merged.push({
                        Date: d,
                        date: d,
                        Crop: c.Crop || c.crop_name || 'Pechay',
                        Rainfall: Number(w.Rainfall || w.rainfall || 0),
                        Max_Temp: Number(w.Max_Temp || w.max_temp || 32.0),
                        Min_Temp: Number(w.Min_Temp || w.min_temp || 24.5),
                        Humidity: Number(w.Humidity || w.humidity || 74),
                        Wind_Speed: Number(w.Wind_Speed || w.wind_speed || 1.5),
                        Crop_Yield: Number(c.Crop_Yield || c.crop_yield || avgYield),
                        Temp_Range: Math.round(((w.Max_Temp || 32) - (w.Min_Temp || 24.5)) * 100) / 100,
                        Avg_Temp: Math.round((((w.Max_Temp || 32) + (w.Min_Temp || 24.5)) / 2) * 100) / 100
                    });
                });
            } else {
                // Weather exists, no specific crop harvest recorded on this date
                merged.push({
                    Date: d,
                    date: d,
                    Crop: cropRecords[0]?.Crop || cropRecords[0]?.crop_name || 'Pechay',
                    Rainfall: Number(w.Rainfall || w.rainfall || 0),
                    Max_Temp: Number(w.Max_Temp || w.max_temp || 32.0),
                    Min_Temp: Number(w.Min_Temp || w.min_temp || 24.5),
                    Humidity: Number(w.Humidity || w.humidity || 74),
                    Wind_Speed: Number(w.Wind_Speed || w.wind_speed || 1.5),
                    Crop_Yield: avgYield,
                    Temp_Range: Math.round(((w.Max_Temp || 32) - (w.Min_Temp || 24.5)) * 100) / 100,
                    Avg_Temp: Math.round((((w.Max_Temp || 32) + (w.Min_Temp || 24.5)) / 2) * 100) / 100
                });
            }
        });
    }

    // 2. Add any crop records whose dates were not in weather records
    if (hasCrops) {
        cropRecords.forEach(c => {
            const d = c.Date || c.date_recorded || c.date;
            if (d && !processedDates.has(d)) {
                processedDates.add(d);
                merged.push({
                    Date: d,
                    date: d,
                    Crop: c.Crop || c.crop_name || 'Pechay',
                    Rainfall: 7.2,
                    Max_Temp: 32.0,
                    Min_Temp: 24.5,
                    Humidity: 74.0,
                    Wind_Speed: 1.5,
                    Crop_Yield: Number(c.Crop_Yield || c.crop_yield || avgYield),
                    Temp_Range: 7.5,
                    Avg_Temp: 28.25
                });
            }
        });
    }

    merged.sort((a, b) => moment(a.Date).diff(moment(b.Date)));
    return merged;
}

module.exports = { 
    preprocessData,
    preprocessWeatherData,
    preprocessCropData,
    mergeWeatherAndCropData
};