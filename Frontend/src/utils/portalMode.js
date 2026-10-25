/**
 * ClimaYield-X Portal Mode Utility
 * Determines if the current application instance is running in Dedicated Farmer-Only Mode.
 * Triggers when:
 * 1. process.env.REACT_APP_FARMER_ONLY === 'true' (environment flag)
 * 2. window.location.port === '3002' (dedicated farmer localhost port)
 * 3. URL contains ?portal=farmer or ?mode=farmer
 */
export const isFarmerOnlyMode = () => {
  if (process.env.REACT_APP_FARMER_ONLY === 'true') {
    return true;
  }
  if (typeof window !== 'undefined') {
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
