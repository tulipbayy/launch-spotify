// Aggregates all /api sub-routers. Auth routes are mounted separately in app.js
// under /auth. Mounts kept alphabetical to minimize merge conflicts.
const express = require('express');

const router = express.Router();

router.use('/forums', require('./forumRoutes'));
router.use('/messages', require('./messageRoutes'));
router.use('/profile', require('./profileRoutes'));
router.use('/spotify', require('./spotifyRoutes'));
router.use('/users', require('./discoverRoutes'));

module.exports = router;
