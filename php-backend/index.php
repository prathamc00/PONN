<?php

// ── Load environment & bootstrap ─────────────────────────────────────────────
require_once __DIR__ . '/config/env.php';
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/helpers/monitoring.php';
require_once __DIR__ . '/middleware/cors.php';
require_once __DIR__ . '/middleware/security.php';
require_once __DIR__ . '/middleware/auth.php';
require_once __DIR__ . '/middleware/rateLimit.php';
require_once __DIR__ . '/helpers/response.php';
require_once __DIR__ . '/helpers/jwt.php';

registerMonitoringHandlers();
enforceHttpsIfRequired();

// ── Controllers ───────────────────────────────────────────────────────────────
require_once __DIR__ . '/modules/auth/AuthController.php';
require_once __DIR__ . '/modules/otp/OtpController.php';
require_once __DIR__ . '/modules/course/CourseController.php';
require_once __DIR__ . '/modules/assignment/AssignmentController.php';
require_once __DIR__ . '/modules/test/TestController.php';
require_once __DIR__ . '/modules/certificate/CertificateController.php';
require_once __DIR__ . '/modules/user/UserController.php';
require_once __DIR__ . '/modules/attendance/AttendanceController.php';
require_once __DIR__ . '/modules/notification/NotificationController.php';

// ── Apply CORS ────────────────────────────────────────────────────────────────
applyCors();
applySecurityHeaders();

// ── Handle preflight OPTIONS ──────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Apply global rate limit (300 req / 15 min per IP) ────────────────────────
checkRateLimit('global', 300, 15 * 60);

// ── Parse request ─────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$uri    = '/' . ltrim($uri, '/');

// Strip /portal prefix if backend is in a subdirectory named portal
$uri = preg_replace('#^/portal#', '', $uri);
if (empty($uri)) $uri = '/';

// Strip a /api prefix if the backend lives at /api (adjust if at root)
// On Hostinger, if the backend is at domain.com/api/, uncomment the line below:
// $uri = preg_replace('#^/api#', '', $uri) ?: '/';

