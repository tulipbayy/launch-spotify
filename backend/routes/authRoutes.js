const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const { login, callback, me, logout } = require('../controllers/authController');

const router = express.Router();

router.get('/login', login);
router.get('/callback', asyncHandler(callback));
router.get('/me', requireAuth, asyncHandler(me));
router.post('/logout', requireAuth, logout);

module.exports = router;
