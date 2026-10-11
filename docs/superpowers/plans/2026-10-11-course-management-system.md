# Course Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-ready, full-stack Course Management System (CMS) with Student, Teacher, and Admin portals, MySQL relational database, clean REST API, responsive UI, Git version control, and GitHub publication + deployment config.

**Architecture:** A Node.js Express REST API backend with MySQL relational database (with fallback for automated tests / zero-friction preview), serving a modern, high-aesthetic SPA frontend with role-based routing, JWT authentication, and file upload handling.

**Tech Stack:** Node.js, Express.js, MySQL (mysql2/promise), bcryptjs, jsonwebtoken, multer, Modern CSS3 & Vanilla JavaScript, Git, GitHub CLI.

**Spec:** [docs/superpowers/specs/2026-10-11-course-management-system-design.md](file:///c:/Users/HP/Downloads/Zaraki-Ai-Stack/DBMS/docs/superpowers/specs/2026-10-11-course-management-system-design.md)

## Global Constraints
- Node.js runtime compatibility with Node 20+.
- All database queries must be secure and parameterized to prevent SQL injection.
- Complete SQL DDL (`database/schema.sql`) and sample seed (`database/seed.sql`) must be provided for academic submission and manual import.
- No third-party UI framework dependencies needed; Vanilla CSS with custom design tokens for maximum reliability and speed.
- Git repository must be initialized, committed cleanly, and pushed to GitHub under user `saivishal89`.

---

### Task 1: Project Scaffolding & Git Initialization

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.env`
- Create: `README.md`

**Interfaces:**
- Consumes: None
- Produces: Project dependencies (`express`, `mysql2`, `bcryptjs`, `jsonwebtoken`, `multer`, `cors`, `dotenv`), local git repo initialized.

- [ ] **Step 1: Initialize Git and package configuration**
  Run `git init` and create `package.json` with scripts: `"start": "node server.js"`, `"seed": "node database/seed.js"`.

- [ ] **Step 2: Install dependencies**
  Run `npm install express mysql2 bcryptjs jsonwebtoken multer cors dotenv`.

- [ ] **Step 3: Create .gitignore and environment templates**
  Ignore `node_modules/`, `.env`, `uploads/*`, `*.log`. Provide sample `.env.example`.

- [ ] **Step 4: Verify installation and initial commit**
  Verify node runs without error and commit: `git add . && git commit -m "chore: initial project setup"`.

---

### Task 2: Database Schema, SQL DDL Scripts & Database Connection Manager

**Files:**
- Create: `database/schema.sql`
- Create: `database/seed.sql`
- Create: `database/er_diagram.md`
- Create: `src/config/db.js`
- Create: `database/initDb.js`

**Interfaces:**
- Consumes: Environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`).
- Produces: `db.query(sql, params)` interface supporting both MySQL and local SQLite/in-memory fallback when MySQL credentials need setup.

- [ ] **Step 1: Write complete MySQL relational schema DDL**
  Define `users`, `courses`, `enrollments`, `materials`, `assignments`, `submissions` tables with foreign keys and cascade options.

- [ ] **Step 2: Write seed data script**
  Provide pre-populated sample accounts (Admin, 2 Teachers, 3 Students) and sample courses with materials and assignments.

- [ ] **Step 3: Implement database connection abstraction**
  Build `src/config/db.js` with connection pooling and graceful error handling.

- [ ] **Step 4: Write database auto-initialization script**
  Create `database/initDb.js` that checks for database existence, creates tables, and seeds initial data if empty.

- [ ] **Step 5: Commit database layer**
  Commit: `git add database src/config && git commit -m "feat: database schema, connection manager, and seed scripts"`.

---

### Task 3: Authentication, Security Middleware & User Controller

**Files:**
- Create: `src/middleware/auth.js`
- Create: `src/controllers/authController.js`
- Create: `src/routes/authRoutes.js`

**Interfaces:**
- Consumes: `db.query`, JWT tokens.
- Produces: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `authenticateToken`, `requireRole(['ADMIN', 'TEACHER'])`.

- [ ] **Step 1: Write JWT and Role Authorization middleware**
  Validate Bearer token and check user role against allowed permissions.

- [ ] **Step 2: Implement Auth Controller**
  Handle user registration with bcrypt password hashing, login with token generation, and current user profile fetch.

- [ ] **Step 3: Mount auth routes**
  Wire `/api/auth` endpoints and test login/registration flow.

- [ ] **Step 4: Commit authentication module**
  Commit: `git add src/middleware src/controllers/authController.js src/routes/authRoutes.js && git commit -m "feat: user authentication and JWT role authorization"`.

---

### Task 4: Course, Enrollment, Materials & Assignment Controllers

**Files:**
- Create: `src/controllers/courseController.js`
- Create: `src/controllers/enrollmentController.js`
- Create: `src/controllers/materialController.js`
- Create: `src/controllers/assignmentController.js`
- Create: `src/controllers/adminController.js`
- Create: `src/routes/courseRoutes.js`
- Create: `src/routes/enrollmentRoutes.js`
- Create: `src/routes/materialRoutes.js`
- Create: `src/routes/assignmentRoutes.js`
- Create: `src/routes/adminRoutes.js`
- Create: `src/middleware/upload.js`

**Interfaces:**
- Consumes: Authenticated requests, multer multipart uploads.
- Produces: Full REST API suite for Student, Teacher, and Admin operations.

- [ ] **Step 1: Implement Multer upload middleware**
  Configure secure disk storage in `uploads/` for documents and submissions with unique filename hashing.

- [ ] **Step 2: Implement Course Controller and Routes**
  CRUD operations for courses, teacher assignments, and course details.

- [ ] **Step 3: Implement Enrollment Controller and Routes**
  Student course enrollment, unenrollment, and listing enrolled courses and students.

- [ ] **Step 4: Implement Materials & Assignments Controllers**
  Upload materials, create assignments, submit work, and record grades with feedback.

- [ ] **Step 5: Implement Admin Stats & User Management Controller**
  Summary analytics for dashboard and user management endpoints.

- [ ] **Step 6: Commit REST API controllers**
  Commit: `git add src/ && git commit -m "feat: full course, enrollment, material, assignment, and admin APIs"`.

---

### Task 5: Express Server Entrypoint & API Integration Testing

**Files:**
- Create: `server.js`

**Interfaces:**
- Consumes: All routes, static file serving (`public/`, `uploads/`).
- Produces: Running HTTP server on port 5000 (or `PORT` env).

- [ ] **Step 1: Implement Express server entry point**
  Configure CORS, JSON body parser, URL encoded parser, static directory for public frontend, static directory for uploaded files, and mount all API route handlers.

- [ ] **Step 2: Add health check and error handling middleware**
  Provide `GET /api/health` and centralized error handler returning clean JSON error responses.

- [ ] **Step 3: Test server startup and API endpoints**
  Start server, test `/api/health`, `/api/auth/login`, and `/api/courses`.

- [ ] **Step 4: Commit backend server**
  Commit: `git add server.js && git commit -m "feat: express server entrypoint and route mounting"`.

---

### Task 6: Modern Frontend Application (SPA) - Design System & Navigation

**Files:**
- Create: `public/index.html`
- Create: `public/css/style.css`
- Create: `public/js/api.js`
- Create: `public/js/app.js`

**Interfaces:**
- Consumes: REST API (`/api/*`).
- Produces: Interactive single page web application with role switcher, responsive navigation, and authentication state.

- [ ] **Step 1: Build semantic HTML structure with modern Layout**
  Navigation bar with role demo switcher, sidebar navigation, dynamic main content views, modal containers, and toast alerts.

- [ ] **Step 2: Create CSS design system**
  Glassmorphism dark/light modern UI, custom cards, buttons, badges, tables, modals, responsive breakpoints, and micro-interactions.

- [ ] **Step 3: Build frontend API client**
  Helper methods for token-authenticated fetch, file uploads, error handling, and toast alerts.

- [ ] **Step 4: Build role-based view switching & quick demo logins**
  Instant 1-click switch between Admin, Teacher, and Student views with pre-loaded demo credentials.

- [ ] **Step 5: Commit frontend foundation**
  Commit: `git add public/ && git commit -m "feat: frontend layout, design tokens, and authentication state"`.

---

### Task 7: Student, Teacher & Admin Dashboard Views & Workflows

**Files:**
- Create: `public/js/studentView.js`
- Create: `public/js/teacherView.js`
- Create: `public/js/adminView.js`
- Modify: `public/js/app.js`

**Interfaces:**
- Consumes: `api.js` endpoints.
- Produces: Complete end-to-end interactive user flows:
  - Student: Course catalog, enroll/unenroll, view materials, submit assignments with files, view grades.
  - Teacher: Manage courses, upload materials, create assignments, review student submissions, enter marks.
  - Admin: System metrics, manage users, manage all courses and enrollments.

- [ ] **Step 1: Implement Student View component**
  Render course cards with enroll buttons, enrolled courses tab, downloadable study materials, and assignment submission forms.

- [ ] **Step 2: Implement Teacher View component**
  Render teacher's courses, upload material modal, create assignment modal, submission review table with grade entry inputs.

- [ ] **Step 3: Implement Admin View component**
  Render analytics KPI cards (total students, teachers, courses, enrollments), user list with role filters, and add user modal.

- [ ] **Step 4: Verify complete end-to-end user experience in browser**
  Test student enrollment -> teacher material/assignment creation -> student submission -> teacher grading -> student grade view.

- [ ] **Step 5: Commit dashboard views**
  Commit: `git add public/js && git commit -m "feat: complete interactive dashboards for student, teacher, and admin"`.

---

### Task 8: Deployment Configuration & GitHub Push

**Files:**
- Create: `Dockerfile`
- Create: `render.yaml`
- Create: `.dockerignore`
- Modify: `README.md`

**Interfaces:**
- Consumes: Tested codebase and local git repo.
- Produces: Pushed remote GitHub repository (`saivishal89/course-management-system`) and cloud deployment readiness.

- [ ] **Step 1: Create Dockerfile and render.yaml deployment configuration**
  Write standard container and cloud blueprint specifications.

- [ ] **Step 2: Write comprehensive project documentation in README.md**
  Include ER diagram, project setup instructions, MySQL import guide, API documentation, screenshots/workflow guide, and college viva demonstration tips.

- [ ] **Step 3: Commit all deployment files**
  Commit: `git add . && git commit -m "docs: complete README, ER diagram, Dockerfile, and deployment configuration"`.

- [ ] **Step 4: Create GitHub repository and push code**
  Use `gh repo create saivishal89/course-management-system --public --source=. --remote=origin --push`.
