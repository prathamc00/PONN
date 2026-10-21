import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directories exist
export const uploadDir = path.resolve(__dirname, '..', 'uploads');
export const aadhaarUploadDir = path.join(uploadDir, 'aadhaar');
export const submissionUploadDir = path.join(uploadDir, 'submissions');
export const thumbnailUploadDir = path.join(uploadDir, 'thumbnails');
export const courseUploadDir = path.join(uploadDir, 'courses');

[uploadDir, aadhaarUploadDir, submissionUploadDir, thumbnailUploadDir, courseUploadDir].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

let useSqlite = false;
let sqliteDb = null;
let mysqlPool = null;

function getMysqlConfig() {
  if (process.env.DATABASE_URL) {
    return {
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      timezone: 'Z',
    };
  }

  return {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'crismatech_db',
    waitForConnections: true,
    connectionLimit: 10,
    timezone: 'Z',
  };
}

try {
  mysqlPool = mysql.createPool(getMysqlConfig());
} catch (err) {
  console.warn('MySQL pool initialization error:', err.message);
}

function getSqliteDb() {
  if (sqliteDb) return sqliteDb;

  const dbPath = path.resolve(__dirname, '..', 'portal.sqlite');
  sqliteDb = new DatabaseSync(dbPath);

  // Register MySQL compatibility functions in SQLite
  sqliteDb.function('NOW', () => new Date().toISOString().replace('T', ' ').substring(0, 19));
  sqliteDb.function('DATE_ADD', (_date, _interval) =>
    new Date(Date.now() + 15 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19)
  );

  return sqliteDb;
}

function normalizeSqlForSqlite(sql) {
  let s = sql
    .replace(/INSERT\s+IGNORE\s+INTO/gi, 'INSERT OR IGNORE INTO')
    .replace(/DATE_ADD\(NOW\(\),\s*INTERVAL\s+\d+\s+MINUTE\)/gi, "datetime('now', '+15 minutes')");
  return s;
}

// Unified pool interface that routes to MySQL or local SQLite
export const pool = {
  async execute(sql, params = []) {
    if (!useSqlite && mysqlPool) {
      try {
        return await mysqlPool.execute(sql, params);
      } catch (err) {
        if (!useSqlite && (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED')) {
          console.warn('⚠️ Switching to local SQLite storage due to MySQL access failure:', err.message);
          useSqlite = true;
          await initSqliteDatabase();
          return this.execute(sql, params);
        }
        throw err;
      }
    }

    const db = getSqliteDb();
    const cleanSql = normalizeSqlForSqlite(sql);
    const trimmed = cleanSql.trim().toUpperCase();

    // Clean params for SQLite (convert undefined to null)
    const cleanParams = params.map((p) => (p === undefined ? null : p));

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('PRAGMA')) {
      const stmt = db.prepare(cleanSql);
      const rows = stmt.all(...cleanParams);
      return [rows, []];
    } else {
      const stmt = db.prepare(cleanSql);
      const result = stmt.run(...cleanParams);
      return [{ insertId: Number(result.lastInsertRowid), affectedRows: result.changes }, []];
    }
  },

  async query(sql, params = []) {
    return this.execute(sql, params);
  },

  async getConnection() {
    if (!useSqlite && mysqlPool) {
      try {
        return await mysqlPool.getConnection();
      } catch (err) {
        if (err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ECONNREFUSED') {
          useSqlite = true;
          await initSqliteDatabase();
        } else {
          throw err;
        }
      }
    }

    // SQLite connection mock
    return {
      async beginTransaction() {},
      async commit() {},
      async rollback() {},
      async execute(sql, params) {
        return pool.execute(sql, params);
      },
      release() {},
    };
  },
};

