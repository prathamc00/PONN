const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const dirs = fs.readdirSync(root).filter(d => fs.existsSync(path.join(root, d, 'code.html')));

console.log(`Processing ${dirs.length} screen folders...`);

// ─── CRISMATECH Education Rebrand: Screen Metadata ───
const screenMeta = {
  'crismatech_online_learning_platform_homepage': {
    category: 'Public Pages',
    role: 'Public',
    title: 'CRISMATECH E-Learning Portal — Home',
    badge: 'HOME',
    description: 'Landing page for CRISMATECH Education e-learning portal. Browse technology courses, view featured instructors, and start learning.'
  },
  'crismatech_academy_of_letters_systems': {
    category: 'Public Pages',
    role: 'Public',
    title: 'About CRISMATECH Education',
    badge: 'ABOUT',
    description: 'Learn about CRISMATECH Education — a tech training company based in KGF and Bengaluru offering digital skills courses.'
  },
  'crismatech_academy_of_letters_systems_homepage': {
    category: 'Public Pages',
    role: 'Public',
    title: 'CRISMATECH Education — Overview',
    badge: 'ABOUT 02',
    description: 'Overview of CRISMATECH Education programs, MSME and CTA certifications, and technology training offerings.'
  },
  'curricular_catalog_masterclass_discovery_crismatech': {
    category: 'Courses',
    role: 'Student / Instructor',
    title: 'Course Catalog — Browse All Courses',
    badge: 'COURSES',
    description: 'Browse all available technology courses. Filter by category (Web Dev, Data Science, Cloud, etc.) and difficulty level.'
  },
  'course_details_algorithmic_morphology': {
    category: 'Courses',
    role: 'Student',
    title: 'Course Details — Full Stack Web Development',
    badge: 'COURSE DETAILS',
    description: 'Course overview with video lessons, syllabus, instructor info, difficulty level, and enrollment button.'
  },
  'lesson_player_7.3_subtractive_milling': {
    category: 'Courses',
    role: 'Student',
    title: 'Video Lesson Player',
    badge: 'LESSON PLAYER',
    description: 'Watch video lectures, download PDF notes, and track lesson-by-lesson progress. Lessons unlock sequentially.'
  },
  'curriculum_course_management_crismatech': {
    category: 'Instructor Panel',
    role: 'Instructor',
    title: 'Course Management — Create & Edit Courses',
    badge: 'MANAGE COURSES',
    description: 'Instructor tools for creating courses, uploading video lessons, adding PDF materials, and setting quiz schedules.'
  },
  'student_dashboard_overview_studio': {
    category: 'Student Dashboard',
    role: 'Student',
    title: 'My Dashboard — Learning Overview',
    badge: 'DASHBOARD',
    description: 'Student home: view enrolled courses, continue lessons, check progress, upcoming quizzes, and recent activity.'
  },
  'learning_progress_crismatech': {
    category: 'Student Dashboard',
    role: 'Student',
    title: 'My Progress — Course Completion Tracking',
    badge: 'MY PROGRESS',
    description: 'Track lesson-by-lesson progress across enrolled courses. See completion percentages and time spent learning.'
  },
  'assignment_submission_artifact_verification_crismatech': {
    category: 'Student Dashboard',
    role: 'Student',
    title: 'Submit Assignment',
    badge: 'ASSIGNMENT',
    description: 'Submit assignments: upload files (PDF, Word, ZIP), write case studies, or paste code for instructor review.'
  },
  'certificates_attestations_crismatech': {
    category: 'Student Dashboard',
    role: 'Student',
    title: 'My Certificates',
    badge: 'CERTIFICATES',
    description: 'View and download earned certificates. Each certificate has a unique verification code for employer/university validation.'
  },
  'quiz_instructions_pre_flight_crismatech': {
    category: 'Assessments',
    role: 'Student',
    title: 'Quiz Instructions — Before You Begin',
    badge: 'QUIZ PREP',
    description: 'Pre-quiz instructions: review rules, time limits, and passing criteria (40% minimum). Available only after all lessons are complete.'
  },
  'timed_quiz_interface_crismatech': {
    category: 'Assessments',
    role: 'Student',
    title: 'Take Quiz — Timed Assessment',
    badge: 'QUIZ',
    description: 'Multiple-choice timed quiz interface with question navigator and countdown timer. Submit answers to get instant scoring.'
  },
  'quiz_results_performance_analysis_crismatech': {
    category: 'Assessments',
    role: 'Student',
    title: 'Quiz Results — Score & Grade',
    badge: 'RESULTS',
    description: 'View quiz score, percentage, and letter grade (A+ to D). Passing score is 40%. Certificate issued on pass.'
  },
  'curricular_catalog_quiz_administration_crismatech': {
    category: 'Instructor Panel',
    role: 'Instructor',
    title: 'Quiz Management — Create & Schedule Quizzes',
    badge: 'QUIZ ADMIN',
    description: 'Create multiple-choice questions, set quiz time windows, and view student score distributions.'
  },
  'instructor_studio_overview_crismatech': {
    category: 'Instructor Panel',
    role: 'Instructor',
    title: 'Instructor Dashboard',
    badge: 'INSTRUCTOR',
    description: 'Instructor home: view assigned courses, pending submissions to grade, student enrollment stats, and upcoming sessions.'
  },
  'submissions_assessment_crismatech': {
    category: 'Instructor Panel',
    role: 'Instructor',
    title: 'Grade Submissions — Review Student Work',
    badge: 'GRADING',
    description: 'Review student file uploads, case studies, and code submissions. Assign marks and write feedback.'
  },
  'faculty_verification_instructor_approvals_crismatech': {
    category: 'Admin Panel',
    role: 'Admin',
    title: 'Instructor Approvals — Verify New Instructors',
    badge: 'APPROVALS',
    description: 'Admin screen to review and approve instructor registration requests before they can create courses.'
  },
  'attendance_session_records_crismatech': {
    category: 'Student Dashboard',
    role: 'Student',
    title: 'My Attendance — Activity Log',
    badge: 'ATTENDANCE',
    description: 'View learning activity log: lessons watched, quizzes taken, assignments submitted, and login history.'
  },
  'admin_command_institutional_overview_crismatech': {
    category: 'Admin Panel',
    role: 'Admin',
    title: 'Admin Dashboard — Platform Overview',
    badge: 'ADMIN HOME',
    description: 'Admin home: total students, instructors, active courses, enrollment numbers, and platform health status.'
  },
  'user_directory_access_control_crismatech': {
    category: 'Admin Panel',
    role: 'Admin',
    title: 'User Management — All Users',
    badge: 'USERS',
    description: 'Manage all platform users: students, instructors, and admins. Search, filter by role, activate/deactivate accounts.'
  },
  'institutional_analytics_reporting_intelligence_crismatech': {
    category: 'Admin Panel',
    role: 'Admin',
    title: 'Platform Analytics — Reports & Insights',
    badge: 'ANALYTICS',
    description: 'Platform-wide analytics: enrollment trends, course completion rates, quiz pass rates, and active user metrics.'
  },
  'login_institutional_authentication_crismatech': {
    category: 'Authentication',
    role: 'Public',
    title: 'Sign In to CRISMATECH',
    badge: 'LOGIN',
    description: 'Login page for students, instructors, and admins to access the CRISMATECH E-Learning Portal.'
  },
  'fellow_registration_account_setup_crismatech': {
    category: 'Authentication',
    role: 'Public',
    title: 'Student Registration — Create Account',
    badge: 'REGISTER',
    description: 'New student sign-up: enter name, email, college, branch, and semester. Email verified via 6-digit OTP.'
  },
  'email_otp_verification_crismatech': {
    category: 'Authentication',
    role: 'Public',
    title: 'Email Verification — Enter OTP Code',
    badge: 'OTP',
    description: 'Enter the 6-digit verification code sent to your email to confirm your account and complete registration.'
  },
  'password_recovery_credential_reset_crismatech': {
    category: 'Authentication',
    role: 'Public',
    title: 'Reset Password',
    badge: 'RESET',
    description: 'Request a password reset link sent to your registered email address.'
  }
};

