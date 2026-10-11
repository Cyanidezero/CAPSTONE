function generateRecommendations(predictions, data, modelType = 'hybrid') {
    const recommendations = [];

    if (!predictions || !Array.isArray(predictions) || predictions.length < 5) {
        return [{ 
            category: 'General', 
            level: 'Info', 
            suggestion: 'Generate a prediction to see customized farming recommendations.' 
        }];
    }

    // 1. Rainfall analysis
    let avgRainfall = null;
    if (modelType === 'sarima') {
        const rainfallForecast = predictions.slice(0, 7);
        avgRainfall = rainfallForecast.reduce((a, b) => a + b, 0) / rainfallForecast.length;
    } else if (data && data.length > 0) {
        const recentRain = data.slice(-14)
            .map(row => parseFloat(row.Rainfall))
            .filter(r => !isNaN(r));
        if (recentRain.length > 0) {
            avgRainfall = recentRain.reduce((a, b) => a + b, 0) / recentRain.length;
        }
    }

    if (avgRainfall !== null) {
        if (avgRainfall > 25) {
            recommendations.push({
                category: 'Rainfall',
                level: 'High',
                suggestion: `High rainfall pattern (~${avgRainfall.toFixed(1)} mm/day). Ensure field drainage ditches are unobstructed and delay fertilizer application to prevent nutrient runoff.`
            });
        } else if (avgRainfall < 5) {
            recommendations.push({
                category: 'Rainfall',
                level: 'Low',
                suggestion: `Low rainfall conditions (~${avgRainfall.toFixed(1)} mm/day). Implement moisture conservation techniques, mulch beds, and prepare drip or furrow irrigation.`
            });
        } else {
            recommendations.push({
                category: 'Rainfall',
                level: 'Normal',
                suggestion: `Moderate rainfall expected (~${avgRainfall.toFixed(1)} mm/day). Maintain standard irrigation and planting schedules.`
            });
        }
    }

    // 2. Temperature analysis
    if (data && data.length > 0) {
        const recentTemps = data.slice(-30)
            .map(row => parseFloat(row.Max_Temp))
            .filter(temp => !isNaN(temp) && temp > 0);
        
        if (recentTemps.length > 0) {
            const avgTemp = recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length;
            
            if (avgTemp > 34) {
                recommendations.push({
                    category: 'Temperature',
                    level: 'High',
                    suggestion: `Sustained high temperatures detected (avg ${avgTemp.toFixed(1)}°C). Provide shade netting for sensitive seedlings and schedule irrigation during early morning or evening.`
                });
            } else if (avgTemp < 16) {
                recommendations.push({
                    category: 'Temperature',
                    level: 'Low',
                    suggestion: `Cool climate conditions (avg ${avgTemp.toFixed(1)}°C). Consider plastic mulch or row covers to maintain soil root-zone warmth.`
                });
            } else {
                recommendations.push({
                    category: 'Temperature',
                    level: 'Normal',
                    suggestion: `Optimal temperature window (avg ${avgTemp.toFixed(1)}°C) supporting healthy photosynthetic and vegetative development.`
                });
            }
        }
    }

    // 3. Humidity & Disease risk analysis
    if (data && data.length > 0) {
        const recentHumidity = data.slice(-30)
            .map(row => parseFloat(row.Humidity))
            .filter(hum => !isNaN(hum) && hum > 0);
        
        if (recentHumidity.length > 0) {
            const avgHumidity = recentHumidity.reduce((a, b) => a + b, 0) / recentHumidity.length;
            
            if (avgHumidity > 78) {
                recommendations.push({
                    category: 'Humidity',
                    level: 'High',
                    suggestion: `Elevated humidity (~${avgHumidity.toFixed(0)}%) increases risk of fungal and bacterial blights. Scout leaf undersides and apply preventive bio-fungicides if needed.`
                });
            } else if (avgHumidity < 40) {
                recommendations.push({
                    category: 'Humidity',
                    level: 'Low',
                    suggestion: `Dry air conditions (~${avgHumidity.toFixed(0)}%). Increase irrigation frequency to prevent leaf transpiration stress and tip burn.`
                });
            }
        }
    }

    // 4. Yield Outlook & Stability analysis (for LSTM & Hybrid models)
    if (modelType !== 'sarima') {
        const meanYield = predictions.reduce((a, b) => a + b, 0) / predictions.length;
        const variance = predictions.reduce((a, b) => a + Math.pow(b - meanYield, 2), 0) / predictions.length;
        const std = Math.sqrt(Math.max(0, variance));
        const cv = meanYield > 0 ? std / meanYield : 0;

        if (meanYield > 0) {
            let yieldLevel = 'Normal';
            let yieldText = `Projected yield trajectory averages ${meanYield.toFixed(2)} units. Maintain regular fertilization and crop maintenance practices.`;

            if (data && data.length > 0) {
                const histYields = data.map(r => parseFloat(r.Crop_Yield)).filter(v => !isNaN(v) && v > 0);
                if (histYields.length > 0) {
                    const histMean = histYields.reduce((a, b) => a + b, 0) / histYields.length;
                    if (meanYield > histMean * 1.1) {
                        yieldLevel = 'High';
                        yieldText = `Strong yield performance projected (${meanYield.toFixed(2)} vs historical avg ${histMean.toFixed(2)}). Prepare harvesting equipment and secure storage capacity early.`;
                    } else if (meanYield < histMean * 0.85) {
                        yieldLevel = 'Low';
                        yieldText = `Yield projected below historical baseline (${meanYield.toFixed(2)} vs historical avg ${histMean.toFixed(2)}). Assess nutrient deficiency or water stress immediately.`;
                    }
                }
            }

            recommendations.push({
                category: 'Yield Outlook',
                level: yieldLevel,
                suggestion: yieldText
            });
        }

        if (cv > 0.25) {
            recommendations.push({
                category: 'Yield Stability',
                level: 'Unstable',
                suggestion: `High yield variability predicted (CV: ${(cv * 100).toFixed(1)}%). Consider staggered planting dates and crop diversification to buffer environmental risks.`
            });
        } else if (cv > 0.12) {
            recommendations.push({
                category: 'Yield Stability',
                level: 'Moderate',
                suggestion: `Moderate yield variability anticipated (CV: ${(cv * 100).toFixed(1)}%). Monitor soil moisture consistency across fields.`
            });
        } else {
            recommendations.push({
                category: 'Yield Stability',
                level: 'Stable',
                suggestion: `Predictable, stable yield curve expected (CV: ${(cv * 100).toFixed(1)}%). Current field practices are well aligned with seasonal trends.`
            });
        }
    }

    // 5. Default fallback if few recommendations triggered
    if (recommendations.length < 2) {
        recommendations.push({
            category: 'General',
            level: 'Info',
            suggestion: 'Monitor field conditions and weather forecasts regularly to synchronize planting and irrigation windows.'
        });
    }

    return recommendations;
}

module.exports = { generateRecommendations };