const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const Request = require('../models/Request');
const Agreement = require('../models/Agreement');
const { protect } = require('../middleware/auth');
const { adjustReservedCredits, withSession } = require('../services/creditService');

// GET /api/offers/request/:requestId
router.get('/request/:requestId', protect, async (req, res) => {
  try {
    const offers = await Offer.find({ request: req.params.requestId })
      .populate('provider', 'name avatar reputationScore completedTasks avgRating')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/offers/my — offers I've sent
router.get('/my', protect, async (req, res) => {
  try {
    const offers = await Offer.find({ provider: req.user._id })
      .populate('request')
      .sort({ createdAt: -1 });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/offers
router.post('/', protect, async (req, res) => {
  try {
    const { request: requestId, message, proposedCredits, proposedDeadline } = req.body;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    if (String(request.requester) === String(req.user._id))
      return res.status(400).json({ message: 'Cannot offer on your own request' });
    if (!['open', 'negotiating'].includes(request.status))
      return res.status(400).json({ message: 'Request not available' });

    const existing = await Offer.findOne({ request: requestId, provider: req.user._id, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'You already have a pending offer' });

    const offer = await Offer.create({
      request: requestId,
      provider: req.user._id,
      message, proposedCredits, proposedDeadline,
    });

    request.status = 'negotiating';
    await request.save();

    await offer.populate('provider', 'name avatar reputationScore');
    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/offers/:id/accept
router.put('/:id/accept', protect, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('request');
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (String(offer.request.requester) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });

    let agreement;

    await withSession(async (session) => {
      await adjustReservedCredits(
        req.user._id,
        offer.request.reservedCredits,
        offer.proposedCredits,
        session
      );

      offer.status = 'accepted';
      await offer.save({ session });

      // Reject all other pending offers
      await Offer.updateMany(
        { request: offer.request._id, _id: { $ne: offer._id }, status: 'pending' },
        { status: 'rejected' },
        { session }
      );

      // Create agreement
      const agreements = await Agreement.create([{
        request: offer.request._id,
        offer: offer._id,
        provider: offer.provider,
        requester: req.user._id,
        creditAmount: offer.proposedCredits,
        deadline: offer.proposedDeadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }], { session });
      agreement = agreements[0];

      offer.request.status = 'in_progress';
      offer.request.reservedCredits = offer.proposedCredits;
      await offer.request.save({ session });
    });

    res.json(agreement);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/offers/:id/reject
router.put('/:id/reject', protect, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id).populate('request');
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (String(offer.request.requester) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });

    offer.status = 'rejected';
    await offer.save();
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/offers/:id/withdraw — provider withdraws their own pending offer
router.put('/:id/withdraw', protect, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer) return res.status(404).json({ message: 'Offer not found' });
    if (String(offer.provider) !== String(req.user._id))
      return res.status(403).json({ message: 'Only the provider can withdraw this offer' });
    if (offer.status !== 'pending')
      return res.status(400).json({ message: 'Only pending offers can be withdrawn' });

    offer.status = 'withdrawn';
    await offer.save();
    res.json(offer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
