const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, useMongo, generateNumber } = require('../utils/db');
const { Proposal } = require('../models');

router.get('/', async (req, res) => {
  try {
    if (useMongo()) return res.json(await Proposal.find().lean());
    res.json(readData('proposals'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (useMongo()) {
      const existing = await Proposal.find().lean();
      const proposal = await Proposal.create({
        id: uuidv4(), number: generateNumber('PRO', existing), ...req.body, status: 'Draft'
      });
      return res.status(201).json(proposal);
    }
    const proposals = readData('proposals');
    const proposal = {
      id: uuidv4(), number: generateNumber('PRO', proposals),
      ...req.body, status: 'Draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    proposals.push(proposal);
    writeData('proposals', proposals);
    res.status(201).json(proposal);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await Proposal.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
      if (!doc) return res.status(404).json({ error: 'Proposal not found' });
      return res.json(doc);
    }
    const proposals = readData('proposals');
    const idx = proposals.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Proposal not found' });
    proposals[idx] = { ...proposals[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('proposals', proposals);
    res.json(proposals[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      await Proposal.deleteOne({ id: req.params.id });
      return res.json({ message: 'Proposal deleted' });
    }
    const proposals = readData('proposals').filter(p => p.id !== req.params.id);
    writeData('proposals', proposals);
    res.json({ message: 'Proposal deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
