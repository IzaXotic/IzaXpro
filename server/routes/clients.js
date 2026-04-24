const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');

// GET all clients
router.get('/', (req, res) => {
  try {
    const clients = readData('clients');
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single client
router.get('/:id', (req, res) => {
  try {
    const clients = readData('clients');
    const client = clients.find(c => c.id === req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create client
router.post('/', (req, res) => {
  try {
    const clients = readData('clients');
    const newClient = {
      id: uuidv4(),
      ...req.body,
      status: req.body.status || 'New',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clients.push(newClient);
    writeData('clients', clients);
    res.status(201).json(newClient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update client
router.put('/:id', (req, res) => {
  try {
    const clients = readData('clients');
    const idx = clients.findIndex(c => c.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Client not found' });
    clients[idx] = { ...clients[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('clients', clients);
    res.json(clients[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE client
router.delete('/:id', (req, res) => {
  try {
    let clients = readData('clients');
    clients = clients.filter(c => c.id !== req.params.id);
    writeData('clients', clients);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
