<?php
/**
 * ClimaYield-X - Forecasts Endpoint
 * GET: Public/Farmer read-only (Returns latest AI forecasts)
 * POST / PUT: Dev only (Authenticated, Publishes new forecast updates)
 */
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Farmer read-only: Fetch forecasts
    try {
        $crop = $_GET['crop'] ?? null;
        $target = $_GET['target'] ?? null;
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 10)));

        $sql = "SELECT * FROM forecasts";
        $params = [];
        $clauses = [];

        if ($crop) {
            $clauses[] = "LOWER(crop_name) = ?";
            $params[] = strtolower($crop);
        }
        if ($target) {
            $clauses[] = "LOWER(target) = ?";
            $params[] = strtolower($target);
        }

        if (!empty($clauses)) {
            $sql .= " WHERE " . implode(" AND ", $clauses);
        }

        $sql .= " ORDER BY updated_at DESC LIMIT {$limit}";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        // Parse JSON forecast_data string
        foreach ($rows as &$r) {
            $r['forecast_data'] = json_decode($r['forecast_data'] ?? '[]', true) ?: [];
        }

        sendResponse([
            'success'   => true,
            'count'     => count($rows),
            'forecasts' => $rows
        ]);
    } catch (Exception $e) {
        sendError('Failed to fetch forecasts: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'POST' || $method === 'PUT') {
    // Dev only: Publish or update a forecast
    requireDevAuth();

    $input = jsonInput();

    $modelType   = trim($input['modelType'] ?? $input['model_type'] ?? 'hybrid');
    $target      = trim($input['target'] ?? 'Crop_Yield');
    $cropName    = trim($input['cropName'] ?? $input['crop_name'] ?? 'Pechay');
    $steps       = (int)($input['steps'] ?? 30);
    $accuracy    = (float)($input['accuracyRate'] ?? $input['accuracy_rate'] ?? 97.40);
    $mae         = (float)($input['mae'] ?? 0.12);
    $rmse        = (float)($input['rmse'] ?? 0.15);
    $mape        = (float)($input['mape'] ?? 2.60);
    $meanYield   = (float)($input['meanProjectedYield'] ?? $input['mean_projected_yield'] ?? 15.00);
    $ci          = trim($input['confidenceInterval'] ?? $input['confidence_interval'] ?? '14.7 – 15.3');
    $summary     = trim($input['summary'] ?? "Updated by Developer Suite");
    $updatedBy   = trim($input['updatedBy'] ?? $input['updated_by'] ?? 'AgriTech Dev');

    $predictions = $input['predictions'] ?? $input['forecast_data'] ?? [];
    if (!is_array($predictions)) {
        $predictions = [];
    }
    $forecastJson = json_encode($predictions);

    try {
        // Check if a forecast for this crop & target exists
        $chk = $pdo->prepare("SELECT id FROM forecasts WHERE LOWER(crop_name) = ? AND LOWER(target) = ? LIMIT 1");
        $chk->execute([strtolower($cropName), strtolower($target)]);
        $existing = $chk->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("
                UPDATE forecasts SET
                    model_type = ?,
                    steps = ?,
                    accuracy_rate = ?,
                    mae = ?,
                    rmse = ?,
                    mape = ?,
                    mean_projected_yield = ?,
                    confidence_interval = ?,
                    forecast_data = ?,
                    summary = ?,
                    updated_by = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            ");
            $stmt->execute([
                $modelType, $steps, $accuracy, $mae, $rmse, $mape,
                $meanYield, $ci, $forecastJson, $summary, $updatedBy, $existing['id']
            ]);
            $forecastId = $existing['id'];
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO forecasts 
                    (model_type, target, crop_name, steps, accuracy_rate, mae, rmse, mape, mean_projected_yield, confidence_interval, forecast_data, summary, updated_by, updated_at)
                VALUES 
                    (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ");
            $stmt->execute([
                $modelType, $target, $cropName, $steps, $accuracy, $mae, $rmse, $mape,
                $meanYield, $ci, $forecastJson, $summary, $updatedBy
            ]);
            $forecastId = $pdo->lastInsertId();
        }

        sendResponse([
            'success'    => true,
            'message'    => "Forecast for {$cropName} ({$target}) successfully published to FarmerSide!",
            'forecastId' => $forecastId,
            'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
        ]);
    } catch (Exception $e) {
        sendError('Failed to save forecast: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
