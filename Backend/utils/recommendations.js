function generateRecommendations(predictions, data, modelType = 'hybrid') {
    const recommendations = [];

    const hasValidPredictions = Array.isArray(predictions) && predictions.length > 0;
    const nPreds = hasValidPredictions ? predictions.length : 0;
    const meanPred = nPreds > 0 ? (predictions.reduce((a, b) => a + b, 0) / nPreds) : 3.95;

    // Instability calculation
    let cv = 0.05;
    if (nPreds > 1) {
        const variance = predictions.reduce((a, b) => a + Math.pow(b - meanPred, 2), 0) / nPreds;
        const std = Math.sqrt(Math.max(0, variance));
        cv = meanPred > 0 ? std / meanPred : 0;
    }

    // 1. Rainfall Analysis & Drainage Strategy
    let avgRainfall = null;
    if (modelType === 'sarima' && hasValidPredictions) {
        const rainfallForecast = predictions.slice(0, Math.min(14, predictions.length));
        avgRainfall = rainfallForecast.reduce((a, b) => a + b, 0) / rainfallForecast.length;
    } else if (data && data.length > 0) {
        const recentRain = data.slice(-14)
            .map(row => parseFloat(row.Rainfall))
            .filter(r => !isNaN(r));
        if (recentRain.length > 0) {
            avgRainfall = recentRain.reduce((a, b) => a + b, 0) / recentRain.length;
        }
    } else {
        avgRainfall = 14.8;
    }

    if (avgRainfall !== null) {
        if (avgRainfall > 25) {
            recommendations.push({
                category: 'Rainfall & Drainage',
                filipinoCategory: 'Ulan at Kanal',
                level: 'High',
                predictionBasis: `Heavy precipitation pattern predicted (~${avgRainfall.toFixed(1)} mm/day average).`,
                filipinoPredictionBasis: `Inaasahang malakas na buhos ng ulan (~${avgRainfall.toFixed(1)} mm/araw).`,
                suggestion: `Heavy rainfall pattern (~${avgRainfall.toFixed(1)} mm/day) detected in forecast. Clear furrow drainage ditches immediately and pause granular fertilizer topdressing to prevent nutrient runoff.`,
                filipinoSuggestion: `Inaasahang malakas na buhos ng ulan (~${avgRainfall.toFixed(1)} mm/araw). Linisin agad ang mga kanal at iantala ang pag-aabono upang hindi mahugasan ang pataba.`,
                actionItem: 'Desilt perimeter ditches and raise vegetable nursery seedbeds.',
                filipinoActionItem: 'Alisin ang bara sa kanal at itaas ang punlaan ng gulay.'
            });
        } else if (avgRainfall < 5) {
            recommendations.push({
                category: 'Rainfall & Drainage',
                filipinoCategory: 'Ulan at Patubig',
                level: 'Low',
                predictionBasis: `Prolonged dry window predicted (~${avgRainfall.toFixed(1)} mm/day average).`,
                filipinoPredictionBasis: `Tuyong panahon ang nakikita sa ulat (~${avgRainfall.toFixed(1)} mm/araw).`,
                suggestion: `Low rainfall conditions (~${avgRainfall.toFixed(1)} mm/day) projected. Conserve root-zone moisture with organic mulch (rice straw or dried grass) and transition to scheduled early-morning drip irrigation.`,
                filipinoSuggestion: `Mababang buhos ng ulan (~${avgRainfall.toFixed(1)} mm/araw). Maglagay ng mulch o dayami sa paligid ng tanim at magdilig nang maaga gamit ang drip irrigation.`,
                actionItem: 'Deploy organic mulch and maintain consistent morning root watering.',
                filipinoActionItem: 'Maglagay ng dayami at magdilig tuwing maagang umaga.'
            });
        } else {
            recommendations.push({
                category: 'Rainfall & Drainage',
                filipinoCategory: 'Ulan at Patubig',
                level: 'Normal',
                predictionBasis: `Balanced seasonal precipitation predicted (~${avgRainfall.toFixed(1)} mm/day average).`,
                filipinoPredictionBasis: `Katamtamang ulan sa darating na mga araw (~${avgRainfall.toFixed(1)} mm/araw).`,
                suggestion: `Moderate rainfall projected (~${avgRainfall.toFixed(1)} mm/day). Maintain standard irrigation cycles while monitoring weekly weather variability.`,
                filipinoSuggestion: `Katamtamang ulan (~${avgRainfall.toFixed(1)} mm/araw). Panatilihin ang karaniwang iskedyul ng pagdidilig at regular na tingnan ang panahon.`,
                actionItem: 'Maintain regular watering cycle; clear minor weed overgrowth.',
                filipinoActionItem: 'Ituloy ang regular na pagdidilig; linisin ang mga damo.'
            });
        }
    }

    // 2. Temperature & Solar Exposure Analysis
    let avgTemp = null;
    if (data && data.length > 0) {
        const recentTemps = data.slice(-30)
            .map(row => parseFloat(row.Max_Temp))
            .filter(temp => !isNaN(temp) && temp > 0);
        if (recentTemps.length > 0) {
            avgTemp = recentTemps.reduce((a, b) => a + b, 0) / recentTemps.length;
        }
    }
    if (avgTemp === null) avgTemp = 32.8;

    if (avgTemp > 33.5) {
        recommendations.push({
            category: 'Thermal Stress & Shading',
            filipinoCategory: 'Init at Lilim',
            level: 'High',
            predictionBasis: `High daytime peak temperature detected (projected peak: ~${avgTemp.toFixed(1)}°C).`,
            filipinoPredictionBasis: `Mataas na init sa tanghali ang inaasahan (~${avgTemp.toFixed(1)}°C).`,
            suggestion: `High thermal peak stress projected (avg ${avgTemp.toFixed(1)}°C). Deploy 30–50% agro-shade nets over sensitive leafy crops (pechay, mustard) and reschedule foliar feeding to after 4:00 PM.`,
            filipinoSuggestion: `Matinding init sa tanghali (~${avgTemp.toFixed(1)}°C). Maglagay ng shade net sa pechay at mustasa, at mag-spray lamang pagkalipas ng alas-4 ng hapon.`,
            actionItem: 'Install protective shade cloth and avoid midday transplanting.',
            filipinoActionItem: 'Maglagay ng net pananggalang sa init at iwasan ang paglilipat-tanim sa tanghali.'
        });
    } else {
        recommendations.push({
            category: 'Thermal Stress & Shading',
            filipinoCategory: 'Temperatura at Araw',
            level: 'Normal',
            predictionBasis: `Favorable daytime temperature window (projected avg: ~${avgTemp.toFixed(1)}°C).`,
            filipinoPredictionBasis: `Magandang temperatura para sa pananim (~${avgTemp.toFixed(1)}°C).`,
            suggestion: `Optimal temperature window (avg ${avgTemp.toFixed(1)}°C) supporting steady vegetative development and robust flowering for tomatoes and eggplants.`,
            filipinoSuggestion: `Nasa tamang temperatura (~${avgTemp.toFixed(1)}°C) para sa mabilis na paglaki at pamumulaklak ng kamatis at talong.`,
            actionItem: 'Ensure 6–8 hours direct sunlight exposure for fruit-bearing vegetables.',
            filipinoActionItem: 'Siguruhing nasisikatan ng araw ang mga namumungang gulay.'
        });
    }

    // 3. Humidity & Foliar Disease Prevention
    let avgHumidity = null;
    if (data && data.length > 0) {
        const recentHum = data.slice(-30)
            .map(row => parseFloat(row.Humidity))
            .filter(hum => !isNaN(hum) && hum > 0);
        if (recentHum.length > 0) {
            avgHumidity = recentHum.reduce((a, b) => a + b, 0) / recentHum.length;
        }
    }
    if (avgHumidity === null) avgHumidity = 84;

    if (avgHumidity > 80) {
        recommendations.push({
            category: 'Pest & Disease Prevention',
            filipinoCategory: 'Peste at Proteksyon',
            level: 'High',
            predictionBasis: `Elevated relative humidity projected (~${avgHumidity.toFixed(0)}%).`,
            filipinoPredictionBasis: `Mataas na kahalumigmigan sa hangin (~${avgHumidity.toFixed(0)}%).`,
            suggestion: `Elevated atmospheric humidity (~${avgHumidity.toFixed(0)}%) significantly elevates risks of bacterial leaf spot and downy mildew. Space out plant canopy and apply preventive organic neem or bio-fungicide sprays.`,
            filipinoSuggestion: `Mataas ang halumigmig sa hangin (~${avgHumidity.toFixed(0)}%). Bantayan ang amag at batik sa dahon; luwagan ang agwat ng tanim at mag-spray ng organikong neem.`,
            actionItem: 'Scout leaf undersides at sunrise; prune crowded lower leaves for ventilation.',
            filipinoActionItem: 'Suriin ang ilalim ng dahon sa umaga; bawasan ang mga lumang dahon sa ibaba.'
        });
    } else {
        recommendations.push({
            category: 'Pest & Disease Prevention',
            filipinoCategory: 'Peste at Proteksyon',
            level: 'Normal',
            predictionBasis: `Relative humidity within safe baseline (~${avgHumidity.toFixed(0)}%).`,
            filipinoPredictionBasis: `Normal na moisture sa hangin (~${avgHumidity.toFixed(0)}%).`,
            suggestion: `Stable atmospheric moisture (~${avgHumidity.toFixed(0)}%). Continue routine pest surveillance and maintain companion planting (marigolds, basil) to deter insect pests.`,
            filipinoSuggestion: `Katamtamang kahalumigmigan (~${avgHumidity.toFixed(0)}%). Magpatuloy sa regular na pag-iinspeksyon at pagtatanim ng marigold pambugaw ng insekto.`,
            actionItem: 'Conduct bi-weekly pest sweep across vegetable rows.',
            filipinoActionItem: 'Magsagawa ng regular na pag-inspeksyon sa mga tanim.'
        });
    }

    // 4. Yield Projection & Harvest Logistics
    if (hasValidPredictions) {
        let yieldLevel = 'Normal';
        let yieldText = `AI model predicts a steady harvest trajectory averaging ${meanPred.toFixed(2)} tons/ha across the selected horizon. Maintain scheduled N-P-K nutrient topdressing.`;
        let filYieldText = `Tinataya ng AI model ang karaniwang ani na ${meanPred.toFixed(2)} tons/ha sa napiling panahon. Panatilihin ang iskedyul ng balanseng pataba.`;
        let action = 'Calibrate fertilizer doses according to plant growth stage.';
        let filAction = 'Iakma ang dami ng pataba ayon sa edad ng pananim.';

        if (meanPred >= 3.8) {
            yieldLevel = 'Low'; // Low risk / high positive yield
            yieldText = `Strong yield performance projected (${meanPred.toFixed(2)} tons/ha). Secure vegetable crates, sanitize post-harvest washing areas, and coordinate harvest transport 3 days before peak maturity.`;
            filYieldText = `Mataas at magandang ani ang inaasahan (${meanPred.toFixed(2)} tons/ha). Ihanda ang mga kahon, linisin ang taguan ng ani, at ayusin ang biyahe patungong palengke 3 araw bago mag-ani.`;
            action = 'Prepare storage crates and contact local vegetable buyers in advance.';
            filAction = 'Ihanda ang mga kahon ng gulay at kontakin ang mga mamimili nang maaga.';
        } else if (meanPred < 3.2) {
            yieldLevel = 'High'; // High risk / yield below target
            yieldText = `Projected yield trajectory (${meanPred.toFixed(2)} tons/ha) is trailing optimal thresholds. Inspect root zones for compaction and apply seaweed or compost tea soil conditioners.`;
            filYieldText = `Mababa nang bahagya ang inaasahang ani (${meanPred.toFixed(2)} tons/ha). Suriin ang lupa kung masyadong matigas at maglagay ng organikong compost tea.`;
            action = 'Apply supplemental foliar micro-nutrients to boost plant vigor.';
            filAction = 'Maglagay ng pampatabang organikong abono sa dahon.';
        }

        recommendations.push({
            category: 'Yield & Harvest Logistics',
            filipinoCategory: 'Ani at Pag-aani',
            level: yieldLevel,
            predictionBasis: `Predicted mean yield: ${meanPred.toFixed(2)} tons/ha across ${nPreds}-day forecast window.`,
            filipinoPredictionBasis: `Inaasahang ani: ${meanPred.toFixed(2)} tons/ha sa ${nPreds}-araw na pagtataya.`,
            suggestion: yieldText,
            filipinoSuggestion: filYieldText,
            actionItem: action,
            filipinoActionItem: filAction
        });
    }

    // 5. Yield Stability & Environmental Buffering
    if (cv > 0.18) {
        recommendations.push({
            category: 'Yield Stability',
            filipinoCategory: 'Katatagan ng Ani',
            level: 'High',
            predictionBasis: `High yield variation predicted across horizon (CV: ${(cv * 100).toFixed(1)}%).`,
            filipinoPredictionBasis: `Mataas na pagbabago sa ani ang nakikita (CV: ${(cv * 100).toFixed(1)}%).`,
            suggestion: `High yield variability predicted across the forecast window (CV: ${(cv * 100).toFixed(1)}%). Adopt staggered 7-day planting intervals and diversify vegetable plots to buffer against climatic shocks.`,
            filipinoSuggestion: `May malaking pagbabago sa ani ayon sa AI (CV: ${(cv * 100).toFixed(1)}%). Magtanim nang may 7-araw na pagitan at maghalo ng iba't ibang gulay para hindi sabay-sabay maapektuhan.`,
            actionItem: 'Implement staggered planting schedule across 2–3 seedbed zones.',
            filipinoActionItem: 'Magtanim nang may pagitan na ilang araw sa iba\'t ibang kama.'
        });
    } else {
        recommendations.push({
            category: 'Yield Stability',
            filipinoCategory: 'Katatagan ng Ani',
            level: 'Low',
            predictionBasis: `Consistent, predictable yield curve forecasted (CV: ${(cv * 100).toFixed(1)}%).`,
            filipinoPredictionBasis: `Matatag at maaasahang takbo ng ani (CV: ${(cv * 100).toFixed(1)}%).`,
            suggestion: `Predictable, stable yield curve projected (CV: ${(cv * 100).toFixed(1)}%). Existing field practices are exceptionally well-synchronized with the upcoming climate cycle.`,
            filipinoSuggestion: `Matatag ang inaasahang ani (CV: ${(cv * 100).toFixed(1)}%). Ang kasalukuyang pamamaraan sa bukid ay tugmang-tugma sa darating na panahon.`,
            actionItem: 'Maintain current field management protocols with weekly spot checks.',
            filipinoActionItem: 'Panatilihin ang kasalukuyang pamamaraan at magsagawa ng lingguhang pagsusuri.'
        });
    }

    return recommendations;
}

module.exports = { generateRecommendations };