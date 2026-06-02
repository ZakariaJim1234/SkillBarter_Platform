const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  avatar: { type: String, default: '' },
  bio: { type: String, default: '' },
  location: { type: String, default: '' },
  contactEmail: { type: String, default: '', trim: true, lowercase: true },
  skillCreditBalance: { type: Number, default: 20 },
  reputationScore: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  avgRating: { type: Number, default: 0 },
  responseRate: { type: Number, default: 100 },
  completionRate: { type: Number, default: 100 },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.virtual('rankingScore').get(function () {
  return (
    this.reputationScore * 0.5 +
    this.responseRate * 0.2 +
    this.completionRate * 0.3
  );
});

module.exports = mongoose.model('User', userSchema);
