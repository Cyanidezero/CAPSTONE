<?php
/**
 * ClimaYield-X - API Front Controller / Router
 */
require_once __DIR__ . '/../bootstrap.php';

$route = $_GET['route'] ?? '';
$route = trim($route, '/');

switch ($route) {
    case 'health':
        require __DIR__ . '/health.php';
        break;
    case 'status':
        require __DIR__ . '/status.php';
        break;
    case 'datasets':
        require __DIR__ . '/datasets.php';
        break;
    case 'datasets/preset/crops':
        $_GET['action'] = 'preset_crops';
        require __DIR__ . '/datasets.php';
        break;
    case 'datasets/preset/weather':
        $_GET['action'] = 'preset_weather';
        require __DIR__ . '/datasets.php';
        break;
    case 'datasets/clear':
        $_GET['action'] = 'clear';
        require __DIR__ . '/datasets.php';
        break;
    case 'upload':
        require __DIR__ . '/upload.php';
        break;
    case 'train/sarima':
        $_GET['model'] = 'sarima';
        require __DIR__ . '/train.php';
        break;
    case 'train/lstm':
        $_GET['model'] = 'lstm';
        require __DIR__ . '/train.php';
        break;
    case 'train/hybrid':
        $_GET['model'] = 'hybrid';
        require __DIR__ . '/train.php';
        break;
    case 'training/latest':
        $_GET['model'] = 'latest';
        require __DIR__ . '/train.php';
        break;
    case 'training/sync':
        $_GET['model'] = 'sync';
        require __DIR__ . '/train.php';
        break;
    case 'forecasts':
        require __DIR__ . '/forecasts.php';
        break;
    case 'alerts':
        require __DIR__ . '/alerts.php';
        break;
    case 'announcements':
        require __DIR__ . '/announcements.php';
        break;
    case 'crops':
        require __DIR__ . '/crops.php';
        break;
    case 'preview':
        require __DIR__ . '/preview.php';
        break;
    case 'predict':
        require __DIR__ . '/predict.php';
        break;
    case 'reset':
        require __DIR__ . '/reset.php';
        break;
    case 'weather':
        require __DIR__ . '/weather.php';
        break;
    case 'auth/login':
        require __DIR__ . '/auth/login.php';
        break;
    case 'auth/signup':
        require __DIR__ . '/auth/signup.php';
        break;
    case 'auth/demo-accounts':
        require __DIR__ . '/auth/demo-accounts.php';
        break;
    case 'auth/logout':
        require __DIR__ . '/auth/logout.php';
        break;
    default:
        sendResponse([
            'name'      => 'ClimaYield-X API',
            'status'    => 'ready',
            'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
        ]);
        break;
}
