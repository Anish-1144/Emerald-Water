const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser, updateProfile } = require('../controllers/user.controller');
const { auth } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', auth, getCurrentUser);
router.put('/profile', auth, updateProfile);

module.exports = router;

