<?php
/**
 * Course Controller
 * Full PHP port of modules/course/course.controller.js
 */

// ── Helpers ───────────────────────────────────────────────────────────────────
function canManageCourse(array $course, array $user): bool {
    return $user['role'] === 'admin' || (string) $course['createdBy'] === (string) $user['id'];
}

function ensureCourseAccess(array $course, array $user): void {
    if (!canManageCourse($course, $user)) {
        errorResponse('You can only manage courses that you created', 403);
    }
}

function fetchCourseById(int $id): ?array {
    $db   = getDb();
    $stmt = $db->prepare('SELECT * FROM courses WHERE id = ?');
    $stmt->execute([$id]);
    $course = $stmt->fetch();
    if ($course && $course['modules']) {
        $course['modules'] = json_decode($course['modules'], true) ?? [];
    } else if ($course) {
        $course['modules'] = [];
    }
    if ($course) {
        $course['_id'] = (string) $course['id'];
    }
    return $course ?: null;
}

// ── getManagedCourses ─────────────────────────────────────────────────────────
function getManagedCourses(): void {
    $user   = getAuthUser();
    $page   = max(1, (int) query('page', 1));
    $limit  = min(100, (int) query('limit', 100));
    $offset = ($page - 1) * $limit;

    $db = getDb();
    if ($user['role'] === 'admin') {
        $count = $db->query('SELECT COUNT(*) FROM courses')->fetchColumn();
        $stmt  = $db->prepare('SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount FROM courses c ORDER BY c.createdAt DESC LIMIT ? OFFSET ?');
        $stmt->execute([$limit, $offset]);
    } else {
        $count = $db->prepare('SELECT COUNT(*) FROM courses WHERE createdBy = ?');
        $count->execute([$user['id']]);
        $count = $count->fetchColumn();
        $stmt  = $db->prepare('SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount FROM courses c WHERE c.createdBy = ? ORDER BY c.createdAt DESC LIMIT ? OFFSET ?');
        $stmt->execute([$user['id'], $limit, $offset]);
    }

    $courses = $stmt->fetchAll();
    foreach ($courses as &$c) {
        $c['_id'] = (string) $c['id'];
        $c['modules'] = json_decode($c['modules'] ?? '[]', true) ?? [];
    }
    unset($c);

    jsonResponse(['success' => true, 'count' => $count, 'page' => $page, 'limit' => $limit, 'courses' => $courses]);
}

// ── getCourses ────────────────────────────────────────────────────────────────
function getCourses(): void {
    $page   = max(1, (int) query('page', 1));
    $limit  = min(100, (int) query('limit', 100));
    $offset = ($page - 1) * $limit;
    $db     = getDb();

    $count   = $db->query('SELECT COUNT(*) FROM courses')->fetchColumn();
    $stmt    = $db->prepare('SELECT c.*, (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) AS enrolledCount FROM courses c ORDER BY c.createdAt DESC LIMIT ? OFFSET ?');
    $stmt->execute([$limit, $offset]);
    $courses = $stmt->fetchAll();
    foreach ($courses as &$c) {
        $c['_id'] = (string) $c['id'];
        $c['modules'] = json_decode($c['modules'] ?? '[]', true) ?? [];
    }
    unset($c);

    jsonResponse(['success' => true, 'count' => (int) $count, 'page' => $page, 'limit' => $limit, 'courses' => $courses]);
}

// ── getCourseById ─────────────────────────────────────────────────────────────
function getCourseById(int $id): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);

    $db      = getDb();
    $isStaff = $user && in_array($user['role'], ['admin', 'instructor'], true);

    $isEnrolled = false;
    $enrolledCount = 0;

    if ($user) {
        $enrStmt = $db->prepare('SELECT COUNT(*) FROM user_courses WHERE courseId = ?');
        $enrStmt->execute([$id]);
        $enrolledCount = (int) $enrStmt->fetchColumn();

        $chk = $db->prepare('SELECT 1 FROM user_courses WHERE userId = ? AND courseId = ?');
        $chk->execute([$user['id'], $id]);
        $isEnrolled = (bool) $chk->fetch();

        $course['isEnrolled']    = $isEnrolled;
        $course['enrolledCount'] = $enrolledCount;
    }

    // Strip video/notes URLs for non-enrolled, non-staff users
    if (!$isStaff && !$isEnrolled && !empty($course['modules'])) {
        $course['modules'] = array_map(function ($m) {
            return [
                'id'          => $m['id'] ?? null,
                'title'       => $m['title'] ?? '',
                'description' => $m['description'] ?? '',
                'duration'    => $m['duration'] ?? '',
                'order'       => $m['order'] ?? 0,
            ];
        }, $course['modules']);
    }

    jsonResponse(['success' => true, 'course' => $course]);
}