async function initSqliteDatabase() {
  const db = getSqliteDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      college TEXT DEFAULT NULL,
      branch TEXT DEFAULT NULL,
      semester INTEGER DEFAULT NULL,
      phone TEXT DEFAULT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      approvalStatus TEXT NOT NULL DEFAULT 'approved',
      emailVerified INTEGER NOT NULL DEFAULT 1,
      aadhaarVerified INTEGER NOT NULL DEFAULT 0,
      aadhaarCardPath TEXT DEFAULT NULL,
      passwordChangedAt TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS otps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      expiresAt TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      tokenHash TEXT NOT NULL UNIQUE,
      expiresAt TEXT NOT NULL,
      usedAt TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      category TEXT DEFAULT NULL,
      level TEXT DEFAULT 'beginner',
      instructor TEXT DEFAULT NULL,
      price REAL DEFAULT 0.00,
      thumbnail TEXT DEFAULT NULL,
      modules TEXT DEFAULT '[]',
      lessons INTEGER NOT NULL DEFAULT 0,
      duration TEXT DEFAULT NULL,
      createdBy INTEGER DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE (userId, courseId)
    );

    CREATE TABLE IF NOT EXISTS course_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student INTEGER NOT NULL,
      course INTEGER NOT NULL,
      completedModules TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE (student, course)
    );

    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student INTEGER NOT NULL,
      course INTEGER DEFAULT NULL,
      activityType TEXT NOT NULL,
      details TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT DEFAULT NULL,
      course INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'file_upload',
      dueDate TEXT DEFAULT NULL,
      maxMarks INTEGER NOT NULL DEFAULT 100,
      createdBy INTEGER DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment INTEGER NOT NULL,
      student INTEGER NOT NULL,
      type TEXT NOT NULL,
      textContent TEXT DEFAULT NULL,
      codeContent TEXT DEFAULT NULL,
      filePath TEXT DEFAULT NULL,
      grade REAL DEFAULT NULL,
      feedback TEXT DEFAULT NULL,
      submittedAt TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      course INTEGER NOT NULL,
      questions TEXT DEFAULT '[]',
      totalQuestions INTEGER NOT NULL DEFAULT 0,
      durationMinutes INTEGER NOT NULL DEFAULT 30,
      startTime TEXT DEFAULT NULL,
      endTime TEXT DEFAULT NULL,
      createdBy INTEGER DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz INTEGER NOT NULL,
      student INTEGER NOT NULL,
      answers TEXT DEFAULT '[]',
      score INTEGER DEFAULT NULL,
      totalMarks INTEGER DEFAULT NULL,
      tabSwitchCount INTEGER NOT NULL DEFAULT 0,
      startedAt TEXT DEFAULT NULL,
      completedAt TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student INTEGER NOT NULL,
      course INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'completion',
      grade TEXT DEFAULT NULL,
      scorePercent INTEGER DEFAULT NULL,
      certificateId TEXT NOT NULL UNIQUE,
      earnedDate TEXT DEFAULT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      UNIQUE (student, course, type)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      link TEXT DEFAULT NULL,
      isRead INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  // Seed default admin
  const adminStmt = db.prepare("SELECT id FROM users WHERE email = 'admin@crismatech.com' LIMIT 1");
  const existingAdmin = adminStmt.all();
  if (!existingAdmin.length) {
    const adminHash = await bcrypt.hash('Admin@123', 10);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(`
      INSERT INTO users (name, email, password, role, approvalStatus, emailVerified, aadhaarVerified, createdAt, updatedAt)
      VALUES ('Platform Admin', 'admin@crismatech.com', ?, 'admin', 'approved', 1, 1, ?, ?)
    `).run(adminHash, now, now);
    console.log('✅ Local Database: Default admin seeded (admin@crismatech.com / Admin@123)');
  }

  // Seed default normal student user for testing
  const studentStmt = db.prepare("SELECT id FROM users WHERE email = 'student@crismatech.com' LIMIT 1");
  const existingStudent = studentStmt.all();
  if (!existingStudent.length) {
    const studentHash = await bcrypt.hash('Student@123', 10);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    db.prepare(`
      INSERT INTO users (name, email, password, role, college, branch, semester, phone, approvalStatus, emailVerified, aadhaarVerified, createdAt, updatedAt)
      VALUES ('Student Vance', 'student@crismatech.com', ?, 'student', '', 'Computer Science', 4, '+91 9876543210', 'approved', 1, 1, ?, ?)
    `).run(studentHash, now, now);
    console.log('✅ Local Database: Default student seeded (student@crismatech.com / Student@123)');
  }


  console.log('✅ Local SQLite database engine active (portal.sqlite).');
}

export async function initDatabase() {
  if (mysqlPool) {
    try {
      await mysqlPool.query('SELECT 1');
      console.log('✅ MySQL database connection verified.');
      useSqlite = false;
      return;
    } catch (error) {
      console.warn(`⚠️ MySQL is unavailable (${error.message}).`);
    }
  }

  // Graceful fallback to local SQLite
  console.log('ℹ️ Activating local zero-config SQLite database engine (portal.sqlite)...');
  useSqlite = true;
  await initSqliteDatabase();
}