// ─── Global Text Replacements (applied to ALL screens) ───
function applyGlobalReplacements(html) {
  const replacements = [
    // ── Company Identity ──
    ['Academy of Letters &amp; Systems', 'Education'],
    ['Academy of Letters & Systems', 'Education'],
    ['ACADEMY OF LETTERS &amp; SYSTEMS', 'EDUCATION'],
    ['ACADEMY OF LETTERS & SYSTEMS', 'EDUCATION'],
    ['Academy of Letters &amp;amp; Systems', 'Education'],

    // ── Role Terminology ──
    ['Fellow (Student)', 'Student'],
    ['Fellow (Post-Doc)', 'Student'],
    ['Fellow', 'Student'],
    ['FELLOW', 'STUDENT'],
    ['FELLOWSHIP ENROLLED', 'STUDENT ENROLLED'],
    ['Fellowship', 'Student Account'],
    ['Fellowships', 'Student Accounts'],
    ['Fellows &amp; Scholars', 'Students'],
    ['Fellows & Scholars', 'Students'],
    ['Scholars', 'Students'],
    ['Scholar', 'Student'],
    ['SCHOLAR', 'STUDENT'],
    ['Provost', 'Admin'],
    ['PROVOST', 'ADMIN'],
    ['Director Marcus Thorne', 'Platform Admin'],
    ['Marcus Thorne', 'Platform Admin'],
    ['Office of the Provost', 'Platform Administration'],
    ['Academic Administrator / Provost', 'Platform Administrator'],
    ['Academic Administrator', 'Platform Administrator'],
    ['Registrar', 'Admin'],
    ['REGISTRAR', 'ADMIN'],

    // ── Institutional → Platform ──
    ['Institutional', 'Platform'],
    ['INSTITUTIONAL', 'PLATFORM'],
    ['institutional', 'platform'],
    ['ADMINISTRATIVE GOVERNANCE ACTIVE', 'PLATFORM ACTIVE'],
    ['ADMINISTRATIVE GOVERNANCE INDEX', 'ADMIN NAVIGATION'],
    ['Administrative Governance', 'Platform Management'],
    ['Academic Command', 'Admin Dashboard'],
    ['ACADEMIC LEDGER ACTIVE', 'LEARNING DASHBOARD ACTIVE'],
    ['Academic Index', 'My Courses'],
    ['Academic Standing', 'Overall Grade'],
    ['HIGH HONORS CANDIDATE', 'ON TRACK'],

    // ── Location & Nodes ──
    ['Cambridge-Zürich', 'KGF-Bengaluru'],
    ['Cambridge-Zurich', 'KGF-Bengaluru'],
    ['Cambridge (UK)', 'KGF Campus'],
    ['Zürich Node (ETH)', 'Bengaluru Campus'],
    ['Cambridge Node (UK)', 'KGF Campus'],
    ['Princeton Node (USA)', 'Online'],
    ['MIT Media Lab Node', 'Online'],
    ['All Institutional Nodes', 'All Campuses'],
    ['CAMBRIDGE / ZÜRICH NODES', 'KGF / BENGALURU'],
    ['LOC: CAMBRIDGE / ZÜRICH NODES', 'LOC: KGF / BENGALURU'],
    ['Cambridge and Zürich nodes', 'KGF and Bengaluru campuses'],
    ['Cambridge VPN', 'CRISMATECH Network'],
    ['Zürich High-Bay Robotic Fabrication Rig #3', 'CRISMATECH Lab — Bengaluru Campus'],
    ['NODE LATENCY', 'SERVER STATUS'],
    ['GLOBAL FABRIC', 'ACTIVE'],
    ['CONSENSUS STATE', 'UPTIME'],
    ['Node', 'Campus'],
    ['NODE', 'CAMPUS'],

    // ── Academic Jargon → E-Learning Language ──
    ['Masterclass', 'Course'],
    ['MASTERCLASS', 'COURSE'],
    ['masterclass', 'course'],
    ['Masterclasses', 'Courses'],
    ['MASTERCLASSES', 'COURSES'],
    ['masterclasses', 'courses'],
    ['Curriculum', 'Courses'],
    ['CURRICULUM', 'COURSES'],
    ['curriculum', 'courses'],
    ['Curricular', 'Course'],
    ['CURRICULAR', 'COURSE'],
    ['curricular', 'course'],
    ['Syllabus', 'Course Content'],
    ['SYLLABUS', 'COURSE CONTENT'],
    ['syllabus', 'course content'],
    ['Studio', 'Dashboard'],
    ['STUDIO', 'DASHBOARD'],
    ['studio', 'dashboard'],
    ['Colloquium', 'Live Session'],
    ['COLLOQUIUM', 'LIVE SESSION'],
    ['colloquium', 'live session'],
    ['Seminar', 'Session'],
    ['SEMINAR', 'SESSION'],
    ['Seminars &amp; Labs', 'Practice Labs'],
    ['Archive &amp; Research', 'Resources'],
    ['Cohort', 'Batch'],
    ['COHORT', 'BATCH'],
    ['cohort', 'batch'],

    // ── Course-Specific Replacements ──
    ['ARCH-702', 'WEB-101'],
    ['Algorithmic Morphology', 'Full Stack Web Development'],
    ['ALGORITHMIC MORPHOLOGY', 'FULL STACK WEB DEVELOPMENT'],
    ['Algorithmic Morphology &amp; Robotic Timber Fabrication', 'Full Stack Web Development'],
    ['Robotic Timber Fabrication', 'JavaScript & React'],
    ['Spatial intelligence', 'Web technologies'],
    ['Spatial systems', 'Web Development'],
    ['ML-401', 'DS-201'],
    ['Machine Learning / Matter', 'Data Science & Analytics'],
    ['Machine intelligence', 'Data Science'],
    ['FAB-210', 'PY-301'],
    ['The New Fabrication', 'Python Programming'],
    ['Digital craft', 'Programming'],
    ['SYS-118', 'CLD-401'],
    ['Systems for a Living City', 'Cloud Computing & DevOps'],
    ['Urban futures', 'Cloud & DevOps'],
    ['NEU-5020', 'SEC-501'],
    ['Spatial Cognition &amp; Neuro-Morphology', 'Cybersecurity Fundamentals'],
    ['ARC-7104', 'WEB-101'],

    // ── Lesson Replacements ──
    ['Subtractive Milling', 'Building REST APIs'],
    ['SUBTRACTIVE MILLING', 'BUILDING REST APIS'],
    ['Subtractive milling', 'Building REST APIs'],
    ['subtractive milling', 'building REST APIs'],
    ['Subtractive Joinery', 'React Components'],
    ['Toolpath', 'Code Exercise'],
    ['TOOLPATH', 'CODE EXERCISE'],
    ['toolpath', 'code exercise'],
    ['Toolpaths', 'Code Exercises'],
    ['toolpaths', 'code exercises'],
    ['Milling', 'Coding'],
    ['milling', 'coding'],
    ['Fabrication', 'Development'],
    ['FABRICATION', 'DEVELOPMENT'],
    ['fabrication', 'development'],
    ['Kinematics', 'Algorithms'],
    ['KINEMATICS', 'ALGORITHMS'],
    ['kinematics', 'algorithms'],
    ['Collision Manifolds', 'Data Structures'],
    ['COLLISION MANIFOLDS', 'DATA STRUCTURES'],
    ['Volumetric Subtraction', 'API Design'],
    ['VOLUMETRIC SUBTRACTION', 'API DESIGN'],
    ['Spindle', 'Server'],
    ['spindle', 'server'],

    // ── Instructor Names → Generic ──
    ['Professor Rostova', 'Instructor'],
    ['Prof. Elena Rostova', 'Course Instructor'],
    ['Amina Okafor', 'Rahul Sharma'],
    ['Dr. Elias Vance', 'Priya Nair'],
    ['Noah Williams', 'Arjun Reddy'],
    ['Mara Chen', 'Sneha Patel'],
    ['Dr. Elizabeth Vance', 'Student User'],
    ['Dr. E. Vance, Student', 'Student User'],
    ['Dr. E. Vance', 'Student User'],
    ['Dr. Vance', 'Student'],
    ['Dr. Aris Thorne', 'New Instructor'],
    ['Dr. Mathilde Laurent', 'Pending Instructor'],
    ['Dr. Alan Sachs', 'Course Instructor'],
    ['Julian K. Mercer', 'Student User'],
    ['Sophia Al-Mansoor', 'Student User'],

    // ── Tech Jargon Cleanup ──
    ['ECTS Accrued', 'Courses Completed'],
    ['ECTS Credits Accrued', 'Courses Completed'],
    ['ECTS', 'Credits'],
    ['Compute Rig', 'Lab Environment'],
    ['COMPUTE RIG', 'LAB ENVIRONMENT'],
    ['Compute &amp; Rig Allocations', 'Lab Environments'],
    ['compute rig', 'lab environment'],
    ['Rig', 'Lab'],
    ['RIG', 'LAB'],
    ['PGP', 'Verified'],
    ['PGP SIGNED', 'VERIFIED'],
    ['SHA-256', 'Verification Code'],
    ['sha256', 'verification code'],
    ['YubiKey', 'Email'],
    ['Hardware Token', 'Email Verified'],
    ['WebAuthn Token', 'Email Login'],
    ['SSH Handshake', 'Login Session'],
    ['Vault Commit', 'Assignment Submit'],
    ['ed25519', 'verified'],
    ['Cryptographic', 'Digital'],
    ['CRYPTOGRAPHIC', 'DIGITAL'],
    ['cryptographic', 'digital'],
    ['Attestation', 'Status'],
    ['ATTESTATION', 'STATUS'],
    ['attestation', 'status'],
    ['Attested', 'Verified'],
    ['ATTESTED', 'VERIFIED'],
    ['Attest', 'Verify'],

    // ── Misc Branding ──
    ['AUTUMN TERM 2025', 'CURRENT TERM 2025'],
    ['AUTUMN 2025', 'CURRENT TERM 2025'],
    ['Autumn 2025', 'Current Term 2025'],
    ['TERM 03 / RESIDENCY 2025', 'CURRENT TERM 2025'],
    ['RESIDENCY', 'TERM'],
    ['EPOCH:', 'TIME:'],
    ['AUDIT ROOT:', 'RECORDS:'],
    ['Audit Ledger', 'Activity Log'],
    ['AUDIT', 'ACTIVITY'],
    ['audit', 'activity'],
    ['Governance', 'Management'],
    ['GOVERNANCE', 'MANAGEMENT'],
    ['governance', 'management'],
    ['Accreditation', 'Approval'],
    ['ACCREDITATION', 'APPROVAL'],
    ['accreditation', 'approval'],
    ['Ledger', 'Records'],
    ['LEDGER', 'RECORDS'],
    ['ledger', 'records'],
    ['Dispatch', 'Notification'],
    ['DISPATCH', 'NOTIFICATION'],
    ['dispatch', 'notification'],
    ['manuscripts', 'assignments'],
    ['Manuscripts', 'Assignments'],
    ['MANUSCRIPTS', 'ASSIGNMENTS'],
    ['manuscript', 'assignment'],
    ['codebases', 'courses'],
    ['syllabi', 'course content'],
    ['Search assignments, course content, courses...', 'Search courses, lessons, assignments...'],
    ['Search users, courses, faculty credentials, activity logs...', 'Search users, courses, and activity...'],

    // ── Session/Admin ──
    ['SESSION ID:', 'SESSION:'],
    ['0x8F4A', 'Active'],
    ['CRIS-8820-T', 'STU-001'],
    ['CRIS-8834-K', 'STU-002'],
    ['CRIS-8791-S', 'STU-003'],
    ['TU Munich', 'CRISMATECH Education, Bengaluru'],
    ['Sorbonne Université / Bio-Material Synthesis Lab', 'CRISMATECH Education, KGF'],
    ['Sorbonne', 'CRISMATECH'],
    ['ETH D-ARCH', 'CRISMATECH-BLR'],

    // Contact
    ['director@crismatech.com', 'director@crismatech.com'],
  ];

  for (const [search, replace] of replacements) {
    // Use split/join for safe global replacement without regex issues
    html = html.split(search).join(replace);
  }

  return html;
}

