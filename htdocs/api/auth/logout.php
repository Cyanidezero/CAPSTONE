<?php
require_once __DIR__ . '/../../bootstrap.php';

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}
@session_unset();
@session_destroy();

sendResponse([
    'success' => true,
    'message' => 'Logged out successfully.'
]);
