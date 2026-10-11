<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config.php';

function respond($code, $payload) {
    http_response_code($code);
    echo json_encode($payload);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    respond(400, ['success' => false, 'message' => 'Invalid request body.']);
}

$role         = $data['role'] ?? 'farmer';
$name         = trim($data['name'] ?? '');
$age          = isset($data['age']) ? intval($data['age']) : 25;
$email        = trim($data['email'] ?? '');
$password     = $data['password'] ?? '';
$farmLocation = trim($data['farm_location'] ?? $data['farmName'] ?? $data['organization'] ?? '');

if (!in_array($role, ['farmer', 'developer', 'dev'], true)) {
    respond(400, ['success' => false, 'message' => 'Unknown account type.']);
}
if ($name === '' || $email === '' || $password === '') {
    respond(400, ['success' => false, 'message' => 'Please fill in all required fields (name, email, password).']);
}
if ($age < 18 || $age > 99) {
    $age = 25; // fallback default
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, ['success' => false, 'message' => 'Please enter a valid email address.']);
}
if (strlen($password) < 4) {
    respond(400, ['success' => false, 'message' => 'Password must be at least 4 characters.']);
}

$isFarmer = ($role === 'farmer');
$table = $isFarmer ? 'farmers' : 'developers';

// Reject duplicate emails across both tables
$check = $pdo->prepare("SELECT id FROM `$table` WHERE LOWER(email) = ?");
$check->execute([strtolower($email)]);
if ($check->fetch()) {
    respond(409, ['success' => false, 'message' => 'An account with that email already exists.']);
}

$hashed = password_hash($password, PASSWORD_DEFAULT);

try {
    if ($isFarmer) {
        $stmt = $pdo->prepare(
            "INSERT INTO farmers (name, age, farm_location, email, password) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$name, $age, $farmLocation ?: "{$name}'s Farm", strtolower($email), $hashed]);
    } else {
        $stmt = $pdo->prepare(
            "INSERT INTO developers (name, age, organization, email, password) VALUES (?, ?, ?, ?, ?)"
        );
        $stmt->execute([$name, $age, $farmLocation ?: "{$name}'s Lab", strtolower($email), $hashed]);
    }
    $newId = $pdo->lastInsertId();
} catch (PDOException $e) {
    respond(500, ['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}

respond(201, [
    'success' => true,
    'message' => ($isFarmer ? 'Farmer' : 'Developer') . ' profile created successfully in XAMPP database.',
    'user' => [
        'id' => $newId,
        'name' => $name,
        'email' => strtolower($email),
        'role' => $isFarmer ? 'farmer' : 'dev',
        'age' => $age
    ]
]);