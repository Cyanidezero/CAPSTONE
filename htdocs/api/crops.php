<?php
/**
 * ClimaYield-X - Crops Endpoint
 * Synchronizes detected crops between Developer and Farmer portals via MySQL.
 */
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/crops_helper.php';

ensureClimaYieldTables($pdo);

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $crops = getDetectedCropsFromDatabase($pdo);
        sendResponse([
            'success' => true,
            'count'   => count($crops),
            'crops'   => $crops
        ]);
    } catch (Exception $e) {
        sendError('Failed to fetch crops: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    $input = jsonInput();
    $crops = $input['crops'] ?? [];
    if (!is_array($crops)) $crops = [];

    $richCrops = detectRichCrops($crops);
    setStateValue($pdo, 'detected_crops', $richCrops);

    // Ensure crop_yield_data has at least placeholder rows if Developer uploaded via client parser
    $cCount = (int)$pdo->query("SELECT COUNT(*) FROM crop_yield_data")->fetchColumn();
    if ($cCount === 0 && !empty($richCrops)) {
        try {
            $stmt = $pdo->prepare("INSERT INTO crop_yield_data (date_recorded, crop_name, crop_yield, unit, source) VALUES (?, ?, ?, 'tons/ha', 'client_sync')");
            $pdo->beginTransaction();
            foreach ($richCrops as $idx => $c) {
                $stmt->execute([date('Y-m-d', strtotime("-{$idx} days")), $c['name'], 8.5]);
            }
            $pdo->commit();
            syncAgriculturalData($pdo);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
        }
    }

    sendResponse([
        'success' => true,
        'count'   => count($richCrops),
        'crops'   => $richCrops
    ]);
} else {
    sendError('Method not allowed', 405);
}
