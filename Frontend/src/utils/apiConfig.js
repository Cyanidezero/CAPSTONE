export const getApiUrl = () => {
  if (typeof window !== 'undefined' && window.location) {
    // When served over HTTPS, use relative '/api' so requests proxy through webpack without Mixed Content errors
    if (window.location.protocol === 'https:') {
      return '/api';
    }
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:5000/api`;
    }
  }
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  return 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
export default API_URL;
