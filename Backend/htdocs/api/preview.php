<?php
require_once __DIR__ . '/../bootstrap.php';

try {
    $stmt = $pdo->query("SELECT date_recorded, crop_name, rainfall, max_temp, min_temp, humidity, crop_yield FROM agricultural_data LIMIT 15");
    $rows = $stmt->fetchAll();

    $count = (int)$pdo->query("SELECT COUNT(*) FROM agricultural_data")->fetchColumn();

    if (empty($rows)) {
        sendResponse(null);
    }

    sendResponse([
        'preview' => $rows,
        'columns' => ['Date', 'Crop_Name', 'Rainfall', 'Max_Temp', 'Min_Temp', 'Humidity', 'Crop_Yield'],
        'shape'   => [
            'rows'    => $count,
            'columns' => 7
        ]
    ]);
} catch (Exception $e) {
    sendError('Failed to fetch dataset preview: ' . $e->getMessage(), 500);
}
