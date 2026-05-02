const express = require('express');

const { getProfile, transfer } = require('../controllers/walletController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/user/profile', protect, getProfile);
router.post('/wallet/transfer', protect, transfer);

module.exports = router;
