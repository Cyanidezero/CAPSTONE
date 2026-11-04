/**
 * ClimaYield-X Crop Daily Tracking & Automatic Maturation Engine
 * 
 * Automatically tracks and increments plant ages by +1 day every agricultural growth day.
 * - In accordance with Philippine urban agriculture schedules, the farming day completes
 *   and increments at 6:00 AM (agricultural dawn).
 * - From 6:00 AM today until 5:59 AM tomorrow is Day N.
 * - At exactly 6:00 AM tomorrow, the day completes and the crops advance to Day N + 1.
 * - Automatically checks and updates via continuous 10s watchdog timers, exact 6:00 AM alarm
 *   timeouts, and window focus/visibility wakeups.
 * - Supports testing simulation (+1 Day fast-forward / Reset to Today).
 * - Accurately updates growth stages, days to harvest, and target harvest dates.
 */

export const STORAGE_KEY_DAILY_TRACKING = 'climayield_crop_daily_tracking';
export const STORAGE_KEY_DAY_OFFSET = 'climayield_crop_day_offset';
export const STORAGE_KEY_LAST_DATE = 'climayield_crop_last_seen_date';

/**
 * Maps a real-time Date object into the agricultural growth date.
 * The agricultural day completes and rolls over at 6:00 AM local time.
 * (Subtracting 6 hours aligns 06:00:00 to 00:00:00 of the growth day)
 */
export function getFarmingDateObj(dateObj = new Date()) {
  const d = dateObj instanceof Date ? new Date(dateObj.getTime()) : new Date(dateObj);
  // Shift back by 6 hours: 6:00 AM today becomes 00:00 AM today; 5:59 AM today becomes 23:59 PM yesterday
  return new Date(d.getTime() - 6 * 3600 * 1000);
}

/**
 * Returns the current farming date string as "YYYY-MM-DD" aligned to 6:00 AM dawn rollover
 */
export function getTodayDateString(dateObj = new Date()) {
  const farmingD = getFarmingDateObj(dateObj);
  const year = farmingD.getFullYear();
  const month = String(farmingD.getMonth() + 1).padStart(2, '0');
  const day = String(farmingD.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates calendar days elapsed between two date strings (YYYY-MM-DD or parseable dates)
 */
export function getCalendarDaysDiff(startStr, endStr) {
  try {
    const [y1, m1, d1] = (startStr || '').split('-').map(Number);
    const [y2, m2, d2] = (endStr || '').split('-').map(Number);
    if (!y1 || !y2) {
      const dt1 = new Date(startStr);
      const dt2 = new Date(endStr);
      const mid1 = new Date(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()).getTime();
      const mid2 = new Date(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()).getTime();
      return Math.round((mid2 - mid1) / 86400000);
    }
    const dt1 = new Date(y1, m1 - 1, d1).getTime();
    const dt2 = new Date(y2, m2 - 1, d2).getTime();
    return Math.round((dt2 - dt1) / 86400000);
  } catch {
    return 0;
  }
}

/**
 * Calculates the exact next 6:00 AM Date object from a reference time
 */
export function getNext6AMDate(from = new Date()) {
  const next = new Date(from.getFullYear(), from.getMonth(), from.getDate(), 6, 0, 0, 0);
  if (from.getTime() >= next.getTime()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Returns milliseconds remaining until the upcoming 6:00 AM growth update
 */
export function getMillisUntilNext6AM(from = new Date()) {
  return Math.max(1000, getNext6AMDate(from).getTime() - from.getTime());
}

/**
 * Returns a human-friendly countdown string until the next 6:00 AM growth update
 */
export function formatTimeUntilNext6AM(from = new Date(), isFil = false) {
  const ms = getMillisUntilNext6AM(from);
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (hours > 0) {
    return isFil ? `${hours} oras at ${minutes} minuto` : `${hours}h ${minutes}m`;
  }
  return isFil ? `${minutes} minuto` : `${minutes}m`;
}

/**
 * Reads all stored crop tracking anchors from localStorage
 */
export function getAllTrackingRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DAILY_TRACKING);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.warn('Error reading crop daily tracking:', err);
  }
  return {};
}

/**
 * Saves all crop tracking anchors to localStorage
 */
export function saveAllTrackingRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY_DAILY_TRACKING, JSON.stringify(records || {}));
  } catch (err) {
    console.warn('Error saving crop daily tracking:', err);
  }
}

