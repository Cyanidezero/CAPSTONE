function validateDataset(data, expectedType = 'auto') {
    const report = {
        isValid: true,
        missingValues: {},
        duplicates: 0,
        dataTypes: {},
        invalidValues: {},
        warnings: []
    };

    if (!data || !Array.isArray(data) || data.length === 0) {
        report.isValid = false;
        report.warnings.push('Dataset is empty');
        return report;
    }

    // Get all column names
    const columns = Object.keys(data[0] || {});
    if (columns.length === 0) {
        report.isValid = false;
        report.warnings.push('Dataset contains no column headers');
        return report;
    }

    const lowerCols = columns.map(c => c.toLowerCase().replace(/[\s_-]+/g, ''));
    
    // Check for recommended agricultural & weather columns
    const weatherAliases = [
        { standard: 'Rainfall', aliases: ['rainfall', 'rain', 'precipitation', 'precip'] },
        { standard: 'Max_Temp', aliases: ['maxtemp', 'maximumtemperature', 'tempmax', 'temperaturemax', 'max_temperature'] },
        { standard: 'Min_Temp', aliases: ['mintemp', 'minimumtemperature', 'tempmin', 'temperaturemin', 'min_temperature'] },
        { standard: 'Humidity', aliases: ['humidity', 'rh', 'relativehumidity'] },
        { standard: 'Wind_Speed', aliases: ['windspeed', 'wind_speed', 'wind'] }
    ];

    const cropAliases = [
        { standard: 'Crop_Yield', aliases: ['cropyield', 'yield', 'production', 'crop_yield', 'harvest', 'harvest_yield', 'harvestyield', 'el_nino_yield', 'la_nina_yield', 'yield_mt_per_ha', 'yieldmtperha', 'volume_mt', 'area_ha'] },
        { standard: 'Crop', aliases: ['crop', 'cropname', 'crop_name', 'vegetable', 'variety', 'pananim', 'commodity', 'plant', 'parent_crop'] }
    ];

    let weatherMatches = 0;
    weatherAliases.forEach(rec => {
        const found = lowerCols.some(c => rec.aliases.some(a => a.replace(/[\s_-]+/g, '') === c));
        if (found) weatherMatches++;
    });

    let cropMatches = 0;
    cropAliases.forEach(rec => {
        const found = lowerCols.some(c => rec.aliases.some(a => a.replace(/[\s_-]+/g, '') === c));
        if (found) cropMatches++;
    });

    const isCropType = expectedType === 'crops' || (expectedType === 'auto' && cropMatches > 0 && weatherMatches === 0);
    const isWeatherType = expectedType === 'weather' || (expectedType === 'auto' && weatherMatches > 0 && cropMatches === 0);

    if (expectedType === 'weather') {
        if (weatherMatches === 0) {
            report.isValid = false;
            report.warnings.push('Weather dataset requires at least one meteorological column (Rainfall, Max_Temp, Min_Temp, Humidity, or Wind_Speed).');
        }
    } else if (expectedType === 'crops') {
        if (cropMatches === 0) {
            report.isValid = false;
            report.warnings.push('Crop yield dataset requires a Crop name or Crop_Yield column (e.g., Crop, Crop_Yield, Yield).');
        }
    } else {
        // Auto / combined
        if (weatherMatches === 0 && cropMatches === 0 && columns.length < 2) {
            report.isValid = false;
            report.warnings.push('Dataset lacks recognized weather or crop yield variables.');
        } else if (weatherMatches < 1 && cropMatches < 1) {
            report.warnings.push('Dataset structure is uncalibrated. Expected weather variables (Rainfall, Temp, Humidity) or crop variables (Crop, Crop_Yield).');
        }
    }

    // Check for missing values
    const missingCounts = {};
    columns.forEach(col => {
        const missing = data.filter(row => row[col] === undefined || row[col] === null || String(row[col]).trim() === '').length;
        if (missing > 0) {
            missingCounts[col] = missing;
        }
    });
    
    if (Object.keys(missingCounts).length > 0) {
        report.missingValues = missingCounts;
        const totalMissing = Object.values(missingCounts).reduce((a, b) => a + b, 0);
        report.warnings.push(`Found ${totalMissing} missing values (will be handled by preprocessing imputation)`);
    }

    // Check for duplicates (simple check using stringified row values)
    const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
    const duplicateCount = data.length - uniqueRows.size;
    if (duplicateCount > 0) {
        report.duplicates = duplicateCount;
        report.warnings.push(`Found ${duplicateCount} duplicate rows (will be deduplicated during preprocessing)`);
    }

    // Check data types and invalid values
    columns.forEach(col => {
        const sample = data.find(row => row[col] !== undefined && row[col] !== null && String(row[col]).trim() !== '');
        if (sample) {
            const val = sample[col];
            report.dataTypes[col] = !isNaN(Number(val)) ? 'number' : typeof val;
            
            // Check for negative values in numeric columns
            if (!isNaN(Number(val))) {
                const negativeValues = data.filter(row => {
                    const v = Number(row[col]);
                    return !isNaN(v) && v < 0;
                }).length;
                if (negativeValues > 0) {
                    report.invalidValues[col] = { negative: negativeValues };
                    report.warnings.push(`Found ${negativeValues} negative values in ${col}`);
                }
            }
        }
    });

    // Check for date column
    const dateAliases = ['date', 'datetime', 'timestamp', 'year', 'yr', 'month', 'day'];
    const hasDateColumn = lowerCols.some(c => dateAliases.some(a => c.includes(a)));
    
    if (!hasDateColumn) {
        report.warnings.push('No date column found. Preprocessing will generate sequential dates.');
    }

    return report;
}

module.exports = { validateDataset };