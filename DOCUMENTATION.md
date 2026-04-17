# 📘 CRISMATECH E-Learning Portal — Detailed Technical Documentation

> This document explains the full technical architecture, data flows, and system design of the portal in depth.
> For a quick setup guide, see [README.md](./README.md).

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Frontend Structure & Routing](#2-frontend-structure--routing)
3. [Authentication System](#3-authentication-system)
4. [API Communication Layer](#4-api-communication-layer)
5. [PHP Backend Router](#5-php-backend-router)
6. [OTP Registration Flow](#6-otp-registration-flow)
7. [Course & Module System](#7-course--module-system)
8. [Quiz System & Completion Gate](#8-quiz-system--completion-gate)
9. [Certificate System](#9-certificate-system)
10. [Role-Based Access Control](#10-role-based-access-control)
11. [Assignment & Grading System](#11-assignment--grading-system)
12. [Security Architecture](#12-security-architecture)
13. [Email System](#13-email-system)
14. [Deployment Architecture](#14-deployment-architecture)
15. [End-to-End Data Flow Example](#15-end-to-end-data-flow-example)
16. [Technology Stack Rationale](#16-technology-stack-rationale)

---

## 1. Project Overview

The **CRISMATECH E-Learning Portal** is a complete Learning Management System (LMS) built from scratch — no CMS, no framework boilerplate. It is a full-stack project consisting of:

- A **React 19 + Vite** Single Page Application (SPA) served as static files
- A **PHP 8.x REST API** with a custom router — no Laravel, no Symfony
- A **MySQL** relational database
- Hosted on **Hostinger** shared hosting under the `/portal/` subdirectory

### System Architecture

```
Browser (Student / Instructor / Admin)
        │
        │secure HTTPS requests
        ▼
┌──────────────────────────┐
│   React Frontend (SPA)   │  ← Runs inside the user's browser
│  Vite, TypeScript, TW    │
└──────────┬───────────────┘
           │ fetch() API calls  (Authorization: Bearer <JWT>)
           ▼
┌──────────────────────────┐
│     PHP API         │  ← Runs on the web server (Apache + PHP 8)
│   index.php → Router     │
│   modules / controllers  │
└──────────┬───────────────┘
           │ PDO SQL queries
           ▼
┌──────────────────────────┐
│      MySQL Database      │  ← Hostinger managed MySQL
│  users, courses, tests   │
│  certificates, progress  │
└──────────────────────────┘
```

---

## 2. Frontend Structure & Routing

### Entry Point Chain

```
Browser loads index.html
    └── loads /assets/index-[hash].js  (Vite bundle)
        └── main.tsx → ReactDOM.createRoot → <App />
```

### Full Route Map (`App.tsx`)

```
<AuthProvider>          ← Provides user, login(), logout() to all components
  <ThemeProvider>       ← Provides dark/light mode toggle
    <BrowserRouter basename="/portal/">   ← All URLs prefixed with /portal/ in production
      │
      ├── /                    → HomePage        (landing page, public)
      ├── /login               → LoginPage       (public)
      ├── /register            → RegisterPage    (OTP 3-step flow, public)
      ├── /forgot-password     → ForgotPasswordPage
      ├── /reset-password      → ResetPasswordPage

      ├── <DashboardLayout>    ← Protected layout (sidebar + header + outlet)
      │    ├── /dashboard      → DashboardPage   (student home with stats)
      │    ├── /courses        → CoursesPage     (browse all courses)
      │    ├── /courses/:id    → CourseDetailPage (video player + module list)
      │    ├── /test           → TestPage        (available quizzes + lock state)
      │    ├── /test/take/:id  → QuizPage        (live quiz with countdown timer)
      │    ├── /test/result    → TestResultPage  (score + certificate info)
      │    ├── /assignments    → AssignmentsPage (view + submit assignments)
      │    ├── /assignments/upload → AssignmentUploadPage
      │    ├── /certificate    → CertificatePage (download certificates)
      │    ├── /attendance     → AttendancePage
      │    └── /profile        → ProfilePage     (edit name, Aadhaar upload)
      │
      └── <AdminLayout>        ← Protected layout (admin/instructor sidebar)
           ├── /admin/dashboard   → AdminDashboard   (role-aware stats)
           ├── /admin/users       → ManageUsers      (admin only)
           ├── /admin/courses     → ManageCourses    (create courses + modules)
           ├── /admin/assignments → ManageAssignments (grade submissions)
           ├── /admin/quiz        → QuizScheduler    (create + schedule quizzes)
           ├── /admin/quiz-results→ QuizResults      (all student attempts)
           ├── /admin/certificates→ AdminCertificates
           ├── /admin/analytics   → AdminAnalytics   (charts + platform stats)
           ├── /admin/activity    → ActivityFeed
           ├── /admin/grading     → GradingQueue
           └── /admin/users/:id   → StudentProfileViewer
```

### Why `basename="/portal/"`

The app is deployed under `https://domain.com/portal/` — not the root. Without `basename`, React Router would generate links like `/courses` which Apache can't find. With `basename`, it generates `/portal/courses` which matches the actual URL. The `BASE_URL` is set in `vite.config.ts` and passed as `import.meta.env.BASE_URL`.

### Page Transitions

Every route is wrapped in `<PageTransition>` which uses **Framer Motion** to animate pages in/out with a fade+slide effect. `AnimatePresence mode="wait"` ensures the old page finishes animating out before the new one appears.

---------- - - - - - - - - - -  - --- -- - - - - - - - - --- -- - -  - - - - -- - - - - - - - - - - - --

## 3. Authentication System

### Login Flow (Step-by-Step)

```
Step 1 — User types email + password → clicks Login

Step 2 — LoginPage.tsx calls:
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });

Step 3 — PHP Backend (AuthController.php → login()):
  ├── Read email + password from request body
  ├── Query: SELECT * FROM users WHERE email = ?
  ├── password_verify($password, $user['password'])  ← bycrypt check
  ├── If instructor: check approvalStatus === 'approved'
  ├── Generate JWT: jwtSign({ id, role }, secret, '7d')
  └── Return: { success: true, token: "eyJ...", user: { id, name, email, role } }

Step 4 — AuthContext.tsx receives response:
  ├── setToken(data.token)     → localStorage.setItem('token', ...)
  ├── setStoredUser(data.user) → localStorage.setItem('user', ...)
  ├── setUser(data.user)       → React state update
  └── navigate('/dashboard')  → React Router redirect

Step 5 — All subsequent API calls automatically include:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Step 6 — Backend verifies on every protected route:
  protect() → getBearerToken() → jwtVerify(token) → loadUserById(id)
  → setAuthUser($user) → controller function runs

Step 7 — Token expiry after 7 days:
  Backend returns 401 Unauthorized
  → apiFetch() detects 401
  → clearAuth() removes token+user from localStorage
  → window.location.href = '/portal/login'
```

### AuthContext State

```tsx
// Available anywhere via: const { user, login, logout } = useAuth()
{
  user: {
    id: 42,
    name: "Prathmesh",
    email: "student@example.com",
    role: "student",         // 'student' | 'instructor' | 'admin'
    approvalStatus: "approved",
    college: "CRISMATECH",
    branch: "Computer Science"
  },
  login(userData, token) { ... },
  logout() { clearAuth(); navigate('/login'); },
  updateUser(newData) { ... }
}
```

### JWT Structure

```
Header: { alg: "HS256", typ: "JWT" }
Payload: { id: 42, role: "student", iat: 1712900000, exp: 1713504800 }
Signature: HMAC-SHA256(base64(header) + "." + base64(payload), JWT_SECRET)
```

---

## 4. API Communication Layer

### `apiFetch()` — The Central HTTP Client

All API calls in the entire frontend go through this one function (`src/utils/api.ts`):

```typescript
apiFetch('/courses', { method: 'GET' })
    │
    ├── 1. Read JWT from localStorage
    │
    ├── 2. Build headers:
    │       Authorization: Bearer <token>
    │       Content-Type: application/json
    │       (skip Content-Type if body is FormData — browser sets multipart)
    │
    ├── 3. Add cache: 'no-store' to prevent stale data
    │
    ├── 4. fetch('https://api.domain.com/api/courses', options)
    │
    ├── 5. Handle 401 Unauthorized:
    │       clearAuth() → redirect to /portal/login
    │       throw Error('Session expired')
    │
    ├── 6. Handle non-OK responses (4xx, 5xx):
    │       parse JSON → throw Error(data.message)
    │
    ├── 7. Handle binary/CSV responses:
    │       return res.blob()  ← for file downloads like CSV export
    │
    └── 8. Parse and return JSON data
```

### Environment Configuration

| Environment | `VITE_API_URL` value |
|---|---|
| Local dev | `http://localhost/php-backend/api` |
| Production | `https://mistyrose-stinkbug-181981.hostingersite.com/api` |

The correct value is automatically selected by Vite based on which `.env` file is active.

---

## 5. PHP Backend Router

### Single Entry Point: `index.php`

Every HTTP request to the backend goes through `index.php`. Here's the exact order of operations:

```
Request arrives → index.php
  │
  ├── 1. require env.php       ← Load .env file into $_ENV
  ├── 2. require db.php        ← Create PDO MySQL connection (singleton pattern)
  ├── 3. require cors.php      ← Set CORS headers (allow frontend domain)
  ├── 4. require auth.php      ← Load auth functions (protect, adminOnly, etc.)
  ├── 5. require rateLimit.php ← Load rate limiting functions
  ├── 6. require response.php  ← Load jsonResponse(), errorResponse(), getBody()
  ├── 7. require jwt.php       ← Load jwtSign(), jwtVerify()
  │
  ├── 8. require all Controllers (AuthController, CourseController, etc.)
  │
  ├── 9. applyCors()           ← Actually send the CORS headers
  │
  ├── 10. OPTIONS check        ← If preflight request → respond 204, exit
  │
  ├── 11. checkRateLimit()     ← 300 requests per 15 min per IP
  │
  ├── 12. Parse URI:
  │        $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
  │        $uri = preg_replace('#^/portal#', '', $uri)  ← strip /portal prefix
  │        // Result: '/api/courses' or '/api/auth/login' etc.
  │
  ├── 13. Loop through $routes array:
  │        foreach ($routes as [$method, $pattern, $handler]) {
  │            if ($method !== $_SERVER['REQUEST_METHOD']) continue;
  │            if (preg_match($pattern, $uri, $matches)) {
  │                $handler($namedMatches);  ← Call the controller function
  │                break;
  │            }
  │        }
  │
  └── 14. No match → 404 Route not found
```

### Route Definition Format

```php
// Each route: [HTTP Method, Regex Pattern, Handler Function]

['GET', '#^/api/courses$#', function() {
    optionalAuth();      // Load user if token exists, don't block if missing
    getCourses();        // Call the controller function
}],

['POST', '#^/api/tests/(?P<id>\d+)/start$#', function($m) {
    protect();           // MUST be logged in or return 401
    startQuiz($m['id']); // $m['id'] = the captured :id from URL
}],

['GET', '#^/api/users$#', function() {
    protect();     // Must be logged in
    adminOnly();   // Must be admin role
    getUsers();
}],
```

### How URL Parameters Are Extracted

```php
// Route pattern: #^/api/courses/(?P<id>\d+)/modules/(?P<moduleId>[^/]+)$#
// URL: /api/courses/42/modules/abc123

// preg_match captures:
$matches = [
    'id'       => '42',
    'moduleId' => 'abc123',
    // + numeric keys (filtered out)
]

// Handler receives only named keys:
function($m) { markModuleComplete($m['id'], $m['moduleId']); }
```

---

## 6. OTP Registration Flow

### Why OTP?

OTP prevents fake registrations with invalid emails and verifies the student actually owns the email address before creating an account.

### Complete 5-Step Flow

```
╔══════════════════════════════════════════════════════╗
║  STEP 1: Fill Registration Form                       ║
║  Name, Email, Password, Phone, College, Branch        ║
║  → Click "Send OTP"                                   ║
╚══════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════╗
║  STEP 2: Backend Sends OTP                            ║
║  POST /api/otp/send { email }                         ║
║                                                       ║
║  OtpController.php → sendEmailOtp():                  ║
║   ① Rate limit: max 20 OTPs / 5 min / IP             ║
║   ② Validate email format (FILTER_VALIDATE_EMAIL)     ║
║   ③ Check email not already in `users` table          ║
║   ④ Delete any existing OTP for this email            ║
║   ⑤ Generate random_int(100000, 999999) → 6 digits   ║
║   ⑥ Save to `otps` table:                            ║
║      { email, code, attempts:0, expiresAt: +5min }   ║
║   ⑦ Send HTML email via PHPMailer + Gmail SMTP        ║
╚══════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════╗
║  STEP 3: User Receives OTP Email                      ║
║  Branded HTML email with large 6-digit code           ║
║  Shows "Code expires in 5 minutes"                    ║
╚══════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════╗
║  STEP 4: User Enters Code + Frontend Verifies         ║
║  POST /api/otp/verify { email, code }                 ║
║                                                       ║
║  OtpController.php → verifyEmailOtp():               ║
║   ① Find OTP row for this email                      ║
║   ② Check current time < expiresAt → else delete+err ║
║   ③ Check attempts <= 5 → else delete + error        ║
║   ④ Compare code → if wrong: increment attempts       ║
║   ⑤ If correct: DELETE otp row → return success ✅   ║
╚══════════════════════════════════════════════════════╝
         │
         ▼
╔══════════════════════════════════════════════════════╗
║  STEP 5: Create Account                               ║
║  POST /api/auth/register { name, email, password, …} ║
║                                                       ║
║  AuthController.php → register():                     ║
║   ① Validate all fields                               ║
║   ② Hash password: password_hash($pw, BCRYPT, 12)    ║
║   ③ INSERT into users table                           ║
║   ④ Generate JWT token                                ║
║   ⑤ Return token + user → auto-login ✅              ║
╚══════════════════════════════════════════════════════╝
```

---

## 7. Course & Module System

### Data Structure

**Course** (`courses` table):
```
id, title, description, category, level, instructor,
thumbnail, modules (JSON), createdBy, createdAt
```

**Modules** — stored as a JSON array inside the `modules` column:
```json
[
  { "_id": "abc1", "title": "Intro to Python", "videoUrl": "/uploads/videos/v1.mp4", "notesUrl": "/uploads/notes/n1.pdf", "order": 1 },
  { "_id": "abc2", "title": "Variables & Types", "videoUrl": "/uploads/videos/v2.mp4", "order": 2 }
]
```

**Course Progress** (`course_progress` table):
```
id, student (userId), course (courseId), completedModules (JSON array of module IDs)
```

### Sequential Video Unlock Logic

```typescript
// CourseDetailPage.tsx
const isModuleUnlocked = (mod: ModuleItem, index: number): boolean => {
  if (index === 0) return true;  // First lesson always accessible
  const prevModule = modules[index - 1];
  return completedModules.includes(String(prevModule._id));
  // Only unlocked if the PREVIOUS module's ID is in completedModules
};
```

**Visual States in the Sidebar:**
- 🔒 Locked — previous lesson not finished
- ▶️ Unlocked — ready to watch
- ✅ Completed — watched and marked done
- 🎬 Active — currently playing (highlighted in purple)

### When Video Ends → Mark Complete

```typescript
// PremiumVideoPlayer fires onEnded
handleVideoEnded() → POST /api/courses/:id/modules/:moduleId/complete

// PHP CourseController → markModuleComplete():
//   1. Get student's progress row
//   2. Decode completedModules JSON array
//   3. Add this moduleId if not already there
//   4. UPDATE course_progress SET completedModules = ?
//   5. Return updated completedModules array

// React updates state → progress bar animates → next lesson unlocks
// If all lessons done → fireConfetti() 🎊
```

---

## 8. Quiz System & Completion Gate

### Course Completion Gate — The Full Server-Side Check

When `POST /api/tests/:id/start` is called:

```php
function startQuiz(int $id): void {
    $user = getAuthUser();
    $test = fetchTestById($id);

    // 1. Check quiz window
    if (now < startTime)  → error "Quiz not started yet"
    if (now > endTime)    → error "Quiz has ended"

    // 2. COMPLETION GATE
    $courseId = $test['course'];
    if ($courseId > 0) {

        // Is student enrolled?
        SELECT 1 FROM user_courses WHERE userId=? AND courseId=?
        if (!enrolled) → 403 "You must be enrolled"

        // How many total modules?
        SELECT modules FROM courses WHERE id=?
        $totalModules = count(json_decode($modules));

        if ($totalModules > 0) {
            // How many has student completed?
            SELECT completedModules FROM course_progress WHERE student=? AND course=?
            $completedCount = count(json_decode($completedModules));

            // THE GATE:
            if ($completedCount < $totalModules) {
                → 403 "Complete all videos first. Progress: 2/5 lessons"
            }
        }
    }

    // 3. Create/resume attempt
    INSERT INTO quiz_attempts (quiz, student, startedAt)
    
    // 4. Return questions (WITHOUT correct answers)
    return shuffled questions with options only
}
```

### Frontend Lock Previews (TestPage.tsx)

```
Quiz Card States:
┌─────────────────────────────────┐
│  [Not Enrolled]                  │
│  🔒 Enroll in course to access   │  ← grey locked button
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  [Enrolled but incomplete]       │
│  🔒 Complete all lessons first   │  ← amber warning
│  ████░░░░░░  2/5 lessons watched │  ← progress bar
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  [100% complete, within window]  │
│  ▶ Start Quiz                    │  ← green gradient button
└─────────────────────────────────┘
```

### After Quiz Submission

```
POST /api/tests/:id/submit { answers: [0, 2, 1, 3, ...] }
    │
    ▼
submitQuiz():
  ├── Load question correct answers from DB (stored but never sent to frontend)
  ├── Compare each submitted answer
  ├── score = count(correct), totalMarks = count(questions)
  ├── UPDATE quiz_attempts SET score, totalMarks, completedAt = NOW()
  │
  ├── percentage = (score / totalMarks) * 100
  ├── If percentage >= 40:
  │     autoIssueCertificate(userId, quizId)
  │       ├── Check no duplicate certificate exists
  │       ├── grade = A+(90+) / A(80+) / B+(70+) / B(60+) / C(50+) / D(40+)
  │       ├── certId = strtoupper(bin2hex(random_bytes(8)))  ← e.g. "A3F9B2C1"
  │       └── INSERT INTO certificates
  │
  └── Return { score, totalMarks, percentage, certificate? }
```

---

## 9. Certificate System

### Certificate Database Record

```
certificates table:
  id, student (userId), course (courseId),
  title         → "Python Basics — Quiz Completion"
  type          → 'quiz_pass' | 'completion'
  grade         → 'A+' | 'A' | 'B+' | 'B' | 'C' | 'D'
  scorePercent  → 73
  certificateId → "A3F9B2C1D4E5F678"  (unique, public-facing ID)
  earnedDate, createdAt, updatedAt
```

### Canvas-Based Certificate Download

Certificates are generated **100% in the browser** — no server involvement:

```javascript
handleDownloadPDF(cert) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200; canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // 1. Dark gradient background (#0F0A2E to #1A1040)
  // 2. Purple border rectangle
  // 3. Corner bracket decorations (4 corners)
  // 4. "CERTIFICATE OF ACHIEVEMENT" heading
  // 5. 🏆 Trophy emoji
  // 6. "This is to certify that" (italic)
  // 7. Student name (large, bold, white)
  // 8. "has successfully completed the assessment for"
  // 9. Course title (purple, bold)
  // 10. Grade badge (rounded rectangle + grade text)
  // 11. Score percentage
  // 12. Horizontal divider line
  // 13. Bottom row: Issue Date | Instructor | Certificate ID
  // 14. Footer: CRISMATECH branding + verify URL

  // Convert to PNG and trigger download:
  const link = document.createElement('a');
  link.download = `Certificate_${cert.certificateId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

### Public Certificate Verification

Any person (employer, university) can verify a certificate's authenticity:
```
GET /api/certificates/verify/A3F9B2C1D4E5F678
← No authentication required
← Returns: student name, course, grade, issue date, instructor
```

---

## 10. Role-Based Access Control

### Three User Roles

| Role | How Created | Capabilities |
|---|---|---|
| `student` | Public `/api/auth/register` | Courses, quizzes, assignments (own), certificates |
| `instructor` | `/api/auth/instructor/register` + admin approval | Manage own courses, assignments, quiz results |
| `admin` | Direct DB insert | Everything — full platform control |

### Instructor Approval Flow

```
Instructor registers → approvalStatus = 'pending'
                ↓
Admin opens ManageUsers → sees pending instructors
                ↓
Admin clicks Approve → PUT /api/users/:id/approval { status: 'approved' }
                ↓
Instructor can now login (ensureApprovedAccess passes)
```

### Backend Guard Functions

```php
protect()
// Checks: JWT exists → valid → user in DB
// Sets $GLOBALS['authUser']
// Returns 401 if anything fails

staffOnly()
// Checks: user is admin → pass
// OR user is instructor AND approvalStatus === 'approved' → pass
// Returns 403 otherwise

adminOnly()
// Checks: user role === 'admin' → pass
// Returns 403 for instructors & students

roleIn('admin', 'instructor')
// Checks: user role is in the given list
```

### Frontend Role Checks

The `AdminDashboard` conditionally renders different stats and quick actions:

```tsx
// Admin sees: Manage Users, Quiz Results (hidden from instructors)
.filter(action => user?.role === 'admin' || !action.adminOnly)

// Stat cards are role-aware:
const statCards = user?.role === 'admin'
  ? [Total Users, Active Courses, Pending Instructors, Completion Rate]
  : [My Courses, My Assignments, Completion Rate, Students Enrolled]
```

---

## 11. Assignment & Grading System

### Three Assignment Types

| Type | Student Submits | Storage |
|---|---|---|
| `file_upload` | Uploads a file (PDF, DOC, ZIP, MP4, etc.) | Saved to `uploads/submissions/` on server |
| `case_study` | Types a long-form text answer | Stored in `textContent` DB column |
| `code` | Pastes code | Stored in `codeContent` DB column |

### File Upload Security

```php
$allowed = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'rar', 'txt', 'png', 'jpg', 'jpeg'];
// Extension whitelist — rejects PHP, JS, EXE etc.

$filename = 'sub_' . $user['id'] . '_' . time() . '.' . $ext;
// Randomized filename prevents overwriting and path traversal
```

### Submission → Grading Pipeline

```
Student: POST /api/assignments/:id/submit
  (multipart/form-data with file OR JSON with text/code)
           ↓
AssignmentController → submitAssignment()
  → Saves to `submissions` table
  → { assignment, student, type, filePath/textContent/codeContent, submittedAt }

Instructor: GET /api/assignments/:id/submissions
  → Lists all students who submitted with their content

Instructor opens grading view (ManageAssignments.tsx)
  → Sees file download link / text content / code block
  → Types grade (0 to maxMarks) + written feedback

Instructor: PUT /api/submissions/:id/grade { grade: 87, feedback: "..." }
  → submission.grade and submission.feedback updated in DB

Student: sees grade and feedback in AssignmentsPage
```

---

## 12. Security Architecture

### 1. Password Storage

```php
// On registration:
$hashed = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
// Stores: "$2y$12$..." in DB — irreversible

// On login:
password_verify($plaintext, $hashed); // Secure constant-time comparison
```

### 2. JWT Security

```
Token lifecycle:
Register/Login → jwtSign({ id, role }, SECRET, '7d') → stored in localStorage
Every request → Authorization: Bearer <token> → jwtVerify() on server
7 days later → token invalid → 401 → force re-login
```

Never store tokens in cookies without `httpOnly` + `SameSite`. This app uses localStorage which is acceptable for this use case.

### 3. CORS Configuration

```php
// cors.php → applyCors()
$allowed = getenv('FRONTEND_URL');  // e.g. https://domain.com

header("Access-Control-Allow-Origin: $allowed");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type");
```

Only the configured frontend domain can make cross-origin requests. All other origins get blocked by the browser.

### 4. Rate Limiting

```php
// Stored in DB: { key, count, windowStart }
// Global: 300 requests / 15 min / IP address
checkRateLimit('global', 300, 15 * 60);

// OTP specific: 20 sends / 5 min / IP
checkRateLimit('otp', 20, 5 * 60);
// Prevents email spam abuse on the register page
```

### 5. SQL Injection Prevention

All database queries use **PDO prepared statements**:
```php
// Safe — parameters are bound, never concatenated:
$stmt = $db->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);

// NEVER done (SQL injection risk):
$db->query("SELECT * FROM users WHERE email = '$email'");
```

---

## 13. Email System

### PHPMailer + Gmail SMTP

```
OtpController / AuthController
         │
         │ calls sendMail($to, $subject, $html)
         ▼
helpers/mailer.php → sendMail()
  ├── $mail = new PHPMailer(true)
  ├── $mail->isSMTP()
  ├── $mail->Host = 'smtp.gmail.com'
  ├── $mail->SMTPAuth = true
  ├── $mail->Username = SMTP_USER  (from .env)
  ├── $mail->Password = SMTP_PASS  (Gmail App Password)
  ├── $mail->SMTPSecure = 'tls'
  ├── $mail->Port = 587
  ├── $mail->setFrom('noreply@crismatech.com', 'CRISMATECH Learning Portal')
  ├── $mail->addAddress($to)
  ├── $mail->isHTML(true)
  ├── $mail->Subject = $subject
  ├── $mail->Body = $html
  └── $mail->send()  → throws RuntimeException on failure
```

### OTP Email HTML Template (`buildOtpEmail($code)`)

The email is a styled HTML document with:
- CRISMATECH branding header (purple gradient)
- Large code block: `{ 1 2 3 4 5 6 }` styled in monospace
- Expiry notice: "This code expires in 5 minutes"
- Security notice: "If you didn't request this, ignore this email"

### Gmail App Password Setup

Regular Gmail password won't work. You need an App Password:
1. Google Account → Security → 2-Step Verification (enable)
2. Google Account → Security → App Passwords
3. Select "Mail" + "Other (custom)" → Generate
4. Copy the 16-character password into `.env` as `SMTP_PASS`

---

## 14. Deployment Architecture

### File Layout on Hostinger

```
Hostinger account
│
├── public_html/              ← Web root (served at https://domain.com/)
│   │
│   ├── [WordPress or other site]
│   │
│   └── portal/              ← React SPA (served at /portal/)
│        ├── .htaccess        ← SPA fallback: redirect all to index.html
│        ├── index.html       ← The React app shell
│        └── assets/
│             ├── index-[hash].js   ← All JS (React, routing, components)
│             └── index-[hash].css  ← All styles
│
├── php-backend/             ← REST API (outside public_html for security)
│   ├── .htaccess             ← Route all requests to index.php
│   ├── index.php             ← Router entry point
│   ├── .env                  ← DB credentials (NEVER publicly accessible)
│   ├── modules/              ← Feature controllers
│   ├── vendor/               ← Composer packages (PHPMailer etc.)
│   └── uploads/
│        ├── videos/          ← Course video files
│        ├── notes/           ← PDF lesson files
│        └── submissions/     ← Student file submissions
│
└── MySQL Database (Hostinger managed)
     Tables:
     ├── users                ← All platform users
     ├── courses              ← Course catalog + JSON modules
     ├── user_courses         ← Enrollment join table
     ├── course_progress      ← Per-student module completion
     ├── tests                ← Quiz definitions + questions
     ├── quiz_attempts        ← Student attempts + scores
     ├── assignments          ← Assignment definitions
     ├── submissions          ← Student submissions + grades
     ├── certificates         ← Issued certificates
     ├── attendance           ← Activity log
     ├── notifications        ← In-app notifications
     └── otps                 ← Temporary OTP codes (auto-deleted)
```

### The `.htaccess` Files Explained

**Frontend (`portal/.htaccess`):**
```apache
RewriteEngine On
RewriteBase /portal/
RewriteCond %{REQUEST_FILENAME} !-f    # If it's NOT a real file
RewriteCond %{REQUEST_FILENAME} !-d    # AND NOT a real directory
RewriteRule ^ index.html [L]           # Serve index.html
```
This makes React Router work. When user visits `/portal/courses/42`, Apache serves `index.html`, React reads the URL, and renders `CourseDetailPage`.

**Backend (`php-backend/.htaccess`):**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.php [L]
```
All API requests go to `index.php` regardless of path.

---

## 15. End-to-End Data Flow Example

**Full scenario: New student → watches course → takes quiz → downloads certificate**

```
DAY 1 — Registration
━━━━━━━━━━━━━━━━━━━
1. Student opens /portal/register
2. Fills form → clicks "Send OTP" → POST /api/otp/send
3. Receives email with code "482916"
4. Enters code → POST /api/otp/verify → ✅ verified
5. Account created → POST /api/auth/register
6. JWT stored in localStorage → redirected to /dashboard

DAY 1 — Course Enrollment
━━━━━━━━━━━━━━━━━━━━━━━━━
7. Browse /courses → clicks "Python Basics"
8. GET /api/courses/12 → sees course info, locked video player
9. Clicks "Enroll Now" → POST /api/courses/12/enroll
   DB: INSERT INTO user_courses (userId=42, courseId=12)
10. Course detail reloads with 5 modules in sidebar

DAY 1 — Watching Lessons
━━━━━━━━━━━━━━━━━━━━━━━━━
11. Module 1 is unlocked → clicks play → video starts
12. Watches full video → fires onEnded()
    POST /api/courses/12/modules/abc1/complete
    DB: completedModules = ["abc1"]
    Progress bar: 1/5 (20%)
13. Module 2 now unlocked → watches it
    POST /api/courses/12/modules/abc2/complete
    DB: completedModules = ["abc1", "abc2"]
    Progress bar: 2/5 (40%)
... (repeat for modules 3, 4, 5)
14. All 5 done → Progress bar: 5/5 (100%) → CONFETTI 🎊

DAY 2 — Taking the Quiz
━━━━━━━━━━━━━━━━━━━━━━━━━
15. Opens /test → sees "Python Basics Quiz" card
    Frontend fetches /api/courses/12/progress → 5/5 complete
    → "Start Quiz" button shown (not locked)
16. Clicks Start → POST /api/tests/7/start
    PHP checks: 5/5 ✅ → creates quiz_attempt (id=99)
    → Returns 10 questions (no correct answers)
17. Navigates to /test/take/7 → QuizPage shows timer + questions
18. Answers all 10 → clicks Submit
    POST /api/tests/7/submit { answers: [1,0,2,3,1,2,0,1,3,2] }

PHP submitQuiz():
  ├── Compares: student got 7/10 correct → 70%
  ├── UPDATE quiz_attempts SET score=7, totalMarks=10, completedAt=NOW()
  ├── 70% >= 40% → autoIssueCertificate(userId=42, quizId=7)
  │     ├── grade = "B+" (70 >= 70)
  │     ├── certId = "A3F9B2C1"
  │     └── INSERT INTO certificates → id=15
  └── Returns { score:7, totalMarks:10, percentage:70, certificate:{...} }

19. Redirected to /test/result → sees score 70% + certificate banner

DAY 2 — Downloading Certificate
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
20. Opens /certificate
    GET /api/certificates/my-certificates
    → Returns certificate row with _id, grade, certificateId, earnedDate

21. Sees certificate card with name, course, grade B+
22. Clicks "Download Certificate"
    → Canvas API generates 1200×850 PNG in browser
    → File downloaded: Certificate_A3F9B2C1.png ✅

23. Employer verifies at:
    GET /api/certificates/verify/A3F9B2C1
    → Returns: "Prathmesh completed Python Basics, Grade B+, Date 2026-04-12"
```

---

## 16. Technology Stack Rationale

| Technology | Why Chosen |
|---|---|
| **React 19** | Component model + hooks = clean, maintainable UI code |
| **TypeScript** | Catches type bugs at compile time; better IDE autocomplete for large codebase |
| **Vite 6** | 10-100x faster than Webpack for dev; instant HMR; optimized production builds |
| **TailwindCSS v4** | Write styles inline — no CSS files to manage; consistent design tokens |
| **Framer Motion** | Smooth page transitions and micro-animations with minimal code |
| **React Router v7** | Industry standard for React SPAs; nested routes for layout sharing |
| **PHP 8.x (no framework)** | Zero overhead; runs on any shared hosting without Node.js; full control |
| **MySQL** | Relational integrity for complex data (enrollments, attempts, progress) |
| **JWT (HS256)** | Stateless auth — no session storage on server; scales horizontally |
| **PHPMailer** | Battle-tested PHP email library; SMTP support with auth |
| **Canvas API** | Client-side certificate generation — no server CPU cost, no PDF library needed |
| **Hostinger Shared Hosting** | Cost-effective; supports PHP + MySQL + Apache natively out of the box |

---

*Documentation version: April 2026 — CRISMATECH Engineering Team*
