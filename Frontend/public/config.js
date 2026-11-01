/**
 * ClimaYield-X Runtime API Configuration
 * Auto-redirects HTTPS to HTTP on InfinityFree (since free subdomains do not support SSL/TLS port 443).
 */
(function() {
  if (typeof window === 'undefined') return;
  
  // 1. Force HTTP on InfinityFree free subdomains (Port 443 abruptly closes on free tier)
  if (window.location.protocol === 'https:' && window.location.hostname.indexOf('infinityfree.me') !== -1) {
    window.location.replace(window.location.href.replace('https:', 'http:'));
    return;
  }

  var host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    window.API_BASE_URL = 'http://localhost:5000/api';
  } else {
    window.API_BASE_URL = 'http://climayieldx.infinityfree.me/api';
  }
})();
