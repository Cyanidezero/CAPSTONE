<?php
/**
 * ClimaYield-X - SMS / Phone Alert Dispatcher Endpoint
 * Dispatches climate and harvest alert notifications to farmer/user mobile phone numbers.
 */
require_once __DIR__ . '/../../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed', 405);
}

$input = jsonInput();
$phone   = trim((string)($input['phone'] ?? $input['targetPhone'] ?? $input['mobile'] ?? ''));
$title   = trim((string)($input['title'] ?? 'ClimaYield-X Harvest & Climate Alert'));
$message = trim((string)($input['message'] ?? $input['body'] ?? ''));
$category= trim((string)($input['category'] ?? 'sms_alert'));

if (empty($phone)) {
    sendError('Mobile phone number is required to send SMS alerts.');
}

$cleanPhone = preg_replace('/[\s\-\(\)]/', '', $phone);
if (!preg_match('/^(09|\+639|639)\d{9}$/', $cleanPhone) && (strlen($cleanPhone) < 10 || strlen($cleanPhone) > 15)) {
    sendError('Please enter a valid mobile phone number (e.g., 09171234567 or +639171234567).');
}

// Dispatch to Infobip / Telecom SMS Gateway (delivers directly to phone Messages)
$gatewayResult = ['sent' => false, 'provider' => 'none'];
if (file_exists(__DIR__ . '/sms_gateway.php')) {
    require_once __DIR__ . '/sms_gateway.php';
    $gatewayResult = sendPhysicalSms($cleanPhone, $message, $title);
}

try {
    // Auto-create sms_logs table if not exists
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `sms_logs` (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `phone` varchar(30) NOT NULL,
            `title` varchar(255) NOT NULL,
            `message` text NOT NULL,
            `status` varchar(50) NOT NULL DEFAULT 'delivered',
            `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    $statusStr = $gatewayResult['sent'] ? "delivered ({$gatewayResult['provider']})" : "logged";
    $stmt = $pdo->prepare("
        INSERT INTO `sms_logs` (`phone`, `title`, `message`, `status`, `created_at`)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ");
    $stmt->execute([$cleanPhone, $title, $message, $statusStr]);
    $logId = $pdo->lastInsertId();

    sendResponse([
        'success'   => true,
        'message'   => "Alert dispatched successfully to {$cleanPhone}",
        'phone'     => $cleanPhone,
        'title'     => $title,
        'provider'  => $gatewayResult['provider'] ?? 'database_log',
        'log_id'    => (int)$logId,
        'timestamp' => gmdate('Y-m-d\TH:i:s\Z')
    ]);
} catch (Exception $e) {
    sendError('Failed to dispatch phone alert: ' . $e->getMessage(), 500);
}
