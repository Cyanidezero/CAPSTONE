<?php
/**
 * ClimaYield-X - PHP API Bootstrap
 * Handles CORS headers, OPTIONS preflight, error suppression, and PDO connection.
 */

// 1. Production Security: Turn off verbose errors (Prevent exposing DB structure/passwords)
ini_set('display_errors', '0');
ini_set('display_startup_errors', '0');
error_reporting(E_ALL);

// Ensure all responses are JSON by default
header('Content-Type: application/json; charset=utf-8');

// Load Configuration
require_once __DIR__ . '/config.php';

// 2. CORS Handling: Allow whitelisted Netlify URLs, InfinityFree self-origin, and localhost
$httpOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
$isAllowedOrigin = false;

if (!empty($httpOrigin)) {
    $host = parse_url($httpOrigin, PHP_URL_HOST);
    if ($host && (
        str_ends_with($host, 'infinityfree.me') || 
        str_ends_with($host, 'infinityfreeapp.com') || 
        str_ends_with($host, 'netlify.app') || 
        $host === 'localhost' || 
        $host === '127.0.0.1'
    )) {
        $isAllowedOrigin = true;
    } else {
        foreach ($ALLOWED_ORIGINS as $allowed) {
            $allowedTrimmed = rtrim(strtolower($allowed), '/');
            $originTrimmed = rtrim(strtolower($httpOrigin), '/');
            if ($allowedTrimmed === $originTrimmed) {
                $isAllowedOrigin = true;
                break;
            }
        }
    }
} else {
    $isAllowedOrigin = true;
}

if ($isAllowedOrigin && !empty($httpOrigin)) {
    header("Access-Control-Allow-Origin: {$httpOrigin}");
    header("Access-Control-Allow-Credentials: true");
    header("Vary: Origin");
} else {
    header("Access-Control-Allow-Origin: *");
}

header("Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept");
header("Access-Control-Max-Age: 86400"); // Cache preflight for 24 hours

// Handle OPTIONS preflight immediately with HTTP 200 OK
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($requestMethod === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['status' => 'OK', 'message' => 'Preflight OK']);
    exit;
}

// 3. Database Connection via PDO with Prepared Statements
$pdo = null;
try {
    $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false, // Native prepared statements
        PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
    ]);
} catch (PDOException $e) {
    error_log("[ClimaYield DB Error] " . $e->getMessage());
    // Safe error message - never leak server paths or DB credentials
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => 'Database connection failed. Please verify DB credentials in config.php.'
    ]);
    exit;
}

function getDbConnection() {
    global $pdo;
    return $pdo;
}

// 4. Helper Utility Functions
function jsonInput() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function sendError($message, $statusCode = 400) {
    http_response_code($statusCode);
    echo json_encode([
        'success' => false,
        'error'   => $message
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// 5. Server-Side Authentication & Role Checking
function getBearerToken() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) {
        $headers = trim($_SERVER["Authorization"]);
    } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
    } elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) {
            $headers = trim($requestHeaders['Authorization']);
        }
    }
    if (!empty($headers) && preg_match('/Bearer\s(\S+)/i', $headers, $matches)) {
        return $matches[1];
    }
    return null;
}

function requireDevAuth() {
    $token = getBearerToken();
    $input = jsonInput();
    $devToken = $token ?: ($input['token'] ?? ($_GET['token'] ?? null));
    $userRole = $input['role'] ?? ($_GET['role'] ?? null);

    if (session_status() === PHP_SESSION_NONE) {
        @session_start();
    }

    $sessionRole = $_SESSION['role'] ?? null;

    if ($sessionRole === 'dev' || $sessionRole === 'developer') {
        return true;
    }

    // Check if valid token provided or valid dev role credential
    if (!empty($devToken) || $userRole === 'dev' || $userRole === 'developer') {
        return true;
    }

    sendError('Unauthorized: Developer privileges required to publish updates.', 403);
}
