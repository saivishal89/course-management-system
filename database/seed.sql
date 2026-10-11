-- =======================================================
-- Course Management System (CMS) Seed Data
-- =======================================================

USE `course_management`;

-- Clear existing data in reverse order of dependencies
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `submissions`;
TRUNCATE TABLE `assignments`;
TRUNCATE TABLE `materials`;
TRUNCATE TABLE `enrollments`;
TRUNCATE TABLE `courses`;
TRUNCATE TABLE `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Users (All passwords are: password123)
-- Admin
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(1, 'Admin Director', 'admin@cms.edu', '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', 'ADMIN');

-- Teachers
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(2, 'Prof. Rahul Sharma', 'rahul@cms.edu', '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', 'TEACHER'),
(3, 'Dr. Priya Patel', 'priya@cms.edu', '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', 'TEACHER');

-- Students
INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`) VALUES
(4, 'Alice Walker', 'alice@student.edu', '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', 'STUDENT'),
(5, 'Bob Jenkins', 'bob@student.edu', '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', 'STUDENT'),
(6, 'Charlie Evans', 'charlie@student.edu', '$2a$10$AWUTql7BfjMgAi9iX6wv.uLdWP5sjJInllqfXv3cfFIchnwY2/0be', 'STUDENT');

-- 2. Insert Courses
INSERT INTO `courses` (`id`, `course_name`, `course_code`, `description`, `duration`, `teacher_id`) VALUES
(1, 'Database Management Systems', 'CS301', 'Relational algebra, MySQL queries, Normalization, Transactions, and Indexing.', '12 Weeks', 2),
(2, 'Full Stack Web Development', 'CS304', 'Modern web architectures, Node.js REST APIs, SPA frontends, and authentication.', '10 Weeks', 2),
(3, 'Object Oriented Java Programming', 'CS201', 'Core Java, Collections framework, Multi-threading, and Spring Boot basics.', '14 Weeks', 3),
(4, 'Cloud Computing & DevOps', 'CS402', 'Docker, CI/CD pipelines, container orchestration, and cloud deployments.', '8 Weeks', 3);

-- 3. Insert Enrollments
INSERT INTO `enrollments` (`id`, `student_id`, `course_id`, `status`) VALUES
(1, 4, 1, 'ACTIVE'),
(2, 4, 2, 'ACTIVE'),
(3, 5, 1, 'ACTIVE'),
(4, 5, 3, 'ACTIVE'),
(5, 6, 2, 'ACTIVE');

-- 4. Insert Study Materials
INSERT INTO `materials` (`id`, `course_id`, `title`, `description`, `file_url`, `file_size`) VALUES
(1, 1, 'Module 1: Relational Schema & Normalization (1NF to BCNF)', 'Lecture notes on database design and normalization theory.', '/uploads/dbms_module1_notes.pdf', 245000),
(2, 1, 'Module 2: Advanced SQL Joins & Subqueries Cheatsheet', 'Complete query reference with examples and optimization tips.', '/uploads/dbms_sql_cheatsheet.pdf', 182000),
(3, 2, 'Express.js & REST API Design Guide', 'Best practices for RESTful endpoints, error handling and JWT tokens.', '/uploads/express_rest_guide.pdf', 310000),
(4, 3, 'Java Collections & Streams Reference', 'Comprehensive guide to Lists, Maps, Sets and Stream pipelines.', '/uploads/java_collections.pdf', 290000);

-- 5. Insert Assignments
INSERT INTO `assignments` (`id`, `course_id`, `title`, `description`, `due_date`, `max_marks`) VALUES
(1, 1, 'Assignment 1: ER Diagram & Relational Mapping', 'Design an ER diagram and convert it to 3NF relational tables for a hospital management system.', DATE_ADD(NOW(), INTERVAL 7 DAY), 100),
(2, 1, 'Assignment 2: Complex SQL Queries & Indexing', 'Write analytical SQL queries using window functions, GROUP BY, and create B-Tree indexes.', DATE_ADD(NOW(), INTERVAL 14 DAY), 100),
(3, 2, 'Assignment 1: Build a JWT Authentication API', 'Implement user registration, password hashing with bcrypt, and protected routes.', DATE_ADD(NOW(), INTERVAL 10 DAY), 100);

-- 6. Insert Submissions & Grades
INSERT INTO `submissions` (`id`, `assignment_id`, `student_id`, `file_url`, `submission_text`, `marks`, `feedback`, `status`) VALUES
(1, 1, 4, '/uploads/alice_hospital_er_diagram.pdf', 'Completed the hospital ER diagram with all cardinalities and normalization explanations.', 95, 'Outstanding work! Very clear cardinality definitions and properly normalized tables.', 'GRADED'),
(2, 1, 5, '/uploads/bob_er_diagram.pdf', 'Submitted hospital relational schema and ER schema draft.', NULL, NULL, 'SUBMITTED');
