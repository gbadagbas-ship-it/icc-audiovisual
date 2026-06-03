const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Routes pour les rapports
router.post('/submit', reportController.submitReport);
router.get('/:weekNumber/:year', reportController.getReport);
router.get('/all', authorize('SUPER_ADMIN'), reportController.getAllReports);
router.delete('/:id', authorize('SUPER_ADMIN'), reportController.deleteReport);

module.exports = router;