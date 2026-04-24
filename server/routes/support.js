const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');

router.get('/', (req, res) => {
  try { res.json(readData('support')); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const support = readData('support');
    const ticket = {
      id: uuidv4(),
      ticketNumber: `SUP-${new Date().getFullYear()}-${String(support.length + 1).padStart(4, '0')}`,
      ...req.body,
      status: 'Open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    support.push(ticket);
    writeData('support', support);
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const support = readData('support');
    const idx = support.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
    support[idx] = { ...support[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('support', support);
    res.json(support[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    let support = readData('support');
    support = support.filter(s => s.id !== req.params.id);
    writeData('support', support);
    res.json({ message: 'Ticket deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
