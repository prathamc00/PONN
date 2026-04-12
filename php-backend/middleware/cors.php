<?php
/**
 * CORS middleware — equivalent to the cors() + helmet() setup in app.js
 */
function applyCors(): void {
    $allowedOriginsEnv = env('FRONTEND_URL', '');
    if ($allowedOriginsEnv) {
        $allowed = array_map('trim', explode(',', $allowedOriginsEnv));
    } else {
        $allowed = [
            'http://localhost:5500',
            'http://127.0.0.1:5500',
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
        ];
    }

    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if (in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: {$origin}");
    }

    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    header('Content-Type: application/json; charset=UTF-8');
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('X-XSS-Protection: 1; mode=block');
}
