const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

router.post('/login', userController.login);
router.post('/register', userController.register);
router.post('/logout', userController.logout);
router.get('/me', authenticate, userController.getMe);
router.put('/update', authenticate, isAdmin, userController.updateUser);
router.put('/:id', authenticate, isAdmin, userController.updateUserById);
router.get('/', authenticate, isAdmin, userController.getAllUsers);
router.get('/:id', authenticate, userController.getUserById);
router.delete('/:id', authenticate, isAdmin, userController.deleteUser);

module.exports = router;
