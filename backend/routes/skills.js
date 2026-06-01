const express = require('express');
const router = express.Router();
const Skill = require('../models/Skill');
const { protect, adminOnly } = require('../middleware/auth');

// GET /api/skills
router.get('/', async (req, res) => {
  try {
    const skills = await Skill.find().sort({ name: 1 });
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/skills — admin only
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const skill = await Skill.create(req.body);
    res.status(201).json(skill);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/skills/:id — admin only
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Skill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Skill deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
