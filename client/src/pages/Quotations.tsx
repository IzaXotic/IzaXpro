import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FileQuestion, Download, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { quotationsAPI, clientsAPI, projectsAPI, pdfAPI } from '../services/api';
import FieldLabel from '../components/FieldLabel';
import { useConfig } from '../hooks/useConfig';

const emptyItem = { description: '', serviceType: '', quantity: 1, unitPrice: 0 };
const emptyForm = {
  clientId: '', clientName: '', clientEmail: '', clientPhone: '', clientCompany: '', clientAddress: '',
  projectId: '', projectName: '', items: [{ ...emptyItem }],
  taxRate: 18, discount: 0, notes: '', validUntil: '', status: 'Draft'
};

const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n || 0);

export default function Quotations() {
  const { config } = useConfig();
  const STATUSES = config.quotationStatuses || [];
  const SERVICE_TYPES = config.services || [];
  const [quotations, setQuotations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [genLoading, setGenLoading] = useState<string | null>(null);

  const load = async () => {
    try {
      const [qRes, cRes, pRes] = await Promise.all([quotationsAPI.getAll(), clientsAPI.getAll(), projectsAPI.getAll()]);
      setQuotations(qRes.data); setClients(cRes.data); setProjects(pRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm, items: [{ ...emptyItem }] }); setShowModal(true); };
  const openEdit   = (q: any) => { setEditing(q); setForm({ ...emptyForm, ...q }); setShowModal(true); };

  const handleClientChange = (clientId: string) => {
    const c = clients.find(x => x.id === clientId);
    if (c) setForm((f: any) => ({ ...f, clientId: c.id, clientName: c.name, clientEmail: c.email, clientPhone: c.phone || '', clientCompany: c.company || '', clientAddress: c.address || '' }));
  };

  const updateItem = (idx: number, field: string, val: any) => {
    setForm((f: any) => {
      const items = [...f.items];
      items[idx] = { ...items[idx], [field]: field === 'quantity' || field === 'unitPrice' ? Number(val) : val };
      return { ...f, items };
    });
  };

  const calcTotals = () => {
    const subtotal    = form.items.reduce((s: number, i: any) => s + ((Number(i.quantity) || 0) * (Number(i.unitPrice) || 0)), 0);
    const discountAmt = Math.min(Number(form.discount) || 0, subtotal);
    const taxAmount   = Math.round(((subtotal - discountAmt) * (Number(form.taxRate) || 0)) / 100);
    return { subtotal, discountAmt, taxAmount, total: subtotal - discountAmt + taxAmount };
  };
  const totals = calcTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await quotationsAPI.update(editing.id, form); toast.success('Quotation updated!'); }
      else { await quotationsAPI.create(form); toast.success('Quotation created!'); }
      setShowModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this quotation?')) return;
    try { await quotationsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const convertToInvoice = async (id: string) => {
    try {
      await quotationsAPI.convert(id);
      toast.success('Converted to Invoice! Check Invoices page.');
      load();
    } catch { toast.error('Failed to convert'); }
  };

  const generatePDF = async (id: string) => {
    setGenLoading(id);
    try {
      const r = await pdfAPI.generateQuotation(id);
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5001';
      window.open(`${baseUrl}${r.data.url}`, '_blank');
      toast.success('PDF generated!');
    } catch { toast.error('PDF generation failed.'); }
    finally { setGenLoading(null); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Quotation</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Quote #</th><th>Client</th><th>Amount</th>
              <th>Valid Until</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              : quotations.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><FileQuestion size={26} /></div>
                    <h3>No Quotations Yet</h3>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Quotation</button>
                  </div>
                </td></tr>
              ) : quotations.map(q => (
                <tr key={q.id}>
                  <td><strong style={{ color: 'var(--primary)' }}>{q.number}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{q.clientName}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{q.clientCompany}</div>
                  </td>
                  <td><strong>{fmt(q.total)}</strong></td>
                  <td style={{ fontSize: 12 }}>{q.validUntil ? new Date(q.validUntil).toLocaleDateString('en-IN') : '-'}</td>
                  <td><span className={`badge badge-${(q.status || 'draft').toLowerCase()}`}>{q.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(q)}><Pencil size={12} /></button>
                      <button className="btn btn-ghost btn-xs" style={{ color: 'var(--success)' }} onClick={() => generatePDF(q.id)} disabled={genLoading === q.id}>
                        {genLoading === q.id ? '...' : <Download size={12} />}
                      </button>
                      {q.status !== 'Converted' && (
                        <button className="btn btn-ghost btn-xs" style={{ color: 'var(--primary)' }} onClick={() => convertToInvoice(q.id)} title="Convert to Invoice">
                          <ArrowRight size={12} />
                        </button>
                      )}
                      <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(q.id)}><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-xl">
            <div className="modal-header">
              <span className="modal-title">{editing ? `Edit ${editing.number}` : 'New Quotation'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <FieldLabel label="Client" required tip="Selecting a client auto-fills their billing details. Use 'Convert to Invoice' later to create an invoice from this quote." />
                    <select required className="form-control" value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Valid Until" tip="Expiry date of this quote. After this date the price is no longer guaranteed — communicate it to the client." />
                    <input type="date" className="form-control" value={form.validUntil?.split('T')[0] || ''} onChange={e => setForm((f: any) => ({ ...f, validUntil: e.target.value }))} />
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-600)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>LINE ITEMS</span>
                    <button type="button" className="btn btn-primary btn-xs" onClick={() => setForm((f: any) => ({ ...f, items: [...f.items, { ...emptyItem }] }))}><Plus size={11} /> Add</button>
                  </div>
                  <div className="items-table">
                    <div className="items-table-header">
                      <span>Description</span><span>Service Type</span><span>Qty</span><span>Unit Price (₹)</span><span>Amount</span><span></span>
                    </div>
                    {form.items.map((item: any, idx: number) => (
                      <div className="items-table-row" key={idx}>
                        <input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Service description" />
                        <select value={item.serviceType} onChange={e => updateItem(idx, 'serviceType', e.target.value)}>
                          {SERVICE_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                        <input type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', e.target.value)} />
                        <input type="number" min={0} value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', e.target.value)} />
                        <div style={{ fontWeight: 700 }}>{fmt(item.quantity * item.unitPrice)}</div>
                        <button type="button" onClick={() => setForm((f: any) => ({ ...f, items: f.items.filter((_: any, i: number) => i !== idx) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }} disabled={form.items.length === 1}>✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                  <div style={{ width: 320, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>LIVE CALCULATION</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ color: 'rgba(255,255,255,0.6)' }}>Subtotal</span>
                      <strong style={{ color: '#f9fafb' }}>{fmt(totals.subtotal)}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)' }}>Discount (₹)</span>
                      <input type="number" min={0} className="form-input" style={{ width: 90, padding: '4px 8px', fontSize: 13, textAlign: 'right' }} value={form.discount} onChange={e => setForm((f: any) => ({ ...f, discount: Number(e.target.value) }))} placeholder="0" />
                      <span style={{ minWidth: 80, textAlign: 'right', color: '#34d399', fontWeight: 600 }}>{totals.discountAmt > 0 ? `−${fmt(totals.discountAmt)}` : '—'}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                      <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)' }}>GST (%)</span>
                      <input type="number" min={0} max={30} className="form-input" style={{ width: 90, padding: '4px 8px', fontSize: 13, textAlign: 'right' }} value={form.taxRate} onChange={e => setForm((f: any) => ({ ...f, taxRate: Number(e.target.value) }))} />
                      <span style={{ minWidth: 80, textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>+{fmt(totals.taxAmount)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 20, padding: '12px 0 4px', color: '#a78bfa' }}>
                      <span>Total</span><span>{fmt(totals.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <FieldLabel label="Notes" tip="Any special terms, conditions, or validity notes. Printed at the bottom of the quotation PDF." />
                  <textarea className="form-control" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Terms, conditions, validity..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create Quotation'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
