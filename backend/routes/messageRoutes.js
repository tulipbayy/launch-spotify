const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const ctrl = require('../controllers/messageController');

const router = express.Router();

router.use(requireAuth);
router.get('/conversations', asyncHandler(ctrl.listConversations));
router.get('/conversations/:userId', asyncHandler(ctrl.getConversation));
router.post('/conversations/:userId', asyncHandler(ctrl.send));

module.exports = router;
