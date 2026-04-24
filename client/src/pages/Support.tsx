import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Headphones, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supportAPI, clientsAPI, projectsAPI } from '../services/api';
import { useConfig } from '../hooks/useConfig';

const emptyForm = {
  clientId: '', clientName: '', projectId: '', projectName: '',
  title: '', description: '', type: '', priority: 'Medium', status: 'Open',
  estimatedHours: '', notes: ''
};

export default function Support() {
  const { config } = useConfig();
  const STATUSES = config.supportStatuses || [];
  const PRIORITIES = config.supportPriorities || [];
  const TYPES = config.supportTypes || [];
  const [tickets, setTickets] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [filter, setFilter] = useState('All');

  const load = async () => {
    try {
      const [tRes, cRes, pRes] = await Promise.all([supportAPI.getAll(), clientsAPI.getAll(), projectsAPI.getAll()]);
      setTickets(tRes.data); setClients(cRes.data); setProjects(pRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (t: any) => { setEditing(t); setForm({ ...emptyForm, ...t }); setShowModal(true); };

  const handleClientChange = (clientId: string) => {
    const c = clients.find(x => x.id === clientId);
    setForm((f: any) => ({ ...f, clientId, clientName: c?.name || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await supportAPI.update(editing.id, form); toast.success('Ticket updated!'); }
      else { await supportAPI.create(form); toast.success('Ticket created!'); }
      setShowModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete ticket?')) return;
    try { await supportAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await supportAPI.update(id, { status }); toast.success('Updated'); load(); }
    catch { toast.error('Failed'); }
  };

  const priorityColor: Record<string, string> = {
    Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#7c3aed'
  };

  const filtered = filter === 'All' ? tickets : tickets.filter(t => t.status === filter);
  const counts: Record<string, number> = { Open: 0, 'In Progress': 0, Resolved: 0, Closed: 0 };
  tickets.forEach(t => { if (counts[t.status] !== undefined) counts[t.status]++; });

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['All', ...STATUSES].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-ghost'} btn-sm`} onClick={() => setFilter(s)}>
            {s} {s !== 'All' && counts[s] !== undefined && <span style={{ background: 'rgba(255,255,255,0.3)', borderRadius: 99, padding: '0 5px', marginLeft: 4, fontSize: 10 }}>{counts[s]}</span>}
          </button>
        ))}
        <button className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }} onClick={openCreate}><Plus size={14} /> New Ticket</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Ticket #</th><th>Title</th><th>Client</th>
              <th>Type</th><th>Priority</th><th>Status</th><th>Created</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              : filtered.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><Headphones size={26} /></div>
                    <h3>No Support Tickets</h3><p>All quiet — no tickets here</p>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Ticket</button>
                  </div>
                </td></tr>
              ) : filtered.map(t => (
                <tr key={t.id}>
                  <td><strong style={{ color: 'var(--primary)', fontSize: 12 }}>{t.ticketNumber}</strong></td>
                  <td>
                    <div style={{ fontWeight: 600, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{t.projectName}</div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{t.clientName}</td>
                  <td style={{ fontSize: 12 }}>{t.type}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: priorityColor[t.priority] || '#666' }}>
                      <AlertCircle size={11} /> {t.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      className={`badge badge-${(t.status || 'open').toLowerCase().replace(' ', '')}`}
                      style={{ border: 'none', cursor: 'pointer', background: 'transparent' }}
                      value={t.status}
                      onChange={e => updateStatus(t.id, e.target.value)}
                    >
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--gray-400)' }}>{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(t)}><Pencil size={12} /></button>
                      <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(t.id)}><Trash2 size={12} /></button>
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
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Ticket' : 'New Support Ticket'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input required className="form-control" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="Brief description of the issue" />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Client</label>
                    <select className="form-control" value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Project</label>
                    <select className="form-control" value={form.projectId} onChange={e => {
                      const p = projects.find(x => x.id === e.target.value);
                      setForm((f: any) => ({ ...f, projectId: e.target.value, projectName: p?.name || '' }));
                    }}>
                      <option value="">Select Project</option>
                      {projects.filter(p => !form.clientId || p.clientId === form.clientId).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-control" value={form.type} onChange={e => setForm((f: any) => ({ ...f, type: e.target.value }))}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-control" value={form.priority} onChange={e => setForm((f: any) => ({ ...f, priority: e.target.value }))}>
                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Hours</label>
                    <input type="number" className="form-control" value={form.estimatedHours} onChange={e => setForm((f: any) => ({ ...f, estimatedHours: e.target.value }))} placeholder="2" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={form.description} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Detailed description of the issue or request..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes / Resolution</label>
                  <textarea className="form-control" value={form.notes} onChange={e => setForm((f: any) => ({ ...f, notes: e.target.value }))} placeholder="Resolution notes, updates..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update Ticket' : 'Create Ticket'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
