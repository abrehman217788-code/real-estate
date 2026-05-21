const mongoose = require('mongoose');

const InquirySchema = new mongoose.Schema({
  property: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  type: { type: String, enum: ['inquiry', 'viewing', 'callback'], default: 'inquiry' },
  status: { type: String, enum: ['new', 'contacted', 'follow-up', 'closed'], default: 'new' },
  agent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', InquirySchema);
