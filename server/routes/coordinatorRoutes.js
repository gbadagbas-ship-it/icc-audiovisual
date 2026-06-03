const express = require('express');
const router = express.Router();
const coordinatorController = require('../controllers/coordinatorController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/assign', authenticate, authorize('SUPER_ADMIN'), coordinatorController.assignGeneralCoordinator);
router.get('/current', coordinatorController.getCurrentGeneralCoordinator);
router.get('/all', authenticate, authorize('SUPER_ADMIN'), coordinatorController.getAllGeneralCoordinators);

module.exports = router;