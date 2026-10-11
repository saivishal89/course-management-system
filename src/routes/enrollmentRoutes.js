const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Student actions
router.post('/', authenticateToken, requireRole('STUDENT'), enrollmentController.enrollCourse);
router.delete('/:courseId', authenticateToken, requireRole('STUDENT'), enrollmentController.unenrollCourse);
router.get('/my-courses', authenticateToken, requireRole('STUDENT'), enrollmentController.getMyCourses);

// Teacher or Admin actions
router.get('/course/:courseId/students', authenticateToken, requireRole(['ADMIN', 'TEACHER']), enrollmentController.getCourseStudents);

module.exports = router;
