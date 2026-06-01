const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  proposedCredits: { type: Number, required: true, min: 1 },
  proposedDeadline: { type: Date },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
  },
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
