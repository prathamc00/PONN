# CRISMATECH Node API

A comprehensive, production-ready Express & MySQL REST API for the CRISMATECH E-Learning Portal.

## Architecture

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express 4 with security middleware (`helmet`, `cors`, `express-rate-limit`)
- **Database**: MySQL 8.x+ via `mysql2/promise` with automatic schema initialization and pooling
- **Authentication**: JWT tokens (Bearer auth) with bcrypt password hashing
- **File Uploads**: `multer` with file extension whitelisting for assignments, Aadhaar cards, and thumbnails
- **Email Delivery**: `nodemailer` with SMTP configuration and development fallback simulator

## Getting Started

1. **Configure Environment**:
   Ensure `.env` exists in `node-backend/` (or copy `.env.example`):
   ```bash
   cp .env.example .env
   ```

2. **Install Dependencies**:
   ```powershell
   npm install
   ```

3. **Start the API Server**:
   ```powershell
   # Development mode (auto-reloading):
   npm run dev

   # Production mode:
   npm run start
   ```

4. **Connect Frontend**:
   Set `VITE_API_URL=http://localhost:5000/api` in your frontend `.env` (e.g. `new- frontend/.env`).

---

## API Endpoints Reference

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new student account |
| `POST` | `/api/auth/login` | Public | Sign in to account |
| `POST` | `/api/auth/instructor/register` | Public | Register instructor (pending admin approval) |
| `POST` | `/api/auth/instructor/login` | Public | Sign in for instructors/admins |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current user profile |
| `PUT` | `/api/auth/me` | Authenticated | Update user profile (name, college, branch, phone) |
| `POST` | `/api/auth/me/aadhaar` | Authenticated | Upload Aadhaar card verification document |
| `POST` | `/api/auth/me/enroll/:courseId`| Authenticated | Enroll in a course |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset link |
| `GET` | `/api/auth/reset-password/validate` | Public | Validate password reset token |
| `POST` | `/api/auth/reset-password` | Public | Set new password with reset token |

### ✉️ OTP Verification (`/api/otp`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/otp/send` | Public | Send 6-digit verification code to email |
| `POST` | `/api/otp/verify` | Public | Verify 6-digit code and get verification token |

### 📚 Courses & Modules (`/api/courses`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/courses` | Public / Optional | List all courses with enrollment counts |
| `GET` | `/api/courses/my-enrollments` | Authenticated | List courses enrolled by current student |
| `GET` | `/api/courses/manage` | Staff Only | Manage courses created by instructor / all for admin |
| `POST` | `/api/courses` | Staff Only | Create a new course |
| `GET` | `/api/courses/:id` | Public / Optional | Get course details and modules |
| `PUT` | `/api/courses/:id` | Staff Only | Update course details |
| `DELETE` | `/api/courses/:id` | Staff Only | Delete course |
| `GET` | `/api/courses/:id/modules` | Authenticated | Get module list for course |
| `POST` | `/api/courses/:id/modules` | Staff Only | Add a new module/lesson |
| `PUT` | `/api/courses/:id/modules/:moduleId` | Staff Only | Update a module/lesson |
| `DELETE` | `/api/courses/:id/modules/:moduleId` | Staff Only | Delete a module/lesson |
| `PUT` | `/api/courses/:id/modules/reorder` | Staff Only | Reorder modules in course |
| `POST` | `/api/courses/:id/enroll` | Authenticated | Enroll in course |
| `DELETE` | `/api/courses/:id/enroll` | Authenticated | Unenroll from course |
| `GET` | `/api/courses/:id/progress` | Authenticated | Get student's progress and completed lessons |
| `POST` | `/api/courses/:id/modules/:moduleId/complete` | Authenticated | Mark lesson complete & unlock next |

