const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;
let isConnected = false;
let fallbackStore = null;

// Configure connection options from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'course_management',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

/**
 * In-memory relational storage fallback
 * Ensures instant out-of-the-box demo if MySQL credentials are not yet updated.
 */
function createFallbackStore() {
  const store = {
    users: [
      { id: 1, name: 'Admin Director', email: 'admin@cms.edu', password: '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', role: 'ADMIN', created_at: new Date() },
      { id: 2, name: 'Prof. Rahul Sharma', email: 'rahul@cms.edu', password: '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', role: 'TEACHER', created_at: new Date() },
      { id: 3, name: 'Dr. Priya Patel', email: 'priya@cms.edu', password: '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', role: 'TEACHER', created_at: new Date() },
      { id: 4, name: 'Alice Walker', email: 'alice@student.edu', password: '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', role: 'STUDENT', created_at: new Date() },
      { id: 5, name: 'Bob Jenkins', email: 'bob@student.edu', password: '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', role: 'STUDENT', created_at: new Date() },
      { id: 6, name: 'Charlie Evans', email: 'charlie@student.edu', password: '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', role: 'STUDENT', created_at: new Date() }
    ],
    courses: [
      { id: 1, course_name: 'Database Management Systems', course_code: 'CS301', description: 'Relational algebra, MySQL queries, Normalization, Transactions, and Indexing.', duration: '12 Weeks', teacher_id: 2, created_at: new Date() },
      { id: 2, course_name: 'Full Stack Web Development', course_code: 'CS304', description: 'Modern web architectures, Node.js REST APIs, SPA frontends, and authentication.', duration: '10 Weeks', teacher_id: 2, created_at: new Date() },
      { id: 3, course_name: 'Object Oriented Java Programming', course_code: 'CS201', description: 'Core Java, Collections framework, Multi-threading, and Spring Boot basics.', duration: '14 Weeks', teacher_id: 3, created_at: new Date() },
      { id: 4, course_name: 'Cloud Computing & DevOps', course_code: 'CS402', description: 'Docker, CI/CD pipelines, container orchestration, and cloud deployments.', duration: '8 Weeks', teacher_id: 3, created_at: new Date() }
    ],
    enrollments: [
      { id: 1, student_id: 4, course_id: 1, enrolled_date: new Date(), status: 'ACTIVE' },
      { id: 2, student_id: 4, course_id: 2, enrolled_date: new Date(), status: 'ACTIVE' },
      { id: 3, student_id: 5, course_id: 1, enrolled_date: new Date(), status: 'ACTIVE' },
      { id: 4, student_id: 5, course_id: 3, enrolled_date: new Date(), status: 'ACTIVE' },
      { id: 5, student_id: 6, course_id: 2, enrolled_date: new Date(), status: 'ACTIVE' }
    ],
    materials: [
      { id: 1, course_id: 1, title: 'Module 1: Relational Schema & Normalization (1NF to BCNF)', description: 'Lecture notes on database design and normalization theory.', file_url: '/uploads/sample_notes.pdf', file_size: 245000, uploaded_date: new Date() },
      { id: 2, course_id: 1, title: 'Module 2: Advanced SQL Joins & Subqueries Cheatsheet', description: 'Complete query reference with examples and optimization tips.', file_url: '/uploads/sample_notes.pdf', file_size: 182000, uploaded_date: new Date() },
      { id: 3, course_id: 2, title: 'Express.js & REST API Design Guide', description: 'Best practices for RESTful endpoints, error handling and JWT tokens.', file_url: '/uploads/sample_notes.pdf', file_size: 310000, uploaded_date: new Date() },
      { id: 4, course_id: 3, title: 'Java Collections & Streams Reference', description: 'Comprehensive guide to Lists, Maps, Sets and Stream pipelines.', file_url: '/uploads/sample_notes.pdf', file_size: 290000, uploaded_date: new Date() }
    ],
    assignments: [
      { id: 1, course_id: 1, title: 'Assignment 1: ER Diagram & Relational Mapping', description: 'Design an ER diagram and convert it to 3NF relational tables for a hospital management system.', due_date: new Date(Date.now() + 7 * 86400000), max_marks: 100, created_at: new Date() },
      { id: 2, course_id: 1, title: 'Assignment 2: Complex SQL Queries & Indexing', description: 'Write analytical SQL queries using window functions, GROUP BY, and create B-Tree indexes.', due_date: new Date(Date.now() + 14 * 86400000), max_marks: 100, created_at: new Date() },
      { id: 3, course_id: 2, title: 'Assignment 1: Build a JWT Authentication API', description: 'Implement user registration, password hashing with bcrypt, and protected routes.', due_date: new Date(Date.now() + 10 * 86400000), max_marks: 100, created_at: new Date() }
    ],
    submissions: [
      { id: 1, assignment_id: 1, student_id: 4, file_url: '/uploads/sample_submission.pdf', submission_text: 'Completed hospital ER diagram with all cardinalities.', submitted_date: new Date(), marks: 95, feedback: 'Outstanding work! Very clear cardinality definitions.', status: 'GRADED' },
      { id: 2, assignment_id: 1, student_id: 5, file_url: '/uploads/sample_submission.pdf', submission_text: 'Submitted hospital relational schema and draft diagram.', submitted_date: new Date(), marks: null, feedback: null, status: 'SUBMITTED' }
    ],
    counters: {
      users: 7,
      courses: 5,
      enrollments: 6,
      materials: 5,
      assignments: 4,
      submissions: 3
    }
  };
  return store;
}

