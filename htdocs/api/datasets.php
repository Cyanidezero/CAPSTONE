<?php
/**
 * ClimaYield-X - Datasets Repository API (PHP / MySQL)
 * Handles:
 *   GET  /api/datasets
 *   POST /api/datasets/preset/crops
 *   POST /api/datasets/preset/weather
 *   POST /api/datasets/clear
 */
require_once __DIR__ . '/../bootstrap.php';
require_once __DIR__ . '/crops_helper.php';

ensureClimaYieldTables($pdo);

$method = $_SERVER['REQUEST_METHOD'];
$action = strtolower(trim($_GET['action'] ?? ''));

if ($method === 'GET') {
    try {
        $wRows = $pdo->query("SELECT date_recorded AS Date, rainfall AS Rainfall, max_temp AS Max_Temp, min_temp AS Min_Temp, humidity AS Humidity, wind_speed AS Wind_Speed FROM weather_data ORDER BY id ASC")->fetchAll();
        $cRows = $pdo->query("SELECT date_recorded AS Date, crop_name AS Crop, crop_yield AS Crop_Yield FROM crop_yield_data ORDER BY id ASC")->fetchAll();
        $aRows = $pdo->query("SELECT date_recorded AS Date, crop_name AS Crop, rainfall AS Rainfall, max_temp AS Max_Temp, min_temp AS Min_Temp, humidity AS Humidity, crop_yield AS Crop_Yield FROM agricultural_data ORDER BY id ASC")->fetchAll();

        $wCount = count($wRows);
        $cCount = count($cRows);
        $aCount = count($aRows);

        $detectedCrops = getDetectedCropsFromDatabase($pdo);

        sendResponse([
            'success' => true,
            'weather' => [
                'loaded'    => $wCount > 0,
                'count'     => $wCount,
                'columns'   => $wCount > 0 ? array_keys($wRows[0]) : [],
                'preview'   => array_slice($wRows, 0, 10),
                'dateRange' => $wCount > 0 ? [
                    'start' => $wRows[0]['Date'],
                    'end'   => $wRows[$wCount - 1]['Date']
                ] : null
            ],
            'crops' => [
                'loaded'        => $cCount > 0,
                'count'         => $cCount,
                'columns'       => $cCount > 0 ? array_keys($cRows[0]) : [],
                'preview'       => array_slice($cRows, 0, 10),
                'detectedCrops' => $detectedCrops,
                'dateRange'     => $cCount > 0 ? [
                    'start' => $cRows[0]['Date'],
                    'end'   => $cRows[$cCount - 1]['Date']
                ] : null
            ],
            'combined' => [
                'loaded'           => $aCount > 0,
                'count'            => $aCount,
                'columns'          => $aCount > 0 ? array_keys($aRows[0]) : [],
                'preview'          => array_slice($aRows, 0, 10),
                'readyForTraining' => ($wCount > 0 || $cCount > 0 || $aCount > 0)
            ]
        ]);
    } catch (Exception $e) {
        sendError('Failed to fetch datasets status: ' . $e->getMessage(), 500);
    }
}

