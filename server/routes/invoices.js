const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');

const generateNumber = (prefix, list) => {
  const year = new Date().getFullYear();
  const count = list.filter(i => i.number && i.number.startsWith(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
};

const calculateTotals = (items = [], taxRate = 0, discount = 0) => {
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  // discount is a flat rupee amount (not percentage)
  const discountAmt = Math.min(Number(discount) || 0, subtotal);
  const taxableAmount = subtotal - discountAmt;
  const taxAmount = Math.round((taxableAmount * taxRate) / 100);
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmt, taxAmount, total };
};

// Invoices
router.get('/', (req, res) => {
  try { res.json(readData('invoices')); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const invoices = readData('invoices');
    const { items = [], taxRate = 18, discount = 0 } = req.body;
    const totals = calculateTotals(items, taxRate, discount);
    const invoice = {
      id: uuidv4(),
      number: generateNumber('INV', invoices),
      ...req.body,
      ...totals,
      status: req.body.status || 'Draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 86400000).toISOString()
    };
    invoices.push(invoice);
    writeData('invoices', invoices);
    res.status(201).json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
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

router.delete('/:id', (req, res) => {
  try {
    let invoices = readData('invoices');
    invoices = invoices.filter(i => i.id !== req.params.id);
    writeData('invoices', invoices);
    res.json({ message: 'Invoice deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
