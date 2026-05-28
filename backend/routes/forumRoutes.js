const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const forumCtrl = require('../controllers/forumController');
const postCtrl = require('../controllers/postController');

const router = express.Router();

router.use(requireAuth);

// Forums
router.get('/', asyncHandler(forumCtrl.list));
router.post('/', asyncHandler(forumCtrl.create));
router.get('/:forumId', asyncHandler(forumCtrl.getOne));

// Posts (nested under a forum)
router.get('/:forumId/posts', asyncHandler(postCtrl.list));
router.post('/:forumId/posts', asyncHandler(postCtrl.create));
router.post('/:forumId/posts/:postId/like', asyncHandler(postCtrl.like));

module.exports = router;
