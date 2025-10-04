const express = require('express');
const router = express.Router();
const { signup, login, getMe } = require('../controller/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/signup', signup);
router.post('/login', login);

router.get('/me', protect, getMe);

module.exports = router;