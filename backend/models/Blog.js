const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  coverImage: { type: String },
  category: { type: String, enum: ['market-trends', 'buying-guides', 'investment-tips', 'area-highlights', 'news'], default: 'market-trends' },
  tags: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublished: { type: Boolean, default: false },
  readTime: { type: Number },
  metaTitle: { type: String },
  metaDescription: { type: String },
}, { timestamps: true });

BlogSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.isModified('slug')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Date.now();
  }
  next();
});

BlogSchema.index({ slug: 1 });
BlogSchema.index({ isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('Blog', BlogSchema);
