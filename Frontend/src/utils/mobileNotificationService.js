/**
 * ClimaYield-X Mobile Push & System Notification Service
 * Delivers native phone system push notifications for:
 * 1. Vegetables ready for harvest
 * 2. Harvest countdown (days left)
 * 3. Climate advisories (drizzle rain, heat stress, heavy rain)
 */

import { calculateCropHarvestInfo } from './harvestWeatherAlerts';

export const isNotificationSupported = () => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('Error requesting notification permission:', err);
    return 'denied';
  }
};

/**
 * Display a native notification through the Service Worker (best for mobile PWA)
 * with fallback to window Notification
 */
export const showMobileNotification = async (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  const defaultOptions = {
    icon: '/icon-192.png',
    badge: '/favicon.png',
    vibrate: [250, 100, 250, 100, 250],
    renotify: true,
    tag: 'climayield-alert',
    ...options
  };

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration && registration.showNotification) {
        await registration.showNotification(title, defaultOptions);
        return true;
      }
    }

    // Fallback to standard Notification
    new Notification(title, defaultOptions);
    return true;
  } catch (error) {
    console.error('Failed to show mobile notification:', error);
    try {
      new Notification(title, defaultOptions);
      return true;
    } catch (e) {
      return false;
    }
  }
};

/**
 * Dispatch automated background checks for harvest readiness, countdown, and weather warnings
 */
