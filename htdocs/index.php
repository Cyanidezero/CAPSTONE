<?php
/**
 * ClimaYield-X - Public Webhost Landing Hub & API Root
 */
$accept = $_SERVER['HTTP_ACCEPT'] ?? '';
$wantsJson = isset($_GET['json']) || (strpos($accept, 'application/json') !== false && strpos($accept, 'text/html') === false);

if ($wantsJson) {
    require_once __DIR__ . '/bootstrap.php';
    sendResponse([
        'name'      => 'ClimaYield-X Backend API',
        'status'    => 'running',
        'platform'  => 'InfinityFree PHP + MySQL',
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z'),
        'endpoints' => [
            'health'        => '/api/health',
            'status'        => '/api/status',
            'forecasts'     => '/api/forecasts',
            'alerts'        => '/api/alerts',
            'announcements' => '/api/announcements',
            'crops'         => '/api/crops',
            'preview'       => '/api/preview',
            'predict'       => '/api/predict',
            'auth_login'    => '/api/auth/login',
            'auth_signup'   => '/api/auth/signup',
            'demo_accounts' => '/api/auth/demo-accounts'
        ]
    ]);
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <script>if(window.location.protocol==='http:'&&window.location.hostname.indexOf('infinityfree.me')!==-1){window.location.replace('https://'+window.location.host+window.location.pathname+window.location.search+window.location.hash);}</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ClimaYield-X | Smart Agricultural Forecasting System</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: radial-gradient(circle at top, #1e293b 0%, #0f172a 100%);
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .hub-container {
      max-width: 820px;
      width: 100%;
      background: rgba(30, 41, 59, 0.85);
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 42px 36px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
      border: 1px solid rgba(34, 197, 94, 0.4);
      padding: 6px 14px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 36px;
      color: #f8fafc;
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    p.subtitle {
      color: #94a3b8;
      font-size: 15px;
      max-width: 600px;
      margin: 0 auto 32px;
      line-height: 1.6;
    }
    .portals-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 28px;
    }
    .portal-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 28px 24px;
      text-decoration: none;
      color: inherit;
      transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .portal-card:hover {
      transform: translateY(-4px);
      border-color: #38bdf8;
      box-shadow: 0 12px 24px rgba(2, 132, 199, 0.2);
    }
    .portal-card.farmer:hover {
      border-color: #22c55e;
      box-shadow: 0 12px 24px rgba(34, 197, 94, 0.2);
    }
    .portal-icon {
      font-size: 42px;
      margin-bottom: 14px;
    }
    .portal-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      color: #f8fafc;
    }
    .portal-desc {
      font-size: 13.5px;
      color: #94a3b8;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .portal-btn {
      margin-top: auto;
      display: inline-block;
      width: 100%;
      padding: 11px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
    }
    .farmer .portal-btn {
      background: #16a34a;
      color: #ffffff;
    }
    .dev .portal-btn {
      background: #0284c7;
      color: #ffffff;
    }
    .quick-links {
      display: flex;
      justify-content: center;
      gap: 16px;
      flex-wrap: wrap;
      border-top: 1px solid #334155;
      padding-top: 22px;
      font-size: 13.5px;
    }
    .quick-links a {
      color: #38bdf8;
      text-decoration: none;
      padding: 6px 12px;
      border-radius: 6px;
      background: rgba(56, 189, 248, 0.1);
      transition: background 0.15s;
    }
    .quick-links a:hover {
      background: rgba(56, 189, 248, 0.2);
    }
  </style>
</head>
<body>
  <div class="hub-container">
    <span class="badge">● Public Webhost Online</span>
    <h1>🌾 ClimaYield-X</h1>
    <p class="subtitle">
      A Data-Driven SARIMA–LSTM Hybrid Model for Predicting Yield Instability in Short-Cycle Vegetables
    </p>

    <div class="portals-grid">
      <a href="/farmer/login.html" class="portal-card farmer">
        <div class="portal-icon">🌾</div>
        <div class="portal-title">Farmer Portal</div>
        <div class="portal-desc">
          Field operations dashboard, local weather monitoring, rainfall alerts, irrigation timing, and crop yield projections.
        </div>
        <span class="portal-btn">Launch Farmer Portal →</span>
      </a>

      <a href="/dev/login.html" class="portal-card dev">
        <div class="portal-icon">💻</div>
        <div class="portal-title">Developer &amp; Research Portal</div>
        <div class="portal-desc">
          SARIMA–LSTM hyperparameter tuning, dataset upload, residual learning analysis, and model retraining controls.
        </div>
        <span class="portal-btn">Launch Dev Portal →</span>
      </a>
    </div>

    <div class="quick-links">
      <a href="/register.html">📝 Register New Account</a>
      <a href="/seed.php">🗄️ Live Database Status &amp; Seeder</a>
      <a href="/api/health">⚡ API Health Check</a>
    </div>
  </div>
</body>
</html>
