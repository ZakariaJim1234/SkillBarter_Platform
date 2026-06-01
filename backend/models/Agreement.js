const mongoose = require('mongoose');

const agreementSchema = new mongoose.Schema({
  request: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  creditAmount: { type: Number, required: true },
  deadline: { type: Date, required: true },
  providerMarkedComplete: { type: Boolean, default: false },
  requesterConfirmed: { type: Boolean, default: false },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'disputed'],
    default: 'active',
  },
}, { timestamps: true });

module.exports = mongoose.model('Agreement', agreementSchema);
