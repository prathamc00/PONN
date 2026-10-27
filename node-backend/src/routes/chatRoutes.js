import express from 'express';
import { pool } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * Real-time Admin Telemetry
 */
async function getAdminTelemetry() {
  try {
    const [userRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalUsers,
        SUM(CASE WHEN role = 'student' THEN 1 ELSE 0 END) as totalStudents,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as totalAdmins,
        SUM(CASE WHEN approvalStatus = 'pending' THEN 1 ELSE 0 END) as pendingApprovals
      FROM users
    `);
    const userStats = userRows?.[0] || {};

    const [courseRows] = await pool.query('SELECT COUNT(*) as totalCourses FROM courses');
    const courseStats = courseRows?.[0] || {};

    const [assignmentRows] = await pool.query('SELECT COUNT(*) as totalAssignments FROM assignments');
    const assignmentStats = assignmentRows?.[0] || {};

    const [submissionRows] = await pool.query(`
      SELECT 
        COUNT(*) as totalSubmissions,
        SUM(CASE WHEN grade IS NULL THEN 1 ELSE 0 END) as pendingGrading
      FROM submissions
    `);
    const submissionStats = submissionRows?.[0] || {};

    let totalTests = 0;
    try {
      const [testRows] = await pool.query('SELECT COUNT(*) as totalTests FROM tests');
      totalTests = testRows?.[0]?.totalTests || 0;
    } catch {
      // tests table
    }

    let totalCertificates = 0;
    try {
      const [certRows] = await pool.query('SELECT COUNT(*) as totalCertificates FROM certificates');
      totalCertificates = certRows?.[0]?.totalCertificates || 0;
    } catch {
      // certificates table
    }

    return {
      users: {
        total: Number(userStats?.totalUsers || 0),
        students: Number(userStats?.totalStudents || 0),
        admins: Number(userStats?.totalAdmins || 0),
        pendingApprovals: Number(userStats?.pendingApprovals || 0),
      },
      courses: Number(courseStats?.totalCourses || 0),
      assignments: Number(assignmentStats?.totalAssignments || 0),
      submissions: {
        total: Number(submissionStats?.totalSubmissions || 0),
        pendingGrading: Number(submissionStats?.pendingGrading || 0),
      },
      tests: Number(totalTests),
      certificates: Number(totalCertificates),
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Failed to load admin telemetry:', err.message);
    return null;
  }
}

/**
 * Real-time Live Database Queries for Student / Guest
 */
async function processStudentQuery(query, user) {
  const q = query.toLowerCase();

  // 1. Strict Boundary Check: Block administrative or backend schema probes
  const adminKeywords = [
    'all users',
    'list users',
    'user list',
    'database',
    'schema',
    'admin password',
    'admin credentials',
    'secret key',
    'jwt_secret',
    'env variable',
    'grading queue',
    'all submissions',
    'test answers',
    'exam answers',
    'quiz answers',
    'cheat',
    'bypass exam',
    'grant me certificate',
    'delete user',
    'drop table',
  ];

  if (adminKeywords.some((kw) => q.includes(kw))) {
    return {
      text: `### Access Scoped\n\nAdministrative records, system databases, grading queues, and exam answer keys are restricted to authorized staff.\n\nStudents can access enrolled courses, assignments, proctored quizzes (60% passing mark), and certificates.\n\nFor administrative inquiries, please contact the Academic Office at [director@crismatech.com](mailto:director@crismatech.com) or **+91 9108118381**.`,
      suggestions: [
        'Certificate requirements',
        'Passing score for exams',
      ],
    };
  }

  // 2. Real-time Enrolled Courses / Student's Courses
  if (q.includes('my course') || q.includes('enrolled') || q.includes('my class')) {
    if (!user) {
      // Prompt sign in to view personal real-time enrollments
      const [available] = await pool.query('SELECT id, title, instructor FROM courses LIMIT 3');
      const courseList = (available || []).map((c) => `* **${c.title}** (Faculty: ${c.instructor || 'CRISMATECH'})`).join('\n');
      return {
        text: `### My Courses\n\nPlease sign in to check your active course enrollments and progress.\n\n**Published courses available right now:**\n${courseList || '* No courses currently published.'}`,
        suggestions: [
          'Available courses',
          'Certificate requirements',
        ],
      };
    }

    try {
      const [enrolled] = await pool.query(
        `SELECT c.id, c.title, c.category, c.instructor 
         FROM user_courses uc 
         JOIN courses c ON c.id = uc.courseId 
         WHERE uc.userId = ?`,
        [user.id]
      );

      if (!enrolled || enrolled.length === 0) {
        return {
          text: `### My Courses\n\nYou are not currently enrolled in any courses.\n\nExplore our catalogue to enroll: **[Course Catalogue](/courses)**.`,
          suggestions: [
            'Available courses',
            'Certificate requirements',
          ],
        };
      }

      const list = enrolled
        .map((c) => `* **${c.title}** (${c.category || 'Technology'}) — [Open Course](/courses/${c.id})`)
        .join('\n');

      return {
        text: `### My Enrolled Courses\n\nYou are currently enrolled in **${enrolled.length}** course(s):\n\n${list}`,
        suggestions: [
          'Passing score for exams',
          'My certificates',
        ],
      };
    } catch (e) {
      console.error('Error fetching student enrolled courses:', e.message);
    }
  }

  // 3. Real-time Available Courses Catalogue
  if (q.includes('course') || q.includes('catalogue') || q.includes('track') || q.includes('curriculum') || q.includes('program') || q.includes('available')) {
    try {
      const [courses] = await pool.query('SELECT id, title, category, level, instructor, duration FROM courses');
      if (courses && courses.length > 0) {
        const courseLines = courses
          .map((c) => `* **${c.title}** (${c.category || 'Technology'}, ${c.level || 'Beginner'}) — Faculty: ${c.instructor || 'CRISMATECH'} — [View Course](/courses/${c.id})`)
          .join('\n');
        return {
          text: `### Available Courses (Live Catalogue)\n\nThere are currently **${courses.length}** published program(s):\n\n${courseLines}\n\nVisit the **[Course Catalogue](/courses)** to enroll.`,
          suggestions: [
            'Certificate requirements',
            'Passing score for exams',
          ],
        };
      }
    } catch (e) {
      console.error('Error fetching live courses:', e.message);
    }
  }

  // 4. Real-time Certificates Query
  if (q.includes('certificate') || q.includes('cert') || q.includes('credential')) {
    if (user) {
      try {
        const [certs] = await pool.query(
          `SELECT cert.id, cert.certificateId, cert.title, cert.scorePercent, cert.earnedDate, c.title as courseTitle
           FROM certificates cert
           LEFT JOIN courses c ON c.id = cert.course
           WHERE cert.student = ?`,
          [user.id]
        );

        if (certs && certs.length > 0) {
          const certList = certs
            .map((c) => `* **${c.title}** (Score: ${c.scorePercent}%) | Certificate ID: \`${c.certificateId}\``)
            .join('\n');

          return {
            text: `### Your Earned Certificates (Live Records)\n\nYou have **${certs.length}** verified certificate(s):\n\n${certList}\n\nYou can view and download your credentials at **[Certificates](/certificate)**.`,
            suggestions: [
              'Passing score for exams',
              'Available courses',
            ],
          };
        }
      } catch (e) {
        console.error('Error fetching student certificates:', e.message);
      }
    }

    return {
      text: `### Certificate Guidelines\n\nAll certificates are digitally verifiable with an encrypted credential ID.\n\n* **Requirements:** Complete 100% of course lessons and achieve at least **60%** on the final assessment.\n* **Access:** Available in the **[Certificates Portal](/certificate)** once criteria are fulfilled.\n* **Verification:** Verifiable publicly at **[/portal/verify](/verify)** with direct LinkedIn sharing.`,
      suggestions: [
        'Passing score for exams',
        'Available courses',
      ],
    };
  }

  // 5. Real-time Tests / Quiz Attempts Query
  if (q.includes('test') || q.includes('quiz') || q.includes('exam') || q.includes('score') || q.includes('pass')) {
    let extraInfo = '';
    try {
      // Live tests available in database
      const [tests] = await pool.query('SELECT id, title, durationMinutes, totalQuestions FROM tests');
      if (tests && tests.length > 0) {
        extraInfo = `\n\n**Scheduled Assessments Right Now:**\n` +
          tests.map((t) => `* **${t.title}** (${t.durationMinutes || 30} mins, ${t.totalQuestions || 0} questions) — [Take Test](/test)`).join('\n');
      }

      // If user is logged in, fetch their actual attempts
      if (user) {
        const [attempts] = await pool.query(
          `SELECT qa.score, qa.percentage, qa.passed, qa.completedAt, t.title as testTitle
           FROM quiz_attempts qa
           JOIN tests t ON t.id = qa.quiz
           WHERE qa.student = ? AND qa.completedAt IS NOT NULL
           ORDER BY qa.completedAt DESC LIMIT 3`,
          [user.id]
        );
        if (attempts && attempts.length > 0) {
          const attemptLines = attempts
            .map((a) => `* **${a.testTitle}**: ${a.percentage}% (${a.passed ? 'Passed' : 'Needs Retake'})`)
            .join('\n');
          extraInfo = `\n\n**Your Assessment History:**\n${attemptLines}` + extraInfo;
        }
      }
    } catch (e) {
      console.error('Error fetching live tests:', e.message);
    }

    return {
      text: `### Assessment Policies\n\nAssessments evaluate practical understanding via proctored questions.\n\n* **Passing Threshold:** Minimum **60%** score required for certification.\n* **Proctoring:** Timed session with fullscreen monitoring.${extraInfo}`,
      suggestions: [
        'Certificate requirements',
        'Available courses',
      ],
    };
  }

  // 6. Real-time Assignments Query
  if (q.includes('assignment') || q.includes('homework') || q.includes('submission') || q.includes('upload') || q.includes('project')) {
    let assignmentsInfo = '';
    try {
      if (user) {
        const [assignments] = await pool.query(
          `SELECT a.id, a.title, a.dueDate, a.maxMarks, c.title as courseTitle, s.grade, s.submittedAt
           FROM assignments a
           JOIN courses c ON c.id = a.course
           JOIN user_courses uc ON uc.courseId = a.course AND uc.userId = ?
           LEFT JOIN submissions s ON s.assignment = a.id AND s.student = ?
           ORDER BY a.dueDate ASC LIMIT 5`,
          [user.id, user.id]
        );

        if (assignments && assignments.length > 0) {
          const aLines = assignments
            .map((a) => {
              const status = a.submittedAt ? (a.grade !== null ? `Graded: ${a.grade}/${a.maxMarks}` : 'Submitted (Under Review)') : 'Pending';
              return `* **${a.title}** (${a.courseTitle}) — Status: **${status}**`;
            })
            .join('\n');
          assignmentsInfo = `\n\n**Your Course Assignments:**\n${aLines}`;
        }
      }
    } catch (e) {
      console.error('Error fetching live assignments:', e.message);
    }

    return {
      text: `### Assignment Submissions\n\n* **Submission:** Go to **[Assignments](/assignments)** and select **[Upload Submission](/assignments/upload)**.\n* **Formats:** PDF reports, ZIP archives, or repository links.\n* **Evaluation:** Faculty evaluate code quality and rubric criteria with feedback posted to your dashboard.${assignmentsInfo}`,
      suggestions: [
        'Certificate requirements',
        'Passing score for exams',
      ],
    };
  }

  // 7. Contact & Support
  if (q.includes('contact') || q.includes('phone') || q.includes('email') || q.includes('support') || q.includes('help') || q.includes('campus') || q.includes('address')) {
    return {
      text: `### Support Desk\n\n* **Phone:** **+91 9108118381**\n* **Email:** [director@crismatech.com](mailto:director@crismatech.com)\n* **Office:** Bengaluru & KGF, Karnataka\n* **Hours:** Monday to Saturday, 9:00 AM – 6:30 PM IST`,
      suggestions: [
        'Available courses',
        'Certificate requirements',
      ],
    };
  }

  // Default Student Response
  return {
    text: `Hello. How can I help you today with your coursework, assignments, or certificates?`,
    suggestions: [
      'Available courses',
      'Certificate requirements',
    ],
  };
}

