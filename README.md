# 🎓 CRISMATECH E-Learning Portal

A full-stack student learning portal built with **React + Vite** (frontend) and **PHP** (backend), deployed on [Hostinger](https://mistyrose-stinkbug-181981.hostingersite.com/portal/).

---

## 🌐 Live Demo

> **URL:** [https://mistyrose-stinkbug-181981.hostingersite.com/portal/](https://mistyrose-stinkbug-181981.hostingersite.com/portal/)

---

## 📁 Project Structure

```
PONN/
├── frontend/               # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── pages/          # All route pages (Student + Admin)
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # Auth & Theme context providers
│   │   └── utils/api.ts    # Centralized API fetch utility
│   ├── public/.htaccess    # SPA routing fix for Apache
│   ├── .env                # Local dev environment
│   ├── .env.production     # Production environment
│   └── vite.config.ts      # Vite build config (base: /portal/)
│
└── php-backend/            # PHP REST API
    ├── modules/            # Feature modules (auth, course, quiz, etc.)
    │   ├── auth/           # Login, register, password reset
    │   ├── otp/            # OTP generation & verification
    │   ├── course/         # Courses, modules, progress tracking
    │   ├── assignment/     # Assignments & submissions
    │   ├── test/           # Quizzes & attempts
    │   ├── certificate/    # Certificate issuance & verification
    │   ├── user/           # User management
    │   ├── attendance/     # Activity tracking
    │   └── notification/   # In-app notifications
    ├── middleware/         # Auth (JWT), CORS, Rate limiting
    ├── helpers/            # JWT, Mailer (PHPMailer), Response utils
    ├── config/             # DB connection, env loader
    ├── index.php           # Single entry point + router
    └── .htaccess           # Route all requests to index.php
```

---

## ✨ Features

### 🎓 Student
- Register with **OTP email verification** (6-digit code, 5-min expiry)
- Login with JWT authentication
- Browse & enroll in courses
- Watch video lectures (sequential unlocking — must complete previous lesson)
- Download PDF notes per lesson
- **Quiz access gated** — must complete 100% of course videos first
- Auto-certificate generation on quiz pass (≥40% score)
- View & download certificates as PNG
- Submit assignments (file upload, text, code)
- Track attendance & activity
- In-app notifications

### 🧑‍🏫 Instructor
- Manage their own courses (create, edit, delete)
- Add video & PDF lesson modules
- Create & schedule quizzes with custom questions
- View student quiz results
- Grade student assignment submissions

### 🛡️ Admin
- Full user management (view, approve instructors, delete)
- Aadhaar verification workflow
- Export student data as CSV
- Platform-wide analytics dashboard
- Manage all courses, assignments, quizzes
- Manually issue certificates
- Activity feed & grading queue

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6 |
| Styling | TailwindCSS v4, Framer Motion |
| Routing | React Router v7 |
| Backend | PHP 8.x (no framework) |
| Database | MySQL (Hostinger managed) |
| Auth | JWT (HS256, 7-day expiry) |
| Email | PHPMailer + Gmail SMTP |
| Hosting | Hostinger Premium Shared Hosting |

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- PHP 8.1+
- MySQL 8+
- Composer (for PHP deps)

### 1. Clone the repo
```bash
git clone <repo-url>
cd PONN
```

### 2. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env        # Edit VITE_API_URL to point to your backend
npm run dev                 # Starts on http://localhost:3000
```

**`.env` (local):**
```env
VITE_API_URL=http://localhost/php-backend/api
```

### 3. Backend setup
```bash
cd php-backend
composer install            # Install PHPMailer
cp .env.example .env        # Fill in your DB and SMTP credentials
```

**`.env` (backend):**
```env
DB_HOST=127.0.0.1
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name
JWT_SECRET=your_64_char_random_secret
JWT_EXPIRES_IN=8h
APP_ENV=production
ENFORCE_HTTPS=true
EMAIL_VERIFICATION_SECRET=another_64_char_random_secret
SECURITY_EVENTS_ENABLED=true
SECURITY_LOG_FILE_FALLBACK=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
FRONTEND_URL=http://localhost:3000
RESET_PASSWORD_URL=http://localhost:3000/reset-password
```

> ⚠️ Use a **Gmail App Password**, not your regular Gmail password. Enable 2FA on Gmail first.

### 4. Database setup
Import the SQL schema into your MySQL database. The backend will auto-create the `otps` table on first OTP request.

---

## 🏗️ Production Deployment (Hostinger)

### Frontend
1. Update `frontend/.env.production`:
   ```env
   VITE_API_URL=https://your-domain.com/api
   ```
2. Build:
   ```bash
   cd frontend
   npm run build
   ```
3. Upload the `dist/` folder contents to `public_html/portal/` on Hostinger

### Backend
1. Update `php-backend/.env` with production values:
   ```env
    APP_ENV=production
    ENFORCE_HTTPS=true
    JWT_SECRET=<64+ random chars>
    EMAIL_VERIFICATION_SECRET=<64+ random chars>
    SECURITY_EVENTS_ENABLED=true
    SECURITY_LOG_FILE_FALLBACK=true
   FRONTEND_URL=https://your-domain.com
   RESET_PASSWORD_URL=https://your-domain.com/portal/reset-password
   ```
2. Upload the entire `php-backend/` folder to your hosting root
3. Make sure `uploads/` directories are writable: `chmod 755 uploads/`
4. Run `composer install --no-dev` on the server
5. Ensure database user is restricted to app host/private network only (never `0.0.0.0/0`)
6. Verify TLS certificate and force HTTPS for all traffic

### Apache Requirements
The project requires `mod_rewrite` to be enabled (Hostinger enables this by default). The `.htaccess` files handle:
- **Frontend:** SPA fallback — all routes serve `index.html`
- **Backend:** All requests routed through `index.php`

---

## 🔐 Security Notes

- JWT tokens expire in **8 hours** by default
- OTP codes expire in **5 minutes**, max 20 requests per IP per 5 min
- Passwords are hashed with **bcrypt** (cost factor 12)
- If available, password hashing uses **Argon2id**
- File uploads are **whitelisted** by extension (pdf, doc, mp4, etc.)
- CORS is restricted to the configured `FRONTEND_URL`
- Sensitive files (`.env`, `composer.json`) are blocked via `.htaccess`
- Registration requires a signed short-lived email verification token
- Password reset links are one-time-use and expire in 15 minutes
- Login attempts are rate-limited per email key and IP
- Security monitoring logs auth denials, API errors, and suspicious traffic in `security_events`

## 📈 Monitoring

- Audit events are stored in `security_events` (and optionally `php-backend/logs/security.log` as fallback)
- Each API response includes an `X-Request-Id` header for correlation
- Track at minimum:
    - `auth_login_failed`, `auth_login_blocked`, `auth_login_success`
    - `rate_limit_exceeded`, `api_rate_limited`
    - `api_error`, `api_unhandled_exception`, `api_fatal_error`

---

## 📧 Email Configuration

This project uses Gmail SMTP via PHPMailer. To set up:
1. Enable **2-Step Verification** on your Google account
2. Go to **Google Account → Security → App Passwords**
3. Generate a password for "Mail" and paste it as `SMTP_PASS`

---

## 🎯 Learning Flow

```
Register (OTP verify) → Login → Enroll in Course
    → Watch ALL Lessons (sequential unlock)
        → Quiz Unlocks
            → Pass Quiz (≥40%)
                → Certificate Auto-Generated 🏆
```

---

## 📄 API Reference (Key Endpoints)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Student registration |
| POST | `/api/auth/login` | None | Login (returns JWT) |
| POST | `/api/otp/send` | None | Send OTP to email |
| POST | `/api/otp/verify` | None | Verify OTP code |
| GET | `/api/courses` | Optional | List all courses |
| POST | `/api/courses/:id/enroll` | Student | Enroll in course |
| POST | `/api/courses/:id/modules/:moduleId/complete` | Student | Mark lesson complete |
| GET | `/api/courses/:id/progress` | Student | Get lesson progress |
| POST | `/api/tests/:id/start` | Student | Start quiz (requires 100% progress) |
| POST | `/api/tests/:id/submit` | Student | Submit quiz answers |
| GET | `/api/certificates/my-certificates` | Student | Get my certificates |
| GET | `/api/users` | Admin only | List all users |

---

## 👥 User Roles

| Role | Access |
|---|---|
| `student` | Courses, quizzes, assignments, certificates |
| `instructor` | Manage own courses, assignments, quiz results |
| `admin` | Full platform access + user management |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push and open a Pull Request

---

## 📝 License

This project is proprietary and owned by **CRISMATECH**. All rights reserved.

---

*Built with ❤️ by the CRISMATECH team*
