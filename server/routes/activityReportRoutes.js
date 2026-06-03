const express = require('express');
const router = express.Router();
const activityReportsController = require('../controllers/activityReportsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', activityReportsController.createReport);
router.get('/all', authorize('SUPER_ADMIN'), activityReportsController.getAllReports);
router.get('/activity/:activityId', activityReportsController.getReportsByActivity);
router.put('/:id', activityReportsController.updateReport);
router.delete('/:id', activityReportsController.deleteReport);

module.exports = router;
