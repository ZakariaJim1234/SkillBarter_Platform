const express = require('express');
const router = express.Router();
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');
const Review = require('../models/Review');
const { protect } = require('../middleware/auth');

// GET /api/users — marketplace listing with filters
router.get('/', async (req, res) => {
  try {
    const { skill, minRating, maxRate, search, page = 1, limit = 12 } = req.query;
    let userIds = null;

    if (skill) {
      const userSkills = await UserSkill.find({ skill, isActive: true }).distinct('user');
      userIds = userSkills.map(String);
    }

    const query = {};
    if (userIds) query._id = { $in: userIds };
    if (minRating) query.reputationScore = { $gte: parseFloat(minRating) };
    if (search) query.name = { $regex: search, $options: 'i' };

    const users = await User.find(query)
      .select('-password -email')
      .sort({ reputationScore: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/profile — update own profile (must be before /:id)
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, bio, location, avatar, contactEmail } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, bio, location, avatar, contactEmail },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/users/skills — add a skill offering (must be before /:id)
router.post('/skills', protect, async (req, res) => {
  try {
    const { skill, skillLevel, description, hourlyCreditRate } = req.body;
    const userSkill = await UserSkill.create({
      user: req.user._id, skill, skillLevel, description, hourlyCreditRate,
    });
    await userSkill.populate('skill');
    res.status(201).json(userSkill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/skills/:id — remove a skill offering (must be before /:id)
router.delete('/skills/:id', protect, async (req, res) => {
  try {
    const userSkill = await UserSkill.findOne({ _id: req.params.id, user: req.user._id });
    if (!userSkill) return res.status(404).json({ message: 'Skill not found' });
    await userSkill.deleteOne();
    res.json({ message: 'Skill removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/:id — public profile (must be after specific routes)
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -email');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userSkills = await UserSkill.find({ user: user._id, isActive: true }).populate('skill');
    const reviews = await Review.find({ targetUser: user._id })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ user, userSkills, reviews });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
