<?php
require_once __DIR__ . '/../../bootstrap.php';

sendResponse([
    'success'  => true,
    'accounts' => [
        'farmer' => [
            'email'    => 'farmer@agri.coop',
            'altEmail' => 'farmer@demo.com',
            'password' => 'password123',
            'role'     => 'farmer',
            'name'     => 'John Miller'
        ],
        'dev' => [
            'email'    => 'dev@agri.coop',
            'altEmail' => 'dev@demo.com',
            'password' => 'password123',
            'role'     => 'dev',
            'name'     => 'Alex Chen'
        ]
    ]
]);