// ── createCourse ──────────────────────────────────────────────────────────────
function createCourse(): void {
    $user = getAuthUser();
    $body = getBody();

    $title    = trim($body['title'] ?? '');
    if (!$title) errorResponse('Title is required');

    $modules  = isset($body['modules']) ? json_encode($body['modules']) : '[]';
    $lessons  = isset($body['lessons']) ? (int) $body['lessons'] : (isset($body['modules']) ? count($body['modules']) : 0);

    $db = getDb();
    $stmt = $db->prepare('
        INSERT INTO courses (title, description, category, level, instructor, price, thumbnail, modules, lessons, duration, createdBy, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ');
    $stmt->execute([
        $title,
        $body['description'] ?? '',
        $body['category'] ?? '',
        isset($body['level']) ? strtolower($body['level']) : 'beginner',
        $user['role'] === 'instructor' ? $user['name'] : ($body['instructor'] ?? ''),
        $body['price'] ?? 0,
        $body['thumbnail'] ?? '',
        $modules,
        $lessons,
        $body['duration'] ?? ($body['durationHours'] ? $body['durationHours'] . ' hours' : ''),
        $user['id'],
    ]);

    $courseId = (int) $db->lastInsertId();
    $course   = fetchCourseById($courseId);
    jsonResponse(['success' => true, 'message' => 'Course created', 'course' => $course], 201);
}

// ── updateCourse ──────────────────────────────────────────────────────────────
function updateCourse(int $id): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);
    ensureCourseAccess($course, $user);

    $body  = getBody();
    $sets  = ['updatedAt = NOW()'];
    $params = [];

    $fields = ['title', 'description', 'category', 'level', 'price', 'thumbnail', 'duration'];
    foreach ($fields as $f) {       
        if (array_key_exists($f, $body)) {
            $sets[] = "$f = ?";
            $params[] = $f === 'level' ? strtolower($body[$f]) : $body[$f];
        } else if ($f === 'duration' && array_key_exists('durationHours', $body)) {
            $sets[] = "duration = ?";
            $params[] = $body['durationHours'] . ' hours';
        }
    }

    if ($user['role'] === 'instructor') {
        $sets[] = 'instructor = ?';
        $params[] = $user['name'];
    } elseif (array_key_exists('instructor', $body)) {
        $sets[] = 'instructor = ?';
        $params[] = $body['instructor'];
    }

    if (array_key_exists('modules', $body)) {
        $sets[] = 'modules = ?';
        $params[] = json_encode($body['modules']);
        $sets[] = 'lessons = ?';
        $params[] = count($body['modules']);
    }

    $params[] = $id;
    $db = getDb();
    $db->prepare('UPDATE courses SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($params);

    $updated = fetchCourseById($id);
    jsonResponse(['success' => true, 'message' => 'Course updated', 'course' => $updated]);
}

// ── deleteCourse ──────────────────────────────────────────────────────────────
function deleteCourse(int $id): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);
    ensureCourseAccess($course, $user);

    $db = getDb();
    $db->prepare('DELETE FROM courses WHERE id = ?')->execute([$id]);
    jsonResponse(['success' => true, 'message' => 'Course deleted']);
}

// ── getModules ────────────────────────────────────────────────────────────────
function getModules(int $id): void {
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);

    $modules = $course['modules'] ?? [];
    usort($modules, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    jsonResponse(['success' => true, 'courseTitle' => $course['title'], 'count' => count($modules), 'modules' => $modules]);
}

// ── addModule ─────────────────────────────────────────────────────────────────
function addModule(int $id): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);
    ensureCourseAccess($course, $user);

    $body    = getBody();
    $modules = $course['modules'] ?? [];
    $uuid    = bin2hex(random_bytes(16));

    $moduleData = [
        'id'          => $uuid,
        'title'       => $body['title'] ?? '',
        'description' => $body['description'] ?? '',
        'duration'    => $body['duration'] ?? '',
        'order'       => isset($body['order']) ? (int) $body['order'] : count($modules),
    ];

    // Handle video/notes file uploads
    if (!empty($_FILES['video']['error']) === false && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        $dest = saveUpload($_FILES['video'], 'videos');
        $moduleData['videoUrl'] = 'uploads/videos/' . $dest;
    }
    if (!empty($_FILES['notes']['error']) === false && $_FILES['notes']['error'] === UPLOAD_ERR_OK) {
        $dest = saveUpload($_FILES['notes'], 'notes');
        $moduleData['notesUrl'] = 'uploads/notes/' . $dest;
    }

    $modules[] = $moduleData;
    $db = getDb();
    $db->prepare('UPDATE courses SET modules = ?, lessons = ?, updatedAt = NOW() WHERE id = ?')
       ->execute([json_encode($modules), count($modules), $id]);

    $updated = fetchCourseById($id);
    jsonResponse(['success' => true, 'message' => 'Lesson added', 'course' => $updated], 201);
}

