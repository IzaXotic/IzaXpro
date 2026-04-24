const express = require('express');
const router = express.Router();
const { readData, useMongo } = require('../utils/db');
const { Client, Project, Invoice, Quotation, Support } = require('../models');

// Helper: parse ?from= and ?to= query params into Date objects
const parseDateRange = (query) => {
  const from = query.from ? new Date(query.from) : null;
  const to   = query.to   ? new Date(query.to + 'T23:59:59.999Z') : null;
  return { from, to };
};

const inRange = (dateStr, from, to) => {
  if (!from && !to) return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (from && d < from) return false;
  if (to   && d > to)   return false;
  return true;
};

router.get('/', async (req, res) => {
  try {
    let clients, projects, invoices, quotations, support;

    if (useMongo()) {
      [clients, projects, invoices, quotations, support] = await Promise.all([
        Client.find().lean(),
        Project.find().lean(),
        Invoice.find().lean(),
        Quotation.find().lean(),
        Support.find().lean(),
      ]);
    } else {
      clients    = readData('clients');
      projects   = readData('projects');
      invoices   = readData('invoices');
      quotations = readData('quotations');
      support    = readData('support');
    }

    const { from, to } = parseDateRange(req.query);

    // Filter invoices by date range (use dueDate or createdAt)
    const filteredInvoices = invoices.filter(inv => {
      const dateStr = inv.dueDate || inv.createdAt || inv.updatedAt;
      return inRange(dateStr, from, to);
    });

    const totalRevenue      = filteredInvoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const pendingRevenue    = filteredInvoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((s, i) => s + (i.total || 0), 0);
    const activeProjects    = projects.filter(p => p.status === 'In Progress').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // Monthly revenue (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('default', { month: 'short' });
      const year  = d.getFullYear();
      const revenue = invoices
        .filter(inv => {
          if (inv.status !== 'Paid') return false;
          const dateStr = inv.dueDate || inv.updatedAt || inv.createdAt;
          if (!dateStr) return false;
          const dt = new Date(dateStr);
          return dt.getMonth() === d.getMonth() && dt.getFullYear() === year;
        })
        .reduce((s, inv) => s + (inv.total || 0), 0);
      monthlyRevenue.push({ month: `${month} ${year}`, revenue });
    }

    res.json({
      stats: {
        totalClients:    clients.length,
        activeProjects,
        completedProjects,
        totalProjects:   projects.length,
        totalInvoices:   filteredInvoices.length,
        paidInvoices:    filteredInvoices.filter(i => i.status === 'Paid').length,
        pendingInvoices: filteredInvoices.filter(i => i.status === 'Sent').length,
        overdueInvoices: filteredInvoices.filter(i => i.status === 'Overdue').length,
        totalRevenue,
        pendingRevenue,
        openTickets:     support.filter(s => s.status === 'Open').length,
        totalQuotations: quotations.length
      },
      monthlyRevenue,
      recentClients:    clients.slice(-5).reverse(),
      recentInvoices:   filteredInvoices.slice(-5).reverse(),
      projectStatusBreakdown: [
        { name: 'Not Started', value: projects.filter(p => p.status === 'Not Started').length },
        { name: 'In Progress', value: activeProjects },
        { name: 'Completed',   value: completedProjects },
        { name: 'On Hold',     value: projects.filter(p => p.status === 'On Hold').length }
      ]
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
