# Course Management System (CMS) - System Design Specification

## 1. System Overview
The Course Management System (CMS) is a comprehensive web application designed for colleges, universities, and training institutes to manage courses, students, teachers, enrollments, assignments, marks, and course materials with role-based access control.

### Core Roles & Capabilities
1. **Student (`STUDENT`)**:
   - Register & authenticate securely.
   - Browse catalog of active courses with teacher details.
   - Enroll in courses (and view enrolled courses).
   - Access & download course study materials.
   - Submit assignments (with file upload & submission notes).
   - View graded submissions, marks, and teacher feedback.

2. **Teacher (`TEACHER`)**:
   - Manage assigned courses.
   - Upload course materials (documents, PDF, notes).
   - Create, edit, and schedule assignments with due dates.
   - View enrolled students per course.
   - Review assignment submissions, assign marks, and provide feedback.

3. **Admin (`ADMIN`)**:
   - High-level institution analytics dashboard (total students, teachers, courses, enrollments, submission stats).
   - Manage students and teachers (create, view, toggle status).
   - Manage all courses and teacher assignments.
   - Manage and review course enrollments.

---

## 2. Architecture & Tech Stack

### High-Level Architecture
```
┌────────────────────────────────────────────────────────┐
│           Client Browser (Single Page App)            │
│  - Responsive Glassmorphism UI (HTML5 / CSS3 / JS)     │
│  - Role-Switching Demo Bar + Real Auth JWT Storage     │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP REST API / JSON + Multipart Uploads
┌──────────────────────────▼─────────────────────────────┐
│                 Node.js + Express Backend              │
│  - Authentication & JWT Middleware (bcryptjs + JWT)    │
│  - Role Authorization: Student, Teacher, Admin         │
│  - Multer File Upload Engine (/uploads directory)      │
│  - MySQL Connection Pool (mysql2/promise)              │
│  - In-Memory / SQLite Fallback for Instant Zero-Setup  │
└──────────────────────────┬─────────────────────────────┘
                           │ Raw SQL Queries / DDL / DML
┌──────────────────────────▼─────────────────────────────┐
│                   MySQL 8.0 Database                   │
│  - Relational Schema with Foreign Keys & Cascades      │
│  - Complete SQL Scripts (schema.sql & seed.sql)        │
└────────────────────────────────────────────────────────┘
```

### Technology Selection
- **Backend**: Node.js v24 + Express.js.
- **Database Driver**: `mysql2/promise` with automatic table initialization and optional sqlite3/mock sync for zero-friction portability.
- **Security**: `bcryptjs` for password hashing, `jsonwebtoken` (JWT) for stateless session handling, `cors`, `helmet`.
- **Uploads**: `multer` for storing material files and assignment submissions.
- **Frontend**: Modern Vanilla JS + CSS3 (custom responsive design system with dark/light theme, modern typography, glassmorphism cards, interactive tabs, dynamic modals, toast notifications).
- **Version Control**: Git repository initialized with `.gitignore`, initial commit, and remote push via `gh repo create`.
- **Cloud Deployment**: Containerized with `Dockerfile`, `render.yaml`, and environment configuration ready for 1-click cloud deployment on Render, Railway, or VPS.

---

## 3. Database Design & Relational Schema

### Database Name: `course_management`

