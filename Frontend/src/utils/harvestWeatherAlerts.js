/**
 * harvestWeatherAlerts.js
 * Agricultural Intelligence module for Quezon City Short-Cycle Vegetables
 * Calculates:
 * 1. Harvest Readiness & Exact Days-to-Harvest Countdown
 * 2. Climate Stress Warnings & Drizzle Rain Advisories
 */

// Approximate maturity and stage durations (in days) for common Quezon City vegetables
export const VEGETABLE_GROWTH_SPECS = {
  pechay: { totalDays: 28, stageDays: [5, 10, 18, 24, 28], harvestWindow: '25–30 days' },
  mustasa: { totalDays: 30, stageDays: [5, 12, 20, 26, 30], harvestWindow: '25–32 days' },
  kangkong: { totalDays: 24, stageDays: [4, 10, 16, 20, 24], harvestWindow: '20–25 days' },
  letsugas: { totalDays: 32, stageDays: [6, 14, 22, 28, 32], harvestWindow: '28–35 days' },
  labanos: { totalDays: 34, stageDays: [6, 14, 22, 28, 34], harvestWindow: '30–35 days' },
  pipino: { totalDays: 48, stageDays: [8, 20, 32, 42, 48], harvestWindow: '45–50 days' },
  sitaw: { totalDays: 52, stageDays: [8, 22, 34, 44, 52], harvestWindow: '45–55 days' },
  okra: { totalDays: 48, stageDays: [8, 20, 32, 42, 48], harvestWindow: '45–50 days' },
  kamatis: { totalDays: 65, stageDays: [12, 28, 42, 54, 65], harvestWindow: '60–70 days' },
  talong: { totalDays: 70, stageDays: [12, 30, 46, 58, 70], harvestWindow: '65–75 days' },
  sili: { totalDays: 65, stageDays: [12, 26, 42, 54, 65], harvestWindow: '60–70 days' }
};

/**
 * Compute the remaining days until harvest and harvest status for any vegetable
 */
export function calculateCropHarvestInfo(crop, lang = 'en') {
  const isFil = lang === 'fil';
  const rawId = String(crop.id || crop.name || crop.filipinoName || '').toLowerCase().trim();
  
  // Find key in VEGETABLE_GROWTH_SPECS
  const specKey = Object.keys(VEGETABLE_GROWTH_SPECS).find(k => rawId.includes(k)) || 'pechay';
  const spec = VEGETABLE_GROWTH_SPECS[specKey];

  const stageStep = Number(crop.stageStep || 2); // 1 to 5

  let daysRemaining = 0;
  let isReady = false;
  let status = 'growing'; // 'ready' | 'near' | 'growing' | 'seedling'

  if (stageStep >= 5) {
    daysRemaining = 0;
    isReady = true;
    status = 'ready';
  } else if (stageStep === 4) {
    // Stage 4: Maturation / nearing harvest
    daysRemaining = Math.max(2, Math.round(spec.totalDays - spec.stageDays[3]));
    status = 'near';
  } else if (stageStep === 3) {
    // Stage 3: Flowering / Fruiting
    daysRemaining = Math.max(6, Math.round(spec.totalDays - spec.stageDays[2]));
    status = 'growing';
  } else if (stageStep === 2) {
    // Stage 2: Vegetative Growth
    daysRemaining = Math.max(12, Math.round(spec.totalDays - spec.stageDays[1]));
    status = 'growing';
  } else {
    // Stage 1: Seedling
    daysRemaining = spec.totalDays;
    status = 'seedling';
  }

  // Display badges
  let badgeText = '';
  let badgeIcon = '🌱';
  let badgeColor = '#3b82f6';

  if (status === 'ready') {
    badgeIcon = '🎉';
    badgeText = isFil ? 'HANDA NANG ANIHIN' : 'READY TO HARVEST';
    badgeColor = '#16a34a';
  } else if (status === 'near') {
    badgeIcon = '⏳';
    badgeText = isFil ? `${daysRemaining} ARAW NA LANG BAGO ANIHIN` : `${daysRemaining} DAYS LEFT TO HARVEST`;
    badgeColor = '#f59e0b';
  } else {
    badgeIcon = '🌱';
    badgeText = isFil ? `${daysRemaining} ARAW BAGO ANIHIN` : `${daysRemaining} DAYS REMAINING`;
    badgeColor = '#10b981';
  }

  return {
    daysRemaining,
    isReady,
    status,
    stageStep,
    badgeText,
    badgeIcon,
    badgeColor,
    harvestWindow: spec.harvestWindow
  };
}

