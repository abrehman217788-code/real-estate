const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Inquiry = require('../models/Inquiry');
const { auth, roleAuth } = require('../middleware/auth');

router.post('/', async (req, res) => {
  try {
    const { name, email, message, property } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: 'Name is required' });
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Valid email is required' });
    if (!message || !message.trim()) return res.status(400).json({ message: 'Message is required' });
    if (!property || !mongoose.Types.ObjectId.isValid(property)) return res.status(400).json({ message: 'Valid property ID is required' });

    const inquiry = await Inquiry.create(req.body);
    res.status(201).json(inquiry);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, roleAuth('agent', 'agency', 'admin'), async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'agent') filter.agent = req.user._id;
    const inquiries = await Inquiry.find(filter)
      .populate('property', 'title price')
      .sort({ createdAt: -1 });
    res.json(inquiries);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/:id/status', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid inquiry ID' });
    }
    const validStatuses = ['new', 'contacted', 'follow-up', 'closed'];
    if (!req.body.status || !validStatuses.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true, runValidators: true }
    );
    if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
    res.json(inquiry);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
