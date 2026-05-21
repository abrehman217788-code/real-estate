const mongoose = require('mongoose');

const PropertySchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'PKR' },
  priceNegotiable: { type: Boolean, default: false },
  status: { type: String, enum: ['sale', 'rent', 'sold', 'pending'], default: 'sale' },
  type: { type: String, enum: ['house', 'apartment', 'villa', 'plot', 'commercial'], required: true },
  bedrooms: { type: Number, default: 0 },
  bathrooms: { type: Number, default: 0 },
  area: { type: String, default: '' },
  areaUnit: { type: String, enum: ['sqft', 'sqyd', 'marla', 'kanal', 'acre'], default: 'sqft' },
  location: {
    address: { type: String },
    city: { type: String, required: true },
    area: { type: String },
    coordinates: { lat: Number, lng: Number }
  },
  images: [{ type: String }],
  amenities: [{ type: String }],
  featured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  views: { type: Number, default: 0 },
}, { timestamps: true });

PropertySchema.index({ 'location.city': 1, status: 1, type: 1, price: 1 });
PropertySchema.index({ featured: -1, createdAt: -1 });

module.exports = mongoose.model('Property', PropertySchema);
