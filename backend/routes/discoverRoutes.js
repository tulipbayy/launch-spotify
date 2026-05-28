const express = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const requireAuth = require('../middleware/requireAuth');
const ctrl = require('../controllers/discoverController');

const router = express.Router();

router.use(requireAuth);
router.get('/', asyncHandler(ctrl.list));
router.get('/:userId', asyncHandler(ctrl.getOne));

module.exports = router;
