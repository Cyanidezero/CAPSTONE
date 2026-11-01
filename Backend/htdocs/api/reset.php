<?php
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

requireDevAuth();

try {
    // Dev only: Clean predictions table
    $pdo->query("DELETE FROM predictions WHERE id > 0");

    sendResponse([
        'success'    => true,
        'message'    => 'Backend prediction cache reset successfully.',
        'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
    ]);
} catch (Exception $e) {
    sendError('Reset failed: ' . $e->getMessage(), 500);
}
