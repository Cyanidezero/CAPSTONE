/**
 * ClimaYield-X Frontend Global Configuration
 * Phase 1 Placeholder API URL: https://YOUR-API.infinityfreeapp.com/api
 * In Phase 2, this can be swapped with your real live backend URL.
 */

export const API_BASE_URL =
  (typeof window !== 'undefined' && window.API_BASE_URL)
    ? window.API_BASE_URL
    : (process.env.REACT_APP_API_URL || 'https://YOUR-API.infinityfreeapp.com/api');

if (typeof window !== 'undefined' && !window.API_BASE_URL) {
  window.API_BASE_URL = API_BASE_URL;
}

export default API_BASE_URL;