/**
 * Generate full list of Harvest and Countdown alerts across all active vegetables
 */
export function getHarvestAlerts(crops = [], lang = 'en') {
  const isFil = lang === 'fil';
  const readyList = [];
  const nearList = [];
  const growingList = [];

  crops.forEach(crop => {
    const info = calculateCropHarvestInfo(crop, lang);
    const cropName = isFil 
      ? crop.filipinoName || crop.name 
      : crop.name || crop.filipinoName;
    const cropObj = { ...crop, cropName, harvestInfo: info };

    if (info.status === 'ready') {
      readyList.push(cropObj);
    } else if (info.status === 'near') {
      nearList.push(cropObj);
    } else {
      growingList.push(cropObj);
    }
  });

  const alerts = [];

  // 1. URGENT: Ready for harvest alert
  if (readyList.length > 0) {
    const names = readyList.map(c => `${c.icon} ${c.cropName}`).join(', ');
    alerts.push({
      id: 'harvest-ready',
      type: 'harvest-ready',
      severity: 'success',
      icon: '🎉',
      title: isFil 
        ? `Handa nang Anihin Ngayon (${readyList.length} Pananim)!`
        : `Ready for Harvest Today (${readyList.length} Crop${readyList.length > 1 ? 's' : ''})!`,
      message: isFil
        ? `Ang ${names} ay nasa tugatog na ng pagkahinog. Anihin sa maagang umaga (5:30 AM – 7:30 AM) upang mapanatili ang crispness at sariwang kalidad sa merkado.`
        : `${names} ${readyList.length > 1 ? 'have' : 'has'} reached peak maturity. Harvest in early morning (5:30 AM – 7:30 AM) to preserve crisp foliage and achieve highest market weight.`,
      action: isFil ? 'Mag-ani Ngayon' : 'Harvest Today',
      crops: readyList
    });
  }

  // 2. COUNTDOWN: Nearing harvest alert (1–5 days)
  if (nearList.length > 0) {
    const items = nearList.map(c => `${c.icon} ${c.cropName} (${c.harvestInfo.daysRemaining} ${isFil ? 'araw' : 'days'})`).join(', ');
    alerts.push({
      id: 'harvest-countdown',
      type: 'harvest-countdown',
      severity: 'warning',
      icon: '⏳',
      title: isFil ? 'Alerto sa Nalalapit na Pag-ani' : 'Harvest Countdown Alert',
      message: isFil
        ? `Nalalapit na ang anihan: ${items}. Ihanda ang mga kahon ng gulay, tubig-panghugas, at i-iskedyul ang bagsakan bago mag-weekend.`
        : `Harvesting approaching soon: ${items}. Prepare vegetable crates, washing stations, and align with local trading centers (Balintawak/Q-Mart).`,
      action: isFil ? 'Ihanda ang Kagamitan' : 'Prepare Crates',
      crops: nearList
    });
  }

  return {
    readyList,
    nearList,
    growingList,
    alerts
  };
}

/**
 * Generate Climate & Weather Alerts (including Drizzle Rain and Adverse Conditions)
 */