/**
 * Real-time Live Database Queries for Administrators
 */
async function processAdminQuery(query, telemetry) {
  const q = query.toLowerCase();

  // 1. Live Platform Telemetry & System Metrics
  if (
    q.includes('telemetry') ||
    q.includes('stat') ||
    q.includes('metric') ||
    q.includes('overview') ||
    q.includes('how many') ||
    q.includes('count') ||
    q.includes('health') ||
    q.includes('system')
  ) {
    if (!telemetry) {
      return {
        text: `### System Status\n\nThe platform is operational. Telemetry counters are currently refreshing.`,
        suggestions: [
          'Latest registered users',
          'Grading queue status',
        ],
      };
    }

    return {
      text: `### Live Platform Overview\n\n* **Registered Accounts:** ${telemetry.users.total} (${telemetry.users.students} students, ${telemetry.users.admins} admins)\n* **Pending Approvals:** ${telemetry.users.pendingApprovals}\n* **Published Courses:** ${telemetry.courses}\n* **Active Assignments:** ${telemetry.assignments}\n* **Submissions:** ${telemetry.submissions.total} (${telemetry.submissions.pendingGrading} pending grading)\n* **Scheduled Tests:** ${telemetry.tests}\n* **Certificates Issued:** ${telemetry.certificates}`,
      suggestions: [
        'Latest registered users',
        'Grading queue status',
      ],
    };
  }

  // 2. Real-time User & Student Directory
  if (q.includes('user') || q.includes('student') || q.includes('account') || q.includes('register') || q.includes('member')) {
    try {
      const [users] = await pool.query(
        'SELECT id, name, email, role, approvalStatus, createdAt FROM users ORDER BY id DESC LIMIT 5'
      );
      if (users && users.length > 0) {
        const uLines = users
          .map((u) => `* **${u.name}** (\`${u.email}\`) — Role: ${u.role} (Status: ${u.approvalStatus})`)
          .join('\n');
        return {
          text: `### Recent User Directory (Live Database)\n\nShowing latest **${users.length}** accounts:\n\n${uLines}\n\nManage all accounts under **[/admin/users](/admin/users)**.`,
          suggestions: [
            'Live platform overview',
            'Grading queue status',
          ],
        };
      }
    } catch (e) {
      console.error('Error fetching real-time users:', e.message);
    }
  }

  // 3. Real-time Grading Queue & Submissions
  if (q.includes('grading') || q.includes('submission') || q.includes('queue') || q.includes('marks')) {
    try {
      const [pending] = await pool.query(`
        SELECT s.id, u.name as studentName, a.title as assignmentTitle, s.submittedAt 
        FROM submissions s 
        JOIN users u ON s.student = u.id 
        JOIN assignments a ON s.assignment = a.id 
        WHERE s.grade IS NULL 
        ORDER BY s.submittedAt ASC LIMIT 5
      `);

      if (!pending || pending.length === 0) {
        return {
          text: `### Assignment Grading Queue\n\nThere are currently **0 pending submissions** awaiting grading. All submissions are up to date.\n\nReview assignments at **[/admin/grading](/admin/grading)**.`,
          suggestions: [
            'Live platform overview',
            'Latest registered users',
          ],
        };
      }

      const pLines = pending
        .map((p) => `* Submission #${p.id}: **${p.studentName}** — *${p.assignmentTitle}*`)
        .join('\n');

      return {
        text: `### Real-Time Grading Queue\n\nThere are currently **${pending.length}** submission(s) pending grading:\n\n${pLines}\n\nEvaluate them at **[/admin/grading](/admin/grading)**.`,
        suggestions: [
          'Live platform overview',
          'Latest registered users',
        ],
      };
    } catch (e) {
      console.error('Error fetching real-time submissions:', e.message);
    }
  }

  // 4. Real-time Courses Directory
  if (q.includes('course') || q.includes('curriculum')) {
    try {
      const [courses] = await pool.query(`
        SELECT c.id, c.title, c.category, c.instructor,
               (SELECT COUNT(*) FROM user_courses uc WHERE uc.courseId = c.id) as enrolledCount
        FROM courses c
      `);
      if (courses && courses.length > 0) {
        const cLines = courses
          .map((c) => `* **${c.title}** (${c.category || 'Tech'}) — Instructor: ${c.instructor || 'CRISMATECH'} — Enrolled Students: **${c.enrolledCount}**`)
          .join('\n');
        return {
          text: `### Real-Time Courses Overview\n\n${cLines}\n\nManage courses at **[/admin/courses](/admin/courses)**.`,
          suggestions: [
            'Live platform overview',
            'Grading queue status',
          ],
        };
      }
    } catch (e) {
      console.error('Error fetching courses for admin:', e.message);
    }
  }

  // 5. Real-time Tests & Quizzes
  if (q.includes('quiz') || q.includes('test') || q.includes('exam') || q.includes('schedule')) {
    try {
      const [tests] = await pool.query(`
        SELECT t.id, t.title, t.durationMinutes,
               (SELECT COUNT(*) FROM quiz_attempts qa WHERE qa.quiz = t.id) as attemptCount
        FROM tests t
      `);
      if (tests && tests.length > 0) {
        const tLines = tests
          .map((t) => `* **${t.title}** (${t.durationMinutes} mins) — Total Attempts: **${t.attemptCount}**`)
          .join('\n');
        return {
          text: `### Real-Time Assessment Schedules\n\n${tLines}\n\nManage quiz configurations at **[/admin/quiz](/admin/quiz)** and attempt records at **[/admin/quiz-results](/admin/quiz-results)**.`,
          suggestions: [
            'Live platform overview',
            'Latest registered users',
          ],
        };
      }
    } catch (e) {
      console.error('Error fetching tests for admin:', e.message);
    }
  }

  // 6. Real-time Certificates Authority
  if (q.includes('certificate') || q.includes('credential')) {
    try {
      const [certs] = await pool.query(`
        SELECT cert.id, cert.certificateId, cert.title, u.name as studentName
        FROM certificates cert
        JOIN users u ON u.id = cert.student
        ORDER BY cert.id DESC LIMIT 5
      `);
      if (certs && certs.length > 0) {
        const certLines = certs
          .map((c) => `* \`${c.certificateId}\`: **${c.title}** issued to **${c.studentName}**`)
          .join('\n');
        return {
          text: `### Real-Time Issued Certificates\n\nLatest **${certs.length}** credentials:\n\n${certLines}\n\nManage credentials at **[/admin/certificates](/admin/certificates)**.`,
          suggestions: [
            'Live platform overview',
            'Grading queue status',
          ],
        };
      }
    } catch (e) {
      console.error('Error fetching certificates for admin:', e.message);
    }
  }

  // Default Admin Response
  return {
    text: `Hello, Administrator. How can I assist you with platform operations or telemetry today?`,
    suggestions: [
      'Live platform overview',
      'Latest registered users',
    ],
  };
}

/**
 * POST /api/chat
 * Handles role-aware intelligent real-time conversations
 */
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message content is required.' });
    }

    const cleanMessage = message.trim();
    const user = req.user;
    const role = user?.role || 'student';
    const isAdmin = role === 'admin';

    let responseData;
    if (isAdmin) {
      const telemetry = await getAdminTelemetry();
      responseData = await processAdminQuery(cleanMessage, telemetry);
    } else {
      responseData = await processStudentQuery(cleanMessage, user);
    }

    return res.json({
      success: true,
      role: isAdmin ? 'admin' : 'student',
      user: user ? { id: user.id, name: user.name, role: user.role } : null,
      reply: responseData.text,
      suggestions: responseData.suggestions || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process chat query.',
      error: error.message,
    });
  }
});

export default router;
