-- ============================================================
-- CRISMATECH Student Learning Portal — MySQL Schema
-- Run this in Hostinger's phpMyAdmin or MySQL CLI
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Users ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `users` (
    `id`              INT          AUTO_INCREMENT PRIMARY KEY,
    `name`            VARCHAR(100) NOT NULL,
    `email`           VARCHAR(255) NOT NULL UNIQUE,
    `password`        VARCHAR(255) NOT NULL,
    `college`         VARCHAR(255) DEFAULT NULL,
    `branch`          VARCHAR(100) DEFAULT NULL,
    `semester`        TINYINT      DEFAULT NULL,
    `phone`           VARCHAR(20)  DEFAULT NULL,
    `role`            ENUM('student','instructor','admin') NOT NULL DEFAULT 'student',
    `approvalStatus`  ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved',
    `emailVerified`   TINYINT(1)   NOT NULL DEFAULT 0,
    `aadhaarVerified` TINYINT(1)   NOT NULL DEFAULT 0,
    `aadhaarCardPath` VARCHAR(500) DEFAULT NULL,
    `passwordChangedAt` DATETIME   DEFAULT NULL,
    `createdAt`       DATETIME     NOT NULL,
    `updatedAt`       DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default admin user (password: Admin@123 — CHANGE THIS IMMEDIATELY)
INSERT INTO `users` (`name`, `email`, `password`, `role`, `approvalStatus`, `emailVerified`, `aadhaarVerified`, `passwordChangedAt`, `createdAt`, `updatedAt`)
VALUES ('Admin', 'admin@crismatech.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'approved', 1, 0, NOW(), NOW(), NOW());

-- ── OTPs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `otps` (
    `id`        INT          AUTO_INCREMENT PRIMARY KEY,
    `email`     VARCHAR(255) NOT NULL UNIQUE,
    `code`      VARCHAR(6)   NOT NULL,
    `attempts`  INT          NOT NULL DEFAULT 0,
    `expiresAt` DATETIME     NOT NULL,
    `createdAt` DATETIME     NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- -- Password reset tokens (one-time, expiring)
CREATE TABLE IF NOT EXISTS `password_reset_tokens` (
    `id`        INT AUTO_INCREMENT PRIMARY KEY,
    `userId`    INT NOT NULL,
    `tokenHash` CHAR(64) NOT NULL,
    `expiresAt` DATETIME NOT NULL,
    `usedAt`    DATETIME DEFAULT NULL,
    `createdAt` DATETIME NOT NULL,
    UNIQUE KEY `uq_token_hash` (`tokenHash`),
    KEY `idx_user` (`userId`),
    KEY `idx_expires` (`expiresAt`),
    FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Courses ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `courses` (
    `id`          INT          AUTO_INCREMENT PRIMARY KEY,
    `title`       VARCHAR(255) NOT NULL,
    `description` TEXT         DEFAULT NULL,
    `category`    VARCHAR(100) DEFAULT NULL,
    `level`       ENUM('beginner','intermediate','advanced') DEFAULT 'beginner',
    `instructor`  VARCHAR(100) DEFAULT NULL,
    `price`       DECIMAL(10,2) DEFAULT 0.00,
    `thumbnail`   VARCHAR(500) DEFAULT NULL,
    `modules`     JSON         DEFAULT NULL,
    `lessons`     INT          NOT NULL DEFAULT 0,
    `duration`    VARCHAR(50)  DEFAULT NULL,
    `createdBy`   INT          DEFAULT NULL,
    `createdAt`   DATETIME     NOT NULL,
    `updatedAt`   DATETIME     NOT NULL,
    FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── User-Course Enrollments (Many-to-Many) ───────────────────
CREATE TABLE IF NOT EXISTS `user_courses` (
    `id`        INT AUTO_INCREMENT PRIMARY KEY,
    `userId`    INT NOT NULL,
    `courseId`  INT NOT NULL,
    `createdAt` DATETIME NOT NULL,
    `updatedAt` DATETIME NOT NULL,
    UNIQUE KEY `uq_user_course` (`userId`, `courseId`),
    FOREIGN KEY (`userId`)   REFERENCES `users`(`id`)   ON DELETE CASCADE,
    FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Course Progress ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `course_progress` (
    `id`               INT  AUTO_INCREMENT PRIMARY KEY,
    `student`          INT  NOT NULL,
    `course`           INT  NOT NULL,
    `completedModules` JSON DEFAULT NULL,
    `createdAt`        DATETIME NOT NULL,
    `updatedAt`        DATETIME NOT NULL,
    UNIQUE KEY `uq_student_course` (`student`, `course`),
    FOREIGN KEY (`student`) REFERENCES `users`(`id`)   ON DELETE CASCADE,
    FOREIGN KEY (`course`)  REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Attendance ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `attendances` (
    `id`           INT  AUTO_INCREMENT PRIMARY KEY,
    `student`      INT  NOT NULL,
    `course`       INT  DEFAULT NULL,
    `activityType` VARCHAR(50) NOT NULL,
    `details`      VARCHAR(500) DEFAULT NULL,
    `createdAt`    DATETIME NOT NULL,
    `updatedAt`    DATETIME NOT NULL,
    FOREIGN KEY (`student`) REFERENCES `users`(`id`)   ON DELETE CASCADE,
    FOREIGN KEY (`course`)  REFERENCES `courses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Assignments ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `assignments` (
    `id`          INT          AUTO_INCREMENT PRIMARY KEY,
    `title`       VARCHAR(255) NOT NULL,
    `description` TEXT         DEFAULT NULL,
    `course`      INT          NOT NULL,
    `type`        ENUM('file_upload','case_study','code') NOT NULL DEFAULT 'file_upload',
    `dueDate`     DATETIME     DEFAULT NULL,
    `maxMarks`    INT          NOT NULL DEFAULT 100,
    `createdBy`   INT          DEFAULT NULL,
    `createdAt`   DATETIME     NOT NULL,
    `updatedAt`   DATETIME     NOT NULL,
    FOREIGN KEY (`course`)    REFERENCES `courses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Submissions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `submissions` (
    `id`          INT  AUTO_INCREMENT PRIMARY KEY,
    `assignment`  INT  NOT NULL,
    `student`     INT  NOT NULL,
    `type`        ENUM('file_upload','case_study','code') NOT NULL,
    `textContent` TEXT         DEFAULT NULL,
    `codeContent` TEXT         DEFAULT NULL,
    `filePath`    VARCHAR(500) DEFAULT NULL,
    `grade`       DECIMAL(5,2) DEFAULT NULL,
    `feedback`    TEXT         DEFAULT NULL,
    `submittedAt` DATETIME     DEFAULT NULL,
    `createdAt`   DATETIME     NOT NULL,
    `updatedAt`   DATETIME     NOT NULL,
    FOREIGN KEY (`assignment`) REFERENCES `assignments`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student`)    REFERENCES `users`(`id`)       ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Tests (Quizzes) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `tests` (
    `id`              INT          AUTO_INCREMENT PRIMARY KEY,
    `title`           VARCHAR(255) NOT NULL,
    `course`          INT          NOT NULL,
    `questions`       JSON         DEFAULT NULL,
    `totalQuestions`  INT          NOT NULL DEFAULT 0,
    `durationMinutes` INT          NOT NULL DEFAULT 30,
    `startTime`       DATETIME     DEFAULT NULL,
    `endTime`         DATETIME     DEFAULT NULL,
    `createdBy`       INT          DEFAULT NULL,
    `createdAt`       DATETIME     NOT NULL,
    `updatedAt`       DATETIME     NOT NULL,
    FOREIGN KEY (`course`)    REFERENCES `courses`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`)  ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Quiz Attempts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `quiz_attempts` (
    `id`             INT  AUTO_INCREMENT PRIMARY KEY,
    `quiz`           INT  NOT NULL,
    `student`        INT  NOT NULL,
    `answers`        JSON DEFAULT NULL,
    `score`          INT  DEFAULT NULL,
    `totalMarks`     INT  DEFAULT NULL,
    `tabSwitchCount` INT  NOT NULL DEFAULT 0,
    `startedAt`      DATETIME DEFAULT NULL,
    `completedAt`    DATETIME DEFAULT NULL,
    `createdAt`      DATETIME NOT NULL,
    `updatedAt`      DATETIME NOT NULL,
    FOREIGN KEY (`quiz`)    REFERENCES `tests`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`student`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Certificates ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `certificates` (
    `id`            INT          AUTO_INCREMENT PRIMARY KEY,
    `student`       INT          NOT NULL,
    `course`        INT          NOT NULL,
    `title`         VARCHAR(255) NOT NULL,
    `type`          ENUM('completion','quiz_pass','manual') NOT NULL DEFAULT 'completion',
    `grade`         VARCHAR(5)   DEFAULT NULL,
    `scorePercent`  INT          DEFAULT NULL,
    `certificateId` VARCHAR(50)  NOT NULL UNIQUE,
    `earnedDate`    DATETIME     DEFAULT NULL,
    `createdAt`     DATETIME     NOT NULL,
    `updatedAt`     DATETIME     NOT NULL,
    UNIQUE KEY `uq_student_course_type` (`student`, `course`, `type`),
    FOREIGN KEY (`student`) REFERENCES `users`(`id`)   ON DELETE CASCADE,
    FOREIGN KEY (`course`)  REFERENCES `courses`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Notifications ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `notifications` (
    `id`        INT          AUTO_INCREMENT PRIMARY KEY,
    `user`      INT          NOT NULL,
    `title`     VARCHAR(255) NOT NULL,
    `message`   TEXT         NOT NULL,
    `type`      ENUM('info','success','warning','error') NOT NULL DEFAULT 'info',
    `link`      VARCHAR(500) DEFAULT NULL,
    `isRead`    TINYINT(1)   NOT NULL DEFAULT 0,
    `createdAt` DATETIME     NOT NULL,
    `updatedAt` DATETIME     NOT NULL,
    FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Rate Limiting ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `rate_limit` (
    `id`           INT AUTO_INCREMENT PRIMARY KEY,
    `ip`           VARCHAR(45) NOT NULL,
    `rate_key`     VARCHAR(64) NOT NULL,
    `requests`     INT         NOT NULL DEFAULT 1,
    `window_start` DATETIME    NOT NULL,
    UNIQUE KEY `uq_ip_key` (`ip`, `rate_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ── Security Monitoring / Audit Events ────────────────────────
CREATE TABLE IF NOT EXISTS `security_events` (
    `id`         INT AUTO_INCREMENT PRIMARY KEY,
    `requestId`  VARCHAR(64)  NOT NULL,
    `eventType`  VARCHAR(64)  NOT NULL,
    `severity`   ENUM('info','warning','error','critical') NOT NULL DEFAULT 'info',
    `method`     VARCHAR(10)  DEFAULT NULL,
    `route`      VARCHAR(255) DEFAULT NULL,
    `ip`         VARCHAR(45)  DEFAULT NULL,
    `userAgent`  VARCHAR(255) DEFAULT NULL,
    `userId`     INT          DEFAULT NULL,
    `statusCode` INT          DEFAULT NULL,
    `details`    JSON         DEFAULT NULL,
    `createdAt`  DATETIME     NOT NULL,
    KEY `idx_security_created` (`createdAt`),
    KEY `idx_security_event` (`eventType`),
    KEY `idx_security_severity` (`severity`),
    KEY `idx_security_request` (`requestId`),
    KEY `idx_security_ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;