if ($method === 'POST') {
    $input = jsonInput();

    // 1. Preset: Input Crop Yield Dataset
    if ($action === 'preset_crops' || strpos($_SERVER['REQUEST_URI'] ?? '', 'preset/crops') !== false) {
        try {
            $presetRows = [
                ['Date' => '2024-01-01', 'Crop' => 'Alugbati', 'Crop_Yield' => 12.11],
                ['Date' => '2024-01-02', 'Crop' => 'Ampalaya fruit [Bitter gourd]', 'Crop_Yield' => 8.83],
                ['Date' => '2024-01-03', 'Crop' => 'Asparagus', 'Crop_Yield' => 8.53],
                ['Date' => '2024-01-04', 'Crop' => 'Basil', 'Crop_Yield' => 1.47],
                ['Date' => '2024-01-05', 'Crop' => 'Beets', 'Crop_Yield' => 4.81],
                ['Date' => '2024-01-06', 'Crop' => 'Broccoli', 'Crop_Yield' => 14.03],
                ['Date' => '2024-01-07', 'Crop' => 'Cabbage', 'Crop_Yield' => 15.21],
                ['Date' => '2024-01-08', 'Crop' => 'Carrot', 'Crop_Yield' => 13.59],
                ['Date' => '2024-01-09', 'Crop' => 'Cauliflower', 'Crop_Yield' => 10.48],
                ['Date' => '2024-01-10', 'Crop' => 'Celery', 'Crop_Yield' => 9.95],
                ['Date' => '2024-01-11', 'Crop' => 'Chinese cabbage (Wongbok, Pechay Baguio)', 'Crop_Yield' => 15.22],
                ['Date' => '2024-01-12', 'Crop' => 'Chives', 'Crop_Yield' => 3.70],
                ['Date' => '2024-01-13', 'Crop' => 'Coriander', 'Crop_Yield' => 1.15],
                ['Date' => '2024-01-14', 'Crop' => 'Cowpea, green', 'Crop_Yield' => 3.26],
                ['Date' => '2024-01-15', 'Crop' => 'Cucumber', 'Crop_Yield' => 7.62],
                ['Date' => '2024-01-16', 'Crop' => 'Eggplant', 'Crop_Yield' => 11.10],
                ['Date' => '2024-01-17', 'Crop' => 'Gisantes [Garden pea]', 'Crop_Yield' => 7.03],
                ['Date' => '2024-01-18', 'Crop' => 'Habitchuelas [Snap beans]', 'Crop_Yield' => 6.26],
                ['Date' => '2024-01-19', 'Crop' => 'Kangkong [Swamp cabbage]', 'Crop_Yield' => 10.60],
                ['Date' => '2024-01-20', 'Crop' => 'Kinchay', 'Crop_Yield' => 2.07],
                ['Date' => '2024-01-21', 'Crop' => 'Kulitis', 'Crop_Yield' => 4.36],
                ['Date' => '2024-01-22', 'Crop' => 'Lettuce', 'Crop_Yield' => 7.93],
                ['Date' => '2024-01-23', 'Crop' => 'Mustard', 'Crop_Yield' => 2.91],
                ['Date' => '2024-01-24', 'Crop' => "Okra [Lady's finger]", 'Crop_Yield' => 7.45],
                ['Date' => '2024-01-25', 'Crop' => 'Onion leeks', 'Crop_Yield' => 3.38],
                ['Date' => '2024-01-26', 'Crop' => 'Parsley', 'Crop_Yield' => 2.89],
                ['Date' => '2024-01-27', 'Crop' => 'Patola', 'Crop_Yield' => 5.27],
                ['Date' => '2024-01-28', 'Crop' => 'Pechay', 'Crop_Yield' => 9.77],
                ['Date' => '2024-01-29', 'Crop' => 'Pechay, native', 'Crop_Yield' => 5.90],
                ['Date' => '2024-01-30', 'Crop' => 'Pepper', 'Crop_Yield' => 5.97],
                ['Date' => '2024-01-31', 'Crop' => 'Pepper, bell', 'Crop_Yield' => 7.94],
                ['Date' => '2024-02-01', 'Crop' => 'Pepper, finger', 'Crop_Yield' => 3.87],
                ['Date' => '2024-02-02', 'Crop' => 'Radish', 'Crop_Yield' => 6.25],
                ['Date' => '2024-02-03', 'Crop' => 'Saluyot', 'Crop_Yield' => 4.06],
                ['Date' => '2024-02-04', 'Crop' => 'Sigarilyas [Winged beans]', 'Crop_Yield' => 2.48],
                ['Date' => '2024-02-05', 'Crop' => 'Singkamas [Turnip]', 'Crop_Yield' => 7.17],
                ['Date' => '2024-02-06', 'Crop' => 'Sitao [Stringbeans]', 'Crop_Yield' => 7.84],
                ['Date' => '2024-02-07', 'Crop' => 'Spinach', 'Crop_Yield' => 1.99],
                ['Date' => '2024-02-08', 'Crop' => 'Spring onion', 'Crop_Yield' => 5.11],
                ['Date' => '2024-02-09', 'Crop' => 'Squash fruit', 'Crop_Yield' => 13.88],
                ['Date' => '2024-02-10', 'Crop' => 'Sweet peas', 'Crop_Yield' => 5.39],
                ['Date' => '2024-02-11', 'Crop' => 'Talinum', 'Crop_Yield' => 1.32],
                ['Date' => '2024-02-12', 'Crop' => 'Tomato', 'Crop_Yield' => 14.97],
                ['Date' => '2024-02-13', 'Crop' => 'Upo [Bottle gourd]', 'Crop_Yield' => 10.40],
                ['Date' => '2024-02-14', 'Crop' => 'Watercress', 'Crop_Yield' => 4.37],
                ['Date' => '2024-02-15', 'Crop' => 'Young corn', 'Crop_Yield' => 1.30],
                ['Date' => '2024-02-16', 'Crop' => 'Zucchini', 'Crop_Yield' => 8.20]
            ];

            $pdo->exec("TRUNCATE TABLE crop_yield_data");
            $stmt = $pdo->prepare("INSERT INTO crop_yield_data (date_recorded, crop_name, crop_yield, unit, source) VALUES (?, ?, ?, 'tons/ha', 'preset')");
            $pdo->beginTransaction();
            foreach ($presetRows as $r) {
                $stmt->execute([$r['Date'], $r['Crop'], $r['Crop_Yield']]);
            }
            $pdo->commit();

            $combinedCount = syncAgriculturalData($pdo);
            $detected = getDetectedCropsFromDatabase($pdo);
            $wCount = (int)$pdo->query("SELECT COUNT(*) FROM weather_data")->fetchColumn();

            // Reset models to Not Trained so the developer must manually train them
            setStateValue($pdo, 'training_status', [
                'sarima'           => 'Not Trained',
                'lstm'             => 'Not Trained',
                'hybrid'           => 'Not Trained',
                'cropModelTrained' => false
            ]);
            setStateValue($pdo, 'latest_training', null);
            setStateValue($pdo, 'all_forecasts', []);
            try {
                $pdo->exec("TRUNCATE TABLE forecasts");
            } catch (Exception $e) {}

            sendResponse([
                'success'       => true,
                'message'       => "🌾 Input Crop Yield Dataset loaded (" . count($presetRows) . " records, " . count($detected) . " crops detected). Synced to Farmer Side!",
                'count'         => count($presetRows),
                'detectedCrops' => $detected,
                'preview'       => array_slice($presetRows, 0, 10),
                'weatherCount'  => $wCount,
                'cropCount'     => count($presetRows),
                'combinedCount' => $combinedCount
            ]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            sendError('Failed to load crop preset: ' . $e->getMessage(), 500);
        }
    }

    // 2. Preset: Weather Scenario (elnino | lanina | baseline)
    if ($action === 'preset_weather' || strpos($_SERVER['REQUEST_URI'] ?? '', 'preset/weather') !== false) {
        try {
            $scenario = strtolower(trim($input['scenario'] ?? 'baseline'));
            $weatherRecords = [];

            if ($scenario === 'elnino') {
                for ($i = 1; $i <= 20; $i++) {
                    $day = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
                    $weatherRecords[] = [
                        'Date'       => "2024-01-{$day}",
                        'Rainfall'   => ($i % 6 === 0) ? 0.8 : 0.0,
                        'Max_Temp'   => round(35.2 + sin($i) * 1.6, 1),
                        'Min_Temp'   => round(26.5 + cos($i) * 0.9, 1),
                        'Humidity'   => round(41 + ($i % 7) * 1.2, 0),
                        'Wind_Speed' => round(1.8 + ($i % 4) * 0.2, 1)
                    ];
                }
            } elseif ($scenario === 'lanina') {
                for ($i = 1; $i <= 20; $i++) {
                    $day = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
                    $weatherRecords[] = [
                        'Date'       => "2024-01-{$day}",
                        'Rainfall'   => round(58.0 + sin($i * 1.3) * 32.0, 1),
                        'Max_Temp'   => round(27.1 + cos($i) * 0.8, 1),
                        'Min_Temp'   => round(22.9 + sin($i) * 0.5, 1),
                        'Humidity'   => round(93 + ($i % 5), 0),
                        'Wind_Speed' => round(3.0 + ($i % 4) * 0.3, 1)
                    ];
                }
            } else {
                for ($i = 1; $i <= 20; $i++) {
                    $day = str_pad((string)$i, 2, '0', STR_PAD_LEFT);
                    $weatherRecords[] = [
                        'Date'       => "2024-01-{$day}",
                        'Rainfall'   => round(max(0, 8.5 + sin($i) * 7.5), 1),
                        'Max_Temp'   => round(30.2 + cos($i) * 1.8, 1),
                        'Min_Temp'   => round(23.2 + sin($i) * 1.1, 1),
                        'Humidity'   => round(64 + sin($i) * 10, 0),
                        'Wind_Speed' => 1.6
                    ];
                }
            }

            $pdo->exec("TRUNCATE TABLE weather_data");
            $stmt = $pdo->prepare("INSERT INTO weather_data (date_recorded, rainfall, max_temp, min_temp, humidity, wind_speed, source) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $pdo->beginTransaction();
            foreach ($weatherRecords as $w) {
                $stmt->execute([$w['Date'], $w['Rainfall'], $w['Max_Temp'], $w['Min_Temp'], $w['Humidity'], $w['Wind_Speed'], $scenario]);
            }
            $pdo->commit();

            $combinedCount = syncAgriculturalData($pdo);
            $cCount = (int)$pdo->query("SELECT COUNT(*) FROM crop_yield_data")->fetchColumn();

            // Reset models to Not Trained on new weather scenario
            setStateValue($pdo, 'training_status', [
                'sarima'           => 'Not Trained',
                'lstm'             => 'Not Trained',
                'hybrid'           => 'Not Trained',
                'cropModelTrained' => false
            ]);
            setStateValue($pdo, 'latest_training', null);
            setStateValue($pdo, 'all_forecasts', []);
            try {
                $pdo->exec("TRUNCATE TABLE forecasts");
            } catch (Exception $e) {}

            sendResponse([
                'success'       => true,
                'scenario'      => $scenario,
                'message'       => "🌦️ Weather Scenario [" . strtoupper($scenario) . "] loaded (" . count($weatherRecords) . " records). Synced to Farmer Side!",
                'count'         => count($weatherRecords),
                'preview'       => array_slice($weatherRecords, 0, 10),
                'weatherCount'  => count($weatherRecords),
                'cropCount'     => $cCount,
                'combinedCount' => $combinedCount
            ]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            sendError('Failed to load weather preset: ' . $e->getMessage(), 500);
        }
    }

    // 3. Clear Repository (weather | crops | all)
    if ($action === 'clear' || strpos($_SERVER['REQUEST_URI'] ?? '', 'datasets/clear') !== false) {
        $type = strtolower(trim($input['type'] ?? 'all'));
        try {
            if ($type === 'weather') {
                $pdo->exec("TRUNCATE TABLE weather_data");
                $status = getStateValue($pdo, 'training_status', [
                    'sarima' => 'Not Trained', 'lstm' => 'Not Trained', 'hybrid' => 'Not Trained', 'cropModelTrained' => false
                ]);
                $status['sarima'] = 'Not Trained';
                $status['lstm'] = 'Not Trained';
                $status['hybrid'] = 'Not Trained';
                setStateValue($pdo, 'training_status', $status);
                setStateValue($pdo, 'latest_training', null);
                setStateValue($pdo, 'all_forecasts', []);
                syncAgriculturalData($pdo);
                sendResponse(['success' => true, 'message' => 'Weather dataset repository cleared. Crop yields were preserved.']);
            } elseif ($type === 'crops') {
                $pdo->exec("TRUNCATE TABLE crop_yield_data");
                setStateValue($pdo, 'detected_crops', []);
                $status = getStateValue($pdo, 'training_status', [
                    'sarima' => 'Not Trained', 'lstm' => 'Not Trained', 'hybrid' => 'Not Trained', 'cropModelTrained' => false
                ]);
                $status['cropModelTrained'] = false;
                setStateValue($pdo, 'training_status', $status);
                syncAgriculturalData($pdo);
                sendResponse(['success' => true, 'message' => 'Crop yield repository cleared. Weather records were preserved.']);
            } else {
                $pdo->exec("TRUNCATE TABLE weather_data");
                $pdo->exec("TRUNCATE TABLE crop_yield_data");
                $pdo->exec("TRUNCATE TABLE agricultural_data");
                setStateValue($pdo, 'detected_crops', []);
                setStateValue($pdo, 'training_status', [
                    'sarima' => 'Not Trained', 'lstm' => 'Not Trained', 'hybrid' => 'Not Trained', 'cropModelTrained' => false
                ]);
                setStateValue($pdo, 'latest_training', null);
                setStateValue($pdo, 'all_forecasts', []);
                sendResponse(['success' => true, 'message' => 'All dataset repositories and model forecasts cleared.']);
            }
        } catch (Exception $e) {
            sendError('Failed to clear dataset: ' . $e->getMessage(), 500);
        }
    }
}

sendError('Unsupported dataset operation.', 400);

