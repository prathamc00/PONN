<?php
/**
 * Simple DB-based rate limiter
 * Replaces express-rate-limit
 *
 * Uses a `rate_limit` table in MySQL to track request counts per IP per key.
 * Table is created automatically on first use.
 */

function checkRateLimit(string $key, int $maxRequests, int $windowSeconds): void {
    $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

    try {
        $db = getDb();

        // Ensure table exists
        $db->exec("
            CREATE TABLE IF NOT EXISTS rate_limit (
                id         INT AUTO_INCREMENT PRIMARY KEY,
                ip         VARCHAR(45)  NOT NULL,
                rate_key   VARCHAR(64)  NOT NULL,
                requests   INT          NOT NULL DEFAULT 1,
                window_start DATETIME   NOT NULL,
                UNIQUE KEY uq_ip_key (ip, rate_key)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        ");

        $now    = date('Y-m-d H:i:s');
        $cutoff = date('Y-m-d H:i:s', time() - $windowSeconds);

        // Try to fetch existing row
        $stmt = $db->prepare('SELECT id, requests, window_start FROM rate_limit WHERE ip = ? AND rate_key = ?');
        $stmt->execute([$ip, $key]);
        $row = $stmt->fetch();

        if (!$row) {
            // First request — insert
            $ins = $db->prepare('INSERT INTO rate_limit (ip, rate_key, requests, window_start) VALUES (?, ?, 1, ?)');
            $ins->execute([$ip, $key, $now]);
            return;
        }

        // If window has passed, reset
        if ($row['window_start'] < $cutoff) {
            $upd = $db->prepare('UPDATE rate_limit SET requests = 1, window_start = ? WHERE id = ?');
            $upd->execute([$now, $row['id']]);
            return;
        }

        // Check limit
        if ($row['requests'] >= $maxRequests) {
            errorResponse('Too many requests, please try again later.', 429);
        }

        // Increment
        $upd = $db->prepare('UPDATE rate_limit SET requests = requests + 1 WHERE id = ?');
        $upd->execute([$row['id']]);
    } catch (PDOException $e) {
        // Silently fail rate limiting if DB issue — don't block legitimate requests
    }
}
