const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  credits: { type: Number, required: true },
  type: {
    type: String,
    enum: ['transfer', 'reserve', 'release', 'starter'],
    default: 'transfer',
  },
  agreement: { type: mongoose.Schema.Types.ObjectId, ref: 'Agreement' },
  note: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