// ── Route table ───────────────────────────────────────────────────────────────
$routes = [
    // ----- OTP ----------------------------------------------------------------
    ['POST', '#^/api/otp/send$#',           function() { sendEmailOtp(); }],
    ['POST', '#^/api/otp/verify$#',         function() { verifyEmailOtp(); }],

    // ----- AUTH ---------------------------------------------------------------
    ['POST', '#^/api/auth/register$#',                  function() { register(); }],
    ['POST', '#^/api/auth/login$#',                     function() { login(); }],
    ['POST', '#^/api/auth/instructor/register$#',       function() { registerInstructor(); }],
    ['POST', '#^/api/auth/instructor/login$#',          function() { loginInstructor(); }],
    ['GET',  '#^/api/auth/me$#',                        function() { protect(); getMe(); }],
    ['PUT',  '#^/api/auth/me$#',                        function() { protect(); updateProfile(); }],
    ['POST', '#^/api/auth/me/aadhaar$#',                function() { protect(); uploadAadhaar(); }],
    ['POST', '#^/api/auth/me/enroll/(?P<courseId>\d+)$#', function($m) { protect(); enrollCourseAuth($m['courseId']); }],
    ['POST', '#^/api/auth/forgot-password$#',           function() { forgotPassword(); }],
    ['GET',  '#^/api/auth/reset-password/validate$#',   function() { validateResetToken(); }],
    ['POST', '#^/api/auth/reset-password$#',            function() { resetPassword(); }],

    // ----- COURSES ------------------------------------------------------------
    ['GET',  '#^/api/courses/manage$#',    function() { protect(); staffOnly(); getManagedCourses(); }],
    ['GET',  '#^/api/courses/my-enrollments$#',         function() { protect(); getMyEnrollments(); }],
    ['GET',  '#^/api/courses$#',            function() { optionalAuth(); getCourses(); }],
    ['POST', '#^/api/courses$#',            function() { protect(); staffOnly(); createCourse(); }],
    ['GET',  '#^/api/courses/(?P<id>[^/]+)$#',       function($m) { optionalAuth(); getCourseById($m['id']); }],
    ['PUT',  '#^/api/courses/(?P<id>[^/]+)$#',       function($m) { protect(); staffOnly(); updateCourse($m['id']); }],
    ['DELETE','#^/api/courses/(?P<id>[^/]+)$#',      function($m) { protect(); staffOnly(); deleteCourse($m['id']); }],
    ['GET',  '#^/api/courses/(?P<id>[^/]+)/modules$#',      function($m) { protect(); getModules($m['id']); }],
    ['POST',  '#^/api/courses/(?P<id>[^/]+)/modules$#',      function($m) { protect(); staffOnly(); addModule($m['id']); }],
    ['PUT',   '#^/api/courses/(?P<id>[^/]+)/modules/(?P<moduleId>[^/]+)$#', function($m) { protect(); staffOnly(); updateModule($m['id'], $m['moduleId']); }],
    ['DELETE','#^/api/courses/(?P<id>[^/]+)/modules/(?P<moduleId>[^/]+)$#',function($m) { protect(); staffOnly(); deleteModule($m['id'], $m['moduleId']); }],
    ['PUT',   '#^/api/courses/(?P<id>[^/]+)/modules/reorder$#', function($m) { protect(); staffOnly(); reorderModules($m['id']); }],
    ['POST',  '#^/api/courses/(?P<id>[^/]+)/enroll$#',   function($m) { protect(); enrollCourse($m['id']); }],
    ['DELETE','#^/api/courses/(?P<id>[^/]+)/enroll$#',  function($m) { protect(); unenrollCourse($m['id']); }],
    ['GET',   '#^/api/courses/(?P<id>[^/]+)/progress$#', function($m) { protect(); getCourseProgress($m['id']); }],
    ['POST',  '#^/api/courses/(?P<id>[^/]+)/modules/(?P<moduleId>[^/]+)/complete$#', function($m) { protect(); markModuleComplete($m['id'], $m['moduleId']); }],

    // ----- ASSIGNMENTS --------------------------------------------------------
    ['GET',   '#^/api/assignments/manage$#',    function() { protect(); staffOnly(); getManagedAssignments(); }],
    ['GET',   '#^/api/assignments/my-submissions$#',         function() { protect(); getMySubmissions(); }],
    ['GET',   '#^/api/assignments$#',            function() { protect(); getAssignments(); }],
    ['POST',  '#^/api/assignments$#',            function() { protect(); staffOnly(); createAssignment(); }],
    ['GET',   '#^/api/assignments/(?P<id>[^/]+)$#',       function($m) { protect(); getAssignmentById($m['id']); }],
    ['PUT',   '#^/api/assignments/(?P<id>[^/]+)$#',       function($m) { protect(); staffOnly(); updateAssignment($m['id']); }],
    ['DELETE','#^/api/assignments/(?P<id>[^/]+)$#',      function($m) { protect(); staffOnly(); deleteAssignment($m['id']); }],
    ['POST',  '#^/api/assignments/(?P<id>[^/]+)/submit$#',function($m) { protect(); submitAssignment($m['id']); }],
    ['GET',   '#^/api/assignments/(?P<id>[^/]+)/submissions$#', function($m) { protect(); staffOnly(); getSubmissions($m['id']); }],

    // ----- SUBMISSIONS --------------------------------------------------------
    ['PUT',   '#^/api/submissions/(?P<id>[^/]+)/grade$#', function($m) { protect(); staffOnly(); gradeSubmission($m['id']); }],

    // ----- TESTS (QUIZ) -------------------------------------------------------
    ['GET',   '#^/api/tests/manage$#',  function() { protect(); staffOnly(); getManagedTests(); }],
    ['GET',   '#^/api/tests$#',          function() { protect(); getTests(); }],
    ['POST',  '#^/api/tests$#',          function() { protect(); staffOnly(); createTest(); }],
    ['GET',   '#^/api/tests/(?P<id>[^/]+)$#',         function($m) { protect(); getTestById($m['id']); }],
    ['PUT',   '#^/api/tests/(?P<id>[^/]+)$#',         function($m) { protect(); staffOnly(); updateTest($m['id']); }],
    ['DELETE','#^/api/tests/(?P<id>[^/]+)$#',        function($m) { protect(); staffOnly(); deleteTest($m['id']); }],
    ['POST',  '#^/api/tests/(?P<id>[^/]+)/start$#',   function($m) { protect(); startQuiz($m['id']); }],
    ['POST',  '#^/api/tests/(?P<id>[^/]+)/submit$#',  function($m) { protect(); submitQuiz($m['id']); }],
    ['POST',  '#^/api/tests/(?P<id>[^/]+)/retake$#',  function($m) { protect(); retakeQuiz($m['id']); }],
    ['GET',   '#^/api/tests/(?P<id>[^/]+)/results$#', function($m) { protect(); staffOnly(); getQuizResults($m['id']); }],

    // ----- QUIZ ATTEMPTS -------------------------------------------------------
    ['GET',   '#^/api/quiz-attempts$#',     function() { protect(); adminOnly(); getAllAttempts(); }],
    ['GET',   '#^/api/tests/my-attempts$#', function() { protect(); getMyAttempts(); }],

    // ----- CERTIFICATES -------------------------------------------------------
    ['GET',   '#^/api/certificates/my-certificates$#',                function() { protect(); getMyCertificates(); }],
    ['GET',   '#^/api/certificates/verify/(?P<certId>[^/]+)$#', function($m) { verifyCertificate($m['certId']); }],
    ['GET',   '#^/api/certificates$#',                   function() { protect(); adminOnly(); getCertificates(); }],
    ['POST',  '#^/api/certificates$#',                   function() { protect(); adminOnly(); createCertificate(); }],
    ['GET',   '#^/api/certificates/(?P<id>[^/]+)$#',       function($m) { protect(); getCertificateById($m['id']); }],
    ['DELETE','#^/api/certificates/(?P<id>[^/]+)$#',      function($m) { protect(); adminOnly(); deleteCertificate($m['id']); }],

    // ----- USERS --------------------------------------------------------------
    ['GET',    '#^/api/users$#',                               function() { protect(); adminOnly(); getUsers(); }],
    ['POST',   '#^/api/users/instructor$#',                    function() { protect(); adminOnly(); addInstructor(); }],
    ['DELETE', '#^/api/users/(?P<id>[^/]+)$#',                   function($m) { protect(); adminOnly(); deleteUser($m['id']); }],
    ['PUT',    '#^/api/users/(?P<id>[^/]+)/approval$#',          function($m) { protect(); adminOnly(); updateInstructorStatus($m['id']); }],
    ['PUT',    '#^/api/users/(?P<id>[^/]+)/aadhaar-verify$#',    function($m) { protect(); adminOnly(); verifyAadhaar($m['id']); }],
    ['POST',   '#^/api/users/(?P<id>[^/]+)/quiz-attempts/reset$#', function($m) { protect(); adminOnly(); resetUserQuizAttempts($m['id']); }],
    ['GET',    '#^/api/users/export/csv$#',                    function() { protect(); adminOnly(); exportUsersCSV(); }],

    // ----- ATTENDANCE ---------------------------------------------------------
    ['POST',  '#^/api/attendance$#',                               function() { protect(); trackActivity(); }],
    ['GET',   '#^/api/attendance/my$#',                            function() { protect(); getMyAttendance(); }],
    ['GET',   '#^/api/attendance/course/(?P<courseId>[^/]+)$#',      function($m) { protect(); staffOnly(); getCourseAttendance($m['courseId']); }],
    ['GET',  '#^/api/attendance$#',                               function() { protect(); adminOnly(); getAllAttendance(); }],

    // ----- NOTIFICATIONS ------------------------------------------------------
    ['GET', '#^/api/notifications$#',                          function() { protect(); getMyNotifications(); }],
    ['PUT', '#^/api/notifications/(?P<id>\d+)/read$#',         function($m) { protect(); markAsRead($m['id']); }],
    ['PUT', '#^/api/notifications/read-all$#',                 function() { protect(); markAllAsRead(); }],

    // ----- HEALTH CHECK -------------------------------------------------------
    ['GET', '#^/$#',      function() { jsonResponse(['message' => 'Student Learning Portal API is running'], 200); }],
    ['GET', '#^/api$#',   function() { jsonResponse(['message' => 'Student Learning Portal API is running'], 200); }],
];

// ── Router ────────────────────────────────────────────────────────────────────
$matched = false;
foreach ($routes as [$routeMethod, $pattern, $handler]) {
    if ($method !== $routeMethod) continue;
    if (preg_match($pattern, $uri, $matches)) {
        $matched = true;
        // Filter numeric keys from preg_match results
        $namedMatches = array_filter($matches, fn($k) => !is_int($k), ARRAY_FILTER_USE_KEY);
        $handler($namedMatches);
        break;
    }
}

if (!$matched) {
    jsonResponse(['success' => false, 'message' => 'Route not found'], 404);
}