export function getClimateAlerts(weather = {}, lang = 'en') {
  const isFil = lang === 'fil';
  const alerts = [];

  const cur = weather.current || weather;
  const temp = Number(cur.temp ?? cur.temperature_2m ?? 29);
  const humidity = Number(cur.humidity ?? cur.relative_humidity_2m ?? 82);
  const precipitation = Number(cur.precipitation ?? cur.rain ?? 0);
  const weatherCode = Number(cur.weatherCode ?? cur.weather_code ?? 2);
  const condition = String(cur.condition || '').toLowerCase();

  // 1. 🌧️ DRIZZLE RAIN ALERT (Specialized check for light drizzle/ambon)
  const isDrizzleCode = (weatherCode >= 51 && weatherCode <= 57) || weatherCode === 61;
  const isDrizzlePrecip = precipitation > 0 && precipitation <= 3.5;
  const isDrizzleText = condition.includes('drizzle') || condition.includes('ambon') || condition.includes('light rain');

  if (isDrizzleCode || isDrizzlePrecip || isDrizzleText) {
    alerts.push({
      id: 'climate-drizzle',
      type: 'drizzle',
      severity: 'info',
      icon: '🌧️',
      title: isFil ? 'Babala sa Ambon at Mahinang Pag-ulan' : 'Drizzle Rain Alert',
      message: isFil
        ? 'May patuloy na ambon sa Quezon City. Ang basang dahon ay nagdudulot ng amag (powdery mildew) at leaf spot sa Pechay, Mustasa, at Letsugas. Iwasan muna ang pag-spray ng foliar fertilizer at tiyakin ang maayos na bentilasyon sa kamang taniman.'
        : 'Continuous drizzle rain detected in Quezon City. Persistent moisture on foliage increases fungal risk (powdery mildew & damping-off) for delicate greens (Pechay, Mustard, Lettuce). Suspend foliar spray applications and maintain bed aeration.',
      action: isFil ? 'Gabay sa Ambon' : 'Drizzle Advisory',
      tag: isFil ? 'Ambon Detected' : 'Drizzle Active'
    });
  }

  // 2. ☀️ EXTREME HEAT STRESS (> 33°C)
  if (temp >= 33) {
    alerts.push({
      id: 'climate-heat',
      type: 'heat',
      severity: 'warning',
      icon: '☀️',
      title: isFil ? 'Babala sa Matinding Init (Heat Stress)' : 'High Heat Stress Warning',
      message: isFil
        ? `Umiinit ang panahon (${temp}°C). Mabilis ang pagkaubos ng tubig sa lupa at pagkalanta ng mga tanim. Magdilig nang maaga (5:00 AM – 7:00 AM) at lagyan ng mulch o dayami ang ibabaw ng lupa.`
        : `Elevated temperature (${temp}°C) creates severe evapotranspiration stress. Vegetables may exhibit temporary wilting and blossom drop. Apply deep early morning irrigation and maintain organic mulch.`,
      action: isFil ? 'Magdilig Maaga' : 'Irrigate Early',
      tag: isFil ? 'Init' : 'Heat Stress'
    });
  }

  // 3. 🌊 HEAVY DOWNPOUR / WATERLOGGING (> 15mm)
  if (precipitation >= 15 || weatherCode === 65 || weatherCode === 82 || weatherCode === 95) {
    alerts.push({
      id: 'climate-heavy-rain',
      type: 'heavy-rain',
      severity: 'danger',
      icon: '🌊',
      title: isFil ? 'Babala sa Malakas na Ulan at Baha' : 'Excess Rainfall & Waterlogging Alert',
      message: isFil
        ? `Inaasahan ang malakas na buhos ng ulan (${precipitation} mm). Tiyaking malinis at walang bara ang mga kanal sa pagitan ng mga plot upang maiwasan ang pagkaipon ng tubig at pagkabulok ng ugat.`
        : `Heavy precipitation (${precipitation} mm) projected. Promptly clear raised bed drainage furrows to prevent root saturation, soil compaction, and bacterial soft rot.`,
      action: isFil ? 'Linisin ang Kanal' : 'Clear Furrows',
      tag: isFil ? 'Malakas na Ulan' : 'Heavy Rain'
    });
  }

  // 4. 🌫️ HIGH RELATIVE HUMIDITY (> 85%)
  if (humidity >= 85 && !isDrizzleCode && !isDrizzlePrecip) {
    alerts.push({
      id: 'climate-humidity',
      type: 'humidity',
      severity: 'warning',
      icon: '🌫️',
      title: isFil ? 'Babala sa Mataas na Halumigmig (Fungal Risk)' : 'High Humidity Disease Watch',
      message: isFil
        ? `Napakataas ng moisture sa hangin (${humidity}%). Mag-ingat sa fungal blight at bacterial wilt sa Kamatis, Talong, at Sili. Luwagan ang espasyo ng mga dahon.`
        : `Relative humidity at ${humidity}%. Favorable microclimate for fungal blight and bacterial wilt in solanaceous crops (Tomato, Eggplant, Pepper). Ensure canopy airflow.`,
      action: isFil ? 'Suriin ang Halaman' : 'Inspect Foliage',
      tag: isFil ? 'Halumigmig' : 'High Humidity'
    });
  }

  // Fallback optimal condition
  if (alerts.length === 0) {
    alerts.push({
      id: 'climate-optimal',
      type: 'optimal',
      severity: 'success',
      icon: '🌤️',
      title: isFil ? 'Maayos at Mainam na Panahon sa Pagtatanim' : 'Optimal Growing Weather',
      message: isFil
        ? `Maganda ang panahon sa Quezon City (${temp}°C, ${humidity}% halumigmig). Angkop na angkop para sa mabilis na paglaki ng mga gulay at aktibidad sa bukid.`
        : `Favorable atmospheric parameters in Quezon City (${temp}°C, ${humidity}% RH). Conditions are optimal for short-cycle vegetable development and scheduled farm tasks.`,
      action: isFil ? 'Mainam ang Lagay' : 'Optimal Window',
      tag: isFil ? 'Maayos' : 'Optimal'
    });
  }

  return alerts;
}
