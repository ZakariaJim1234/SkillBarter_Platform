const express = require('express');
const router = express.Router();
const Dispute = require('../models/Dispute');
const Agreement = require('../models/Agreement');
const { protect, adminOnly } = require('../middleware/auth');
const { transferCredits, releaseCredits, withSession } = require('../services/creditService');

// POST /api/disputes
router.post('/', protect, async (req, res) => {
  try {
    const { agreementId, description } = req.body;
    const agreement = await Agreement.findById(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

    const isParty = [String(agreement.provider), String(agreement.requester)].includes(String(req.user._id));
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    const existing = await Dispute.findOne({ agreement: agreementId, status: 'open' });
    if (existing) return res.status(400).json({ message: 'Dispute already open' });

    agreement.status = 'disputed';
    await agreement.save();

    const dispute = await Dispute.create({
      agreement: agreementId,
      complainant: req.user._id,
      description,
    });

    res.status(201).json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/disputes — admin only
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate('agreement')
      .populate('complainant', 'name')
      .sort({ createdAt: -1 });
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/disputes/:id/resolve — admin resolves
router.put('/:id/resolve', protect, adminOnly, async (req, res) => {
  try {
    const { resolution, outcome } = req.body;
    // outcome: 'provider' | 'requester' | 'split'
    const dispute = await Dispute.findById(req.params.id).populate('agreement');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    const agreement = dispute.agreement;

    await withSession(async (session) => {
      if (outcome === 'provider') {
        await transferCredits(agreement.requester, agreement.provider, agreement.creditAmount, agreement._id, session);
        dispute.status = 'resolved_provider';
      } else if (outcome === 'requester') {
        await releaseCredits(agreement.requester, agreement.creditAmount, session);
        dispute.status = 'resolved_requester';
      } else if (outcome === 'split') {
        const half = Math.floor(agreement.creditAmount / 2);
        await transferCredits(agreement.requester, agreement.provider, half, agreement._id, session);
        await releaseCredits(agreement.requester, agreement.creditAmount - half, session);
        dispute.status = 'resolved_split';
      }

      agreement.status = 'completed';
      await agreement.save({ session });
    });

    dispute.resolution = resolution;
    dispute.resolvedBy = req.user._id;
    await dispute.save();

    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
