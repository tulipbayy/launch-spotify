const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const ctrl = require('../controllers/profileController');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(ctrl.getMine));
router.patch('/', asyncHandler(ctrl.update));
router.patch('/visibility', asyncHandler(ctrl.setVisibility));
router.put('/displayed', asyncHandler(ctrl.setDisplayed));

module.exports = router;
