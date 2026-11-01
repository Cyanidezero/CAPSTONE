/**
 * ClimaYield-X Runtime API Configuration (Farmer Portal)
 */
(function() {
  var isInfinityFree = typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.indexOf('infinityfree.me') !== -1;
  window.API_BASE_URL = isInfinityFree
    ? (window.location.origin + '/api')
    : 'https://climayieldx.infinityfree.me/api';
})();
