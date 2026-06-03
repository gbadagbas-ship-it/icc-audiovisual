const express = require('express');
const router = express.Router();
const poleController = require('../controllers/poleController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', poleController.getPoles);
router.post('/', authorize('SUPER_ADMIN'), poleController.createPole);
router.put('/:id', authorize('SUPER_ADMIN'), poleController.updatePole);
router.delete('/:id', authorize('SUPER_ADMIN'), poleController.deletePole);

module.exports = router;