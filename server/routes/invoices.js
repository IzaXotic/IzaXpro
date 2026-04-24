const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, useMongo, generateNumber } = require('../utils/db');
const { Invoice } = require('../models');

const calculateTotals = (items = [], taxRate = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const taxableAmount = subtotal - discountAmt;
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmt, taxAmount, total };
};

router.get('/', async (req, res) => {
  try {
    if (useMongo()) return res.json(await Invoice.find().lean());
    res.json(readData('invoices'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { items = [], taxRate = 18, discount = 0 } = req.body;
    const totals = calculateTotals(items, taxRate, discount);
    if (useMongo()) {
      const existing = await Invoice.find().lean();
      const invoice = await Invoice.create({
        id: uuidv4(), number: generateNumber('INV', existing),
        ...req.body, ...totals, status: req.body.status || 'Draft',
        dueDate: req.body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString()
      });
      return res.status(201).json(invoice);
    }
    const invoices = readData('invoices');
    const invoice = {
      id: uuidv4(), number: generateNumber('INV', invoices),
      ...req.body, ...totals, status: req.body.status || 'Draft',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString()
    };
    invoices.push(invoice);
    writeData('invoices', invoices);
    res.status(201).json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const existing = await Invoice.findOne({ id: req.params.id }).lean();
      if (!existing) return res.status(404).json({ error: 'Invoice not found' });
      const { items = existing.items, taxRate = existing.taxRate, discount = existing.discount } = req.body;
      const totals = calculateTotals(items, taxRate, discount);
      const doc = await Invoice.findOneAndUpdate({ id: req.params.id }, { ...req.body, ...totals }, { new: true }).lean();
      return res.json(doc);
    }
    const invoices = readData('invoices');
    const idx = invoices.findIndex(i => i.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Invoice not found' });
    const { items = invoices[idx].items, taxRate = invoices[idx].taxRate, discount = invoices[idx].discount } = req.body;
    const totals = calculateTotals(items, taxRate, discount);
    invoices[idx] = { ...invoices[idx], ...req.body, ...totals, updatedAt: new Date().toISOString() };
    writeData('invoices', invoices);
    res.json(invoices[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      await Invoice.deleteOne({ id: req.params.id });
      return res.json({ message: 'Invoice deleted' });
    }
    const invoices = readData('invoices').filter(i => i.id !== req.params.id);
    writeData('invoices', invoices);
    res.json({ message: 'Invoice deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