#### Table: `users`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `name` VARCHAR(100) NOT NULL
- `email` VARCHAR(120) UNIQUE NOT NULL
- `password` VARCHAR(255) NOT NULL
- `role` ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT'
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### Table: `courses`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `course_name` VARCHAR(150) NOT NULL
- `course_code` VARCHAR(50) UNIQUE NOT NULL
- `description` TEXT
- `duration` VARCHAR(50) NOT NULL
- `teacher_id` INT NULL, FOREIGN KEY (`teacher_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### Table: `enrollments`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `student_id` INT NOT NULL, FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
- `course_id` INT NOT NULL, FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
- `enrolled_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `status` ENUM('ACTIVE', 'DROPPED', 'COMPLETED') DEFAULT 'ACTIVE'
- UNIQUE KEY `unique_student_course` (`student_id`, `course_id`)

#### Table: `materials`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `course_id` INT NOT NULL, FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
- `title` VARCHAR(150) NOT NULL
- `description` TEXT
- `file_url` VARCHAR(255) NOT NULL
- `file_size` INT DEFAULT 0
- `uploaded_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### Table: `assignments`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `course_id` INT NOT NULL, FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE CASCADE
- `title` VARCHAR(150) NOT NULL
- `description` TEXT
- `due_date` DATETIME NOT NULL
- `max_marks` INT DEFAULT 100
- `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

#### Table: `submissions`
- `id` INT AUTO_INCREMENT PRIMARY KEY
- `assignment_id` INT NOT NULL, FOREIGN KEY (`assignment_id`) REFERENCES `assignments`(`id`) ON DELETE CASCADE
- `student_id` INT NOT NULL, FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
- `file_url` VARCHAR(255) NULL
- `submission_text` TEXT NULL
- `submitted_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `marks` INT NULL
- `feedback` TEXT NULL
- `status` ENUM('SUBMITTED', 'GRADED', 'LATE') DEFAULT 'SUBMITTED'
- UNIQUE KEY `unique_student_assignment` (`student_id`, `assignment_id`)

---

## 4. REST API Specification

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create new student/teacher account.
- `POST /api/auth/login` - Authenticate with email/password; returns JWT + user info.
- `GET /api/auth/me` - Validate session token and return user profile.

### Courses (`/api/courses`)
- `GET /api/courses` - List all courses (filters by student enrollment or teacher assignment).
- `GET /api/courses/:id` - Get course details with teacher info, materials, and assignments.
- `POST /api/courses` - Create course (Admin / Teacher).
- `PUT /api/courses/:id` - Update course details (Admin / Assigned Teacher).
- `DELETE /api/courses/:id` - Delete course (Admin).

### Enrollments (`/api/enrollments`)
- `POST /api/enrollments` - Student enrolls into course.
- `DELETE /api/enrollments/:courseId` - Student unenrolls from course.
- `GET /api/enrollments/my-courses` - List courses student is enrolled in.
- `GET /api/enrollments/course/:courseId/students` - List enrolled students (Teacher / Admin).

### Study Materials (`/api/materials`)
- `POST /api/materials` - Upload material (Teacher / Admin) via multipart form data.
- `GET /api/materials/course/:courseId` - Retrieve materials for a course.
- `DELETE /api/materials/:id` - Delete material (Teacher / Admin).

### Assignments & Submissions (`/api/assignments`)
- `POST /api/assignments` - Create assignment (Teacher / Admin).
- `GET /api/assignments/course/:courseId` - List assignments for a course.
- `POST /api/assignments/:id/submit` - Student submits assignment file/text.
- `GET /api/assignments/:id/submissions` - Teacher lists all submissions for an assignment.
- `POST /api/assignments/submissions/:submissionId/grade` - Teacher assigns grade & feedback.

### Admin Dashboard (`/api/admin`)
- `GET /api/admin/stats` - Institution statistics (total students, teachers, courses, enrollments, submissions).
- `GET /api/admin/users` - List all registered users with role filter.
- `POST /api/admin/users` - Admin creates new teacher or student.
- `DELETE /api/admin/users/:id` - Delete a user.

---

## 5. Frontend UI/UX Design

- **Visual Style**: Clean glassmorphism dark/light modern UI with cohesive indigo/violet/emerald accents, responsive sidebar navigation, stat badges, animated feedback toasts, and clean data tables.
- **Top Quick Demo Switcher**: Instant buttons (`Log in as Admin`, `Log in as Teacher (Rahul)`, `Log in as Student (Alice)`) so examiners, teachers, and reviewers can test all roles in 1 click without manually re-typing credentials.
- **Modals**: Smooth modal dialogs for Creating Courses, Uploading Materials, Creating Assignments, Submitting Work, and Grading.
- **Responsive Layout**: Fluid flexbox and CSS grid matching desktop, tablet, and mobile displays.

---

## 6. Git & GitHub Deployment Plan
1. Local git repository initialized (`git init`).
2. `.gitignore` set up ignoring `node_modules`, `uploads/*`, `.env`.
3. Commit all cleanly organized codebase files.
4. GitHub CLI (`gh repo create`) to publish repository to GitHub under `saivishal89/course-management-system`.
5. Configuration files for deployment (`render.yaml` and `Dockerfile`).
