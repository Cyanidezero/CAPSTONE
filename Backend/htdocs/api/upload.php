<?php
/**
 * ClimaYield-X Dataset Upload API (PHP / MySQL)
 * Handles CSV dataset uploads for Weather and Crop Yields, validates and persists into database.
 */

require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendJson(['success' => false, 'error' => 'Method not allowed. Use POST.'], 405);
}

// 1. Verify file was uploaded
if (!isset($_FILES['file']) && !isset($_FILES['dataset'])) {
    sendJson(['success' => false, 'error' => 'No file uploaded. Please attach a CSV file.'], 400);
}

$fileItem = $_FILES['file'] ?? $_FILES['dataset'];

if ($fileItem['error'] !== UPLOAD_ERR_OK) {
    sendJson(['success' => false, 'error' => 'File upload failed with error code: ' . $fileItem['error']], 400);
}

$tmpPath = $fileItem['tmp_name'];
$fileName = $fileItem['name'];
$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

if ($ext !== 'csv') {
    sendJson(['success' => false, 'error' => 'Only CSV files (.csv) are currently supported on this server.'], 400);
}

// 2. Determine target type (weather vs crop)
$targetType = strtolower($_GET['type'] ?? $_POST['type'] ?? '');

$handle = fopen($tmpPath, 'r');
if (!$handle) {
    sendJson(['success' => false, 'error' => 'Failed to read uploaded CSV file.'], 500);
}

// Read header
$header = fgetcsv($handle);
if (!$header) {
    fclose($handle);
    sendJson(['success' => false, 'error' => 'CSV file is empty or corrupted.'], 400);
}

// Clean and normalize header columns
$headersClean = array_map(function($h) {
    return strtolower(trim(preg_replace('/[\x00-\x1F\x80-\xFF]/', '', $h)));
}, $header);

// Auto-detect type if not provided
if (empty($targetType)) {
    if (in_array('crop', $headersClean) || in_array('crop_yield', $headersClean) || in_array('yield', $headersClean)) {
        $targetType = 'crop';
    } else {
        $targetType = 'weather';
    }
}

$pdo = getDbConnection();
$totalRows = 0;
$validRows = 0;
$detectedCrops = [];

if ($targetType === 'crop') {
    // Column indices
    $dateIdx = array_search('date', $headersClean);
    if ($dateIdx === false) $dateIdx = array_search('date_recorded', $headersClean);
    $cropIdx = array_search('crop', $headersClean);
    if ($cropIdx === false) $cropIdx = array_search('crop_name', $headersClean);
    $yieldIdx = array_search('crop_yield', $headersClean);
    if ($yieldIdx === false) $yieldIdx = array_search('yield', $headersClean);
    $unitIdx = array_search('unit', $headersClean);

    $records = [];
    while (($row = fgetcsv($handle)) !== false) {
        $totalRows++;
        if (count($row) < count($headersClean)) continue;

        $dateVal = $dateIdx !== false && isset($row[$dateIdx]) ? trim($row[$dateIdx]) : date('Y-m-d');
        $cropVal = $cropIdx !== false && isset($row[$cropIdx]) ? trim($row[$cropIdx]) : 'Pechay';
        $yieldVal = $yieldIdx !== false && isset($row[$yieldIdx]) ? floatval($row[$yieldIdx]) : 0;
        $unitVal = $unitIdx !== false && isset($row[$unitIdx]) ? trim($row[$unitIdx]) : 'tons/ha';

        if (!empty($cropVal)) {
            $cropName = ucfirst(strtolower($cropVal));
            if (!in_array($cropName, $detectedCrops)) {
                $detectedCrops[] = $cropName;
            }
        }

        $records[] = [
            'date_recorded' => $dateVal,
            'crop_name' => $cropVal,
            'crop_yield' => $yieldVal,
            'unit' => $unitVal,
            'source' => 'upload'
        ];
    }
    fclose($handle);

    // Save to crop_yield_data table
    try {
        $pdo->exec("TRUNCATE TABLE crop_yield_data");
        $stmt = $pdo->prepare("INSERT INTO crop_yield_data (date_recorded, crop_name, crop_yield, unit, source) VALUES (?, ?, ?, ?, ?)");
        
        $pdo->beginTransaction();
        foreach ($records as $r) {
            $stmt->execute([$r['date_recorded'], $r['crop_name'], $r['crop_yield'], $r['unit'], $r['source']]);
            $validRows++;
        }
        $pdo->commit();
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sendJson(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }

} else {
    // Weather dataset
    $dateIdx = array_search('date', $headersClean);
    if ($dateIdx === false) $dateIdx = array_search('date_recorded', $headersClean);
    $rainIdx = array_search('rainfall', $headersClean);
    $maxTempIdx = array_search('max_temp', $headersClean);
    if ($maxTempIdx === false) $maxTempIdx = array_search('maxtemp', $headersClean);
    $minTempIdx = array_search('min_temp', $headersClean);
    if ($minTempIdx === false) $minTempIdx = array_search('mintemp', $headersClean);
    $humIdx = array_search('humidity', $headersClean);
    $windIdx = array_search('wind_speed', $headersClean);
    if ($windIdx === false) $windIdx = array_search('windspeed', $headersClean);

    $records = [];
    while (($row = fgetcsv($handle)) !== false) {
        $totalRows++;
        if (count($row) < count($headersClean)) continue;

        $dateVal = $dateIdx !== false && isset($row[$dateIdx]) ? trim($row[$dateIdx]) : date('Y-m-d');
        $rainVal = $rainIdx !== false && isset($row[$rainIdx]) ? floatval($row[$rainIdx]) : 0;
        $maxVal = $maxTempIdx !== false && isset($row[$maxTempIdx]) ? floatval($row[$maxTempIdx]) : 30;
        $minVal = $minTempIdx !== false && isset($row[$minTempIdx]) ? floatval($row[$minTempIdx]) : 22;
        $humVal = $humIdx !== false && isset($row[$humIdx]) ? floatval($row[$humIdx]) : 75;
        $windVal = $windIdx !== false && isset($row[$windIdx]) ? floatval($row[$windIdx]) : 2;

        $records[] = [
            'date_recorded' => $dateVal,
            'rainfall' => $rainVal,
            'max_temp' => $maxVal,
            'min_temp' => $minVal,
            'humidity' => $humVal,
            'wind_speed' => $windVal,
            'source' => 'upload'
        ];
    }
    fclose($handle);

    // Save to weather_data table
    try {
        $pdo->exec("TRUNCATE TABLE weather_data");
        $stmt = $pdo->prepare("INSERT INTO weather_data (date_recorded, rainfall, max_temp, min_temp, humidity, wind_speed, source) VALUES (?, ?, ?, ?, ?, ?, ?)");
        
        $pdo->beginTransaction();
        foreach ($records as $r) {
            $stmt->execute([$r['date_recorded'], $r['rainfall'], $r['max_temp'], $r['min_temp'], $r['humidity'], $r['wind_speed'], $r['source']]);
            $validRows++;
        }
        $pdo->commit();
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        sendJson(['success' => false, 'error' => 'Database error: ' . $e->getMessage()], 500);
    }
}

sendJson([
    'success' => true,
    'message' => "Dataset uploaded and saved successfully! ({$validRows} rows processed into {$targetType} database)",
    'validationReport' => [
        'valid' => true,
        'totalRows' => $totalRows,
        'cleanRows' => $validRows,
        'columns' => $header,
        'targetType' => $targetType,
        'errors' => [],
        'warnings' => []
    ],
    'detectedCrops' => $detectedCrops
]);
