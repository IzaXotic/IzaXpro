const express = require('express');
const router = express.Router();
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs-extra');
const { readData, useMongo } = require('../utils/db');
const { Invoice, Quotation, Proposal } = require('../models');

const COMPANY = {
  name: 'IzaXotic',
  tagline: 'Custom Web Development & UI/UX Design Studio',
  address: 'Remote-First, India — Serving Clients Worldwide',
  phone: '+91 98765 43210',
  email: 'hello@izaxotic.com',
  website: 'izaxpro.onrender.com',
  gstin: 'GSTIN: Add Your GSTIN Here',
  bankName: 'Add Your Bank',
  accountNo: 'Add Account No.',
  ifsc: 'Add IFSC'
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount || 0);

const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

const baseStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f0f0f; background: #fff; }
  .page { max-width: 900px; margin: 0 auto; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 30px; border-bottom: 3px solid #0f0f0f; margin-bottom: 30px; }
  .company-name { font-size: 28px; font-weight: 900; color: #0f0f0f; letter-spacing: -1px; }
  .company-name span { color: #7c3aed; }
  .company-tagline { font-size: 10px; color: #888; margin-top: 4px; text-transform: uppercase; letter-spacing: 2px; }
  .company-info { font-size: 11px; color: #555; line-height: 1.7; }
  .doc-title { font-size: 32px; font-weight: 900; color: #0f0f0f; text-align: right; letter-spacing: 3px; text-transform: uppercase; }
  .doc-number { font-size: 12px; color: #888; margin-top: 4px; text-align: right; font-family: monospace; }
  .badge { display: inline-block; padding: 3px 12px; border-radius: 4px; font-size: 11px; font-weight: 700; text-align: right; text-transform: uppercase; letter-spacing: 1px; }
  .badge-paid { background: #d1fae5; color: #065f46; }
  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-draft { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
  .badge-sent { background: #dbeafe; color: #1e40af; }
  .badge-overdue { background: #fee2e2; color: #991b1b; }
  .two-col { display: flex; gap: 40px; margin-bottom: 30px; }
  .bill-section { flex: 1; }
  .section-label { font-size: 10px; font-weight: 800; color: #7c3aed; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px; font-family: monospace; }
  .client-name { font-size: 17px; font-weight: 800; color: #0f0f0f; }
  .client-info { font-size: 12px; color: #555; line-height: 1.7; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  thead tr { background: #0f0f0f; color: white; }
  thead th { padding: 13px 16px; text-align: left; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; }
  tbody tr:nth-child(even) { background: #fafafa; }
  tbody td { padding: 12px 16px; font-size: 12px; border-bottom: 1px solid #f1f5f9; }
  .text-right { text-align: right; }
  .totals { margin-left: auto; width: 300px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #eee; }
  .total-row.grand { font-weight: 900; font-size: 18px; color: #0f0f0f; border-top: 3px solid #0f0f0f; border-bottom: none; padding-top: 12px; margin-top: 4px; }
  .notes { background: #fafafa; border-left: 4px solid #0f0f0f; padding: 16px 20px; border-radius: 0 8px 8px 0; margin-top: 30px; font-size: 12px; line-height: 1.7; color: #555; }
  .footer { margin-top: 50px; padding-top: 20px; border-top: 2px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
  .footer-left { font-size: 11px; color: #888; }
  .footer-right { font-size: 11px; color: #888; text-align: right; }
  .watermark { font-size: 10px; color: #bbb; margin-top: 6px; font-family: monospace; }
  .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .meta-item { font-size: 12px; color: #555; }
  .meta-item strong { color: #0f0f0f; font-weight: 700; }
  .bank-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 8px; margin-top: 30px; font-size: 12px; line-height: 1.8; color: #555; }
`;

const buildInvoiceHTML = (doc, type = 'INVOICE') => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>${baseStyles}</style></head><body><div class="page">
  <div class="header">
    <div>
      <div class="company-name">Iza<span>Xotic</span></div>
      <div class="company-tagline">Custom Web Development &amp; UI/UX Design Studio</div>
      <div class="company-info" style="margin-top:10px">
        ${COMPANY.address}<br>${COMPANY.phone} | ${COMPANY.email}<br>
        ${COMPANY.website}<br>${COMPANY.gstin}
      </div>
    </div>
    <div>
      <div class="doc-title">${type}</div>
      <div class="doc-number">#${doc.number}</div>
      <div style="margin-top:8px;text-align:right">
        <span class="badge badge-${(doc.status || 'draft').toLowerCase()}">${doc.status}</span>
      </div>
    </div>
  </div>

  <div class="two-col">
    <div class="bill-section">
      <div class="section-label">Bill To</div>
      <div class="client-name">${doc.clientName || 'Client Name'}</div>
      <div class="client-info">
        ${doc.clientCompany ? doc.clientCompany + '<br>' : ''}
        ${doc.clientEmail || ''}<br>
        ${doc.clientPhone ? doc.clientPhone + '<br>' : ''}
        ${doc.clientAddress || ''}
      </div>
    </div>
    <div class="bill-section">
      <div class="section-label">Details</div>
      <div class="meta-grid">
        <div class="meta-item"><strong>Date:</strong><br>${formatDate(doc.createdAt)}</div>
        <div class="meta-item"><strong>Due Date:</strong><br>${formatDate(doc.dueDate || doc.validUntil)}</div>
        ${doc.projectName ? `<div class="meta-item"><strong>Project:</strong><br>${doc.projectName}</div>` : ''}
        ${doc.paymentTerms ? `<div class="meta-item"><strong>Terms:</strong><br>${doc.paymentTerms}</div>` : ''}
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th><th>Description</th><th>Service Type</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${(doc.items || []).map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td><strong>${item.description}</strong>${item.details ? '<br><span style="color:#888;font-size:11px">' + item.details + '</span>' : ''}</td>
          <td>${item.serviceType || 'Development'}</td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${formatCurrency(item.unitPrice)}</td>
          <td class="text-right"><strong>${formatCurrency(item.quantity * item.unitPrice)}</strong></td>
        </tr>`).join('')}
    </tbody>
  </table>

  <div class="totals">
    <div class="total-row"><span>Subtotal</span><span>${formatCurrency(doc.subtotal)}</span></div>
    ${doc.discount > 0 ? `<div class="total-row" style="color:#059669"><span>Discount (${doc.discount}%)</span><span>- ${formatCurrency(doc.discountAmt)}</span></div>` : ''}
    ${doc.taxRate > 0 ? `<div class="total-row"><span>GST (${doc.taxRate}%)</span><span>${formatCurrency(doc.taxAmount)}</span></div>` : ''}
    <div class="total-row grand"><span>Total</span><span>${formatCurrency(doc.total)}</span></div>
  </div>

  ${doc.notes ? `<div class="notes"><strong>Notes & Terms:</strong><br>${doc.notes}</div>` : ''}

  ${type === 'INVOICE' ? `
  <div class="bank-box">
    <div class="section-label" style="margin-bottom:8px">Bank Details</div>
    <div>
      <strong>Bank:</strong> ${COMPANY.bankName} &nbsp;|&nbsp;
      <strong>Account:</strong> ${COMPANY.accountNo} &nbsp;|&nbsp;
      <strong>IFSC:</strong> ${COMPANY.ifsc}
    </div>
  </div>` : ''}

  <div class="footer">
    <div class="footer-left">
      Thank you for choosing IzaXotic!<br>
      Your vision, engineered into reality.<br>
      <span class="watermark">SYS://GENERATED · IzaXpro · ${new Date().getFullYear()}</span>
    </div>
    <div class="footer-right">
      Authorized Signatory<br>
      <strong>IzaXotic</strong><br>
      <span style="font-size:10px;color:#bbb">Computer generated document</span>
    </div>
  </div>
</div></body></html>`;

const buildProposalHTML = (doc) => `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  ${baseStyles}
  .cover { text-align: center; padding: 60px 40px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border-radius: 12px; margin-bottom: 40px; }
  .cover h1 { font-size: 36px; font-weight: 900; margin-bottom: 12px; }
  .cover p { font-size: 14px; opacity: 0.9; }
  .section { margin-bottom: 30px; }
  .section h2 { font-size: 18px; font-weight: 700; color: #6366f1; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; margin-bottom: 15px; }
  .section p { font-size: 13px; line-height: 1.8; color: #444; }
  .timeline-item { display: flex; gap: 20px; margin-bottom: 16px; padding: 14px; background: #f8f9ff; border-radius: 8px; border-left: 4px solid #6366f1; }
  .timeline-phase { font-weight: 700; color: #6366f1; font-size: 13px; min-width: 120px; }
  .timeline-details { font-size: 12px; color: #555; line-height: 1.6; }
  .price-box { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; }
  .price-box .amount { font-size: 42px; font-weight: 900; }
  .price-box .label { font-size: 14px; opacity: 0.85; }
  .tech-tag { display: inline-block; background: #e0e7ff; color: #4338ca; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin: 3px; }
</style>
</head><body><div class="page">
  <div class="header">
    <div>
      <div class="company-name">Iza<span>Xotic</span></div>
      <div class="company-tagline">Custom Web Dev &amp; UI/UX Design Studio</div>
      <div class="company-info" style="margin-top:8px">${COMPANY.email} | ${COMPANY.phone}</div>
    </div>
    <div>
      <div class="doc-title">PROPOSAL</div>
      <div class="doc-number">#${doc.number}</div>
      <div style="text-align:right;margin-top:6px"><span class="badge badge-draft">${doc.status}</span></div>
    </div>
  </div>

  <div class="cover">
    <h1>${doc.title || 'Project Proposal'}</h1>
    <p>Prepared for: <strong>${doc.clientName || 'Valued Client'}</strong></p>
    <p style="margin-top:8px">Date: ${formatDate(doc.createdAt)} &nbsp;|&nbsp; Valid Until: ${formatDate(doc.validUntil)}</p>
  </div>

  ${doc.overview ? `<div class="section"><h2>Project Overview</h2><p>${doc.overview}</p></div>` : ''}
  ${doc.scope ? `<div class="section"><h2>Scope of Work</h2><p>${doc.scope}</p></div>` : ''}
  
  ${doc.phases && doc.phases.length ? `
  <div class="section">
    <h2>Project Timeline & Phases</h2>
    ${doc.phases.map(phase => `
      <div class="timeline-item">
        <div class="timeline-phase">${phase.name}</div>
        <div class="timeline-details">${phase.description}<br><strong>Duration:</strong> ${phase.duration}</div>
      </div>`).join('')}
  </div>` : ''}

  ${doc.technologies && doc.technologies.length ? `
  <div class="section">
    <h2>Technologies & Stack</h2>
    <div>${doc.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}</div>
  </div>` : ''}

  ${doc.investmentAmount ? `
  <div class="section">
    <h2>Investment</h2>
    <div class="price-box">
      <div class="label">Total Project Investment</div>
      <div class="amount">${formatCurrency(doc.investmentAmount)}</div>
      <div class="label" style="margin-top:8px">${doc.paymentSchedule || 'Payment terms to be discussed'}</div>
    </div>
  </div>` : ''}

  ${doc.deliverables ? `<div class="section"><h2>Deliverables</h2><p>${doc.deliverables}</p></div>` : ''}
  ${doc.terms ? `<div class="section"><h2>Terms & Conditions</h2><p>${doc.terms}</p></div>` : ''}

  <div class="footer">
    <div class="footer-left">Prepared by IzaXotic<br><span class="watermark">SYS://CONFIDENTIAL · Your vision, engineered into reality</span></div>
    <div class="footer-right">Authorized Signatory<br><strong>IzaXotic</strong></div>
  </div>
</div></body></html>`;

const generatePDF = async (html, filename) => {
  const pdfDir = path.join(__dirname, '../data/pdfs');
  await fs.ensureDir(pdfDir);
  const filePath = path.join(pdfDir, filename);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process'
    ]
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  await page.pdf({ path: filePath, format: 'A4', printBackground: true, margin: { top: '20px', bottom: '20px' } });
  await browser.close();
  return filePath;
};

// Generate Invoice PDF
router.post('/invoice/:id', async (req, res) => {
  try {
    let doc;
    if (useMongo()) {
      doc = await Invoice.findOne({ id: req.params.id }).lean();
    } else {
      doc = readData('invoices').find(i => i.id === req.params.id);
    }
    if (!doc) return res.status(404).json({ error: 'Invoice not found' });
    const html = buildInvoiceHTML(doc, 'INVOICE');
    const filename = `invoice-${doc.number}.pdf`;
    await generatePDF(html, filename);
    res.json({ url: `/pdfs/${filename}`, filename });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate Quotation PDF
router.post('/quotation/:id', async (req, res) => {
  try {
    let doc;
    if (useMongo()) {
      doc = await Quotation.findOne({ id: req.params.id }).lean();
    } else {
      doc = readData('quotations').find(q => q.id === req.params.id);
    }
    if (!doc) return res.status(404).json({ error: 'Quotation not found' });
    const html = buildInvoiceHTML(doc, 'QUOTATION');
    const filename = `quotation-${doc.number}.pdf`;
    await generatePDF(html, filename);
    res.json({ url: `/pdfs/${filename}`, filename });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate Proposal PDF
router.post('/proposal/:id', async (req, res) => {
  try {
    let doc;
    if (useMongo()) {
      doc = await Proposal.findOne({ id: req.params.id }).lean();
    } else {
      doc = readData('proposals').find(p => p.id === req.params.id);
    }
    if (!doc) return res.status(404).json({ error: 'Proposal not found' });
    const html = buildProposalHTML(doc);
    const filename = `proposal-${doc.number}.pdf`;
    await generatePDF(html, filename);
    res.json({ url: `/pdfs/${filename}`, filename });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
