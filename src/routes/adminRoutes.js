const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All endpoints in this router are restricted to ADMIN
router.use(authenticateToken, requireRole('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.getAllUsers);
router.post('/users', adminController.createUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
