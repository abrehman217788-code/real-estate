const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/profile', auth, async (req, res) => {
  res.json({ user: req.user });
});

router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    if (name !== undefined && (!name || !name.trim())) return res.status(400).json({ message: 'Name cannot be empty' });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, avatar },
      { new: true, runValidators: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/favorites/:propertyId', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    const user = await User.findById(req.user._id);
    const idx = user.favorites.findIndex(fav => fav.equals(req.params.propertyId));
    if (idx > -1) user.favorites.splice(idx, 1);
    else user.favorites.push(req.params.propertyId);
    await user.save();
    res.json({ favorites: user.favorites });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
