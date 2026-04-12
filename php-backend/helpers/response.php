<?php
/**
 * HTTP response helpers
 * Replaces res.status().json() pattern from Express
 */

function jsonResponse(array $data, int $statusCode = 200): void {
    http_response_code($statusCode);
    header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
    header('Cache-Control: post-check=0, pre-check=0', false);
    header('Pragma: no-cache');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function successResponse(string $message, array $data = [], int $code = 200): void {
    jsonResponse(array_merge(['success' => true, 'message' => $message], $data), $code);
}

function errorResponse(string $message, int $code = 400): void {
    jsonResponse(['success' => false, 'message' => $message], $code);
}

/**
 * Parse request body — handles both JSON and form data
 */
function getBody(): array {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? '';
    if (str_contains($contentType, 'application/json')) {
        $raw  = file_get_contents('php://input');
        $data = json_decode($raw, true);
        return is_array($data) ? $data : [];
    }
    // Fallback: try parsing php://input as JSON even if Content-Type header is missing
    // (some CDNs/proxies strip or rename the header)
    $raw = file_get_contents('php://input');
    if ($raw && ($data = json_decode($raw, true)) && is_array($data)) {
        return $data;
    }
    return $_POST;
}

/**
 * Get a query parameter with optional default
 */
function query(string $key, $default = null) {
    return $_GET[$key] ?? $default;
}

/**
 * Get Bearer token from Authorization header
 */
function getBearerToken(): ?string {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (str_starts_with($authHeader, 'Bearer ')) {
        return substr($authHeader, 7);
    }
    return null;
}