/**
 * Gets or initializes the tracking record for a specific crop
 */
export function getOrInitCropTracking(cropId, defaultInitialAge = 1, totalDays = 45) {
  if (!cropId) return null;
  const records = getAllTrackingRecords();
  const id = String(cropId).toLowerCase().trim();

  if (records[id]) {
    return records[id];
  }

  // Anchor to current farming date (6:00 AM cycle)
  const todayStr = getTodayDateString();
  const newRecord = {
    cropId: id,
    initialAge: Math.max(1, Number(defaultInitialAge) || 1),
    startDate: todayStr,
    totalDays: Number(totalDays) || 45,
    cycleNumber: 1,
    createdAt: Date.now()
  };

  records[id] = newRecord;
  saveAllTrackingRecords(records);
  return newRecord;
}

/**
 * Gets the simulated manual day offset (for testing/demoing day-by-day updates)
 */
export function getManualDayOffset() {
  try {
    const val = localStorage.getItem(STORAGE_KEY_DAY_OFFSET);
    return val !== null ? parseInt(val, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Sets manual day offset and notifies listeners
 */
export function setManualDayOffset(offset) {
  try {
    const num = Number(offset) || 0;
    localStorage.setItem(STORAGE_KEY_DAY_OFFSET, String(num));
    window.dispatchEvent(new CustomEvent('cropDailyTrackingUpdated', { detail: { offset: num } }));
    return num;
  } catch {
    return 0;
  }
}

/**
 * Advances manual day offset by delta (e.g. +1 or -1)
 */
export function advanceManualDay(delta = 1) {
  const current = getManualDayOffset();
  return setManualDayOffset(current + delta);
}

/**
 * Resets manual day offset back to 0 (real today)
 */
export function resetManualDay() {
  return setManualDayOffset(0);
}

/**
 * Replants a crop (starts a fresh cycle from Day 1)
 */
export function replantCrop(cropId, totalDays = 45) {
  if (!cropId) return;
  const id = String(cropId).toLowerCase().trim();
  const records = getAllTrackingRecords();
  const prev = records[id] || {};

  records[id] = {
    ...prev,
    cropId: id,
    initialAge: 1,
    startDate: getTodayDateString(),
    totalDays: Number(totalDays) || prev.totalDays || 45,
    cycleNumber: (prev.cycleNumber || 1) + 1,
    replantedAt: Date.now()
  };

  saveAllTrackingRecords(records);
  window.dispatchEvent(new CustomEvent('cropDailyTrackingUpdated', { detail: { replanted: id } }));
}

/**
 * Clears all crop tracking data (called during dataset resets)
 */
export function clearAllCropTracking() {
  try {
    localStorage.removeItem(STORAGE_KEY_DAILY_TRACKING);
    localStorage.removeItem(STORAGE_KEY_DAY_OFFSET);
    localStorage.removeItem(STORAGE_KEY_LAST_DATE);
    window.dispatchEvent(new CustomEvent('cropDailyTrackingUpdated', { detail: { cleared: true } }));
  } catch {}
}

/**
 * Calculates the current real/simulated plant age and harvest metadata for a crop
 */
export function calculateCropDailyStatus(crop, defaultAge, totalDays, manualOffset = null) {
  const cId = String(crop?.id || crop?.name || crop?.filipinoName || '').toLowerCase().trim();
  const totDays = Number(totalDays || crop?.stagesConfig?.totalDays || crop?.totalDays || 45);
  const fallbackAge = Math.max(1, Number(defaultAge || crop?.plantAgeDays || Math.round(totDays / 2)));

  const tracking = getOrInitCropTracking(cId, fallbackAge, totDays);
  const activeOffset = manualOffset !== null ? manualOffset : getManualDayOffset();

  // Current farming date aligned to 6:00 AM agricultural shift
  const todayStr = getTodayDateString();
  const realElapsed = getCalendarDaysDiff(tracking.startDate, todayStr);
  const totalElapsed = Math.max(0, realElapsed + activeOffset);

  const rawDay = tracking.initialAge + totalElapsed;
  const currentDay = Math.min(totDays, Math.max(1, rawDay));
  const isReady = rawDay >= totDays;
  const daysLeft = Math.max(0, totDays - rawDay);

  // Target harvest calendar date
  const now = new Date();
  const effectiveNow = new Date(now.getTime() + activeOffset * 86400000);
  const harvestDate = new Date(effectiveNow.getTime() + daysLeft * 86400000);

  return {
    cropId: cId,
    currentDay,
    rawDay,
    totalDays: totDays,
    isReady,
    daysLeft,
    realElapsed,
    manualOffset: activeOffset,
    totalElapsed,
    initialAge: tracking.initialAge,
    startDate: tracking.startDate,
    cycleNumber: tracking.cycleNumber || 1,
    effectiveDate: effectiveNow,
    harvestDate,
    timeUntilNext6AM: formatTimeUntilNext6AM(now, false),
    timeUntilNext6AMFil: formatTimeUntilNext6AM(now, true)
  };
}

/**
 * Global background watcher for 6:00 AM Dawn Shift.
 * Fires 'cropDailyTrackingUpdated' event whenever 6:00 AM arrives,
 * on window focus/tab restore, or every 10 seconds.
 */
export function initAgricultural6AMWatcher() {
  if (typeof window === 'undefined') return;
  if (window.__climayield_6am_watcher_active) return;
  window.__climayield_6am_watcher_active = true;

  let lastFarmingDate = getTodayDateString();

  const checkAndTrigger = () => {
    const currentFarmingDate = getTodayDateString();
    if (currentFarmingDate !== lastFarmingDate) {
      lastFarmingDate = currentFarmingDate;
      window.dispatchEvent(new CustomEvent('cropDailyTrackingUpdated', {
        detail: { farmingDate: currentFarmingDate, reason: '6am_dawn_shift' }
      }));
    }
  };

  // Watchdog interval every 10 seconds
  setInterval(checkAndTrigger, 10000);

  // Window visibility & focus listeners (for wakeups after sleep/lock)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkAndTrigger();
      }
    });
  }
  window.addEventListener('focus', checkAndTrigger);

  // Schedule exact alarm for the next 6:00:01 AM
  const scheduleAlarm = () => {
    const ms = getMillisUntilNext6AM();
    setTimeout(() => {
      checkAndTrigger();
      scheduleAlarm();
    }, ms + 1000);
  };
  scheduleAlarm();
}

/**
 * Formats a Date object into a readable date string in English or Filipino
 */
export function formatCalendarDate(dateObj, isFil = false) {
  if (!dateObj || !(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return isFil ? 'Araw na ito' : 'Today';
  }

  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthsFil = [
    'Enero', 'Pebrero', 'Marso', 'Abril', 'Mayo', 'Hunyo',
    'Hulyo', 'Agosto', 'Setyembre', 'Oktubre', 'Nobyembre', 'Disyembre'
  ];

  const daysEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const daysFil = ['Linggo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado'];

  const dName = isFil ? daysFil[dateObj.getDay()] : daysEn[dateObj.getDay()];
  const mName = isFil ? monthsFil[dateObj.getMonth()] : monthsEn[dateObj.getMonth()];
  const dNum = dateObj.getDate();
  const yNum = dateObj.getFullYear();

  return isFil
    ? `${dName}, ${mName} ${dNum}, ${yNum}`
    : `${dName}, ${mName} ${dNum}, ${yNum}`;
}
