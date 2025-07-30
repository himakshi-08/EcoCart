const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  condition: String,
  location: String,
  images: [String], // Array of image URLs
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Item', itemSchema);