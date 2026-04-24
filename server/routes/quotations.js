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
  const discountAmt = (subtotal * discount) / 100;
  const taxableAmount = subtotal - discountAmt;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const total = taxableAmount + taxAmount;
  return { subtotal, discountAmt, taxAmount, total };
};

router.get('/', (req, res) => {
  try { res.json(readData('quotations')); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const quotations = readData('quotations');
    const { items = [], taxRate = 18, discount = 0 } = req.body;
    const totals = calculateTotals(items, taxRate, discount);
    const quotation = {
      id: uuidv4(),
      number: generateNumber('QUO', quotations),
      ...req.body,
      ...totals,
      status: 'Draft',
      validUntil: req.body.validUntil || new Date(Date.now() + 15 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    quotations.push(quotation);
    writeData('quotations', quotations);
    res.status(201).json(quotation);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const quotations = readData('quotations');
    const idx = quotations.findIndex(q => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Quotation not found' });
    const { items = quotations[idx].items, taxRate = quotations[idx].taxRate, discount = quotations[idx].discount } = req.body;
    const totals = calculateTotals(items, taxRate, discount);
    quotations[idx] = { ...quotations[idx], ...req.body, ...totals, updatedAt: new Date().toISOString() };
    writeData('quotations', quotations);
    res.json(quotations[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Convert quotation to invoice
router.post('/:id/convert', (req, res) => {
  try {
    const quotations = readData('quotations');
    const invoices = readData('invoices');
    const quotation = quotations.find(q => q.id === req.params.id);
    if (!quotation) return res.status(404).json({ error: 'Quotation not found' });
    const invoice = {
      ...quotation,
      id: uuidv4(),
      number: generateNumber('INV', invoices),
      type: 'Invoice',
      quotationId: quotation.id,
      status: 'Draft',
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    invoices.push(invoice);
    writeData('invoices', invoices);
    // Update quotation status
    const qIdx = quotations.findIndex(q => q.id === req.params.id);
    quotations[qIdx].status = 'Converted';
    writeData('quotations', quotations);
    res.status(201).json(invoice);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    let quotations = readData('quotations');
    quotations = quotations.filter(q => q.id !== req.params.id);
    writeData('quotations', quotations);
    res.json({ message: 'Quotation deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
