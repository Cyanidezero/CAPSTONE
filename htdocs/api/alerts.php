<?php
/**
 * ClimaYield-X - Alerts Endpoint
 * GET: Farmer read-only (Returns active climate, harvest, and agricultural alerts)
 * POST / PUT: Dev only (Authenticated, Publishes new alert or resolves existing)
 */
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Farmer read-only
    try {
        $status = $_GET['status'] ?? 'active';
        $category = $_GET['category'] ?? null;
        $limit = min(50, max(1, (int)($_GET['limit'] ?? 20)));

        $sql = "SELECT * FROM alerts";
        $params = [];
        $clauses = [];

        if ($status !== 'all') {
            $clauses[] = "status = ?";
            $params[] = $status;
        }
        if ($category) {
            $clauses[] = "category = ?";
            $params[] = $category;
        }

        if (!empty($clauses)) {
            $sql .= " WHERE " . implode(" AND ", $clauses);
        }

        $sql .= " ORDER BY updated_at DESC LIMIT {$limit}";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $alerts = $stmt->fetchAll();

        sendResponse([
            'success' => true,
            'count'   => count($alerts),
            'alerts'  => $alerts
        ]);
    } catch (Exception $e) {
        sendError('Failed to fetch alerts: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    // Dev only: Publish a new alert
    requireDevAuth();

    $input = jsonInput();
    $title      = trim($input['title'] ?? '');
    $message    = trim($input['message'] ?? '');
    $severity   = in_array($input['severity'] ?? '', ['info', 'warning', 'critical']) ? $input['severity'] : 'info';
    $category   = trim($input['category'] ?? 'climate');
    $targetCrop = trim($input['targetCrop'] ?? $input['target_crop'] ?? 'All');
    $status     = in_array($input['status'] ?? '', ['active', 'resolved', 'archived']) ? $input['status'] : 'active';
    $createdBy  = trim($input['createdBy'] ?? $input['created_by'] ?? 'AgriTech Dev Team');

    if (empty($title) || empty($message)) {
        sendError('Alert title and message are required.');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO alerts (title, message, severity, category, target_crop, status, created_by, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$title, $message, $severity, $category, $targetCrop, $status, $createdBy]);
        $alertId = $pdo->lastInsertId();

        sendResponse([
            'success'    => true,
            'message'    => "Alert '{$title}' successfully published to Farmer dashboards!",
            'alertId'    => $alertId,
            'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
        ], 201);
    } catch (Exception $e) {
        sendError('Failed to publish alert: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'PUT') {
    // Dev only: Update/resolve an alert
    requireDevAuth();

    $input = jsonInput();
    $id     = (int)($input['id'] ?? ($_GET['id'] ?? 0));
    $status = $input['status'] ?? null;
    $title  = $input['title'] ?? null;
    $message= $input['message'] ?? null;

    if ($id <= 0) {
        sendError('Valid alert ID is required.');
    }

    try {
        $updates = [];
        $params = [];

        if ($status && in_array($status, ['active', 'resolved', 'archived'])) {
            $updates[] = "status = ?";
            $params[] = $status;
        }
        if ($title) {
            $updates[] = "title = ?";
            $params[] = trim($title);
        }
        if ($message) {
            $updates[] = "message = ?";
            $params[] = trim($message);
        }

        if (empty($updates)) {
            sendError('No fields to update.');
        }

        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;

        $sql = "UPDATE alerts SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse([
            'success'    => true,
            'message'    => "Alert #{$id} updated successfully.",
            'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
        ]);
    } catch (Exception $e) {
        sendError('Failed to update alert: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