### 📝 Assignments & Submissions (`/api/assignments`, `/api/submissions`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/assignments` | Authenticated | List assignments (enrolled courses for students) |
| `GET` | `/api/assignments/my-submissions` | Authenticated | List student's own submissions |
| `GET` | `/api/assignments/manage` | Staff Only | Manage assignments with submission counts |
| `POST` | `/api/assignments` | Staff Only | Create assignment (`file_upload`, `case_study`, `code`) |
| `GET` | `/api/assignments/:id` | Authenticated | Get assignment details and current submission |
| `PUT` | `/api/assignments/:id` | Staff Only | Update assignment |
| `DELETE` | `/api/assignments/:id` | Staff Only | Delete assignment |
| `POST` | `/api/assignments/:id/submit` | Authenticated | Submit assignment (file, case study text, or code) |
| `GET` | `/api/assignments/:id/submissions` | Staff Only | View all student submissions for assignment |
| `GET` | `/api/submissions` | Staff Only | Grading queue (all student submissions) |
| `PUT` | `/api/submissions/:id/grade` | Staff Only | Grade submission and send feedback notification |

### ⏱️ Tests & Quizzes (`/api/tests`, `/api/quiz-attempts`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/tests` | Authenticated | List tests with course completion gates |
| `GET` | `/api/tests/my-attempts` | Authenticated | List current student's quiz attempts |
| `GET` | `/api/tests/manage` | Staff Only | Manage scheduled quizzes |
| `POST` | `/api/tests` | Staff Only | Create a quiz with multiple-choice questions |
| `GET` | `/api/tests/:id` | Authenticated | Get quiz details (sanitized for students) |
| `PUT` | `/api/tests/:id` | Staff Only | Update quiz details and questions |
| `DELETE` | `/api/tests/:id` | Staff Only | Delete quiz |
| `POST` | `/api/tests/:id/start` | Authenticated | Start proctored quiz session with gate check |
| `POST` | `/api/tests/:id/submit` | Authenticated | Submit answers, anti-cheat telemetry, auto-issue cert |
| `POST` | `/api/tests/:id/retake` | Authenticated | Clear previous attempt to allow retake |
| `GET` | `/api/tests/:id/results` | Staff Only | View all student scores and attempts for quiz |
| `GET` | `/api/quiz-attempts` | Admin Only | Platform-wide quiz attempt telemetry |

### 🎓 Certificates (`/api/certificates`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/certificates/my-certificates` | Authenticated | View earned certificates |
| `GET` | `/api/certificates/verify/:certId` | Public | Public certificate authenticity verification |
| `GET` | `/api/certificates` | Admin Only | List all issued certificates |
| `POST` | `/api/certificates` | Admin Only | Manually issue a certificate |
| `GET` | `/api/certificates/:id` | Authenticated | Get certificate details |
| `DELETE` | `/api/certificates/:id` | Admin Only | Revoke and delete a certificate |

### 👥 User Administration (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | Admin Only | List all platform users with enrollments |
| `POST` | `/api/users/instructor` | Admin Only | Directly create approved instructor account |
| `DELETE` | `/api/users/:id` | Admin Only | Delete user account |
| `PUT` | `/api/users/:id/approval` | Admin Only | Approve or reject instructor registration |
| `PUT` | `/api/users/:id/aadhaar-verify` | Admin Only | Approve or revoke Aadhaar verification |
| `POST` | `/api/users/:id/quiz-attempts/reset` | Admin Only | Reset quiz attempts for student |
| `GET` | `/api/users/export/csv` | Admin Only | Export full users list as CSV |

### 📊 Attendance & Activity (`/api/attendance`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/attendance` | Authenticated | Record student learning activity |
| `GET` | `/api/attendance/my` | Authenticated | Get student's activity log |
| `GET` | `/api/attendance/course/:courseId` | Staff Only | Get attendance log for a specific course |
| `GET` | `/api/attendance` | Admin Only | Get all activity logs across platform |

### 🔔 Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/notifications` | Authenticated | Get user notifications and unread count |
| `PUT` | `/api/notifications/:id/read` | Authenticated | Mark a notification as read |
| `PUT` | `/api/notifications/read-all` | Authenticated | Mark all notifications as read |
