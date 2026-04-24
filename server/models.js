const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  phone: String,
  company: String,
  address: String,
  status: String,
  joinDate: String,
  projects: Number,
  totalValue: Number,
  notes: String,
}, { timestamps: true });

const ProjectSchema = new mongoose.Schema({
  id: String,
  name: String,
  client: String,
  clientId: String,
  status: String,
  progress: Number,
  startDate: String,
  endDate: String,
  budget: Number,
  description: String,
  type: String,
}, { timestamps: true });

const InvoiceSchema = new mongoose.Schema({
  id: String,
  invoiceNumber: String,
  client: String,
  clientId: String,
  amount: Number,
  status: String,
  dueDate: String,
  issueDate: String,
  items: [{ description: String, quantity: Number, rate: Number, amount: Number }],
  notes: String,
  tax: Number,
  subtotal: Number,
  total: Number,
}, { timestamps: true });

const QuotationSchema = new mongoose.Schema({
  id: String,
  quotationNumber: String,
  client: String,
  clientId: String,
  amount: Number,
  status: String,
  validUntil: String,
  issueDate: String,
  items: [{ description: String, quantity: Number, rate: Number, amount: Number }],
  notes: String,
  tax: Number,
  subtotal: Number,
  total: Number,
}, { timestamps: true });

const ProposalSchema = new mongoose.Schema({
  id: String,
  proposalNumber: String,
  client: String,
  clientId: String,
  title: String,
  status: String,
  value: Number,
  sentDate: String,
  validUntil: String,
  description: String,
  scope: String,
  timeline: String,
  paymentTerms: mongoose.Schema.Types.Mixed,
  deliverables: [String],
}, { timestamps: true });

const MilestoneSchema = new mongoose.Schema({
  id: String,
  projectId: String,
  name: String,
  status: String,
  dueDate: String,
  completedDate: String,
  description: String,
  amount: Number,
}, { timestamps: true });

const SupportSchema = new mongoose.Schema({
  id: String,
  ticketNumber: String,
  client: String,
  clientId: String,
  subject: String,
  status: String,
  priority: String,
  category: String,
  createdDate: String,
  resolvedDate: String,
  description: String,
  notes: String,
}, { timestamps: true });

module.exports = {
  Client: mongoose.model('Client', ClientSchema),
  Project: mongoose.model('Project', ProjectSchema),
  Invoice: mongoose.model('Invoice', InvoiceSchema),
  Quotation: mongoose.model('Quotation', QuotationSchema),
  Proposal: mongoose.model('Proposal', ProposalSchema),
  Milestone: mongoose.model('Milestone', MilestoneSchema),
  Support: mongoose.model('Support', SupportSchema),
};
