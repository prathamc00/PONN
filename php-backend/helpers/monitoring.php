<?php
/**
 * Security monitoring and audit logging helpers.
 */

function monitoringEnabled(): bool
{
    $raw = strtolower(trim((string) env('SECURITY_EVENTS_ENABLED', 'true')));
    return !in_array($raw, ['0', 'false', 'no', 'off'], true);
}

function shouldFallbackToFileLogs(): bool
{
    $raw = strtolower(trim((string) env('SECURITY_LOG_FILE_FALLBACK', 'true')));
    return !in_array($raw, ['0', 'false', 'no', 'off'], true);
}

function getRequestId(): string
{
    if (!empty($GLOBALS['requestId'])) {
        return (string) $GLOBALS['requestId'];
    }

    $requestId = bin2hex(random_bytes(16));
    $GLOBALS['requestId'] = $requestId;
    return $requestId;
}

function getClientIpAddress(): string
{
    $forwardedFor = trim((string) ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''));
    if ($forwardedFor !== '') {
        $parts = array_map('trim', explode(',', $forwardedFor));
        if (!empty($parts[0])) {
            return substr($parts[0], 0, 45);
        }
    }

    $realIp = trim((string) ($_SERVER['HTTP_X_REAL_IP'] ?? ''));
    if ($realIp !== '') {
        return substr($realIp, 0, 45);
    }

    return substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
}

function ensureSecurityEventsTable(): void
{
    static $ready = false;
    if ($ready) {
        return;
    }

    $db = getDb();
    $db->exec("CREATE TABLE IF NOT EXISTS security_events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        requestId VARCHAR(64) NOT NULL,
        eventType VARCHAR(64) NOT NULL,
        severity ENUM('info', 'warning', 'error', 'critical') NOT NULL DEFAULT 'info',
        method VARCHAR(10) DEFAULT NULL,
        route VARCHAR(255) DEFAULT NULL,
        ip VARCHAR(45) DEFAULT NULL,
        userAgent VARCHAR(255) DEFAULT NULL,
        userId INT DEFAULT NULL,
        statusCode INT DEFAULT NULL,
        details JSON DEFAULT NULL,
        createdAt DATETIME NOT NULL,
        INDEX idx_created_at (createdAt),
        INDEX idx_event_type (eventType),
        INDEX idx_severity (severity),
        INDEX idx_request_id (requestId),
        INDEX idx_ip (ip)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

    $ready = true;
}

function writeSecurityFallbackLog(array $payload): void
{
    if (!shouldFallbackToFileLogs()) {
        return;
    }

    $logDir = __DIR__ . '/../logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0755, true);
    }

    $line = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($line === false) {
        return;
    }

    @file_put_contents($logDir . '/security.log', $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function logSecurityEvent(string $eventType, string $severity = 'info', array $details = [], ?int $statusCode = null, ?int $userId = null): void
{
    if (!monitoringEnabled()) {
        return;
    }

    $severityAllowed = ['info', 'warning', 'error', 'critical'];
    if (!in_array($severity, $severityAllowed, true)) {
        $severity = 'info';
    }

    $requestId = getRequestId();
    $method = substr((string) ($_SERVER['REQUEST_METHOD'] ?? 'CLI'), 0, 10);
    $route = substr((string) (parse_url((string) ($_SERVER['REQUEST_URI'] ?? ''), PHP_URL_PATH) ?? ''), 0, 255);
    $ip = getClientIpAddress();
    $userAgent = substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255);

    $payload = [
        'requestId' => $requestId,
        'eventType' => substr($eventType, 0, 64),
        'severity' => $severity,
        'method' => $method,
        'route' => $route,
        'ip' => $ip,
        'userAgent' => $userAgent,
        'userId' => $userId,
        'statusCode' => $statusCode,
        'details' => $details,
        'createdAt' => date('c'),
    ];

    try {
        ensureSecurityEventsTable();
        $db = getDb();
        $stmt = $db->prepare('INSERT INTO security_events (requestId, eventType, severity, method, route, ip, userAgent, userId, statusCode, details, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
        $stmt->execute([
            $requestId,
            substr($eventType, 0, 64),
            $severity,
            $method,
            $route,
            $ip,
            $userAgent,
            $userId,
            $statusCode,
            json_encode($details, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
        ]);
    } catch (Throwable $e) {
        $payload['monitoringError'] = 'db_write_failed';
        writeSecurityFallbackLog($payload);
    }
}

function registerMonitoringHandlers(): void
{
    set_exception_handler(function (Throwable $e): void {
        logSecurityEvent('api_unhandled_exception', 'critical', [
            'message' => $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
        ], 500);

        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => 'Internal server error',
                'requestId' => getRequestId(),
            ]);
        }

        exit;
    });

    register_shutdown_function(function (): void {
        $error = error_get_last();
        if (!$error) {
            return;
        }

        $fatalTypes = [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR];
        if (!in_array($error['type'], $fatalTypes, true)) {
            return;
        }

        logSecurityEvent('api_fatal_error', 'critical', [
            'message' => (string) ($error['message'] ?? 'Fatal error'),
            'file' => (string) ($error['file'] ?? ''),
            'line' => (int) ($error['line'] ?? 0),
        ], 500);

        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'message' => 'Internal server error',
                'requestId' => getRequestId(),
            ]);
        }
    });
}
