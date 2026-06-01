const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  requester: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  creditOffer: { type: Number, required: true, min: 1 },
  reservedCredits: { type: Number, default: 0 },
  deadline: { type: Date },
  status: {
    type: String,
    enum: ['open', 'negotiating', 'in_progress', 'completed', 'cancelled', 'disputed'],
    default: 'open',
  },
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
