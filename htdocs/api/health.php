<?php
require_once __DIR__ . '/../bootstrap.php';

try {
    $stmt = $pdo->query("SELECT 1");
    $dbOk = (bool)$stmt->fetch();
} catch (Exception $e) {
    $dbOk = false;
}

sendResponse([
    'status'    => 'OK',
    'message'   => 'ClimaYield-X PHP Backend Running',
    'database'  => $dbOk ? 'Connected' : 'Offline',
    'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
]);
