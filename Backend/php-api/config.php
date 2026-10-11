<?php
/**
 * Database connection for ClimaYield-X.
 * Edit these four values to match your local MySQL/MariaDB setup
 * (e.g. XAMPP/WAMP defaults are usually host=localhost, user=root, pass='').
 */
$DB_HOST = 'localhost';
$DB_NAME = 'climayield';
$DB_USER = 'root';
$DB_PASS = '';

$dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";

$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, $options);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed. Check config.php and make sure the climayield database has been imported.'
    ]);
    exit;
}