export const dispatchHarvestAndClimateAlerts = async (crops = [], liveWeather = null, isFilipino = false, force = false) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const nowHour = new Date().getHours();

  // 1. Check Ready to Harvest Crops (Stage 5 / 0 days left)
  const readyCrops = crops.filter(c => {
    const info = calculateCropHarvestInfo(c);
    return info.isReady;
  });

  if (readyCrops.length > 0) {
    const readyNames = readyCrops.map(c => isFilipino && c.tagalog_name ? c.tagalog_name : c.crop_name);
    const readyKey = `climayield_notif_ready_${readyNames.slice(0, 3).join('_')}_${todayStr}`;
    
    if (force || !localStorage.getItem(readyKey)) {
      const title = isFilipino
        ? `🎉 Handa nang Anihin: ${readyNames.slice(0, 2).join(', ')}${readyNames.length > 2 ? ` (+${readyNames.length - 2} pa)` : ''}!`
        : `🎉 Ready to Harvest: ${readyNames.slice(0, 2).join(', ')}${readyNames.length > 2 ? ` (+${readyNames.length - 2} more)` : ''}!`;
      
      const body = isFilipino
        ? `${readyNames.join(', ')} ay nasa tamang panahon na para anihin ngayong araw. Mag-ani sa umaga upang mapanatili ang sariwang kalidad.`
        : `${readyNames.join(', ')} reached harvest maturity today. Harvest early morning to ensure maximum crispness and market value.`;

      const sent = await showMobileNotification(title, {
        body,
        tag: `harvest-ready-${todayStr}`,
        vibrate: [300, 100, 300, 100, 300]
      });

      if (sent) localStorage.setItem(readyKey, Date.now().toString());
    }
  }

  // 2. Check Harvest Countdown Crops (Stage 4 / 2 to 5 days left)
  const countdownCrops = crops
    .map(c => ({ crop: c, info: calculateCropHarvestInfo(c) }))
    .filter(item => !item.info.isReady && item.info.daysLeft >= 1 && item.info.daysLeft <= 4);

  if (countdownCrops.length > 0) {
    const cdKey = `climayield_notif_countdown_${todayStr}`;
    if (force || !localStorage.getItem(cdKey)) {
      const summaryItems = countdownCrops.slice(0, 3).map(item => {
        const name = isFilipino && item.crop.tagalog_name ? item.crop.tagalog_name : item.crop.crop_name;
        return `${name} (${item.info.daysLeft} ${isFilipino ? 'araw' : 'days'})`;
      });

      const title = isFilipino
        ? `⏳ Paalala sa Pag-aani (${countdownCrops.length} Gulay)`
        : `⏳ Harvest Countdown (${countdownCrops.length} Crops Approaching)`;

      const body = isFilipino
        ? `Malapit nang anihin: ${summaryItems.join(', ')}. Ihanda ang mga crates at espasyo bago ang anihan.`
        : `Approaching harvest: ${summaryItems.join(', ')}. Prepare harvesting crates and wash stations.`;

      const sent = await showMobileNotification(title, {
        body,
        tag: `harvest-cd-${todayStr}`,
        vibrate: [200, 100, 200]
      });

      if (sent) localStorage.setItem(cdKey, Date.now().toString());
    }
  }

  // 3. Climate Warnings: Drizzle Rain & Unfavorable Weather
  if (liveWeather) {
    const weatherCode = liveWeather.weathercode || 0;
    const precip = liveWeather.precipitation || 0;
    const temp = liveWeather.temperature || 28;

    // DRIZZLE WARNING (WMO 51-57 or 61, or precipitation 0.1 - 3.5mm)
    const isDrizzle = (weatherCode >= 51 && weatherCode <= 57) || weatherCode === 61 || (precip >= 0.1 && precip <= 3.5);
    if (isDrizzle) {
      const drizzleKey = `climayield_notif_drizzle_${todayStr}_h${nowHour}`;
      if (force || !localStorage.getItem(drizzleKey)) {
        const title = isFilipino
          ? '🌧️ Babala sa Ambon (Drizzle Rain Alert)'
          : '🌧️ Drizzle Rain Advisory';

        const body = isFilipino
          ? `May ambon sa Quezon City (${precip > 0 ? `${precip}mm` : 'mababang ulan'}). Bantayan ang pamamasa ng dahon upang maiwasan ang amag (fungal disease). Iwasan muna ang pag-spray.`
          : `Light drizzle detected in Quezon City (${precip > 0 ? `${precip}mm` : 'light'}). Prolonged leaf wetness promotes powdery mildew and fungal damping-off. Avoid foliar spraying.`;

        const sent = await showMobileNotification(title, {
          body,
          tag: `climate-drizzle-${nowHour}`,
          vibrate: [250, 100, 250]
        });

        if (sent) localStorage.setItem(drizzleKey, Date.now().toString());
      }
    }

    // HEAT STRESS WARNING (Temp > 33°C)
    if (temp >= 33) {
      const heatKey = `climayield_notif_heat_${todayStr}`;
      if (force || !localStorage.getItem(heatKey)) {
        const title = isFilipino
          ? `☀️ Babala: Matinding Init (${temp.toFixed(1)}°C)`
          : `☀️ Heat Stress Warning (${temp.toFixed(1)}°C)`;

        const body = isFilipino
          ? 'Mataas ang init sa pananim. Maglagay ng mulch o lilim, at magdilig ng maaga sa umaga o hapon upang hindi malanta ang mga gulay.'
          : 'Elevated ambient temperature may cause wilting. Provide shade nets or mulching, and schedule irrigation during early morning or late afternoon.';

        const sent = await showMobileNotification(title, {
          body,
          tag: `climate-heat-${todayStr}`,
          vibrate: [300, 100, 300]
        });

        if (sent) localStorage.setItem(heatKey, Date.now().toString());
      }
    }

    // HEAVY RAIN WARNING (Precipitation > 15mm)
    if (precip >= 15) {
      const heavyRainKey = `climayield_notif_heavyrain_${todayStr}_h${nowHour}`;
      if (force || !localStorage.getItem(heavyRainKey)) {
        const title = isFilipino
          ? `⛈️ Babala: Malakas na Ulan (${precip.toFixed(1)} mm)`
          : `⛈️ Heavy Rainfall Warning (${precip.toFixed(1)} mm)`;

        const body = isFilipino
          ? 'Malakas ang ulan sa Quezon City. Suriin ang mga drainage trenches sa taniman upang maiwasan ang pagbaha at root rot.'
          : 'Intense precipitation detected. Clear furrow drains and drainage canals immediately to avoid root rot and waterlogging.';

        const sent = await showMobileNotification(title, {
          body,
          tag: `climate-rain-${nowHour}`,
          vibrate: [400, 100, 400]
        });

        if (sent) localStorage.setItem(heavyRainKey, Date.now().toString());
      }
    }
  }
};

/**
 * Send a quick test alert directly to the phone so user can verify it works
 */
export const sendTestAlertToPhone = async (isFilipino = false) => {
  const perm = await requestNotificationPermission();
  if (perm !== 'granted') {
    return { success: false, reason: perm };
  }

  const title = isFilipino
    ? '🌾 ClimaYield-X: Aktibo ang Mobile Alerts!'
    : '🌾 ClimaYield-X: Mobile Alerts Active!';

  const body = isFilipino
    ? 'Makatatanggap ka na ng agarang abiso sa iyong cellphone kapag handa nang anihin ang gulay o may babala sa panahon at ambon.'
    : 'You will now receive phone notifications when vegetables are ready to harvest or when drizzle and adverse climate are detected.';

  const success = await showMobileNotification(title, {
    body,
    tag: 'climayield-test-alert',
    vibrate: [250, 100, 250, 100, 250]
  });

  return { success, reason: success ? 'sent' : 'failed' };
};
