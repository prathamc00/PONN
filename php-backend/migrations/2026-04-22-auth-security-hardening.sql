-- Auth and security hardening migration
-- Safe to run multiple times (idempotent where supported)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1) Users table hardening fields
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS emailVerified TINYINT(1) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS passwordChangedAt DATETIME NULL;

-- Backfill to prevent locking existing users out immediately.
UPDATE users
SET emailVerified = 1
WHERE emailVerified IS NULL OR emailVerified = 0;

UPDATE users
SET passwordChangedAt = COALESCE(passwordChangedAt, updatedAt, createdAt, NOW())
WHERE passwordChangedAt IS NULL;

-- 2) One-time expiring password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    tokenHash CHAR(64) NOT NULL,
    expiresAt DATETIME NOT NULL,
    usedAt DATETIME DEFAULT NULL,
    createdAt DATETIME NOT NULL,
    UNIQUE KEY uq_token_hash (tokenHash),
    INDEX idx_user (userId),
    INDEX idx_expires (expiresAt),
    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3) Security monitoring / audit events
CREATE TABLE IF NOT EXISTS security_events (
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
    INDEX idx_security_created (createdAt),
    INDEX idx_security_event (eventType),
    INDEX idx_security_severity (severity),
    INDEX idx_security_request (requestId),
    INDEX idx_security_ip (ip)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