/**
 * Initializes database pool and checks connection
 */
async function initDatabase() {
  try {
    // Attempt connecting to MySQL server
    const testConn = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });

    // Create database if not exists
    await testConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4;`);
    await testConn.end();

    // Initialize pool connected to database
    pool = mysql.createPool(dbConfig);
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    if (rows && rows[0].result === 2) {
      isConnected = true;
      console.log(`[Database] Successfully connected to MySQL at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    }
  } catch (err) {
    console.warn(`[Database] MySQL connection notice: ${err.message}`);
    console.warn(`[Database] Seamlessly running with in-memory fallback store. To connect live MySQL, update DB_PASSWORD in .env.`);
    isConnected = false;
    fallbackStore = createFallbackStore();
  }
}

/**
 * Executes a SQL query against MySQL or falls back to storage engine
 */
async function query(sql, params = []) {
  if (isConnected && pool) {
    return pool.query(sql, params);
  }

  // Fallback engine handling standard queries
  if (!fallbackStore) {
    fallbackStore = createFallbackStore();
  }

  const s = sql.trim();
  const lower = s.toLowerCase();

  // 1. SELECT queries
  if (lower.startsWith('select')) {
    // Users by email
    if (lower.includes('from users') && lower.includes('email = ?')) {
      const email = params[0];
      const match = fallbackStore.users.filter(u => u.email.toLowerCase() === String(email).toLowerCase());
      return [match];
    }
    // User by id
    if (lower.includes('from users') && lower.includes('id = ?')) {
      const id = parseInt(params[0], 10);
      const match = fallbackStore.users.filter(u => u.id === id);
      return [match];
    }
    // All users
    if (lower.includes('from users') && !lower.includes('join')) {
      return [fallbackStore.users];
    }
    // Courses list
    if (lower.includes('from courses') || lower.includes('from `courses`')) {
      const res = fallbackStore.courses.map(c => {
        const teacher = fallbackStore.users.find(u => u.id === c.teacher_id);
        const enrolledCount = fallbackStore.enrollments.filter(e => e.course_id === c.id && e.status === 'ACTIVE').length;
        return {
          ...c,
          teacher_name: teacher ? teacher.name : 'Unassigned',
          teacher_email: teacher ? teacher.email : '',
          enrolled_count: enrolledCount
        };
      });
      // Filter by teacher_id if requested
      if (lower.includes('teacher_id = ?')) {
        const tId = parseInt(params[0], 10);
        return [res.filter(c => c.teacher_id === tId)];
      }
      // Single course by id
      if (lower.includes('c.id = ?') || lower.includes('where courses.id = ?') || lower.includes('where id = ?')) {
        const cId = parseInt(params[0], 10);
        return [res.filter(c => c.id === cId)];
      }
      return [res];
    }
    // Enrollments
    if (lower.includes('from enrollments')) {
      if (lower.includes('student_id = ? and course_id = ?')) {
        const sId = parseInt(params[0], 10);
        const cId = parseInt(params[1], 10);
        const match = fallbackStore.enrollments.filter(e => e.student_id === sId && e.course_id === cId);
        return [match];
      }
      if (lower.includes('student_id = ?')) {
        const sId = parseInt(params[0], 10);
        const myEnrollments = fallbackStore.enrollments.filter(e => e.student_id === sId && e.status === 'ACTIVE');
        const detailed = myEnrollments.map(e => {
          const course = fallbackStore.courses.find(c => c.id === e.course_id) || {};
          const teacher = fallbackStore.users.find(u => u.id === course.teacher_id);
          return {
            ...e,
            course_name: course.course_name,
            course_code: course.course_code,
            description: course.description,
            duration: course.duration,
            teacher_name: teacher ? teacher.name : 'Unassigned'
          };
        });
        return [detailed];
      }
      if (lower.includes('course_id = ?')) {
        const cId = parseInt(params[0], 10);
        const courseEnrollments = fallbackStore.enrollments.filter(e => e.course_id === cId);
        const detailed = courseEnrollments.map(e => {
          const student = fallbackStore.users.find(u => u.id === e.student_id) || {};
          return {
            ...e,
            student_name: student.name,
            student_email: student.email
          };
        });
        return [detailed];
      }
      return [fallbackStore.enrollments];
    }
    // Materials
    if (lower.includes('from materials')) {
      if (lower.includes('course_id = ?')) {
        const cId = parseInt(params[0], 10);
        return [fallbackStore.materials.filter(m => m.course_id === cId)];
      }
      return [fallbackStore.materials];
    }
    // Assignments
    if (lower.includes('from assignments')) {
      if (lower.includes('course_id = ?')) {
        const cId = parseInt(params[0], 10);
        return [fallbackStore.assignments.filter(a => a.course_id === cId)];
      }
      if (lower.includes('id = ?')) {
        const aId = parseInt(params[0], 10);
        return [fallbackStore.assignments.filter(a => a.id === aId)];
      }
      return [fallbackStore.assignments];
    }
    // Submissions
    if (lower.includes('from submissions')) {
      if (lower.includes('assignment_id = ? and student_id = ?')) {
        const aId = parseInt(params[0], 10);
        const sId = parseInt(params[1], 10);
        return [fallbackStore.submissions.filter(s => s.assignment_id === aId && s.student_id === sId)];
      }
      if (lower.includes('assignment_id = ?')) {
        const aId = parseInt(params[0], 10);
        const list = fallbackStore.submissions.filter(s => s.assignment_id === aId).map(s => {
          const student = fallbackStore.users.find(u => u.id === s.student_id) || {};
          return { ...s, student_name: student.name, student_email: student.email };
        });
        return [list];
      }
      if (lower.includes('student_id = ?')) {
        const sId = parseInt(params[0], 10);
        const list = fallbackStore.submissions.filter(s => s.student_id === sId).map(s => {
          const assign = fallbackStore.assignments.find(a => a.id === s.assignment_id) || {};
          return { ...s, assignment_title: assign.title, max_marks: assign.max_marks };
        });
        return [list];
      }
      return [fallbackStore.submissions];
    }
    // Admin stats count queries
    if (lower.includes('count(*) as count')) {
      if (lower.includes("from users where role = 'student'")) {
        return [[{ count: fallbackStore.users.filter(u => u.role === 'STUDENT').length }]];
      }
      if (lower.includes("from users where role = 'teacher'")) {
        return [[{ count: fallbackStore.users.filter(u => u.role === 'TEACHER').length }]];
      }
      if (lower.includes('from courses')) {
        return [[{ count: fallbackStore.courses.length }]];
      }
      if (lower.includes('from enrollments')) {
        return [[{ count: fallbackStore.enrollments.filter(e => e.status === 'ACTIVE').length }]];
      }
      if (lower.includes('from submissions')) {
        return [[{ count: fallbackStore.submissions.length }]];
      }
    }
  }

  // 2. INSERT queries
  if (lower.startsWith('insert into')) {
    if (lower.includes('into users')) {
      const id = fallbackStore.counters.users++;
      const [name, email, password, role] = params;
      const newUser = { id, name, email, password, role: role || 'STUDENT', created_at: new Date() };
      fallbackStore.users.push(newUser);
      return [{ insertId: id, affectedRows: 1 }];
    }
    if (lower.includes('into courses')) {
      const id = fallbackStore.counters.courses++;
      const [course_name, course_code, description, duration, teacher_id] = params;
      const newCourse = { id, course_name, course_code, description, duration, teacher_id: parseInt(teacher_id, 10), created_at: new Date() };
      fallbackStore.courses.push(newCourse);
      return [{ insertId: id, affectedRows: 1 }];
    }
    if (lower.includes('into enrollments')) {
      const id = fallbackStore.counters.enrollments++;
      const [student_id, course_id] = params;
      const newEnrollment = { id, student_id: parseInt(student_id, 10), course_id: parseInt(course_id, 10), enrolled_date: new Date(), status: 'ACTIVE' };
      fallbackStore.enrollments.push(newEnrollment);
      return [{ insertId: id, affectedRows: 1 }];
    }
    if (lower.includes('into materials')) {
      const id = fallbackStore.counters.materials++;
      const [course_id, title, description, file_url, file_size] = params;
      const newMaterial = { id, course_id: parseInt(course_id, 10), title, description, file_url, file_size: file_size || 0, uploaded_date: new Date() };
      fallbackStore.materials.push(newMaterial);
      return [{ insertId: id, affectedRows: 1 }];
    }
    if (lower.includes('into assignments')) {
      const id = fallbackStore.counters.assignments++;
      const [course_id, title, description, due_date, max_marks] = params;
      const newAssign = { id, course_id: parseInt(course_id, 10), title, description, due_date: new Date(due_date), max_marks: parseInt(max_marks, 10) || 100, created_at: new Date() };
      fallbackStore.assignments.push(newAssign);
      return [{ insertId: id, affectedRows: 1 }];
    }
    if (lower.includes('into submissions')) {
      const id = fallbackStore.counters.submissions++;
      const [assignment_id, student_id, file_url, submission_text] = params;
      const newSub = { id, assignment_id: parseInt(assignment_id, 10), student_id: parseInt(student_id, 10), file_url, submission_text, submitted_date: new Date(), marks: null, feedback: null, status: 'SUBMITTED' };
      fallbackStore.submissions.push(newSub);
      return [{ insertId: id, affectedRows: 1 }];
    }
  }

  // 3. UPDATE queries
  if (lower.startsWith('update')) {
    if (lower.includes('update submissions') && lower.includes('marks = ?')) {
      const [marks, feedback, status, id] = params;
      const sub = fallbackStore.submissions.find(s => s.id === parseInt(id, 10));
      if (sub) {
        sub.marks = parseInt(marks, 10);
        sub.feedback = feedback;
        sub.status = status || 'GRADED';
      }
      return [{ affectedRows: 1 }];
    }
    if (lower.includes('update courses')) {
      const [course_name, description, duration, teacher_id, id] = params;
      const course = fallbackStore.courses.find(c => c.id === parseInt(id, 10));
      if (course) {
        course.course_name = course_name;
        course.description = description;
        course.duration = duration;
        course.teacher_id = parseInt(teacher_id, 10);
      }
      return [{ affectedRows: 1 }];
    }
    if (lower.includes('update enrollments') && lower.includes('status = ?')) {
      const [status, sId, cId] = params;
      const enr = fallbackStore.enrollments.find(e => e.student_id === parseInt(sId, 10) && e.course_id === parseInt(cId, 10));
      if (enr) enr.status = status;
      return [{ affectedRows: 1 }];
    }
  }

  // 4. DELETE queries
  if (lower.startsWith('delete from')) {
    if (lower.includes('from enrollments') && lower.includes('student_id = ? and course_id = ?')) {
      const sId = parseInt(params[0], 10);
      const cId = parseInt(params[1], 10);
      fallbackStore.enrollments = fallbackStore.enrollments.filter(e => !(e.student_id === sId && e.course_id === cId));
      return [{ affectedRows: 1 }];
    }
    if (lower.includes('from materials') && lower.includes('id = ?')) {
      const mId = parseInt(params[0], 10);
      fallbackStore.materials = fallbackStore.materials.filter(m => m.id !== mId);
      return [{ affectedRows: 1 }];
    }
    if (lower.includes('from courses') && lower.includes('id = ?')) {
      const cId = parseInt(params[0], 10);
      fallbackStore.courses = fallbackStore.courses.filter(c => c.id !== cId);
      return [{ affectedRows: 1 }];
    }
    if (lower.includes('from users') && lower.includes('id = ?')) {
      const uId = parseInt(params[0], 10);
      fallbackStore.users = fallbackStore.users.filter(u => u.id !== uId);
      return [{ affectedRows: 1 }];
    }
  }

  return [[]];
}

module.exports = {
  initDatabase,
  query,
  getIsConnected: () => isConnected,
  getPool: () => pool
};
