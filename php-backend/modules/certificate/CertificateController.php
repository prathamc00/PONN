<?php
/**
 * Certificate Controller
 * Full PHP port of modules/certificate/certificate.controller.js
 */

function getCertGrade(int $percent): string {
    if ($percent >= 90) return 'A+';
    if ($percent >= 80) return 'A';
    if ($percent >= 70) return 'B+';
    if ($percent >= 60) return 'B';
    if ($percent >= 50) return 'C';
    return 'D';
}

// ── getMyCertificates ─────────────────────────────────────────────────────────
function getMyCertificates(): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('
        SELECT cert.*, c.title AS courseTitle, c.category, c.instructor, c.level
        FROM certificates cert
        LEFT JOIN courses c ON c.id = cert.course
        WHERE cert.student = ?
        ORDER BY cert.earnedDate DESC
    ');
    $stmt->execute([$user['id']]);
    $certificates = $stmt->fetchAll();
    foreach ($certificates as &$cert) {
        $cert['_id'] = (string) $cert['id'];
    }
    unset($cert);
    jsonResponse(['success' => true, 'count' => count($certificates), 'certificates' => $certificates]);
}

// ── getCertificates ───────────────────────────────────────────────────────────
function getCertificates(): void {
    $db   = getDb();
    $stmt = $db->query('
        SELECT cert.*, u.name AS studentName, u.email AS studentEmail, u.college AS studentCollege, u.branch AS studentBranch,
               c.title AS courseTitle, c.category, c.instructor, c.level
        FROM certificates cert
        LEFT JOIN users u ON u.id = cert.student
        LEFT JOIN courses c ON c.id = cert.course
        ORDER BY cert.createdAt DESC
    ');
    $rows = $stmt->fetchAll();

    $certificates = array_map(function ($row) {
        $row['_id'] = (string) $row['id'];
        $row['user'] = [
            '_id' => isset($row['student']) ? (string) $row['student'] : '',
            'name' => $row['studentName'] ?? null,
            'email' => $row['studentEmail'] ?? null,
            'college' => $row['studentCollege'] ?? null,
            'branch' => $row['studentBranch'] ?? null,
        ];
        $row['course'] = [
            '_id' => isset($row['course']) ? (string) $row['course'] : '',
            'title' => $row['courseTitle'] ?? null,
            'category' => $row['category'] ?? null,
            'instructor' => $row['instructor'] ?? null,
            'level' => $row['level'] ?? null,
        ];
        return $row;
    }, $rows);

    jsonResponse(['success' => true, 'count' => count($certificates), 'certificates' => $certificates]);
}

// ── getCertificateById ────────────────────────────────────────────────────────
function getCertificateById(int $id): void {
    $db   = getDb();
    $stmt = $db->prepare('
        SELECT cert.*,
               u.name AS studentName, u.email AS studentEmail, u.college, u.branch,
               c.title AS courseTitle, c.category, c.instructor, c.level
        FROM certificates cert
        LEFT JOIN users u ON u.id = cert.student
        LEFT JOIN courses c ON c.id = cert.course
        WHERE cert.id = ?
    ');
    $stmt->execute([$id]);
    $certificate = $stmt->fetch();
    if (!$certificate) errorResponse('Certificate not found', 404);
    jsonResponse(['success' => true, 'certificate' => $certificate]);
}

// ── verifyCertificate ─────────────────────────────────────────────────────────
function verifyCertificate(string $certId): void {
    $db   = getDb();
    $stmt = $db->prepare('
        SELECT cert.*,
               u.name AS studentName, u.email AS studentEmail, u.college,
               c.title AS courseTitle, c.category, c.instructor
        FROM certificates cert
        LEFT JOIN users u ON u.id = cert.student
        LEFT JOIN courses c ON c.id = cert.course
        WHERE cert.certificateId = ?
    ');
    $stmt->execute([$certId]);
    $certificate = $stmt->fetch();
    if (!$certificate) errorResponse('Certificate not found or invalid', 404);
    jsonResponse(['success' => true, 'certificate' => $certificate]);
}

// ── autoIssueCertificate (helper called from TestController) ──────────────────
function autoIssueCertificate(int $userId, int $quizId): ?array {
    try {
        $db = getDb();

        $stmt = $db->prepare('SELECT qa.*, t.course, t.title AS testTitle, c.title AS courseTitle FROM quiz_attempts qa JOIN tests t ON t.id = qa.quiz LEFT JOIN courses c ON c.id = t.course WHERE qa.quiz = ? AND qa.student = ?');
        $stmt->execute([$quizId, $userId]);
        $attempt = $stmt->fetch();

        if (!$attempt || !$attempt['completedAt']) return null;

        $courseId    = $attempt['course'];
        $scorePercent = $attempt['totalMarks'] > 0
            ? (int) round(($attempt['score'] / $attempt['totalMarks']) * 100)
            : 0;

        if ($scorePercent < 40) return null;

        // Check if already exists
        $chk = $db->prepare("SELECT * FROM certificates WHERE student = ? AND course = ? AND type = 'quiz_pass'");
        $chk->execute([$userId, $courseId]);
        $existing = $chk->fetch();
        if ($existing) return $existing;

        $courseName = $attempt['courseTitle'] ?? 'Course';
        $title      = "{$courseName} — Quiz Completion";
        $grade      = getCertGrade($scorePercent);
        $certId     = strtoupper(bin2hex(random_bytes(8)));

        $db->prepare('INSERT INTO certificates (student, course, title, type, grade, scorePercent, certificateId, earnedDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())')
           ->execute([$userId, $courseId, $title, 'quiz_pass', $grade, $scorePercent, $certId]);

        $newId = (int) $db->lastInsertId();
        $row   = $db->prepare('SELECT * FROM certificates WHERE id = ?');
        $row->execute([$newId]);
        return $row->fetch() ?: null;
    } catch (Exception $e) {
        return null;
    }
}

// ── createCertificate (admin) ─────────────────────────────────────────────────
function createCertificate(): void {
    $body = getBody();
    $db   = getDb();

    $certId = strtoupper(bin2hex(random_bytes(8)));

    $stmt = $db->prepare('
        INSERT INTO certificates (student, course, title, type, grade, scorePercent, certificateId, earnedDate, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ');
    $stmt->execute([
        $body['student'] ?? null,
        $body['course'] ?? null,
        $body['title'] ?? 'Certificate',
        $body['type'] ?? 'completion',
        $body['grade'] ?? 'B',
        $body['scorePercent'] ?? 0,
        $certId,
        $body['earnedDate'] ?? date('Y-m-d H:i:s'),
    ]);

    $newId = (int) $db->lastInsertId();
    $row   = $db->prepare('SELECT * FROM certificates WHERE id = ?');
    $row->execute([$newId]);
    jsonResponse(['success' => true, 'message' => 'Certificate created', 'certificate' => $row->fetch()], 201);
}

// ── deleteCertificate ─────────────────────────────────────────────────────────
function deleteCertificate(int $id): void {
    $db   = getDb();
    $stmt = $db->prepare('SELECT id FROM certificates WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) errorResponse('Certificate not found', 404);

    $db->prepare('DELETE FROM certificates WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'Certificate deleted']);
}
