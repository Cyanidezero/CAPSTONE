/**
 * ClimaYield-X Automatic Update & Cache Invalidation System
 * Ensures evaluators, farmers, and testers never need to manually refresh or clear cache:
 * 1. Automatically polls version.json every 12 seconds for new system deployments
 * 2. Checks immediately when user switches tabs or unlocks their mobile phone
 * 3. Listens to Service Worker updatefound & controllerchange events
 * 4. Clears CacheStorage, unregisters stale service workers, and reloads automatically
 */
import currentVersionData from '../version.json';

const LOCAL_BUILD_TIMESTAMP = currentVersionData?.buildTimestamp || 0;
const POLL_INTERVAL_MS = 12000; // Check every 12 seconds
let isUpdating = false;

/**
 * Show a sleek non-blocking floating indicator before automatic reload
 */
function showUpdateNotification() {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById('climayield-auto-update-banner');
  if (existing) return;

  const banner = document.createElement('div');
  banner.id = 'climayield-auto-update-banner';
  banner.style.position = 'fixed';
  banner.style.top = '16px';
  banner.style.left = '50%';
  banner.style.transform = 'translateX(-50%)';
  banner.style.zIndex = '999999';
  banner.style.background = 'linear-gradient(135deg, #15803d 0%, #16a34a 100%)';
  banner.style.color = '#ffffff';
  banner.style.padding = '12px 20px';
  banner.style.borderRadius = '50px';
  banner.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.35)';
  banner.style.display = 'flex';
  banner.style.alignItems = 'center';
  banner.style.gap = '10px';
  banner.style.fontSize = '0.9rem';
  banner.style.fontWeight = '700';
  banner.style.fontFamily = 'Inter, -apple-system, sans-serif';
  banner.style.transition = 'all 0.3s ease';

  banner.innerHTML = `
    <span style="font-size: 1.2rem; display: inline-block; animation: spin 1s infinite linear;">🔄</span>
    <span>System updated! Refreshing to latest version...</span>
    <style>
      @keyframes spin { 100% { transform: rotate(360deg); } }
    </style>
  `;

  document.body.appendChild(banner);
}

/**
 * Clear all PWA and browser caches, then reload cleanly
 */
export async function clearCachesAndReload(newTimestamp) {
  if (isUpdating) return;
  isUpdating = true;

  try {
    sessionStorage.setItem('last_auto_reloaded_build', String(newTimestamp || Date.now()));
  } catch (e) {}

  showUpdateNotification();

  // 1. Clear CacheStorage API
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      console.log('[AutoUpdater] Cleared CacheStorage:', keys);
    } catch (e) {}
  }

  // 2. Notify Service Worker to skipWaiting
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        await reg.update().catch(() => {});
      }
    } catch (e) {}
  }

  // 3. Reload cleanly after a brief 600ms grace period for visual feedback
  setTimeout(() => {
    window.location.reload(true);
  }, 650);
}

/**
 * Fetch remote version.json and compare against local build
 */
export async function checkForSystemUpdates() {
  if (isUpdating) return;

  try {
    // Determine relative or absolute path to version.json
    const baseUrl = (process.env.PUBLIC_URL || '').replace(/\/$/, '');
    const versionUrl = `${baseUrl}/version.json?_t=${Date.now()}`;

    const res = await fetch(versionUrl, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache'
      }
    });

    if (!res.ok) return;

    const data = await res.json();
    const remoteTimestamp = Number(data?.buildTimestamp || 0);

    if (remoteTimestamp && LOCAL_BUILD_TIMESTAMP && remoteTimestamp > LOCAL_BUILD_TIMESTAMP) {
      const lastReloaded = sessionStorage.getItem('last_auto_reloaded_build');
      if (lastReloaded === String(remoteTimestamp)) {
        return; // Prevent repeating reload on the same build
      }

      console.log(`[AutoUpdater] New system version detected! Local: ${LOCAL_BUILD_TIMESTAMP}, Remote: ${remoteTimestamp}. Auto-refreshing...`);
      clearCachesAndReload(remoteTimestamp);
    }
  } catch (e) {
    // Network failure / offline: continue quietly
  }
}

/**
 * Start the continuous background update polling
 */
export function startAutoUpdater() {
  if (typeof window === 'undefined') return;

  // Run initial check after 2 seconds
  setTimeout(checkForSystemUpdates, 2000);

  // Poll continuously every 12 seconds
  const intervalId = setInterval(checkForSystemUpdates, POLL_INTERVAL_MS);

  // Re-check whenever evaluator switches back to the tab or unlocks mobile phone
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      checkForSystemUpdates();
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('focus', onVisibilityChange);

  // Re-check if Service Worker signals a new version
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('[AutoUpdater] Service worker controller changed. Refreshing...');
      clearCachesAndReload();
    });

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'NEW_VERSION_AVAILABLE') {
        console.log('[AutoUpdater] SW received NEW_VERSION_AVAILABLE. Refreshing...');
        clearCachesAndReload();
      }
    });
  }

  return () => {
    clearInterval(intervalId);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('focus', onVisibilityChange);
  };
}

