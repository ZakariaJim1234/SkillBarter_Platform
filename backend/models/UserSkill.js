const mongoose = require('mongoose');

const userSkillSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skill: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
  skillLevel: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Expert'],
    default: 'Intermediate',
  },
  description: { type: String, default: '' },
  hourlyCreditRate: { type: Number, required: true, min: 1 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

userSkillSchema.index({ user: 1, skill: 1 }, { unique: true });

module.exports = mongoose.model('UserSkill', userSkillSchema);
