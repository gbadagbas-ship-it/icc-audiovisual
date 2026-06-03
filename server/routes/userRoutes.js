const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/', authorize('POLE_MANAGER', 'SUPER_ADMIN'), userController.getUsers);
router.get('/pole/:poleId', authorize('POLE_MANAGER', 'SUPER_ADMIN'), userController.getUsersByPole);
router.post('/', authorize('SUPER_ADMIN'), userController.createUser);
router.put('/:id', authorize('SUPER_ADMIN'), userController.updateUser);
router.delete('/:id', authorize('SUPER_ADMIN'), userController.deleteUser);

module.exports = router;