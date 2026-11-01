<?php
/**
 * ClimaYield-X - Reset System State & Datasets Endpoint
 */
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/crops_helper.php';

ensureClimaYieldTables($pdo);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

try {
    $pdo->exec("TRUNCATE TABLE weather_data");
    $pdo->exec("TRUNCATE TABLE crop_yield_data");
    $pdo->exec("TRUNCATE TABLE agricultural_data");
    $pdo->exec("TRUNCATE TABLE predictions");

    setStateValue($pdo, 'detected_crops', []);
    setStateValue($pdo, 'training_status', [
        'sarima'           => 'Not Trained',
        'lstm'             => 'Not Trained',
        'hybrid'           => 'Not Trained',
        'cropModelTrained' => false
    ]);
    setStateValue($pdo, 'latest_training', null);
    setStateValue($pdo, 'all_forecasts', []);

    sendResponse([
        'success' => true,
        'message' => 'Backend datasets (weather & crops) and AI models reset successfully.'
    ]);
} catch (Exception $e) {
    sendError('Reset failed: ' . $e->getMessage(), 500);
}
