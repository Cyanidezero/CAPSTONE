<?php
/**
 * ClimaYield-X - Root API Landing / Health Ping
 */
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
