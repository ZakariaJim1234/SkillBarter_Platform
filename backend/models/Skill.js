const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  category: {
    type: String,
    required: true,
    enum: ['Technology', 'Design', 'Education', 'Repair', 'Creative', 'Business', 'Health', 'Other'],
  },
  description: { type: String, default: '' },
  icon: { type: String, default: '🛠️' },
}, { timestamps: true });

module.exports = mongoose.model('Skill', skillSchema);