// ─── Per-Screen Content Cleaning (Remove All Demo Data) ───
function cleanOperationalHtml(dir, html) {
  // 1. ATTENDANCE & STUDIO SESSION RECORDS
  if (dir === 'attendance_session_records_crismatech') {
    // Clear mock table rows (id is tableBody)
    const tbodyRegex = /<tbody[^>]*id=["']tableBody["'][^>]*>[\s\S]*?<\/tbody>/i;
    const emptyBody = `<tbody class="divide-y divide-surface-container-low text-body-sm font-body-sm" id="tableBody">
      <tr>
        <td colspan="7" class="py-16 px-6 text-center bg-surface-container-low/30">
          <div class="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
            <span class="material-symbols-outlined text-4xl text-outline/50">event_busy</span>
            <span class="font-headline-sm text-xl text-primary font-medium">No Attendance Records Yet</span>
            <p class="font-body-sm text-sm text-on-surface-variant leading-relaxed">
              Your attendance across live sessions, webinars, and studio classes will automatically appear here as sessions occur.
            </p>
          </div>
        </td>
      </tr>
    </tbody>`;
    html = html.replace(tbodyRegex, emptyBody);

    // Reset metric cards
    html = html.replace(/<div class="font-headline-lg text-headline-lg text-primary font-medium tracking-tight">98\.4%<\/div>/g, '<div class="font-headline-lg text-headline-lg text-primary font-medium tracking-tight">0.0%</div>');
    html = html.replace(/EXEMPLARY STANDING/g, 'NO SESSIONS LOGGED');
    html = html.replace(/<div class="bg-primary h-full w-\[98\.4%\]"><\/div>/g, '<div class="bg-primary h-full w-[0%]"></div>');
    html = html.replace(/42 \/ 44/g, '0 / 0');
    html = html.replace(/95\.5% CONTACT COMPLETED/g, '0.0% COMPLETED');
    html = html.replace(/<div class="font-headline-lg text-headline-lg text-secondary font-medium tracking-tight">02<\/div>/g, '<div class="font-headline-lg text-headline-lg text-secondary font-medium tracking-tight">00</div>');
    html = html.replace(/REF #MED-881 \/ JURY LEAVE/g, 'NO LEAVE RECORDED');
    html = html.replace(/All Sessions \[44\]/g, 'All Sessions [0]');
    html = html.replace(/Present \[40\]/g, 'Present [0]');
    html = html.replace(/Attested \/ Excused \[02\]/g, 'Excused [0]');
    html = html.replace(/Remote Attestation \[02\]/g, 'Remote [0]');
    html = html.replace(/SHOWING <span class="text-on-surface font-medium" id="visibleRowCount">\d+<\/span> OF \d+ AUDITED SESSIONS/g, 'SHOWING <span class="text-on-surface font-medium" id="visibleRowCount">0</span> OF 0 SESSIONS');
    html = html.replace(/DR\. ELIZABETH VANCE/g, 'CURRENT STUDENT');
    html = html.replace(/CRIS-8820-T/g, 'STU-001');
    html = html.replace(/Next scheduled contact: Colloquium 08 \(Tomorrow, 09:30 CET\) with Dr\. Alan Sachs/g, 'No scheduled live sessions for today. Upcoming sessions will appear here.');
    html = html.replace(/\+13\.4% Surplus Margin/g, '0.0% Margin');
  }

  // 2. USER DIRECTORY & ACCESS CONTROL
  if (dir === 'user_directory_access_control_crismatech') {
    // Clear table body
    const tbodyRegex = /<tbody[^>]*id=["']directory-tbody["'][^>]*>[\s\S]*?<\/tbody>/i;
    const emptyTableBody = `<tbody class="divide-y divide-surface-container font-body-sm text-body-sm" id="directory-tbody">
      <tr>
        <td colspan="8" class="py-12 px-6 text-center bg-surface-container-low/40">
          <div class="flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
            <span class="material-symbols-outlined text-3xl text-outline/60">person_off</span>
            <span class="font-headline-sm text-base text-primary font-medium">No User Records Yet</span>
            <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed">
              Connect your student database or add users manually. Students will appear here after they register and verify their email via OTP.
            </p>
            <div class="flex items-center gap-2.5 mt-2">
              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-surface rounded text-xs font-label-mono-xs uppercase tracking-wider font-semibold hover:bg-primary-container transition-colors shadow-sm">
                + Add Student
              </button>
              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-container text-on-surface rounded text-xs font-label-mono-xs uppercase tracking-wider hover:bg-surface-container-high transition-colors">
                Import CSV
              </button>
            </div>
          </div>
        </td>
      </tr>
    </tbody>`;
    html = html.replace(tbodyRegex, emptyTableBody);

    // Reset top stats
    html = html.replace(/>1,474</g, '>0<');
    html = html.replace(/>1,428</g, '>0<');
    html = html.replace(/>96\.8%</g, '>0.0%<');
    html = html.replace(/>46</g, '>1<');
    html = html.replace(/>8</g, '>1<');
    html = html.replace(/>2</g, '>0<');
    html = html.replace(/All Roles \[1,474\]/g, 'All Roles [1]');
    html = html.replace(/Students &amp; Students \[1,428\]/g, 'Students [0]');
    html = html.replace(/Students & Students \[1,428\]/g, 'Students [0]');
    html = html.replace(/Faculty \/ Instructors \[46\]/g, 'Instructors [0]');
    html = html.replace(/Platform Admins \[8\]/g, 'Admins [1]');
    html = html.replace(/External Jurors \[12\]/g, 'External [0]');
    html = html.replace(/6 of 1,474 Records Loaded/g, '0 of 0 Records Loaded');
    html = html.replace(/Showing 1–6 of 1,474 registered scholars • Page 1 of 246/g, 'Showing 0 of 0 registered users • Page 1 of 1');

    // Replace right panel dossier (Dr. Elizabeth Vance) with empty state
    const rightPaneRegex = /<div class="lg:col-span-4 flex flex-col gap-5 sticky top-20">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/main>/i;
    const cleanRightPane = `<div class="lg:col-span-4 flex flex-col gap-5 sticky top-20">
      <div class="bg-surface-container-lowest rounded shadow-[0_1px_6px_rgba(0,0,0,0.03)] p-8 flex flex-col items-center justify-center text-center gap-3 border border-surface-container">
        <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
          <span class="material-symbols-outlined text-2xl">badge</span>
        </div>
        <h3 class="font-headline-sm text-base text-primary font-medium">No User Selected</h3>
        <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed">
          Select a user from the directory table to inspect their profile details, course enrollments, attendance history, and access permissions.
        </p>
      </div>
    </div>
  </div>
</div>
</div>
</main>`;
    html = html.replace(rightPaneRegex, cleanRightPane);
  }

  // 3. FACULTY VERIFICATION & INSTRUCTOR APPROVALS
  if (dir === 'faculty_verification_instructor_approvals_crismatech') {
    html = html.replace(/>4<\/span>\s*<\/button>/g, '>0</span></button>');
    html = html.replace(/>42<\/span>\s*<\/button>/g, '>0</span></button>');
    html = html.replace(/>2<\/span>\s*<\/button>/g, '>0</span></button>');
    html = html.replace(/>128<\/span>\s*<\/button>/g, '>0</span></button>');
    html = html.replace(/Application Queue \(Sorted by Urgency\)/g, 'Instructor Approval Queue');

    const workspaceRegex = /<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">[\s\S]*?<\/main>/i;
    const cleanWorkspace = `<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <!-- LEFT PANE: Empty Queue -->
      <div class="lg:col-span-5 flex flex-col gap-4">
        <div class="flex items-center justify-between px-2">
          <span class="font-label-mono-xs text-label-mono-xs uppercase tracking-wider text-outline">Instructor Approval Queue</span>
          <span class="font-label-mono-xs text-label-mono-xs text-on-surface-variant">0 PENDING</span>
        </div>
        <div class="p-8 rounded bg-surface-container-lowest border border-surface-container flex flex-col items-center justify-center text-center gap-3">
          <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
            <span class="material-symbols-outlined text-2xl">verified_user</span>
          </div>
          <h3 class="font-headline-sm text-base text-primary font-medium">No Pending Approvals</h3>
          <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            All instructor verification applications have been reviewed. When new instructors register, their dossiers will appear here for verification.
          </p>
        </div>
      </div>
      <!-- RIGHT PANE: Clean Details Placeholder -->
      <div class="lg:col-span-7 bg-surface-container-lowest rounded p-12 flex flex-col items-center justify-center text-center gap-3 border border-surface-container min-h-[400px]">
        <span class="material-symbols-outlined text-4xl text-outline/50">folder_open</span>
        <h3 class="font-headline-sm text-lg text-primary font-medium">No Instructor Selected</h3>
        <p class="font-body-sm text-sm text-on-surface-variant max-w-sm leading-relaxed">
          Select an applicant from the verification queue to inspect their submitted credentials, certifications, and teaching background.
        </p>
      </div>
    </div>
    </main>`;
    html = html.replace(workspaceRegex, cleanWorkspace);
  }

  // 4. SUBMISSIONS ASSESSMENT
  if (dir === 'submissions_assessment_crismatech') {
    html = html.replace(/CANDIDATE DOSSIERS QUEUE \(\d+\)/g, 'SUBMISSIONS QUEUE (0)');
    const workspaceRegex = /<div class="grid grid-cols-12 gap-6 items-start mt-2">[\s\S]*?<\/main>/i;
    const cleanWorkspace = `<div class="grid grid-cols-12 gap-6 items-start mt-2">
      <!-- LEFT: Empty Queue -->
      <div class="col-span-12 xl:col-span-4 flex flex-col gap-3">
        <div class="flex items-center justify-between px-1">
          <span class="font-label-mono-xs text-label-mono-xs uppercase text-outline tracking-wider">SUBMISSIONS QUEUE (0)</span>
          <span class="font-label-mono-xs text-label-mono-xs text-secondary font-medium">[AUTO-REFRESH: ACTIVE]</span>
        </div>
        <div class="p-8 bg-surface-container-lowest rounded shadow-sm text-center flex flex-col items-center justify-center gap-3 border border-surface-container">
          <span class="material-symbols-outlined text-3xl text-outline/60">task_alt</span>
          <h3 class="font-headline-sm text-base text-primary font-medium">Submissions Queue Empty</h3>
          <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed">
            No student assignments are currently awaiting grading. When students submit assignments, they will appear here.
          </p>
        </div>
      </div>
      <!-- RIGHT: Clean Assessment Desk -->
      <div class="col-span-12 xl:col-span-8 bg-surface-container-lowest rounded p-12 flex flex-col items-center justify-center text-center gap-3 border border-surface-container shadow-sm min-h-[420px]">
        <span class="material-symbols-outlined text-4xl text-outline/50">grading</span>
        <h3 class="font-headline-sm text-lg text-primary font-medium">No Submission Selected</h3>
        <p class="font-body-sm text-sm text-on-surface-variant max-w-md leading-relaxed">
          Select an assignment submission from the queue to review files, evaluate code or reports, and issue rubric grades and feedback.
        </p>
      </div>
    </div>
    </main>`;
    html = html.replace(workspaceRegex, cleanWorkspace);
  }

  // 5. STUDENT DASHBOARD OVERVIEW
  if (dir === 'student_dashboard_overview_studio') {
    // Replace active course card
    const courseCardRegex = /<!-- Studio Module 01: Core In-Progress Workbench -->[\s\S]*?<!-- Secondary Course Card: Computational Timber Joinery -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/i;
    const cleanCourseCard = `<div class="bg-surface-container-lowest rounded-lg p-8 border border-surface-dim flex flex-col items-center justify-center text-center gap-4">
      <div class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-primary">
        <span class="material-symbols-outlined text-3xl">school</span>
      </div>
      <div class="max-w-md">
        <h3 class="font-headline-sm text-xl text-primary font-medium">No Active Courses Enrolled</h3>
        <p class="font-body-sm text-sm text-on-surface-variant mt-1.5 leading-relaxed">
          You are not currently enrolled in any courses. Explore our technology programs in Web Development, Python, Cloud, and Data Science to get started.
        </p>
      </div>
      <a href="#/curricular_catalog_masterclass_discovery_crismatech" class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary font-body-sm text-body-sm font-medium rounded hover:bg-primary-container transition-colors shadow-sm">
        <span class="material-symbols-outlined text-base">explore</span>
        <span>Browse Course Catalog</span>
      </a>
    </div>`;
    html = html.replace(courseCardRegex, cleanCourseCard);

    // Reset telemetry metrics
    html = html.replace(/4× H100 SXM5/g, '0 Allocated');
    html = html.replace(/1\.84 \/ 4\.0 TB/g, '0 / 25 GB');
    html = html.replace(/14\.5 Hours/g, '0 Hours');
    html = html.replace(/92\.4% EFFICIENCY/g, '0% USAGE');

    // Reset Schedule Ledger
    const scheduleRegex = /<!-- Synchronous Schedule Ledger[\s\S]*?<!-- Synchronous Colloquia Calendar Strip/i;
    const cleanSchedule = `<!-- Synchronous Schedule Ledger -->
    <div class="bg-surface-container-lowest rounded shadow-sm border border-surface-dim overflow-hidden p-8 text-center flex flex-col items-center justify-center gap-2.5">
      <span class="material-symbols-outlined text-3xl text-outline/50">event_available</span>
      <h4 class="font-headline-sm text-base text-primary font-medium">No Upcoming Events</h4>
      <p class="font-body-sm text-xs text-on-surface-variant leading-relaxed">
        You have no scheduled live sessions, deadlines, or quizzes in the next 72 hours.
      </p>
    </div>
    <!-- Synchronous Colloquia Calendar Strip`;
    html = html.replace(scheduleRegex, cleanSchedule);
  }

  // 6. LEARNING PROGRESS
  if (dir === 'learning_progress_crismatech') {
    html = html.replace(/64% Completed/g, '0% Completed');
    html = html.replace(/24 \/ 32/g, '0 / 0');
    html = html.replace(/75% Module Pass Rate/g, '0% Module Pass Rate');
    html = html.replace(/93\.4/g, '—');
    html = html.replace(/\[HONORS\]/g, '[NEW STUDENT]');
    html = html.replace(/Top Decile Standing/g, 'No Assessments Completed');
    html = html.replace(/03 STUDIOS ACTIVE/g, '0 COURSES ACTIVE');

    const activeSectionRegex = /<!-- Active Courses Section -->[\s\S]*?<\/section>/i;
    const cleanActiveSection = `<!-- Active Courses Section -->
    <section class="flex flex-col gap-space-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-baseline gap-3">
          <h2 class="font-headline-sm text-headline-sm font-medium text-primary">In Progress</h2>
          <span class="font-label-mono-xs text-label-mono-xs px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-medium">0 COURSES ACTIVE</span>
        </div>
      </div>
      <div class="p-12 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container flex flex-col items-center justify-center text-center gap-3">
        <div class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline">
          <span class="material-symbols-outlined text-3xl">hourglass_empty</span>
        </div>
        <h3 class="font-headline-sm text-xl text-primary font-medium">No Courses in Progress</h3>
        <p class="font-body-sm text-sm text-on-surface-variant max-w-md leading-relaxed">
          Your lesson-by-lesson learning progress, video completion rates, and assessment scores will appear here once you begin learning.
        </p>
        <a href="#/curricular_catalog_masterclass_discovery_crismatech" class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary font-body-sm text-body-sm rounded hover:bg-primary-container transition-colors shadow-sm mt-2">
          <span class="material-symbols-outlined text-base">search</span>
          <span>Find Courses to Start</span>
        </a>
      </div>
    </section>`;
    html = html.replace(activeSectionRegex, cleanActiveSection);
  }

  // 7. CERTIFICATES & ATTESTATIONS
  if (dir === 'certificates_attestations_crismatech') {
    html = html.replace(/Conferred Certificates \(2\)/g, 'Conferred Certificates (0)');
    const certListRegex = /<!-- Card 1 \(Active\) -->[\s\S]*?<!-- Right Column: Verification Dossier & Certificate Visualizer/i;
    const cleanCertList = `<div class="p-10 bg-surface-container-lowest rounded-lg shadow-sm border border-surface-container text-center flex flex-col items-center justify-center gap-3 mb-6">
      <div class="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center text-outline">
        <span class="material-symbols-outlined text-3xl">workspace_premium</span>
      </div>
      <h3 class="font-headline-sm text-xl text-primary font-medium">No Certificates Earned Yet</h3>
      <p class="font-body-sm text-sm text-on-surface-variant max-w-md leading-relaxed">
        Complete all sequential video lessons and pass the final course quiz with at least 40% to earn your officially verified CRISMATECH Certificate.
      </p>
    </div>
    <!-- Right Column: Verification Dossier & Certificate Visualizer`;
    html = html.replace(certListRegex, cleanCertList);
  }

  // 8. ASSIGNMENT SUBMISSION & ARTIFACT VERIFICATION
  if (dir === 'assignment_submission_artifact_verification_crismatech') {
    html = html.replace(/Staged Artifacts \(3 of 3 Verified\)/g, 'Staged Artifacts (0 Files Staged)');
    const stagedRegex = /<!-- Artifact 1: Grasshopper Script -->[\s\S]*?<!-- Submission Checklist & Final Attestation -->/i;
    const cleanStaged = `<div class="p-8 bg-surface-container-low rounded-lg border-2 border-dashed border-outline-variant/60 text-center flex flex-col items-center justify-center gap-2.5 my-3">
      <span class="material-symbols-outlined text-3xl text-outline/60">cloud_upload</span>
      <span class="font-body-md font-medium text-on-surface">No Files Staged Yet</span>
      <p class="font-body-sm text-xs text-on-surface-variant max-w-xs">
        Drag and drop assignment files here, or use the file picker above. Supported formats: .PDF, .DOCX, .ZIP, .PY, .JS (up to 50 MB).
      </p>
    </div>
    <!-- Submission Checklist & Final Attestation -->`;
    html = html.replace(stagedRegex, cleanStaged);
  }

  // 9. INSTRUCTOR STUDIO OVERVIEW
  if (dir === 'instructor_studio_overview_crismatech') {
    html = html.replace(/342 Fellows/g, '0 Students Enrolled');
    html = html.replace(/71\.4% COMPLETED/g, '0.0% AVERAGE PROGRESS');
    html = html.replace(/>342<\/span>/g, '>0</span>');
    html = html.replace(/>04<\/span>/g, '>0</span>');
    html = html.replace(/>14<\/span>/g, '>0</span>');
  }

  // 10. ADMIN COMMAND INSTITUTIONAL OVERVIEW
  if (dir === 'admin_command_institutional_overview_crismatech') {
    html = html.replace(/>1,428<\/span>/g, '>0</span>');
    html = html.replace(/RESIDENT FELLOWS: 312/g, 'ENROLLED STUDENTS: 0');
    html = html.replace(/AUDITORS: 1,116/g, 'AUDITORS: 0');
    html = html.replace(/>46<\/span>/g, '>1</span>');
    html = html.replace(/>04<\/span>/g, '>0</span>');
    html = html.replace(/\[ACTION REQ < 48H\]/g, '[ALL REVIEWED]');
  }

  // 11. CURRICULAR CATALOG QUIZ ADMINISTRATION
  if (dir === 'curricular_catalog_quiz_administration_crismatech') {
    html = html.replace(/Scheduled Proctored Quizzes \(8\)/g, 'Scheduled Quizzes (0)');
    html = html.replace(/\[LIVE WINDOW ACTIVE - 88 OF 128 SUBMITTED\]/g, '[SCHEDULED QUIZZES: 0 ACTIVE]');
  }

  return html;
}

const screens = [];

for (const dir of dirs) {
  const filePath = path.join(root, dir, 'code.html');
  let content = fs.readFileSync(filePath, 'utf8');

  // 1) Apply per-screen operational cleanup
  content = cleanOperationalHtml(dir, content);

  // 2) Extract body
  const bodyMatch = content.match(/<body([^>]*)>([\s\S]*?)<\/body>/i);
  let bodyAttr = bodyMatch ? bodyMatch[1] : '';
  let bodyHtml = bodyMatch ? bodyMatch[2] : content;

  const classMatch = bodyAttr.match(/class=["']([^"']*)["']/i);
  const bodyClass = classMatch ? classMatch[1] : 'bg-background font-body-md text-on-surface antialiased';

  // 3) Extract inline scripts (for micro-interactions)
  const scriptMatches = [...bodyHtml.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
  const inlineScripts = scriptMatches
    .map(m => m[1].trim())
    .filter(s => !s.includes('cdn.tailwindcss.com') && !s.includes('tailwind.config'));

  // 4) Strip all scripts from rendered HTML
  let cleanHtml = bodyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

  // 5) Apply global CRISMATECH Education text transformations
  cleanHtml = applyGlobalReplacements(cleanHtml);

  // Also transform scripts so their text content matches
  const transformedScripts = inlineScripts.map(s => applyGlobalReplacements(s));

  const meta = screenMeta[dir] || {
    category: 'General',
    role: 'General',
    title: dir.replace(/_/g, ' '),
    badge: dir,
    description: dir
  };

  screens.push({
    id: dir,
    ...meta,
    bodyClass,
    html: cleanHtml,
    scripts: transformedScripts
  });
}

// Write screensData.js
const outputPath = path.join(__dirname, 'src', 'screensData.js');
const jsOutput = `// Auto-generated: CRISMATECH Education E-Learning Portal — 26 screens
// Company: CRISMATECH Education, KGF & Bengaluru
// Contact: director@crismatech.com
export const screens = ${JSON.stringify(screens, null, 2)};

export const categories = [
  'All Screens',
  'Public Pages',
  'Courses',
  'Student Dashboard',
  'Assessments',
  'Instructor Panel',
  'Admin Panel',
  'Authentication'
];

export const screenMap = Object.fromEntries(screens.map(s => [s.id, s]));
`;

fs.writeFileSync(outputPath, jsOutput, 'utf8');
console.log(`✓ Saved ${screens.length} screens rebranded to CRISMATECH Education e-learning portal.`);
