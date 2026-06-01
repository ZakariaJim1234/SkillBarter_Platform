const express = require('express');
const router = express.Router();
const Request = require('../models/Request');
const Message = require('../models/Message');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { reserveCredits, releaseCredits, withSession } = require('../services/creditService');

// GET /api/requests
router.get('/', async (req, res) => {
  try {
    const { skill, status = 'open', page = 1, limit = 10 } = req.query;
    const query = { status };
    if (skill) query.skill = skill;

    const requests = await Request.find(query)
      .populate('requester', 'name avatar reputationScore')
      .populate('skill', 'name category icon')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Request.countDocuments(query);
    res.json({ requests, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/my — my own requests
router.get('/my', protect, async (req, res) => {
  try {
    const requests = await Request.find({ requester: req.user._id })
      .populate('skill', 'name category icon')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/:id
router.get('/:id', async (req, res) => {
  try {
    const request = await Request.findById(req.params.id)
      .populate('requester', 'name avatar reputationScore')
      .populate('skill', 'name category icon');
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, skill, creditOffer, deadline } = req.body;

    await withSession(async (session) => {
      await reserveCredits(req.user._id, creditOffer, session);

      const request = await Request.create([{
        title, description,
        requester: req.user._id,
        skill, creditOffer,
        reservedCredits: creditOffer,
        deadline,
      }], { session });

      res.status(201).json(request[0]);
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/requests/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Not found' });
    if (String(request.requester) !== String(req.user._id))
      return res.status(403).json({ message: 'Not authorized' });
    if (!['open', 'negotiating'].includes(request.status))
      return res.status(400).json({ message: 'Cannot cancel at this stage' });

    await withSession(async (session) => {
      await releaseCredits(req.user._id, request.reservedCredits, session);
      request.status = 'cancelled';
      request.reservedCredits = 0;
      await request.save({ session });
    });

    res.json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/requests/:id/messages — only requester or offer providers can read
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const Offer = require('../models/Offer');
    const isRequester = String(request.requester) === String(req.user._id);
    const hasOffer = await Offer.exists({ request: req.params.id, provider: req.user._id });
    if (!isRequester && !hasOffer)
      return res.status(403).json({ message: 'Not authorized to view this chat' });

    const messages = await Message.find({ request: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/requests/:id/messages — only requester or offer providers can send
router.post('/:id/messages', protect, async (req, res) => {
  try {
    if (!req.body.text || !req.body.text.trim())
      return res.status(400).json({ message: 'Message text required' });

    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    const Offer = require('../models/Offer');
    const isRequester = String(request.requester) === String(req.user._id);
    const hasOffer = await Offer.exists({ request: req.params.id, provider: req.user._id });
    if (!isRequester && !hasOffer)
      return res.status(403).json({ message: 'Not authorized to send messages here' });

    const message = await Message.create({
      request: req.params.id,
      sender: req.user._id,
      text: req.body.text.trim(),
    });
    await message.populate('sender', 'name avatar');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
