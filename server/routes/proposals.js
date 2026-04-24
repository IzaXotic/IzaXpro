const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');

const generateNumber = (prefix, list) => {
  const year = new Date().getFullYear();
  const count = list.filter(i => i.number && i.number.startsWith(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
};

router.get('/', (req, res) => {
  try { res.json(readData('proposals')); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const proposals = readData('proposals');
    const proposal = {
      id: uuidv4(),
      number: generateNumber('PRO', proposals),
      ...req.body,
      status: 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    proposals.push(proposal);
    writeData('proposals', proposals);
    res.status(201).json(proposal);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const proposals = readData('proposals');
    const idx = proposals.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Proposal not found' });
    proposals[idx] = { ...proposals[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('proposals', proposals);
    res.json(proposals[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    let proposals = readData('proposals');
    proposals = proposals.filter(p => p.id !== req.params.id);
    writeData('proposals', proposals);
    res.json({ message: 'Proposal deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
