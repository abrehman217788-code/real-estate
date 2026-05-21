const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

router.post('/create-payment-intent', auth, async (req, res) => {
  try {
    const { amount, currency = 'pkr' } = req.body;
    if (amount === undefined || isNaN(amount) || Number(amount) <= 0) return res.status(400).json({ message: 'Valid amount is required' });
    res.json({ clientSecret: `pi_mock_${Date.now()}_secret`, amount: Number(amount), currency });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/verify', auth, async (req, res) => {
  try {
    const { paymentId } = req.body;
    res.json({ success: true, paymentId, status: 'completed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
