const express = require('express');
const router = express.Router();
const { readData, useMongo } = require('../utils/db');
const { Client, Project, Invoice, Quotation, Support } = require('../models');

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

    const totalRevenue      = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
    const pendingRevenue    = invoices.filter(i => i.status === 'Sent' || i.status === 'Overdue').reduce((s, i) => s + (i.total || 0), 0);
    const activeProjects    = projects.filter(p => p.status === 'In Progress').length;
    const completedProjects = projects.filter(p => p.status === 'Completed').length;

    // Monthly revenue (last 6 months) — use dueDate or updatedAt, whichever exists
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const month = d.toLocaleString('default', { month: 'short' });
      const year  = d.getFullYear();
      const revenue = invoices
        .filter(inv => {
          if (inv.status !== 'Paid') return false;
          const dateStr = inv.updatedAt || inv.dueDate || inv.createdAt;
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
        totalInvoices:   invoices.length,
        paidInvoices:    invoices.filter(i => i.status === 'Paid').length,
        pendingInvoices: invoices.filter(i => i.status === 'Sent').length,
        overdueInvoices: invoices.filter(i => i.status === 'Overdue').length,
        totalRevenue,
        pendingRevenue,
        openTickets:     support.filter(s => s.status === 'Open').length,
        totalQuotations: quotations.length
      },
      monthlyRevenue,
      recentClients:    clients.slice(-5).reverse(),
      recentInvoices:   invoices.slice(-5).reverse(),
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
