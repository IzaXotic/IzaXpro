import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FileText, Download, ArrowRight, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { invoicesAPI, clientsAPI, projectsAPI } from '../services/api';
import FieldLabel from '../components/FieldLabel';
import DatePicker from '../components/DatePicker';
import { useConfig } from '../hooks/useConfig';
import type { Client, Project, Invoice } from '../types';

const emptyItem = { description: '', serviceType: '', quantity: 1, unitPrice: 0 };
const emptyForm = {
  clientId: '', clientName: '', clientEmail: '', clientPhone: '', clientCompany: '', clientAddress: '',
  projectId: '', projectName: '', items: [{ ...emptyItem }],
  taxRate: 18, discount: 0, notes: '', paymentTerms: '', status: 'Draft', dueDate: ''
};

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0);

export default function Invoices() {
  const { config } = useConfig();
  const STATUSES = config.invoiceStatuses || [];
  const SERVICE_TYPES = config.services || [];
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients]   = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]   = useState<Invoice | null>(null);
  const [form, setForm]         = useState<any>(emptyForm);
  const [genLoading, setGenLoading] = useState<string | null>(null);

  const load = async () => {
    try {
      const [iRes, cRes, pRes] = await Promise.all([invoicesAPI.getAll(), clientsAPI.getAll(), projectsAPI.getAll()]);
      setInvoices(iRes.data); setClients(cRes.data); setProjects(pRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, items: [{ ...emptyItem }] }); setShowModal(true); };
  const toDateStr = (val: any) => val ? new Date(val).toISOString().split('T')[0] : '';
  const openEdit   = (inv: any) => {
    setEditing(inv);
    // Normalize items — MongoDB may store 'rate' instead of 'unitPrice'
    const items = (inv.items || []).map((item: any) => ({
      description: item.description || '',
      serviceType: item.serviceType || '',
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice ?? item.rate ?? item.amount ?? 0),
    }));
    setForm({ ...emptyForm, ...inv, items, dueDate: toDateStr(inv.dueDate) });
    setShowModal(true);
  };

  const handleClientChange = (clientId: string) => {
    const c = clients.find(x => x.id === clientId);
    if (c) setForm((f: any) => ({ ...f, clientId: c.id, clientName: c.name, clientEmail: c.email, clientPhone: c.phone || '', clientCompany: c.company || '', clientAddress: c.address || '' }));
    else setForm((f: any) => ({ ...f, clientId }));
  };

  const handleProjectChange = (projectId: string) => {
    const p = projects.find(x => x.id === projectId);
    setForm((f: any) => ({ ...f, projectId, projectName: p?.name || '' }));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setForm((f: any) => {
      const items = [...f.items];
      // Keep raw string while typing so leading-zero / clearing works naturally
      items[idx] = { ...items[idx], [field]: val };
      return { ...f, items };
    });
  };

  const addItem    = () => setForm((f: any) => ({ ...f, items: [...f.items, { ...emptyItem }] }));
  const removeItem = (idx: number) => setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== idx) }));

  const calcTotals = () => {
    const subtotal    = form.items.reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0);
    const discountAmt = Math.min(Number(form.discount) || 0, subtotal);
    const taxAmount   = Math.round(((subtotal - discountAmt) * (Number(form.taxRate) || 0)) / 100);
    const total       = subtotal - discountAmt + taxAmount;
    return { subtotal, discountAmt, taxAmount, total };
  };
  const totals = calcTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await invoicesAPI.update(editing.id, form); toast.success('Invoice updated!'); }
      else { await invoicesAPI.create(form); toast.success('Invoice created!'); }
      setShowModal(false); load();
    } catch { toast.error('Failed to save invoice'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this invoice?')) return;
    try { await invoicesAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const generatePDF = async (inv: Invoice) => {
    setGenLoading(inv.id);
    try {
      // Enrich with fallback data from loaded clients list
      const client = clients.find(c => c.id === inv.clientId);
      const enriched: any = {
        ...inv,
        clientName:    inv.clientName    || client?.name    || '—',
        clientCompany: inv.clientCompany || client?.company || '',
        clientEmail:   inv.clientEmail   || client?.email   || '',
        clientPhone:   inv.clientPhone   || client?.phone   || '',
        number: inv.number || `INV-${inv.id?.slice(0, 8).toUpperCase()}`,
        items: (inv.items || []).map((item: any) => ({
          ...item,
          description: item.description || '',
          serviceType: item.serviceType || '',
          quantity:    Number(item.quantity)  || 1,
          unitPrice:   Number(item.unitPrice) || Number(item.rate) || Number(item.amount) || 0,
        })),
      };
      // Recalculate totals from items (always fresh — don't use stale stored values)
      const subtotal    = enriched.items.reduce((s: number, i: any) => s + (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0), 0);
      const discountAmt = Math.min(Number(enriched.discount) || Number(enriched.discountAmt) || 0, subtotal);
      const taxRate     = Number(enriched.taxRate) || 0;
      const taxAmount   = Math.round(((subtotal - discountAmt) * taxRate) / 100);
      const total       = subtotal - discountAmt + taxAmount;
      enriched.subtotal    = subtotal;
      enriched.discountAmt = discountAmt;
      enriched.taxRate     = taxRate;
      enriched.taxAmount   = taxAmount;
      enriched.total       = total;

      // ASCII-safe currency formatter — avoids ₹ glyph missing from html2canvas fonts
      const fmt2 = (n: number) => 'Rs.' + (Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const fmtDate = (d: any) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

      // Div-based items rows (html2canvas tables are unreliable when off-screen)
      const itemRows = enriched.items.map((item: any, i: number) => `
        <div style="display:flex;align-items:center;background:${i % 2 === 0 ? '#fff' : '#fafafa'};border-bottom:1px solid #f1f5f9;padding:0">
          <div style="width:36px;padding:10px 14px;font-size:12px;flex-shrink:0">${i + 1}</div>
          <div style="flex:2;padding:10px 14px;font-size:12px;font-weight:700">${item.description || ''}</div>
          <div style="flex:1;padding:10px 14px;font-size:12px">${item.serviceType || ''}</div>
          <div style="width:50px;padding:10px 14px;font-size:12px;text-align:right;flex-shrink:0">${item.quantity}</div>
          <div style="width:100px;padding:10px 14px;font-size:12px;text-align:right;flex-shrink:0">${fmt2(item.unitPrice)}</div>
          <div style="width:110px;padding:10px 14px;font-size:12px;text-align:right;font-weight:700;flex-shrink:0">${fmt2(item.quantity * item.unitPrice)}</div>
        </div>`).join('');

      const html = `<div id="pdf-content" style="font-family:Arial,Helvetica,sans-serif;color:#0f0f0f;background:#fff;padding:40px;width:780px;box-sizing:border-box">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #0f0f0f;margin-bottom:24px">
          <div>
            <div style="font-size:26px;font-weight:900;letter-spacing:-1px">Iza<span style="color:#7c3aed">Xotic</span></div>
            <div style="font-size:10px;color:#888;text-transform:uppercase;letter-spacing:2px;margin-top:4px">Custom Web Development &amp; UI/UX Design Studio</div>
            <div style="font-size:11px;color:#555;margin-top:8px;line-height:1.7">Remote-First, India<br>hello@izaxotic.com</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:28px;font-weight:900;letter-spacing:3px;text-transform:uppercase">Invoice</div>
            <div style="font-size:12px;color:#888;font-family:monospace;margin-top:4px">#${enriched.number}</div>
            <div style="margin-top:8px"><span style="background:${enriched.status === 'Paid' ? '#d1fae5' : enriched.status === 'Overdue' ? '#fee2e2' : '#fef3c7'};color:${enriched.status === 'Paid' ? '#065f46' : enriched.status === 'Overdue' ? '#991b1b' : '#92400e'};padding:3px 12px;border-radius:4px;font-size:11px;font-weight:700;text-transform:uppercase">${enriched.status}</span></div>
          </div>
        </div>
        <div style="display:flex;gap:40px;margin-bottom:24px">
          <div style="flex:1">
            <div style="font-size:10px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;font-family:monospace">Bill To</div>
            <div style="font-size:16px;font-weight:800">${enriched.clientName}</div>
            <div style="font-size:12px;color:#555;line-height:1.7;margin-top:4px">${enriched.clientCompany ? enriched.clientCompany + '<br>' : ''}${enriched.clientEmail || ''}<br>${enriched.clientPhone || ''}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:10px;font-weight:800;color:#7c3aed;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;font-family:monospace">Details</div>
            <div style="font-size:12px;color:#555;line-height:1.8">
              <span style="font-weight:700;color:#0f0f0f">Date:</span> ${fmtDate(enriched.createdAt)}<br>
              <span style="font-weight:700;color:#0f0f0f">Due:</span> ${fmtDate(enriched.dueDate)}<br>
              ${enriched.projectName ? `<span style="font-weight:700;color:#0f0f0f">Project:</span> ${enriched.projectName}<br>` : ''}
              ${enriched.paymentTerms ? `<span style="font-weight:700;color:#0f0f0f">Terms:</span> ${enriched.paymentTerms}` : ''}
            </div>
          </div>
        </div>
        <div style="border:1px solid #f1f5f9;border-radius:8px;overflow:hidden;margin:16px 0">
          <div style="display:flex;align-items:center;background:#0f0f0f;color:white;padding:0">
            <div style="width:36px;padding:12px 14px;font-size:11px;font-weight:700;flex-shrink:0">#</div>
            <div style="flex:2;padding:12px 14px;font-size:11px;font-weight:700">Description</div>
            <div style="flex:1;padding:12px 14px;font-size:11px;font-weight:700">Service</div>
            <div style="width:50px;padding:12px 14px;font-size:11px;font-weight:700;text-align:right;flex-shrink:0">Qty</div>
            <div style="width:100px;padding:12px 14px;font-size:11px;font-weight:700;text-align:right;flex-shrink:0">Unit Price</div>
            <div style="width:110px;padding:12px 14px;font-size:11px;font-weight:700;text-align:right;flex-shrink:0">Amount</div>
          </div>
          ${itemRows}
        </div>
        <div style="margin-left:auto;width:280px;margin-top:16px">
          <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #eee"><span>Subtotal</span><span>${fmt2(enriched.subtotal)}</span></div>
          ${enriched.discountAmt > 0 ? `<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #eee;color:#059669"><span>Discount</span><span>- ${fmt2(enriched.discountAmt)}</span></div>` : ''}
          ${enriched.taxRate > 0 ? `<div style="display:flex;justify-content:space-between;padding:7px 0;font-size:13px;border-bottom:1px solid #eee"><span>GST (${enriched.taxRate}%)</span><span>${fmt2(enriched.taxAmount)}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;padding:12px 0 4px;font-size:20px;font-weight:900;border-top:3px solid #0f0f0f;margin-top:4px"><span>Total</span><span>${fmt2(enriched.total)}</span></div>
        </div>
        ${enriched.notes ? `<div style="background:#fafafa;border-left:4px solid #0f0f0f;padding:14px 18px;border-radius:0 8px 8px 0;margin-top:24px;font-size:12px;line-height:1.7;color:#555"><span style="font-weight:700">Notes:</span><br>${enriched.notes}</div>` : ''}
        <div style="margin-top:40px;padding-top:16px;border-top:2px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#888">
          <div>Thank you for choosing IzaXotic!<br><span style="font-family:monospace;font-size:9px;color:#ccc;letter-spacing:0.5px">SYS://GENERATED - IzaXpro - ${new Date().getFullYear()}</span></div>
          <div style="text-align:right">Authorized Signatory<br><span style="font-weight:900;color:#0f0f0f">IzaXotic</span></div>
        </div>
      </div>`;

      const container = document.createElement('div');
      // Use visibility:hidden + position:absolute so html2canvas can measure layout properly
      container.style.cssText = 'position:absolute;top:0;left:0;visibility:hidden;pointer-events:none;z-index:-1';
      container.innerHTML = html;
      document.body.appendChild(container);
      const canvas = await html2canvas(container.firstChild as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#fff' });
      document.body.removeChild(container);
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const w = pdf.internal.pageSize.getWidth();
      const h = (canvas.height * w) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, w, h);
      pdf.save(`invoice-${inv.number || inv.id}.pdf`);
      toast.success('PDF downloaded!');
    } catch (err) { toast.error('PDF generation failed'); }
    finally { setGenLoading(null); }
  };

  const markStatus = async (id: string, status: string) => {
    try { await invoicesAPI.update(id, { status }); toast.success(`Marked as ${status}`); load(); }
    catch { toast.error('Failed to update'); }
  };

  const totalRevenue  = invoices.filter(i => i.status === 'Paid').reduce((s, i) => s + (i.total || 0), 0);
  const totalPending  = invoices.filter(i => i.status === 'Sent').reduce((s, i)  => s + (i.total || 0), 0);
  const totalOverdue  = invoices.filter(i => i.status === 'Overdue').reduce((s, i) => s + (i.total || 0), 0);

  return (
    <div>
      {/* Summary */}
      <div className="stats-grid" style={{ marginBottom: 20 }}>
        {[
          { label: 'Total Invoices', value: invoices.length, color: '#6366f1', bg: '#e0e7ff' },
          { label: 'Paid Revenue',   value: fmt(totalRevenue), color: '#10b981', bg: '#d1fae5' },
          { label: 'Pending',        value: fmt(totalPending),  color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Overdue',        value: fmt(totalOverdue),  color: '#ef4444', bg: '#fee2e2' },
        ].map((s, i) => (
          <div className="stat-card" key={i}>
            <div>
              <div className="stat-card-value" style={{ fontSize: 20 }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}><FileText size={20} /></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Invoice</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Invoice #</th><th>Client</th><th>Project</th>
              <th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              : invoices.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><FileText size={26} /></div>
                    <h3>No Invoices Yet</h3><p>Create your first invoice</p>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Invoice</button>
                  </div>
                </td></tr>
              ) : invoices.map(inv => {
                const client = clients.find(c => c.id === inv.clientId);
                const displayName = inv.clientName || client?.name || '—';
                const displayCompany = inv.clientCompany || client?.company || '';
                const displayNumber = inv.number || `INV-${inv.id?.slice(0,8).toUpperCase()}`;
                return (
                <tr key={inv.id}>
                  <td><strong style={{ color: 'var(--primary)' }}>{displayNumber}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{displayName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{displayCompany}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{inv.projectName || '-'}</td>
                  <td><strong>{fmt(inv.total ?? 0)}</strong></td>
                  <td style={{ fontSize: 12 }}>{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('en-IN') : '-'}</td>
                  <td>
                    <select
                      className={`badge badge-${(inv.status || 'draft').toLowerCase()}`}
                      style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                      value={inv.status}
                      onChange={e => markStatus(inv.id, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(inv)} title="Edit"><Pencil size={12} /></button>
                      <button className="btn btn-ghost btn-xs" style={{ color: 'var(--success)' }} onClick={() => generatePDF(inv)} title="Download PDF" disabled={genLoading === inv.id}>
                        {genLoading === inv.id ? '...' : <Download size={12} />}
                      </button>
                      <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(inv.id)} title="Delete"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-xl">
            <div className="modal-header">
              <span className="modal-title">{editing ? `Edit Invoice #${editing.number || `INV-${(editing.id || '').slice(0, 8).toUpperCase()}`}` : 'New Invoice'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <FieldLabel label="Client" required tip="Select a client to auto-fill their billing details on the PDF. Add clients in the Clients module first." />
                    <select required className="form-control" value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Project (Optional)" tip="Link this invoice to a project for traceability. Only shows projects belonging to the selected client." />
                    <select className="form-control" value={form.projectId} onChange={e => handleProjectChange(e.target.value)}>
                      <option value="">Select Project</option>
                      {projects.filter(p => !form.clientId || p.clientId === form.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Due Date" tip="Payment deadline for this invoice. Overdue invoices should be chased and marked accordingly." />
                    <DatePicker value={form.dueDate?.split('T')[0] || ''} onChange={val => setForm((f: any) => ({ ...f, dueDate: val }))} />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Payment Terms" tip="Standard payment window communicated to the client. Printed on the PDF." />
                    <select className="form-control" value={form.paymentTerms} onChange={e => setForm((f: any) => ({ ...f, paymentTerms: e.target.value }))}>
                      {['Net 7', 'Net 15', 'Net 30', 'Net 45', 'Due on Receipt', '50% Advance'].map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                {/* Line Items */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>LINE ITEMS</span>
                    <button type="button" className="btn btn-primary btn-xs" onClick={addItem}><Plus size={11} /> Add Item</button>
                  </div>
                  <div className="items-table">
                    <div className="items-table-header">
                      <span>Description</span><span>Service Type</span>
                      <span>Qty</span><span>Unit Price (₹)</span><span>Amount</span><span></span>
                    </div>
                    {form.items.map((item: any, idx: number) => (
                      <div className="items-table-row" key={idx}>
                        <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service description" />
                        <select value={item.serviceType} onChange={e => updateItem(idx, 'serviceType', e.target.value)}>
                          {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <input type="number" min={1} value={item.quantity === 0 || item.quantity === '' ? '' : item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        <input type="number" min={0} value={item.unitPrice === 0 || item.unitPrice === '' ? '' : item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(item.quantity * item.unitPrice)}</div>
                        <button type="button" onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, lineHeight: 1 }} disabled={form.items.length === 1}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <div style={{ width: 320, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>LIVE CALCULATION</div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>Subtotal</span>
                      <strong style={{ color: '#f9fafb' }}>{fmt(totals.subtotal)}</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)' }}>Discount (₹)</span>
                      <input
                        type="number" min={0} className="form-input"
                        style={{ width: 90, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                        value={form.discount === 0 || form.discount === '' ? '' : form.discount}
                        onChange={e => setForm((f: any) => ({ ...f, discount: e.target.value }))}
                        placeholder="0"
                      />
                      <span style={{ minWidth: 80, textAlign: 'right', color: '#34d399', fontWeight: 600 }}>
                        {totals.discountAmt > 0 ? `−${fmt(totals.discountAmt)}` : '—'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', fontSize: 13, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)' }}>GST (%)</span>
                      <input
                        type="number" min={0} max={30} className="form-input"
                        style={{ width: 90, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                        value={form.taxRate === 0 || form.taxRate === '' ? '' : form.taxRate}
                        onChange={e => setForm((f: any) => ({ ...f, taxRate: e.target.value }))}
                      />
                      <span style={{ minWidth: 80, textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
                        +{fmt(totals.taxAmount)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0 4px', fontSize: 20, fontWeight: 900, color: '#a78bfa' }}>
                      <span>Total</span>
                      <span>{fmt(totals.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid-2" style={{ marginTop: 12 }}>
                  <div className="form-group">
                    <FieldLabel label="Status" tip="Draft: not sent yet. Sent: awaiting payment. Paid: revenue confirmed. Overdue: past due date." />
                    <select className="form-control" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Notes / Payment Instructions" tip="Bank account details, UPI ID, or any special payment instructions. Printed at the bottom of the PDF." />
                    <textarea className="form-control" style={{ minHeight: 60 }} value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Bank details, payment instructions..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update Invoice' : 'Create Invoice'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
