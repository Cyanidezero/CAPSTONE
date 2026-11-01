import { API_BASE_URL } from '../config';

export const getApiUrl = () => {
  // 1. If running locally on localhost/127.0.0.1, use the local Node.js backend
  if (typeof window !== 'undefined' && window.location && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:5000/api';
  }
  // 2. If running on InfinityFree, use same-origin /api so both HTTP and HTTPS work cleanly
  if (typeof window !== 'undefined' && window.location && window.location.origin && (window.location.origin.includes('infinityfree.me') || window.location.origin.includes('infinityfreeapp.com'))) {
    return `${window.location.origin}/api`;
  }
  // 3. Runtime config set by /config.js in window
  if (typeof window !== 'undefined' && window.API_BASE_URL) {
    return window.API_BASE_URL;
  }
  // 4. Fallback
  return 'https://climayieldx.infinityfree.me/api';
};

export const API_URL = getApiUrl();
export default API_URL;
