const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');
const mongoose = require('mongoose');
const { Support } = require('../models');

const useMongo = () => mongoose.connection.readyState === 1;

router.get('/', async (req, res) => {
  try {
    if (useMongo()) return res.json(await Support.find().lean());
    res.json(readData('support'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    if (useMongo()) {
      const count = await Support.countDocuments();
      const ticket = await Support.create({
        id: uuidv4(),
        ticketNumber: `SUP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`,
        ...req.body, status: 'Open'
      });
      return res.status(201).json(ticket);
    }
    const support = readData('support');
    const ticket = {
      id: uuidv4(),
      ticketNumber: `SUP-${new Date().getFullYear()}-${String(support.length + 1).padStart(4, '0')}`,
      ...req.body, status: 'Open',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    support.push(ticket);
    writeData('support', support);
    res.status(201).json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await Support.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
      if (!doc) return res.status(404).json({ error: 'Ticket not found' });
      return res.json(doc);
    }
    const support = readData('support');
    const idx = support.findIndex(s => s.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Ticket not found' });
    support[idx] = { ...support[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('support', support);
    res.json(support[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      await Support.deleteOne({ id: req.params.id });
      return res.json({ message: 'Ticket deleted' });
    }
    const support = readData('support').filter(s => s.id !== req.params.id);
    writeData('support', support);
    res.json({ message: 'Ticket deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