// ── updateModule ──────────────────────────────────────────────────────────────
function updateModule(int $id, string $moduleId): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);
    ensureCourseAccess($course, $user);

    $modules  = $course['modules'] ?? [];
    $modIndex = -1;
    foreach ($modules as $i => $m) {
        if ((string) ($m['id'] ?? '') === $moduleId) { $modIndex = $i; break; }
    }
    if ($modIndex === -1) errorResponse('Module not found', 404);

    $mod  = $modules[$modIndex];
    $body = getBody();

    if (isset($body['title']))       $mod['title']       = $body['title'];
    if (isset($body['description'])) $mod['description'] = $body['description'];
    if (isset($body['duration']))    $mod['duration']    = $body['duration'];
    if (isset($body['order']))       $mod['order']       = (int) $body['order'];

    if (!empty($_FILES['video']['error']) === false && $_FILES['video']['error'] === UPLOAD_ERR_OK) {
        $dest = saveUpload($_FILES['video'], 'videos');
        $mod['videoUrl'] = 'uploads/videos/' . $dest;
    }
    if (!empty($_FILES['notes']['error']) === false && $_FILES['notes']['error'] === UPLOAD_ERR_OK) {
        $dest = saveUpload($_FILES['notes'], 'notes');
        $mod['notesUrl'] = 'uploads/notes/' . $dest;
    }

    $modules[$modIndex] = $mod;
    $db = getDb();
    $db->prepare('UPDATE courses SET modules = ?, updatedAt = NOW() WHERE id = ?')
       ->execute([json_encode($modules), $id]);

    $updated = fetchCourseById($id);
    jsonResponse(['success' => true, 'message' => 'Lesson updated', 'course' => $updated]);
}

// ── deleteModule ──────────────────────────────────────────────────────────────
function deleteModule(int $id, string $moduleId): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);
    ensureCourseAccess($course, $user);

    $modules = array_values(array_filter($course['modules'] ?? [], fn($m) => (string)($m['id'] ?? '') !== $moduleId));
    foreach ($modules as $i => &$m) { $m['order'] = $i; }
    unset($m);

    $db = getDb();
    $db->prepare('UPDATE courses SET modules = ?, lessons = ?, updatedAt = NOW() WHERE id = ?')
       ->execute([json_encode($modules), count($modules), $id]);

    $updated = fetchCourseById($id);
    jsonResponse(['success' => true, 'message' => 'Lesson deleted', 'course' => $updated]);
}

// ── reorderModules ────────────────────────────────────────────────────────────
function reorderModules(int $id): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);
    ensureCourseAccess($course, $user);

    $body        = getBody();
    $moduleOrder = $body['moduleOrder'] ?? null;
    if (!is_array($moduleOrder)) errorResponse('moduleOrder must be an array of module IDs');

    $modules = $course['modules'] ?? [];
    foreach ($moduleOrder as $idx => $mid) {
        foreach ($modules as &$m) {
            if ((string) ($m['id'] ?? '') === (string) $mid) {
                $m['order'] = $idx;
                break;
            }
        }
        unset($m);
    }

    $db = getDb();
    $db->prepare('UPDATE courses SET modules = ?, updatedAt = NOW() WHERE id = ?')
       ->execute([json_encode($modules), $id]);

    usort($modules, fn($a, $b) => ($a['order'] ?? 0) <=> ($b['order'] ?? 0));
    jsonResponse(['success' => true, 'message' => 'Lessons reordered', 'modules' => $modules]);
}

