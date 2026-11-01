<?php
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query("SELECT DISTINCT crop_name FROM crop_yield_data WHERE crop_name IS NOT NULL AND crop_name != '' ORDER BY crop_name ASC");
        $crops = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (empty($crops)) {
            $crops = ['Pechay', 'Mustasa', 'Kangkong', 'Lettuce', 'Labanos', 'Sitaw', 'Okra', 'Talong', 'Kamatis'];
        }
        sendResponse([
            'success' => true,
            'count'   => count($crops),
            'crops'   => $crops
        ]);
    } catch (Exception $e) {
        sendError('Failed to fetch crops: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    requireDevAuth();
    $input = jsonInput();
    $crops = $input['crops'] ?? [];
    sendResponse([
        'success' => true,
        'count'   => count($crops),
        'crops'   => $crops,
        'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
    ]);
} else {
    sendError('Method not allowed', 405);
}
