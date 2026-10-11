const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Public or student-augmented courses list
router.get('/', authenticateToken, courseController.getAllCourses);
router.get('/:id', authenticateToken, courseController.getCourseById);

// Course creation & modification
router.post('/', authenticateToken, requireRole(['ADMIN', 'TEACHER']), courseController.createCourse);
router.put('/:id', authenticateToken, requireRole(['ADMIN', 'TEACHER']), courseController.updateCourse);
router.delete('/:id', authenticateToken, requireRole('ADMIN'), courseController.deleteCourse);

module.exports = router;
