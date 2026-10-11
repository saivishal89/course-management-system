const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Course assignments
router.get('/course/:courseId', authenticateToken, assignmentController.getCourseAssignments);
router.post('/', authenticateToken, requireRole(['ADMIN', 'TEACHER']), assignmentController.createAssignment);

// Student assignment submission & personal grades
router.post('/:id/submit', authenticateToken, requireRole('STUDENT'), upload.single('file'), assignmentController.submitAssignment);
router.get('/my-grades', authenticateToken, requireRole('STUDENT'), assignmentController.getMyGrades);

// Teacher/Admin reviewing and grading
router.get('/:id/submissions', authenticateToken, requireRole(['ADMIN', 'TEACHER']), assignmentController.getAssignmentSubmissions);
router.post('/submissions/:submissionId/grade', authenticateToken, requireRole(['ADMIN', 'TEACHER']), assignmentController.gradeSubmission);

module.exports = router;
