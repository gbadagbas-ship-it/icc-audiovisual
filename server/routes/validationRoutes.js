const express = require('express');
const router = express.Router();
const validationController = require('../controllers/validationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.post('/validate-week', authorize('SUPER_ADMIN'), validationController.validateWeek);
router.get('/week-status/:weekNumber/:year', validationController.isWeekValidated);
router.get('/weeks-status', authorize('SUPER_ADMIN'), validationController.getWeeksStatus);

module.exports = router;