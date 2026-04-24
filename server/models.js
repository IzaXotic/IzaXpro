const mongoose = require('mongoose');

const opts = { strict: false, timestamps: true };

const ClientSchema   = new mongoose.Schema({ id: String }, opts);
const ProjectSchema  = new mongoose.Schema({ id: String }, opts);
const InvoiceSchema  = new mongoose.Schema({ id: String }, opts);
const QuotationSchema = new mongoose.Schema({ id: String }, opts);
const ProposalSchema = new mongoose.Schema({ id: String }, opts);
const MilestoneSchema = new mongoose.Schema({ id: String }, opts);
const SupportSchema  = new mongoose.Schema({ id: String }, opts);

module.exports = {
  Client:    mongoose.model('Client',    ClientSchema),
  Project:   mongoose.model('Project',   ProjectSchema),
  Invoice:   mongoose.model('Invoice',   InvoiceSchema),
  Quotation: mongoose.model('Quotation', QuotationSchema),
  Proposal:  mongoose.model('Proposal',  ProposalSchema),
  Milestone: mongoose.model('Milestone', MilestoneSchema),
  Support:   mongoose.model('Support',   SupportSchema),
};
