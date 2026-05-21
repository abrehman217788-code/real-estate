const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Property = require('../models/Property');
const { auth, roleAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const { city, type, status, minPrice, maxPrice, bedrooms, featured, page = 1, limit = 12 } = req.query;
    const filter = { isActive: true };
    if (city) filter['location.city'] = { $regex: city.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (bedrooms) filter.bedrooms = { $gte: parseInt(bedrooms) };
    if (featured === 'true') filter.featured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    const total = await Property.countDocuments(filter);
    const properties = await Property.find(filter)
      .populate('agent', 'name email phone')
      .sort({ featured: -1, createdAt: -1 })
      .skip((page - 1) * limit).limit(parseInt(limit));

    res.json({ properties, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    const property = await Property.findById(req.params.id).populate('agent', 'name email phone avatar');
    if (!property) return res.status(404).json({ message: 'Property not found' });
    property.views += 1;
    await property.save();
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', auth, roleAuth('agent', 'agency', 'admin'), async (req, res) => {
  try {
    const { title, description, price, type } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required' });
    if (!description || !description.trim()) return res.status(400).json({ message: 'Description is required' });
    if (!price || isNaN(price) || Number(price) <= 0) return res.status(400).json({ message: 'Valid price is required' });
    if (!type || !['house', 'apartment', 'villa', 'plot', 'commercial'].includes(type)) return res.status(400).json({ message: 'Valid type is required' });
    if (!req.body.location?.city || !req.body.location.city.trim()) return res.status(400).json({ message: 'City is required' });

    const property = await Property.create({ ...req.body, agent: req.user._id });
    res.status(201).json(property);
  } catch (err) {
    if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    const isOwner = property.agent && property.agent.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    Object.assign(property, req.body);
    await property.save();
    res.json(property);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ message: 'Property not found' });
    const isOwner = property.agent && property.agent.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }
    property.isActive = false;
    await property.save();
    res.json({ message: 'Property deactivated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
