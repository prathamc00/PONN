<?php
/**
 * Assignment Controller
 * Full PHP port of modules/assignment/assignment.controller.js
 */

function canManageAssignment(array $assignment, array $user): bool {
    return $user['role'] === 'admin' || (string) $assignment['createdBy'] === (string) $user['id'];
}

function ensureAssignmentAccess(array $assignment, array $user): void {
    if (!canManageAssignment($assignment, $user)) {
        errorResponse('You can only manage assignments that you created', 403);
    }
}

function fetchAssignmentById(int $id): ?array {
    $db   = getDb();
    $stmt = $db->prepare('
        SELECT a.*, c.title AS courseTitle
        FROM assignments a
        LEFT JOIN courses c ON c.id = a.course
        WHERE a.id = ?
    ');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $row['Course'] = ['title' => $row['courseTitle']];
    return $row;
}

// ── getManagedAssignments ─────────────────────────────────────────────────────
function getManagedAssignments(): void {
    $user   = getAuthUser();
    $page   = max(1, (int) query('page', 1));
    $limit  = min(100, (int) query('limit', 100));
    $offset = ($page - 1) * $limit;
    $db     = getDb();

    if ($user['role'] === 'admin') {
        $count = $db->query('SELECT COUNT(*) FROM assignments')->fetchColumn();
        $stmt  = $db->prepare('SELECT a.*, c.title AS courseTitle FROM assignments a LEFT JOIN courses c ON c.id = a.course ORDER BY a.createdAt DESC LIMIT ? OFFSET ?');
        $stmt->execute([$limit, $offset]);
    } else {
        $c = $db->prepare('SELECT COUNT(*) FROM assignments WHERE createdBy = ?');
        $c->execute([$user['id']]); $count = $c->fetchColumn();
        $stmt = $db->prepare('SELECT a.*, c.title AS courseTitle FROM assignments a LEFT JOIN courses c ON c.id = a.course WHERE a.createdBy = ? ORDER BY a.createdAt DESC LIMIT ? OFFSET ?');
        $stmt->execute([$user['id'], $limit, $offset]);
    }

    $assignments = $stmt->fetchAll();
    jsonResponse(['success' => true, 'count' => (int) $count, 'page' => $page, 'limit' => $limit, 'assignments' => $assignments]);
}

// ── getAssignments ────────────────────────────────────────────────────────────
function getAssignments(): void {
    $user   = getAuthUser();
    $page   = max(1, (int) query('page', 1));
    $limit  = min(100, (int) query('limit', 100));
    $offset = ($page - 1) * $limit;
    $db     = getDb();

    if ($user && $user['role'] === 'student') {
        // Only show assignments for courses the student is enrolled in
        $countStmt = $db->prepare('SELECT COUNT(*) FROM assignments a JOIN user_courses uc ON uc.courseId = a.course WHERE uc.userId = ?');
        $countStmt->execute([$user['id']]);
        $count = $countStmt->fetchColumn();

        $stmt = $db->prepare('
            SELECT a.*, c.title AS courseTitle 
            FROM assignments a 
            JOIN user_courses uc ON uc.courseId = a.course 
            LEFT JOIN courses c ON c.id = a.course 
            WHERE uc.userId = ? 
            ORDER BY a.createdAt DESC 
            LIMIT ? OFFSET ?
        ');
        $stmt->execute([$user['id'], $limit, $offset]);
    } else {
        $count = $db->query('SELECT COUNT(*) FROM assignments')->fetchColumn();
        $stmt  = $db->prepare('SELECT a.*, c.title AS courseTitle FROM assignments a LEFT JOIN courses c ON c.id = a.course ORDER BY a.createdAt DESC LIMIT ? OFFSET ?');
        $stmt->execute([$limit, $offset]);
    }

    $assignments = $stmt->fetchAll();
    foreach ($assignments as &$a) {
        $a['_id'] = (string) $a['id'];
        $a['course'] = [
            '_id'   => (string) $a['course'],
            'title' => $a['courseTitle'] ?? ''
        ];
    }
    unset($a);

    jsonResponse(['success' => true, 'count' => (int) $count, 'page' => $page, 'limit' => $limit, 'assignments' => $assignments]);
}

// ── getAssignmentById ─────────────────────────────────────────────────────────
function getAssignmentById(int $id): void {
    $assignment = fetchAssignmentById($id);
    if (!$assignment) errorResponse('Assignment not found', 404);
    jsonResponse(['success' => true, 'assignment' => $assignment]);
}

// ── createAssignment ──────────────────────────────────────────────────────────
function createAssignment(): void {
    $user = getAuthUser();
    $body = getBody();
    $db   = getDb();

    $courseId = (int) ($body['course'] ?? 0);
    $course   = $db->prepare('SELECT id, createdBy FROM courses WHERE id = ?');
    $course->execute([$courseId]);
    $courseRow = $course->fetch();
    if (!$courseRow) errorResponse('Course not found', 404);

    if ($user['role'] !== 'admin' && (string) $courseRow['createdBy'] !== (string) $user['id']) {
        errorResponse('You can only create assignments for your own courses', 403);
    }

    $stmt = $db->prepare('
        INSERT INTO assignments (title, description, course, type, dueDate, maxMarks, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ');
    $stmt->execute([
        $body['title'] ?? '',
        $body['description'] ?? '',
        $courseId,
        $body['type'] ?? 'file_upload',
        $body['dueDate'] ?? null,
        $body['maxMarks'] ?? 100,
        $user['id'],
    ]);

    $assignmentId = (int) $db->lastInsertId();
    $assignment   = fetchAssignmentById($assignmentId);
    jsonResponse(['success' => true, 'message' => 'Assignment created', 'assignment' => $assignment], 201);
}

// ── updateAssignment ──────────────────────────────────────────────────────────
function updateAssignment(int $id): void {
    $user       = getAuthUser();
    $assignment = fetchAssignmentById($id);
    if (!$assignment) errorResponse('Assignment not found', 404);
    ensureAssignmentAccess($assignment, $user);

    $body = getBody();
    $db   = getDb();

    // If course is being changed, verify ownership
    if (isset($body['course']) && (string) $body['course'] !== (string) $assignment['course']) {
        $courseRow = $db->prepare('SELECT id, createdBy FROM courses WHERE id = ?');
        $courseRow->execute([(int) $body['course']]);
        $cr = $courseRow->fetch();
        if (!$cr) errorResponse('Course not found', 404);
        if ($user['role'] !== 'admin' && (string) $cr['createdBy'] !== (string) $user['id']) {
            errorResponse('You can only create assignments for your own courses', 403);
        }
    }

    $sets   = ['updatedAt = NOW()'];
    $params = [];
    foreach (['title', 'description', 'course', 'type', 'dueDate', 'maxMarks'] as $f) {
        if (array_key_exists($f, $body)) { $sets[] = "$f = ?"; $params[] = $body[$f]; }
    }
    $params[] = $id;
    $db->prepare('UPDATE assignments SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);

    $updated = fetchAssignmentById($id);
    jsonResponse(['success' => true, 'message' => 'Assignment updated', 'assignment' => $updated]);
}

// ── deleteAssignment ──────────────────────────────────────────────────────────
function deleteAssignment(int $id): void {
    $user       = getAuthUser();
    $assignment = fetchAssignmentById($id);
    if (!$assignment) errorResponse('Assignment not found', 404);
    ensureAssignmentAccess($assignment, $user);

    $db = getDb();
    $db->prepare('DELETE FROM submissions WHERE assignment = ?')->execute([$id]);
    $db->prepare('DELETE FROM assignments WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'Assignment deleted']);
}

// ── submitAssignment ──────────────────────────────────────────────────────────
function submitAssignment(int $id): void {
    $user       = getAuthUser();
    $assignment = fetchAssignmentById($id);
    if (!$assignment) errorResponse('Assignment not found', 404);

    $db = getDb();
    $chk = $db->prepare('SELECT id FROM submissions WHERE assignment = ? AND student = ?');
    $chk->execute([$id, $user['id']]);
    if ($chk->fetch()) errorResponse('You have already submitted this assignment', 409);

    $body           = getBody();
    $type           = $assignment['type'];
    $textContent    = null;
    $codeContent    = null;
    $filePath       = null;

    if ($type === 'case_study') {
        $textContent = $body['textContent'] ?? null;
    } elseif ($type === 'code') {
        $codeContent = $body['codeContent'] ?? null;
    } elseif ($type === 'file_upload' && !empty($_FILES['file']['error']) === false && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
        $dir = __DIR__ . '/../../../uploads/submissions/';
        if (!is_dir($dir)) mkdir($dir, 0755, true);
        $ext      = strtolower(pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION));
        
        // Security: Whitelist allowed file extensions
        $allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'png', 'jpg', 'jpeg'];
        if (!in_array($ext, $allowed, true)) {
            errorResponse('Invalid file type. Allowed: ' . implode(', ', $allowed), 400);
        }
        
        $filename = 'sub_' . $user['id'] . '_' . time() . '.' . $ext;
        move_uploaded_file($_FILES['file']['tmp_name'], $dir . $filename);
        $filePath = 'uploads/submissions/' . $filename;
    }

    $stmt = $db->prepare('
        INSERT INTO submissions (assignment, student, type, textContent, codeContent, filePath, submittedAt, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), NOW())
    ');
    $stmt->execute([$id, $user['id'], $type, $textContent, $codeContent, $filePath]);
    $submissionId = (int) $db->lastInsertId();

    $subRow = $db->prepare('SELECT * FROM submissions WHERE id = ?');
    $subRow->execute([$submissionId]);
    $sub = $subRow->fetch();
    if ($sub) { $sub['_id'] = (string) $sub['id']; }

    jsonResponse(['success' => true, 'message' => 'Assignment submitted successfully', 'submission' => $sub], 201);
}

// ── getSubmissions ────────────────────────────────────────────────────────────
function getSubmissions(int $id): void {
    $user       = getAuthUser();
    $assignment = fetchAssignmentById($id);
    if (!$assignment) errorResponse('Assignment not found', 404);
    ensureAssignmentAccess($assignment, $user);

    $db   = getDb();
    $stmt = $db->prepare('
        SELECT s.*, u.name AS studentName, u.email AS studentEmail
        FROM submissions s
        LEFT JOIN users u ON u.id = s.student
        WHERE s.assignment = ?
        ORDER BY s.submittedAt DESC
    ');
    $stmt->execute([$id]);
    $items = $stmt->fetchAll();
    foreach ($items as &$s) {
        $s['_id']     = (string) $s['id'];
        $s['student'] = [
            '_id'   => (string) $s['student'],
            'name'  => $s['studentName'] ?? '',
            'email' => $s['studentEmail'] ?? ''
        ];
    }
    unset($s);

    jsonResponse(['success' => true, 'count' => count($items), 'submissions' => $items]);
}

// ── getMySubmissions ──────────────────────────────────────────────────────────
function getMySubmissions(): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('
        SELECT s.*, a.title AS assignmentTitle, a.course, a.type AS assignmentType, a.dueDate, a.maxMarks
        FROM submissions s
        LEFT JOIN assignments a ON a.id = s.assignment
        WHERE s.student = ?
        ORDER BY s.submittedAt DESC
    ');
    $stmt->execute([$user['id']]);
    $items = $stmt->fetchAll();
    foreach ($items as &$s) {
        $s['_id'] = (string) $s['id'];
        $s['assignment'] = [
            '_id'     => (string) $s['assignment'],
            'title'   => $s['assignmentTitle'] ?? '',
            'course'  => $s['course'],
            'type'    => $s['assignmentType'],
            'dueDate' => $s['dueDate'],
            'maxMarks'=> $s['maxMarks']
        ];
    }
    unset($s);

    jsonResponse(['success' => true, 'count' => count($items), 'submissions' => $items]);
}

// ── gradeSubmission ───────────────────────────────────────────────────────────
function gradeSubmission(int $id): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('
        SELECT s.*, a.createdBy AS assignmentCreatedBy
        FROM submissions s
        LEFT JOIN assignments a ON a.id = s.assignment
        WHERE s.id = ?
    ');
    $stmt->execute([$id]);
    $submission = $stmt->fetch();
    if (!$submission) errorResponse('Submission not found', 404);

    if ($user['role'] !== 'admin' && (string) $submission['assignmentCreatedBy'] !== (string) $user['id']) {
        errorResponse('You can only manage assignments that you created', 403);
    }

    $body     = getBody();
    $grade    = $body['grade'] ?? null;
    $feedback = $body['feedback'] ?? null;

    $db->prepare('UPDATE submissions SET grade = ?, feedback = ?, updatedAt = NOW() WHERE id = ?')
       ->execute([$grade, $feedback, $id]);

    $subRow = $db->prepare('SELECT * FROM submissions WHERE id = ?');
    $subRow->execute([$id]);
    $sub = $subRow->fetch();
    if ($sub) { $sub['_id'] = (string) $sub['id']; }

    jsonResponse(['success' => true, 'message' => 'Submission graded', 'submission' => $sub]);
}
