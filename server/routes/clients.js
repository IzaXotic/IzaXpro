const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, useMongo } = require('../utils/db');
const { Client } = require('../models');

router.get('/', async (req, res) => {
  try {
    if (useMongo()) return res.json(await Client.find().lean());
    res.json(readData('clients'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await Client.findOne({ id: req.params.id }).lean();
      if (!doc) return res.status(404).json({ error: 'Client not found' });
      return res.json(doc);
    }
    const client = readData('clients').find(c => c.id === req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const newClient = { id: uuidv4(), ...req.body, status: req.body.status || 'New' };
    if (useMongo()) {
      const doc = await Client.create(newClient);
      return res.status(201).json(doc);
    }
    const clients = readData('clients');
    clients.push(newClient);
    writeData('clients', clients);
    res.status(201).json(newClient);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await Client.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
      if (!doc) return res.status(404).json({ error: 'Client not found' });
      return res.json(doc);
    }
    const clients = readData('clients');
    const idx = clients.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Client not found' });
    clients[idx] = { ...clients[idx], ...req.body };
    writeData('clients', clients);
    res.json(clients[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      await Client.deleteOne({ id: req.params.id });
      return res.json({ message: 'Client deleted' });
    }
    const clients = readData('clients').filter(c => c.id !== req.params.id);
    writeData('clients', clients);
    res.json({ message: 'Client deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
