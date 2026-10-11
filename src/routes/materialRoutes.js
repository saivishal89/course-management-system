const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { authenticateToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/course/:courseId', authenticateToken, materialController.getCourseMaterials);
router.post('/', authenticateToken, requireRole(['ADMIN', 'TEACHER']), upload.single('file'), materialController.uploadMaterial);
router.delete('/:id', authenticateToken, requireRole(['ADMIN', 'TEACHER']), materialController.deleteMaterial);

module.exports = router;
