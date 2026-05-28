const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const ctrl = require('../controllers/spotifyController');

const router = express.Router();

router.use(requireAuth);
router.get('/me', asyncHandler(ctrl.me));
router.get('/top/artists', asyncHandler(ctrl.topArtists));
router.get('/top/tracks', asyncHandler(ctrl.topTracks));
router.get('/liked', asyncHandler(ctrl.liked));

module.exports = router;
