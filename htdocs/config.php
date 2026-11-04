<?php
/**
 * ClimaYield-X - InfinityFree MySQL & Application Configuration
 * -------------------------------------------------------------
 * IMPORTANT: Replace the placeholders below with the credentials
 * from your InfinityFree vPanel / Client Area under:
 * "MySQL Details" (Databases -> MySQL Databases).
 *
 * DO NOT commit your real database password to public Git repositories!
 */

// Optional: Load local credentials override if config.local.php exists
if (file_exists(__DIR__ . '/config.local.php')) {
    include_once __DIR__ . '/config.local.php';
}

// 1. InfinityFree Database Settings
if (!defined('DB_HOST')) define('DB_HOST', getenv('DB_HOST') ?: 'sql100.infinityfree.com');
if (!defined('DB_NAME')) define('DB_NAME', getenv('DB_NAME') ?: 'if0_43286056_climayield');
if (!defined('DB_USER')) define('DB_USER', getenv('DB_USER') ?: 'if0_43286056');
if (!defined('DB_PASS')) define('DB_PASS', getenv('DB_PASS') ?: 'vWSxrmUFLhwHcO');
if (!defined('DB_PORT')) define('DB_PORT', getenv('DB_PORT') ?: '3306');

// 2. Strict CORS Whitelist: Netlify Frontend URLs
// Only these frontend origins are allowed to make requests.
$ALLOWED_ORIGINS = [
    'https://climayield-farmer.netlify.app',
    'https://climayield-developer.netlify.app',
    'https://climayield-dev.netlify.app',
    // Local development fallbacks:
    'https://localhost:3000',
    'https://localhost:3001',
    'http://localhost:3000',
    'http://localhost:3001'
];

// 3. Real Mobile SMS Gateway Settings (For physical text messages to mobile phones)
// Supports Pocket Alert, Semaphore (Philippine standard: https://semaphore.co), iTexMo, and PhilSMS.
if (!defined('POCKETALERT_API_TOKEN')) define('POCKETALERT_API_TOKEN', getenv('POCKETALERT_API_TOKEN') ?: '5464b9dc-1c5e-4618-8430-35b121984d73');
if (!defined('SEMAPHORE_API_KEY')) define('SEMAPHORE_API_KEY', getenv('SEMAPHORE_API_KEY') ?: '');
if (!defined('SEMAPHORE_SENDER_NAME')) define('SEMAPHORE_SENDER_NAME', getenv('SEMAPHORE_SENDER_NAME') ?: '');
if (!defined('ITEXMO_API_CODE')) define('ITEXMO_API_CODE', getenv('ITEXMO_API_CODE') ?: '');
if (!defined('ITEXMO_PASSWORD')) define('ITEXMO_PASSWORD', getenv('ITEXMO_PASSWORD') ?: '');
if (!defined('PHILSMS_API_TOKEN')) define('PHILSMS_API_TOKEN', getenv('PHILSMS_API_TOKEN') ?: '');

