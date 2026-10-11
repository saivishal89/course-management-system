-- =======================================================
-- Course Management System (CMS) Database Schema
-- DBMS Project - Relational MySQL DDL
-- =======================================================

CREATE DATABASE IF NOT EXISTS `course_management`
DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `course_management`;

-- 1. Users Table (Handles Students, Teachers, and Admins)
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'TEACHER', 'STUDENT') NOT NULL DEFAULT 'STUDENT',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_users_role` (`role`),
    INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Courses Table
CREATE TABLE IF NOT EXISTS `courses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_name` VARCHAR(150) NOT NULL,
    `course_code` VARCHAR(50) NOT NULL UNIQUE,
    `description` TEXT,
    `duration` VARCHAR(50) NOT NULL DEFAULT '12 Weeks',
    `teacher_id` INT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_courses_teacher`
        FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    INDEX `idx_courses_teacher` (`teacher_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Enrollments Table (Many-to-Many between Students & Courses)
CREATE TABLE IF NOT EXISTS `enrollments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `student_id` INT NOT NULL,
    `course_id` INT NOT NULL,
    `enrolled_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('ACTIVE', 'DROPPED', 'COMPLETED') NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT `fk_enrollments_student`
        FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_enrollments_course`
        FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `uq_student_course` UNIQUE (`student_id`, `course_id`),
    INDEX `idx_enrollments_student` (`student_id`),
    INDEX `idx_enrollments_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Study Materials Table
CREATE TABLE IF NOT EXISTS `materials` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `file_url` VARCHAR(255) NOT NULL,
    `file_size` INT DEFAULT 0,
    `uploaded_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_materials_course`
        FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX `idx_materials_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Assignments Table
CREATE TABLE IF NOT EXISTS `assignments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `course_id` INT NOT NULL,
    `title` VARCHAR(150) NOT NULL,
    `description` TEXT,
    `due_date` DATETIME NOT NULL,
    `max_marks` INT DEFAULT 100,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_assignments_course`
        FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX `idx_assignments_course` (`course_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Submissions & Grades Table
CREATE TABLE IF NOT EXISTS `submissions` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `assignment_id` INT NOT NULL,
    `student_id` INT NOT NULL,
    `file_url` VARCHAR(255) NULL,
    `submission_text` TEXT NULL,
    `submitted_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `marks` INT NULL,
    `feedback` TEXT NULL,
    `status` ENUM('SUBMITTED', 'GRADED', 'LATE') DEFAULT 'SUBMITTED',
    CONSTRAINT `fk_submissions_assignment`
        FOREIGN KEY (`assignment_id`) REFERENCES `assignments` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_submissions_student`
        FOREIGN KEY (`student_id`) REFERENCES `users` (`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `uq_assignment_student` UNIQUE (`assignment_id`, `student_id`),
    INDEX `idx_submissions_assignment` (`assignment_id`),
    INDEX `idx_submissions_student` (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
