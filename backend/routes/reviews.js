const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Agreement = require('../models/Agreement');
const { protect } = require('../middleware/auth');
const { updateReputation } = require('../services/reputationService');

// POST /api/reviews
router.post('/', protect, async (req, res) => {
  try {
    const { agreementId, rating, comment } = req.body;

    const agreement = await Agreement.findById(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });
    if (agreement.status !== 'completed')
      return res.status(400).json({ message: 'Can only review completed agreements' });

    const isParty = [String(agreement.provider), String(agreement.requester)].includes(String(req.user._id));
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    const targetUser = String(agreement.provider) === String(req.user._id)
      ? agreement.requester
      : agreement.provider;

    const existing = await Review.findOne({ agreement: agreementId, reviewer: req.user._id });
    if (existing) return res.status(400).json({ message: 'Already reviewed' });

    const review = await Review.create({
      agreement: agreementId,
      reviewer: req.user._id,
      targetUser,
      rating, comment,
    });

    await updateReputation(targetUser);
    await review.populate('reviewer', 'name avatar');
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reviews/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const reviews = await Review.find({ targetUser: req.params.userId })
      .populate('reviewer', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
