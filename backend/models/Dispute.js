const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  agreement: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement', required: true },
  complainant: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String, required: true },
  respondent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  response: { type: String, default: '' },
  respondedAt: { type: Date },
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved_provider', 'resolved_requester', 'resolved_split'],
    default: 'open',
  },
  resolution: { type: String, default: '' },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
