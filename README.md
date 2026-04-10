# 🎓 Student Learning Portal

A full-stack web application for managing student education — featuring courses, assignments, quizzes, attendance, certificates, notifications, and a real-time experience powered by Socket.IO.

---

## 📚 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Scripts](#scripts)
- [Contributing](#contributing)

---

## ✨ Features

- **Authentication** — Register, login, OTP verification, forgot/reset password
- **Courses** — Browse, enroll, and manage course content
- **Assignments** — Submit and track assignments with file uploads
- **Quizzes & Tests** — Timed quizzes with auto-grading and result tracking
- **Attendance** — Track and view student attendance records
- **Certificates** — Auto-generate certificates upon course completion
- **Notifications** — Real-time in-app notifications via Socket.IO
- **Admin Panel** — Manage users, courses, assignments, grading queue, and analytics
- **Profile Management** — Update personal info and upload documents (e.g., Aadhar card)

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + TypeScript | UI Framework |
| Vite | Build Tool & Dev Server |
| React Router v7 | Client-side Routing |
| Tailwind CSS v4 | Styling |
| Framer Motion | Animations |
| Socket.IO Client | Real-time Communication |
| Lucide React | Icons |
| Google Generative AI | AI Features |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express | Server Framework |
| MongoDB + Mongoose | Database |
| Socket.IO | Real-time WebSockets |
| JWT | Authentication |
| Bcrypt.js | Password Hashing |
| Multer | File Uploads |
| Nodemailer | Email (OTP / Password Reset) |
| Helmet + Rate Limiting | Security |

---

## 📁 Project Structure

```
Student-Learning-Portal/
├── backend/
│   ├── app.js                  # Express app setup & middleware
│   ├── server.js               # Server entry point
│   ├── socketManager.js        # Socket.IO event handlers
│   ├── config/                 # DB connection & config
│   ├── middlewares/            # Auth, error handling
│   ├── modules/
│   │   ├── auth/               # Login, register, password reset
│   │   ├── otp/                # OTP generation & verification
│   │   ├── user/               # User profile & management
│   │   ├── course/             # Course CRUD
│   │   ├── assignment/         # Assignments & submissions
│   │   ├── test/               # Quizzes & attempts
│   │   ├── attendance/         # Attendance records
│   │   ├── certificate/        # Certificate generation
│   │   └── notification/       # In-app notifications
│   ├── scripts/
│   │   └── seedData.js         # Database seeder
│   └── uploads/                # Uploaded files (gitignored)
│
└── frontend/
    ├── index.html
    ├── vite.config.ts
    └── src/
        ├── App.tsx             # Routes & layout
        ├── main.tsx            # App entry point
        ├── pages/              # All page components
        ├── components/         # Reusable UI components
        ├── context/            # React context providers
        ├── hooks/              # Custom hooks
        ├── utils/              # Helper utilities
        └── types.ts            # TypeScript type definitions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **MongoDB** (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **npm** v9+

---

### Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env
# (then fill in the values — see Environment Variables below)

# Seed the database with sample data (optional)
npm run seed

# Start the development server
npm run dev
```

The backend runs on **http://localhost:5000** by default.

---

### Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The frontend runs on **http://localhost:3000** by default.

---

## 🔧 Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/student-learning-portal

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Frontend URL (for CORS in production)
FRONTEND_URL=http://localhost:3000
```

---

## 📡 API Overview

All API routes are prefixed with `/api`.

| Resource | Endpoint | Description |
|---|---|---|
| Auth | `/api/auth` | Register, login, logout |
| OTP | `/api/otp` | Send & verify OTPs |
| Users | `/api/users` | Profile, admin user management |
| Courses | `/api/courses` | Course CRUD & enrollment |
| Assignments | `/api/assignments` | Create & manage assignments |
| Submissions | `/api/submissions` | Student submission handling |
| Tests | `/api/tests` | Quiz creation & management |
| Quiz Attempts | `/api/quiz-attempts` | Record & fetch quiz results |
| Certificates | `/api/certificates` | Certificate generation & download |
| Attendance | `/api/attendance` | Mark & view attendance |
| Notifications | `/api/notifications` | In-app notification management |

---

## 📜 Scripts

### Backend

| Command | Description |
|---|---|
| `npm run dev` | Start server with nodemon (hot reload) |
| `npm start` | Start server in production mode |
| `npm run seed` | Seed the database with sample data |
| `npm run seed:clear` | Clear all seeded data |

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | TypeScript type checking |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

> Built with ❤️ for students and educators.
