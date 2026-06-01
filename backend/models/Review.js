const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  agreement: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, default: '' },
}, { timestamps: true });

reviewSchema.index({ agreement: 1, reviewer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
