import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { clientsAPI } from '../services/api';
import FieldLabel from '../components/FieldLabel';
import { useConfig } from '../hooks/useConfig';
import type { Client } from '../types';

const emptyForm = {
  name: '', email: '', phone: '', company: '', address: '',
  services: [] as string[], budget: '', notes: '', status: 'New'
};

export default function Clients() {
  const { config } = useConfig();
  const STATUSES = config.clientStatuses || [];
  const SERVICES = config.services || [];
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const load = async () => {
    try { const r = await clientsAPI.getAll(); setClients(r.data); }
    catch { toast.error('Failed to load clients'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (c: Client) => { setEditing(c); setForm({ ...emptyForm, ...c, budget: String(c.budget ?? ''), services: c.services || [] }); setShowModal(true); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await clientsAPI.update(editing.id, form); toast.success('Client updated!'); }
      else { await clientsAPI.create(form); toast.success('Client added!'); }
      setShowModal(false); load();
    } catch { toast.error('Failed to save client'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this client?')) return;
    try { await clientsAPI.delete(id); toast.success('Client deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleService = (s: string) => {
    setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }));
  };

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <input className="form-control" placeholder="🔍 Search clients..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }} />
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add Client</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Client</th><th>Company</th><th>Services</th>
              <th>Budget</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--gray-400)' }}>Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><User size={26} /></div>
                    <h3>No Clients Found</h3>
                    <p>Add your first client to get started</p>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> Add Client</button>
                  </div>
                </td></tr>
              ) : filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>
                        {(c.name || 'C')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{c.company || '-'}</td>
                  <td>
                    {(c.services || []).slice(0, 2).map((s: string) => (
                      <span key={s} style={{ display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 4, padding: '2px 6px', fontSize: 10, fontWeight: 600, marginRight: 3 }}>{s}</span>
                    ))}
                    {(c.services || []).length > 2 && <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>+{(c.services || []).length - 2}</span>}
                  </td>
                  <td>{c.budget ? `₹${Number(c.budget).toLocaleString('en-IN')}` : '-'}</td>
                  <td><span className={`badge badge-${(c.status || 'new').toLowerCase().replace(' ', '')}`}>{c.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(c)}><Pencil size={12} /></button>
                      <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(c.id)}><Trash2 size={12} /></button>
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
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Client' : 'Add New Client'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <FieldLabel label="Full Name" required tip="Primary contact person's full name. Appears on all generated PDFs." />
                    <input required className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Smith" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Company" tip="Business or organisation name — printed as the billing party on invoices and proposals." />
                    <input className="form-control" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Corp" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Email" required tip="Primary contact email. Used for communication and shown on PDF documents." />
                    <input required type="email" className="form-control" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@acme.com" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Phone" tip="Optional mobile / landline. Appears in client profile and PDF headers." />
                    <input className="form-control" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                  </div>
                </div>
                <div className="form-group">
                  <FieldLabel label="Address" tip="Client's billing address — city, state, and PIN. Printed on invoice PDFs." />
                  <input className="form-control" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="City, State, PIN" />
                </div>
                <div className="form-group">
                  <FieldLabel label="Services Required" tip="Toggle all services this client is interested in. Used for filtering and proposal scoping." />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {SERVICES.map(s => (
                      <button type="button" key={s} onClick={() => toggleService(s)} style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1.5px solid',
                        background: form.services.includes(s) ? 'var(--primary)' : 'transparent',
                        color: form.services.includes(s) ? 'white' : 'var(--gray-500)',
                        borderColor: form.services.includes(s) ? 'var(--primary)' : 'var(--gray-200)'
                      }}>{s}</button>
                    ))}
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <FieldLabel label="Budget (₹)" tip="Estimated client budget. Informational only — actual billing is handled via Invoices." />
                    <input type="number" className="form-control" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="100000" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Status" tip="Current relationship stage: New → Active → In Progress → On Hold → Completed." />
                    <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <FieldLabel label="Notes / Requirements" tip="Internal notes about this client's requirements, preferences, or special instructions." />
                  <textarea className="form-control" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Project requirements, special notes..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update Client' : 'Add Client'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
