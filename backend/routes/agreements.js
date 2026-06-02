const express = require('express');
const router = express.Router();
const Agreement = require('../models/Agreement');
const Request = require('../models/Request');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { transferCredits, withSession } = require('../services/creditService');
const { updateReputation } = require('../services/reputationService');

// GET /api/agreements/my
router.get('/my', protect, async (req, res) => {
  try {
    const agreements = await Agreement.find({
      $or: [{ provider: req.user._id }, { requester: req.user._id }],
    })
      .populate('request', 'title skill')
      .populate('provider', 'name avatar')
      .populate('requester', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(agreements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/agreements/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id)
      .populate('request')
      .populate('provider', 'name avatar reputationScore')
      .populate('requester', 'name avatar reputationScore');
    if (!agreement) return res.status(404).json({ message: 'Not found' });

    const isParty = [String(agreement.provider._id), String(agreement.requester._id)].includes(String(req.user._id));
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    res.json(agreement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/agreements/:id/mark-complete — provider marks done
router.put('/:id/mark-complete', protect, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: 'Not found' });
    if (String(agreement.provider) !== String(req.user._id))
      return res.status(403).json({ message: 'Only provider can mark complete' });
    if (agreement.status !== 'active')
      return res.status(400).json({ message: 'Agreement not active' });
    if (agreement.providerMarkedComplete)
      return res.status(400).json({ message: 'Already marked as complete' });

    agreement.providerMarkedComplete = true;
    await agreement.save();
    res.json(agreement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/agreements/:id/confirm — requester confirms completion
router.put('/:id/confirm', protect, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json({ message: 'Not found' });
    if (String(agreement.requester) !== String(req.user._id))
      return res.status(403).json({ message: 'Only requester can confirm' });
    if (agreement.status !== 'active')
      return res.status(400).json({ message: 'Agreement is not active' });
    if (agreement.requesterConfirmed)
      return res.status(400).json({ message: 'Agreement already confirmed' });
    if (!agreement.providerMarkedComplete)
      return res.status(400).json({ message: 'Provider has not marked complete yet' });

    await withSession(async (session) => {
      await transferCredits(
        agreement.requester, agreement.provider,
        agreement.creditAmount, agreement._id, session
      );

      agreement.requesterConfirmed = true;
      agreement.status = 'completed';
      await agreement.save({ session });

      // Update request status
      await Request.findByIdAndUpdate(
        agreement.request,
        { status: 'completed', reservedCredits: 0 },
        { session }
      );

      // Increment provider completed tasks
      await User.findByIdAndUpdate(agreement.provider, { $inc: { completedTasks: 1 } }, { session });
    });

    // Async reputation update (no need to block response)
    updateReputation(agreement.provider).catch(console.error);
    updateReputation(agreement.requester).catch(console.error);

    res.json({ message: 'Agreement completed. Credits transferred.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
