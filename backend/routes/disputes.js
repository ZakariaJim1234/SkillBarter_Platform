const express = require('express');
const router = express.Router();
const Dispute = require('../models/Dispute');
const Agreement = require('../models/Agreement');
const Request = require('../models/Request');
const { protect, adminOnly } = require('../middleware/auth');
const { transferCredits, releaseCredits, withSession } = require('../services/creditService');

const activeDisputeStatuses = ['open', 'under_review'];

const populateDispute = (query) => query
  .populate({
    path: 'agreement',
    populate: [
      { path: 'request', select: 'title description skill status' },
      { path: 'provider', select: 'name email' },
      { path: 'requester', select: 'name email' },
    ],
  })
  .populate('complainant', 'name email')
  .populate('respondent', 'name email')
  .populate('resolvedBy', 'name');

// POST /api/disputes
router.post('/', protect, async (req, res) => {
  try {
    const { agreementId, description } = req.body;
    if (!description || !description.trim()) {
      return res.status(400).json({ message: 'Dispute description is required' });
    }

    const agreement = await Agreement.findById(agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

    const isParty = [String(agreement.provider), String(agreement.requester)].includes(String(req.user._id));
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    const existing = await Dispute.findOne({ agreement: agreementId, status: { $in: activeDisputeStatuses } });
    if (existing) return res.status(400).json({ message: 'Dispute already open' });

    agreement.status = 'disputed';
    await agreement.save();

    const dispute = await Dispute.create({
      agreement: agreementId,
      complainant: req.user._id,
      description: description.trim(),
    });

    res.status(201).json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/disputes/agreement/:agreementId — agreement parties can view active dispute
router.get('/agreement/:agreementId', protect, async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.agreementId);
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });

    const isParty = [String(agreement.provider), String(agreement.requester)].includes(String(req.user._id));
    if (!isParty && !req.user.isAdmin) return res.status(403).json({ message: 'Not authorized' });

    const dispute = await populateDispute(
      Dispute.findOne({ agreement: req.params.agreementId, status: { $in: activeDisputeStatuses } })
    );
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });

    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/disputes — admin only
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const disputes = await populateDispute(Dispute.find().sort({ createdAt: -1 }));
    res.json(disputes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/disputes/:id/respond — the other party submits their side
router.put('/:id/respond', protect, async (req, res) => {
  try {
    const { response } = req.body;
    if (!response || !response.trim()) {
      return res.status(400).json({ message: 'Response is required' });
    }

    const dispute = await Dispute.findById(req.params.id).populate('agreement');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    if (dispute.status !== 'open') {
      return res.status(400).json({ message: 'Dispute is not waiting for a response' });
    }
    if (String(dispute.complainant) === String(req.user._id)) {
      return res.status(400).json({ message: 'Complainant cannot respond to their own dispute' });
    }

    const agreement = dispute.agreement;
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });
    const isParty = [String(agreement.provider), String(agreement.requester)].includes(String(req.user._id));
    if (!isParty) return res.status(403).json({ message: 'Not authorized' });

    dispute.respondent = req.user._id;
    dispute.response = response.trim();
    dispute.respondedAt = new Date();
    dispute.status = 'under_review';
    await dispute.save();

    res.json(await populateDispute(Dispute.findById(dispute._id)));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/disputes/:id/resolve — admin resolves
router.put('/:id/resolve', protect, adminOnly, async (req, res) => {
  try {
    const { resolution, outcome } = req.body;
    // outcome: 'provider' | 'requester' | 'split'
    if (!['provider', 'requester', 'split'].includes(outcome)) {
      return res.status(400).json({ message: 'Invalid dispute outcome' });
    }
    if (!resolution || !resolution.trim()) {
      return res.status(400).json({ message: 'Resolution note is required' });
    }

    const dispute = await Dispute.findById(req.params.id).populate('agreement');
    if (!dispute) return res.status(404).json({ message: 'Dispute not found' });
    if (!['open', 'under_review'].includes(dispute.status)) {
      return res.status(400).json({ message: 'Dispute is already resolved' });
    }
    if (dispute.status !== 'under_review' || !dispute.response) {
      return res.status(400).json({ message: 'The other party must submit their response before admin resolution' });
    }

    const agreement = dispute.agreement;
    if (!agreement) return res.status(404).json({ message: 'Agreement not found' });
    if (agreement.status !== 'disputed') {
      return res.status(400).json({ message: 'Agreement is not disputed' });
    }

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

      //latest add
      const requestFinalStatus = (outcome === 'provider') ? 'completed' : 'open';
      await Request.findByIdAndUpdate(
        agreement.request,
        { status: requestFinalStatus, reservedCredits: 0 },
        { session }
      );

      dispute.resolution = resolution.trim();
      dispute.resolvedBy = req.user._id;
      await dispute.save({ session });
    });

    res.json(dispute);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
