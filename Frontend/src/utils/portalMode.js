/**
 * ClimaYield-X Portal Mode Utility
 * Determines if the current application instance is running in Dedicated Farmer-Only or Dev-Only Mode.
 */

export const isFarmerOnlyMode = () => {
  if (process.env.REACT_APP_FARMER_ONLY === 'true') {
    return true;
  }
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/farmer/') || pathname.endsWith('/farmer') || pathname.includes('/farmer')) {
      return true;
    }
    // Port 3002 or fallback farmer ports
    if (['3002', '3003', '3004'].includes(window.location.port)) {
      return true;
    }
    // Subdomain or hostname hint (e.g., climayield-farmer...)
    if (window.location.hostname && window.location.hostname.toLowerCase().includes('farmer')) {
      return true;
    }
    // URL query flags: ?portal=farmer, ?mode=farmer, ?role=farmer
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('portal') === 'farmer' ||
      params.get('mode') === 'farmer' ||
      params.get('role') === 'farmer'
    ) {
      return true;
    }
  }
  return false;
};

export const isDevOnlyMode = () => {
  if (process.env.REACT_APP_DEV_ONLY === 'true') {
    return true;
  }
  if (typeof window !== 'undefined') {
    const pathname = window.location.pathname.toLowerCase();
    if (pathname.includes('/dev/') || pathname.endsWith('/dev') || pathname.includes('/dev')) {
      return true;
    }
    // Port 3001 or fallback dev ports
    if (['3001', '3005'].includes(window.location.port)) {
      return true;
    }
    // Subdomain or hostname hint (e.g., climayield-dev...)
    if (window.location.hostname && window.location.hostname.toLowerCase().includes('dev')) {
      return true;
    }
    // URL query flags: ?portal=dev, ?mode=dev, ?role=dev
    const params = new URLSearchParams(window.location.search);
    if (
      params.get('portal') === 'dev' ||
      params.get('mode') === 'dev' ||
      params.get('role') === 'dev'
    ) {
      return true;
    }
  }
  return false;
};