// ── enrollCourse ──────────────────────────────────────────────────────────────
function enrollCourse(int $id): void {
    $user   = getAuthUser();
    $db     = getDb();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);

    $chk = $db->prepare('SELECT 1 FROM user_courses WHERE userId = ? AND courseId = ?');
    $chk->execute([$user['id'], $id]);
    if ($chk->fetch()) errorResponse('Already enrolled in this course', 409);

    $db->prepare('INSERT INTO user_courses (userId, courseId, createdAt, updatedAt) VALUES (?, ?, NOW(), NOW())')
       ->execute([$user['id'], $id]);

    // Track attendance
    $db->prepare('INSERT INTO attendances (student, course, activityType, details, createdAt, updatedAt) VALUES (?, ?, ?, ?, NOW(), NOW())')
       ->execute([$user['id'], $id, 'login', 'Enrolled in course: ' . $course['title']]);

    // Create notification
    createNotificationHelper($user['id'], 'Course Enrolled 🎉', 'You have successfully enrolled in ' . $course['title'] . '. Start learning now!', 'success', '/courses/' . $id);

    $count = $db->prepare('SELECT COUNT(*) FROM user_courses WHERE courseId = ?');
    $count->execute([$id]);
    $enrolledCount = (int) $count->fetchColumn();

    jsonResponse(['success' => true, 'message' => 'Enrolled successfully', 'enrolledCount' => $enrolledCount]);
}

// ── unenrollCourse ────────────────────────────────────────────────────────────
function unenrollCourse(int $id): void {
    $user = getAuthUser();
    $db   = getDb();
    $db->prepare('DELETE FROM user_courses WHERE userId = ? AND courseId = ?')->execute([$user['id'], $id]);
    jsonResponse(['success' => true, 'message' => 'Unenrolled successfully']);
}

// ── getMyEnrollments ──────────────────────────────────────────────────────────
function getMyEnrollments(): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('
        SELECT c.* FROM courses c
        JOIN user_courses uc ON uc.courseId = c.id
        WHERE uc.userId = ?
        ORDER BY uc.createdAt DESC
    ');
    $stmt->execute([$user['id']]);
    $courses = $stmt->fetchAll();
    foreach ($courses as &$c) {
        $c['_id'] = (string) $c['id'];
        $c['modules'] = json_decode($c['modules'] ?? '[]', true) ?? [];
    }
    unset($c);

    jsonResponse(['success' => true, 'count' => count($courses), 'courses' => $courses]);
}

// ── getCourseProgress ─────────────────────────────────────────────────────────
function getCourseProgress(int $id): void {
    $user = getAuthUser();
    $db   = getDb();

    $stmt = $db->prepare('SELECT completedModules FROM course_progress WHERE student = ? AND course = ?');
    $stmt->execute([$user['id'], $id]);
    $progress = $stmt->fetch();

    $completedModules = $progress ? (json_decode($progress['completedModules'], true) ?? []) : [];
    jsonResponse(['success' => true, 'completedModules' => $completedModules]);
}

// ── markModuleComplete ────────────────────────────────────────────────────────
function markModuleComplete(int $id, string $moduleId): void {
    $user   = getAuthUser();
    $course = fetchCourseById($id);
    if (!$course) errorResponse('Course not found', 404);

    $mod = null;
    foreach ($course['modules'] ?? [] as $m) {
        if ((string) ($m['id'] ?? '') === $moduleId) { $mod = $m; break; }
    }
    if (!$mod) errorResponse('Module not found', 404);

    $db   = getDb();
    $stmt = $db->prepare('SELECT id, completedModules FROM course_progress WHERE student = ? AND course = ?');
    $stmt->execute([$user['id'], $id]);
    $progress = $stmt->fetch();

    if (!$progress) {
        $db->prepare('INSERT INTO course_progress (student, course, completedModules, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())')
           ->execute([$user['id'], $id, json_encode([$moduleId])]);
        $completed = [$moduleId];
    } else {
        $completed = json_decode($progress['completedModules'], true) ?? [];
        if (!in_array($moduleId, array_map('strval', $completed), true)) {
            $completed[] = $moduleId;
            $db->prepare('UPDATE course_progress SET completedModules = ?, updatedAt = NOW() WHERE id = ?')
               ->execute([json_encode($completed), $progress['id']]);
        }
    }

    jsonResponse(['success' => true, 'message' => 'Module marked as complete', 'completedModules' => $completed]);
}

// ── saveUpload helper ─────────────────────────────────────────────────────────
function saveUpload(array $file, string $folder): string {
    $dir = __DIR__ . '/../../../uploads/' . $folder . '/';
    if (!is_dir($dir)) mkdir($dir, 0755, true);
    $ext      = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    // Security: Whitelist allowed file extensions
    $allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'mp4', 'webm', 'jpg', 'jpeg', 'png'];
    if (!in_array($ext, $allowed, true)) {
        errorResponse('Invalid file type. Allowed: ' . implode(', ', $allowed), 400);
    }
    
    $filename = bin2hex(random_bytes(8)) . '_' . time() . '.' . $ext;
    move_uploaded_file($file['tmp_name'], $dir . $filename);
    return $filename;
}
