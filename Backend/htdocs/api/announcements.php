<?php
/**
 * ClimaYield-X - Announcements Endpoint
 * GET: Farmer read-only (Returns active system, research, and cooperative announcements)
 * POST / PUT: Dev only (Authenticated, Publishes new announcements)
 */
require_once __DIR__ . '/../bootstrap.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Farmer read-only
    try {
        $stmt = $pdo->query("SELECT * FROM announcements WHERE is_active = 1 ORDER BY priority DESC, updated_at DESC LIMIT 20");
        $announcements = $stmt->fetchAll();

        sendResponse([
            'success'       => true,
            'count'         => count($announcements),
            'announcements' => $announcements
        ]);
    } catch (Exception $e) {
        sendError('Failed to fetch announcements: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'POST') {
    // Dev only: Publish a new announcement
    requireDevAuth();

    $input = jsonInput();
    $title    = trim($input['title'] ?? '');
    $message  = trim($input['message'] ?? '');
    $priority = in_array($input['priority'] ?? '', ['normal', 'high', 'urgent']) ? $input['priority'] : 'normal';
    $author   = trim($input['author'] ?? 'ClimaYield Dev Team');

    if (empty($title) || empty($message)) {
        sendError('Announcement title and message are required.');
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO announcements (title, message, priority, author, is_active, updated_at)
            VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
        ");
        $stmt->execute([$title, $message, $priority, $author]);
        $annId = $pdo->lastInsertId();

        sendResponse([
            'success'        => true,
            'message'        => "Announcement published to Farmer dashboards!",
            'announcementId' => $annId,
            'updated_at'     => gmdate('Y-m-d\TH:i:s\Z')
        ], 201);
    } catch (Exception $e) {
        sendError('Failed to publish announcement: ' . $e->getMessage(), 500);
    }
} elseif ($method === 'PUT') {
    // Dev only: Update/deactivate announcement
    requireDevAuth();

    $input = jsonInput();
    $id       = (int)($input['id'] ?? ($_GET['id'] ?? 0));
    $isActive = isset($input['isActive']) ? (int)$input['isActive'] : (isset($input['is_active']) ? (int)$input['is_active'] : null);
    $title    = $input['title'] ?? null;
    $message  = $input['message'] ?? null;
    $priority = $input['priority'] ?? null;

    if ($id <= 0) {
        sendError('Valid announcement ID is required.');
    }

    try {
        $updates = [];
        $params = [];

        if ($isActive !== null) {
            $updates[] = "is_active = ?";
            $params[] = $isActive;
        }
        if ($title) {
            $updates[] = "title = ?";
            $params[] = trim($title);
        }
        if ($message) {
            $updates[] = "message = ?";
            $params[] = trim($message);
        }
        if ($priority && in_array($priority, ['normal', 'high', 'urgent'])) {
            $updates[] = "priority = ?";
            $params[] = $priority;
        }

        if (empty($updates)) {
            sendError('No fields to update.');
        }

        $updates[] = "updated_at = CURRENT_TIMESTAMP";
        $params[] = $id;

        $sql = "UPDATE announcements SET " . implode(", ", $updates) . " WHERE id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        sendResponse([
            'success'    => true,
            'message'    => "Announcement #{$id} updated successfully.",
            'updated_at' => gmdate('Y-m-d\TH:i:s\Z')
        ]);
    } catch (Exception $e) {
        sendError('Failed to update announcement: ' . $e->getMessage(), 500);
    }
} else {
    sendError('Method not allowed', 405);
}
