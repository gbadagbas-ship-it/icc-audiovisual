const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', activityController.getActivities);
router.post('/', authorize('POLE_MANAGER', 'SUPER_ADMIN'), activityController.createActivity);
router.put('/:id', authorize('POLE_MANAGER', 'SUPER_ADMIN'), activityController.updateActivity);
router.delete('/:id', authorize('POLE_MANAGER', 'SUPER_ADMIN'), activityController.deleteActivity);

module.exports = router;