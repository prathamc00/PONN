<?php
/**
 * Test (Quiz) Controller
 * Full PHP port of modules/test/test.controller.js
 */

require_once __DIR__ . '/../certificate/CertificateController.php';

function canManageTest(array $test, array $user): bool {
    return $user['role'] === 'admin' || (string) $test['createdBy'] === (string) $user['id'];
}

function ensureTestAccess(array $test, array $user): void {
    if (!canManageTest($test, $user)) {
        errorResponse('You can only manage quizzes that you created', 403);
    }
}

function fetchTestById(int $id): ?array {
    $db   = getDb();
    $stmt = $db->prepare('
        SELECT t.*, c.title AS courseTitle
        FROM tests t
        LEFT JOIN courses c ON c.id = t.course
        WHERE t.id = ?
    ');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    $row['questions'] = json_decode($row['questions'] ?? '[]', true) ?? [];
    $row['Course']    = ['title' => $row['courseTitle'] ?? ''];
    $row['_id']       = (string) $row['id'];
    $row['course']    = (string) $row['course'];
    return $row;
}

// ── getManagedTests ────────────────────────────────────────────────────────────
function getManagedTests(): void {
    $user = getAuthUser();
    $db   = getDb();

    $filter = $user['role'] === 'admin' ? '' : 'WHERE t.createdBy = ?';
    $params = $user['role'] === 'admin' ? [] : [$user['id']];

    $stmt = $db->prepare("SELECT t.*, c.title AS courseTitle FROM tests t LEFT JOIN courses c ON c.id = t.course $filter ORDER BY t.startTime DESC");
    $stmt->execute($params);
    $tests = $stmt->fetchAll();
    foreach ($tests as &$t) { 
        $t['questions'] = json_decode($t['questions'] ?? '[]', true) ?? []; 
        $t['_id']       = (string) $t['id'];
        $t['course']    = (string) $t['course'];
    }
    unset($t);

    jsonResponse(['success' => true, 'count' => count($tests), 'tests' => $tests]);
}

// ── getTests ───────────────────────────────────────────────────────────────────
function getTests(): void {
    $user    = getAuthUser();
    $isAdmin = $user && $user['role'] === 'admin';
    $db      = getDb();

    $stmt = $db->query('SELECT t.*, c.title AS courseTitle FROM tests t LEFT JOIN courses c ON c.id = t.course ORDER BY t.startTime DESC');
    $tests = $stmt->fetchAll();

    foreach ($tests as &$t) {
        $questions = json_decode($t['questions'] ?? '[]', true) ?? [];
        $t['questions'] = $isAdmin ? $questions : array_map(fn($q) => ['question' => $q['question'], 'options' => $q['options']], $questions);
        $t['_id']       = (string) $t['id'];
        $t['course']    = (string) $t['course'];
    }
    unset($t);

    jsonResponse(['success' => true, 'count' => count($tests), 'tests' => $tests]);
}

// ── getTestById ────────────────────────────────────────────────────────────────
function getTestById(int $id): void {
    $user    = getAuthUser();
    $isAdmin = $user && $user['role'] === 'admin';
    $test    = fetchTestById($id);
    if (!$test) errorResponse('Test not found', 404);

    if (!$isAdmin) {
        $test['questions'] = array_map(
            fn($q) => ['question' => $q['question'], 'options' => $q['options']],
            $test['questions']
        );
    }

    jsonResponse(['success' => true, 'test' => $test]);
}

// ── createTest ─────────────────────────────────────────────────────────────────
function createTest(): void {
    $user = getAuthUser();
    $body = getBody();
    $db   = getDb();

    $courseId = (int) ($body['course'] ?? 0);
    $courseRow = $db->prepare('SELECT id, createdBy FROM courses WHERE id = ?');
    $courseRow->execute([$courseId]);
    $course = $courseRow->fetch();
    if (!$course) errorResponse('Course not found', 404);

    if ($user['role'] !== 'admin' && (string) $course['createdBy'] !== (string) $user['id']) {
        errorResponse('You can only create quizzes for your own courses', 403);
    }

    $questions     = $body['questions'] ?? [];
    $totalQuestions = is_array($questions) ? count($questions) : 0;

    $stmt = $db->prepare('
        INSERT INTO tests (title, course, questions, totalQuestions, durationMinutes, startTime, endTime, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ');
    $stmt->execute([
        $body['title'] ?? '',
        $courseId,
        json_encode($questions),
        $totalQuestions,
        $body['durationMinutes'] ?? 30,
        $body['startTime'] ?? null,
        $body['endTime'] ?? null,
        $user['id'],
    ]);

    $testId = (int) $db->lastInsertId();
    $test   = fetchTestById($testId);
    jsonResponse(['success' => true, 'message' => 'Test created', 'test' => $test], 201);
}

// ── updateTest ─────────────────────────────────────────────────────────────────
function updateTest(int $id): void {
    $user = getAuthUser();
    $test = fetchTestById($id);
    if (!$test) errorResponse('Test not found', 404);
    ensureTestAccess($test, $user);

    $body = getBody();
    $db   = getDb();

    if (isset($body['course']) && (string) $body['course'] !== (string) $test['course']) {
        $cr = $db->prepare('SELECT id, createdBy FROM courses WHERE id = ?');
        $cr->execute([(int) $body['course']]);
        $c = $cr->fetch();
        if (!$c) errorResponse('Course not found', 404);
        if ($user['role'] !== 'admin' && (string) $c['createdBy'] !== (string) $user['id']) {
            errorResponse('You can only create quizzes for your own courses', 403);
        }
    }

    $sets   = ['updatedAt = NOW()'];
    $params = [];

    foreach (['title', 'course', 'durationMinutes', 'startTime', 'endTime'] as $f) {
        if (array_key_exists($f, $body)) { $sets[] = "$f = ?"; $params[] = $body[$f]; }
    }
    if (isset($body['questions']) && is_array($body['questions'])) {
        $sets[]   = 'questions = ?';
        $params[] = json_encode($body['questions']);
        $sets[]   = 'totalQuestions = ?';
        $params[] = count($body['questions']);
    }

    $params[] = $id;
    $db->prepare('UPDATE tests SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);

    $updated = fetchTestById($id);
    jsonResponse(['success' => true, 'message' => 'Test updated', 'test' => $updated]);
}

// ── deleteTest ─────────────────────────────────────────────────────────────────
function deleteTest(int $id): void {
    $user = getAuthUser();
    $test = fetchTestById($id);
    if (!$test) errorResponse('Test not found', 404);
    ensureTestAccess($test, $user);

    $db = getDb();
    $db->prepare('DELETE FROM quiz_attempts WHERE quiz = ?')->execute([$id]);
    $db->prepare('DELETE FROM tests WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'Test deleted']);
}

// ── startQuiz ──────────────────────────────────────────────────────────────────
function startQuiz(int $id): void {
    $user = getAuthUser();
    $test = fetchTestById($id);
    if (!$test) errorResponse('Quiz not found', 404);

    $now = new DateTime();
    if ($test['startTime'] && $now < new DateTime($test['startTime'])) {
        errorResponse('Quiz has not started yet');
    }
    if ($test['endTime'] && $now > new DateTime($test['endTime'])) {
        errorResponse('Quiz has ended');
    }

    // ── COURSE COMPLETION GATE ─────────────────────────────────────────────────
    $courseId = (int) $test['course'];
    if ($courseId > 0) {
        $db = getDb();

        // Check student is enrolled
        $enrolled = $db->prepare('SELECT 1 FROM user_courses WHERE userId = ? AND courseId = ?');
        $enrolled->execute([$user['id'], $courseId]);
        if (!$enrolled->fetch()) {
            errorResponse('You must be enrolled in this course to take the quiz.', 403);
        }

        // Fetch course modules
        $courseStmt = $db->prepare('SELECT modules FROM courses WHERE id = ?');
        $courseStmt->execute([$courseId]);
        $courseRow = $courseStmt->fetch();
        $allModules = json_decode($courseRow['modules'] ?? '[]', true) ?? [];
        $totalModules = count($allModules);

        if ($totalModules > 0) {
            // Fetch completed modules for this student
            $progressStmt = $db->prepare('SELECT completedModules FROM course_progress WHERE student = ? AND course = ?');
            $progressStmt->execute([$user['id'], $courseId]);
            $progressRow = $progressStmt->fetch();
            $completedModules = $progressRow ? (json_decode($progressRow['completedModules'], true) ?? []) : [];
            $completedCount = count($completedModules);

            if ($completedCount < $totalModules) {
                errorResponse(
                    "You must complete all course videos before taking this quiz. Progress: {$completedCount}/{$totalModules} lessons completed.",
                    403
                );
            }
        }
    }
    // ── END GATE ───────────────────────────────────────────────────────────────

    $db      = getDb();
    $attempt = $db->prepare('SELECT * FROM quiz_attempts WHERE quiz = ? AND student = ?');
    $attempt->execute([$id, $user['id']]);
    $existing = $attempt->fetch();

    $questions = array_map(fn($q, $i) => ['index' => $i, 'question' => $q['question'], 'options' => $q['options']], $test['questions'], array_keys($test['questions']));

    if ($existing) {
        if ($existing['completedAt']) {
            jsonResponse(['success' => false, 'message' => 'You have already completed this quiz.', 'attempt' => $existing], 409);
        }
        jsonResponse([
            'success'        => true,
            'message'        => 'Quiz resumed',
            'attemptId'      => $existing['id'],
            'startedAt'      => $existing['startedAt'] ? date('c', strtotime($existing['startedAt'])) : date('c'),
            'quizTitle'      => $test['title'],
            'courseName'     => $test['Course']['title'] ?? '',
            'durationMinutes'=> $test['durationMinutes'],
            'endTime'        => $test['endTime'],
            'questions'      => $questions,
        ]);
    }

    $db->prepare('INSERT INTO quiz_attempts (quiz, student, startedAt, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW(), NOW())')
       ->execute([$id, $user['id']]);
    $attemptId = (int) $db->lastInsertId();

    jsonResponse([
        'success'        => true,
        'message'        => 'Quiz started',
        'attemptId'      => $attemptId,
        'startedAt'      => date('c'),
        'quizTitle'      => $test['title'],
        'courseName'     => $test['Course']['title'] ?? '',
        'durationMinutes'=> $test['durationMinutes'],
        'endTime'        => $test['endTime'],
        'questions'      => $questions,
    ]);
}


// ── submitQuiz ────────────────────────────────────────────────────────────────
function submitQuiz(int $id): void {
    $user = getAuthUser();
    $test = fetchTestById($id);
    if (!$test) errorResponse('Quiz not found', 404);

    $db      = getDb();
    $attempt = $db->prepare('SELECT * FROM quiz_attempts WHERE quiz = ? AND student = ?');
    $attempt->execute([$id, $user['id']]);
    $existing = $attempt->fetch();

    if (!$existing) errorResponse('No active attempt found. Start the quiz first.');
    if ($existing['completedAt']) errorResponse('Quiz already submitted', 409);

    $body          = getBody();
    $answers       = $body['answers'] ?? [];
    $tabSwitchCount = (int) ($body['tabSwitchCount'] ?? 0);

    $score       = 0;
    $totalMarks  = count($test['questions']);

    if (is_array($answers)) {
        foreach ($answers as $ans) {
            $qIdx = $ans['questionIndex'] ?? -1;
            $q    = $test['questions'][$qIdx] ?? null;
            if ($q && ($ans['selectedAnswer'] ?? '') === ($q['correctAnswer'] ?? '')) {
                $score++;
            }
        }
    }

    $db->prepare('UPDATE quiz_attempts SET answers = ?, score = ?, totalMarks = ?, tabSwitchCount = ?, completedAt = NOW(), updatedAt = NOW() WHERE id = ?')
       ->execute([json_encode($answers), $score, $totalMarks, $tabSwitchCount, $existing['id']]);

    $percentage  = $totalMarks > 0 ? round(($score / $totalMarks) * 100) : 0;
    $certificate = null;

    if ($percentage >= 40) {
        $certificate = autoIssueCertificate($user['id'], $id);
        createNotificationHelper(
            $user['id'],
            'Certificate Earned 🏆',
            'Congratulations! You passed the quiz for ' . $test['title'] . ' with a score of ' . $percentage . '%. Your certificate is ready.',
            'success',
            '/certificate'
        );
    }

    jsonResponse([
        'success'        => true,
        'message'        => 'Quiz submitted successfully',
        'score'          => $score,
        'totalMarks'     => $totalMarks,
        'percentage'     => $percentage,
        'tabSwitchCount' => $tabSwitchCount,
        'certificate'    => $certificate ? ['id' => $certificate['id'], 'certificateId' => $certificate['certificateId'], 'grade' => $certificate['grade']] : null,
    ]);
}

// ── retakeQuiz ────────────────────────────────────────────────────────────────
function retakeQuiz(int $id): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('SELECT * FROM quiz_attempts WHERE quiz = ? AND student = ? ORDER BY completedAt DESC LIMIT 1');
    $stmt->execute([$id, $user['id']]);
    $attempt = $stmt->fetch();

    if (!$attempt || !$attempt['completedAt']) {
        errorResponse('No completed attempt found to retake');
    }

    $percentage = $attempt['totalMarks'] > 0 ? ($attempt['score'] / $attempt['totalMarks']) * 100 : 0;
    if ($percentage >= 45) {
        errorResponse('You scored 45% or higher and cannot reattempt this quiz.', 403);
    }

    $db->prepare('DELETE FROM quiz_attempts WHERE quiz = ? AND student = ?')->execute([$id, $user['id']]);
    jsonResponse(['success' => true, 'message' => 'Previous attempt cleared. You can now retake the quiz.']);
}

// ── getMyAttempts ─────────────────────────────────────────────────────────────
function getMyAttempts(): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('
        SELECT qa.*, t.title AS testTitle, t.course, t.durationMinutes, t.startTime, t.endTime, t.totalQuestions, c.title AS courseTitle
        FROM quiz_attempts qa
        LEFT JOIN tests t ON t.id = qa.quiz
        LEFT JOIN courses c ON c.id = t.course
        WHERE qa.student = ?
        ORDER BY qa.completedAt DESC
    ');
    $stmt->execute([$user['id']]);
    $attempts = $stmt->fetchAll();
    foreach ($attempts as &$a) { $a['answers'] = json_decode($a['answers'] ?? '[]', true) ?? []; }
    unset($a);

    jsonResponse(['success' => true, 'count' => count($attempts), 'attempts' => $attempts]);
}

// ── getAllAttempts (Admin) ───────────────────────────────────────────────────
function getAllAttempts(): void {
    $db   = getDb();
    $stmt = $db->query('
        SELECT qa.*, 
               t.title AS testTitle, 
               t.totalQuestions,
               t.course AS courseId,
               u.name AS studentName,
               u.email AS studentEmail,
               c.title AS courseTitle
        FROM quiz_attempts qa
        LEFT JOIN tests t ON t.id = qa.quiz
        LEFT JOIN users u ON u.id = qa.student
        LEFT JOIN courses c ON c.id = t.course
        ORDER BY qa.completedAt DESC
    ');
    $attempts = $stmt->fetchAll();
    foreach ($attempts as &$a) {
        $a['_id'] = (string) $a['id'];
        $a['answers'] = json_decode($a['answers'] ?? '[]', true) ?? [];
        $percentage = $a['totalMarks'] > 0 ? ($a['score'] / $a['totalMarks']) * 100 : 0;
        $a['passed'] = $percentage >= 40;
        $a['student'] = [
            '_id'   => (string) ($a['student'] ?? ''),
            'name'  => $a['studentName'] ?? '',
            'email' => $a['studentEmail'] ?? '',
        ];
        $a['quiz'] = [
            '_id'            => (string) ($a['quiz'] ?? ''),
            'title'          => $a['testTitle'] ?? '',
            'totalQuestions' => (int) ($a['totalQuestions'] ?? 0),
            'course'         => [
                '_id'   => (string) ($a['courseId'] ?? ''),
                'title' => $a['courseTitle'] ?? '',
            ],
        ];
    }
    unset($a);
    jsonResponse(['success' => true, 'count' => count($attempts), 'attempts' => $attempts]);
}

// ── getQuizResults ─────────────────────────────────────────────────────────────
function getQuizResults(int $id): void {
    $user = getAuthUser();
    $test = fetchTestById($id);
    if (!$test) errorResponse('Quiz not found', 404);
    ensureTestAccess($test, $user);

    $db   = getDb();
    $stmt = $db->prepare('
        SELECT qa.*, u.name AS studentName, u.email AS studentEmail
        FROM quiz_attempts qa
        LEFT JOIN users u ON u.id = qa.student
        WHERE qa.quiz = ?
        ORDER BY qa.score DESC
    ');
    $stmt->execute([$id]);
    $attempts = $stmt->fetchAll();
    foreach ($attempts as &$a) { $a['answers'] = json_decode($a['answers'] ?? '[]', true) ?? []; }
    unset($a);

    jsonResponse(['success' => true, 'count' => count($attempts), 'attempts' => $attempts]);
}
