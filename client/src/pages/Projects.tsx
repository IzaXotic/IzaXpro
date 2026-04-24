import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Target, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { projectsAPI, clientsAPI, milestonesAPI } from '../services/api';
import FieldLabel from '../components/FieldLabel';
import { useConfig } from '../hooks/useConfig';
import type { Client, Project, Milestone } from '../types';

const emptyForm = {
  name: '', clientId: '', type: '', description: '',
  startDate: '', deadline: '', estimatedHours: '', budget: '', status: 'Not Started', progress: 0
};

const emptyMilestone = { title: '', description: '', dueDate: '', status: 'Not Started', completion: 0 };

export default function Projects() {
  const { config } = useConfig();
  const STATUSES = config.projectStatuses || [];
  const TYPES = config.projectTypes || [];
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showMsModal, setShowMsModal] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [editingMs, setEditingMs] = useState<Milestone | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [msForm, setMsForm] = useState<any>({ ...emptyMilestone });
  const [activeProjId, setActiveProjId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    try {
      const [pRes, cRes, mRes] = await Promise.all([projectsAPI.getAll(), clientsAPI.getAll(), milestonesAPI.getAll()]);
      setProjects(pRes.data); setClients(cRes.data); setMilestones(mRes.data);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const clientName = (id: string) => clients.find(c => c.id === id)?.name || '-';

  const openCreate = () => { setEditing(null); setForm(emptyForm); setShowModal(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({
      ...emptyForm, ...p,
      budget: String(p.budget ?? ''),
      estimatedHours: String(p.estimatedHours ?? ''),
      startDate: p.startDate?.split('T')[0] || '',
      deadline:  p.deadline?.split('T')[0]  || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await projectsAPI.update(editing.id, form); toast.success('Project updated!'); }
      else { await projectsAPI.create(form); toast.success('Project created!'); }
      setShowModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project?')) return;
    try { await projectsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const openAddMs = (projId: string) => {
    setActiveProjId(projId); setEditingMs(null);
    setMsForm({ ...emptyMilestone, projectId: projId }); setShowMsModal(true);
  };
  const openEditMs = (ms: any) => { setEditingMs(ms); setMsForm({ ...ms }); setActiveProjId(ms.projectId); setShowMsModal(true); };

  const handleMsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMs) { await milestonesAPI.update(editingMs.id, msForm); toast.success('Milestone updated!'); }
      else { await milestonesAPI.create({ ...msForm, projectId: activeProjId }); toast.success('Milestone added!'); }
      setShowMsModal(false); load();
    } catch { toast.error('Failed to save milestone'); }
  };

  const deleteMs = async (id: string) => {
    try { await milestonesAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const getStatusColor = (s: string) => {
    if (s === 'Completed') return 'var(--success)';
    if (s === 'In Progress') return 'var(--info)';
    if (s === 'On Hold') return 'var(--warning)';
    return 'var(--gray-400)';
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Project</button>
      </div>

      {loading ? (
        <div className="empty-state"><p>Loading projects...</p></div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Target size={26} /></div>
          <h3>No Projects Yet</h3><p>Create your first project to get started</p>
          <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Project</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {projects.map(p => {
            const pMilestones = milestones.filter(m => m.projectId === p.id);
            const isExpanded = expanded[p.id];
            return (
              <div className="card" key={p.id}>
                <div style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</span>
                        <span className={`badge badge-${(p.status || 'new').toLowerCase().replace(' ', '')}`}>{p.status}</span>
                        <span style={{ fontSize: 11, background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>{p.type}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--gray-400)', marginBottom: 12 }}>
                        Client: <strong style={{ color: 'var(--gray-600)' }}>{clientName(p.clientId)}</strong>
                        {p.deadline && <> &nbsp;·&nbsp; Deadline: <strong style={{ color: 'var(--gray-600)' }}>{new Date(p.deadline).toLocaleDateString('en-IN')}</strong></>}
                        {p.budget && <> &nbsp;·&nbsp; Budget: <strong style={{ color: 'var(--gray-600)' }}>₹{Number(p.budget).toLocaleString('en-IN')}</strong></>}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="progress-bar" style={{ flex: 1, maxWidth: 300 }}>
                          <div className="progress-fill" style={{ width: `${p.progress || 0}%` }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: getStatusColor(p.status) }}>{p.progress || 0}%</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openAddMs(p.id)}><Plus size={12} /> Milestone</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}><Pencil size={12} /></button>
                      <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
                      <button className="btn btn-ghost btn-xs" onClick={() => setExpanded(x => ({ ...x, [p.id]: !x[p.id] }))}>
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && pMilestones.length > 0 && (
                    <div style={{ marginTop: 16, borderTop: '1px solid var(--gray-100)', paddingTop: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Milestones</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {pMilestones.map(m => (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--gray-50)', borderRadius: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: getStatusColor(m.status), flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{m.title}</div>
                              {m.dueDate && <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>Due: {new Date(m.dueDate).toLocaleDateString('en-IN')}</div>}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div className="progress-bar" style={{ width: 80 }}>
                                <div className="progress-fill" style={{ width: `${m.completion || 0}%` }} />
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 700, minWidth: 32 }}>{m.completion || 0}%</span>
                              <span className={`badge badge-${(m.status || 'new').toLowerCase().replace(' ', '')}`} style={{ fontSize: 10 }}>{m.status}</span>
                              <button className="btn btn-ghost btn-xs" onClick={() => openEditMs(m)}><Pencil size={11} /></button>
                              <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => deleteMs(m.id)}><Trash2 size={11} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {isExpanded && pMilestones.length === 0 && (
                    <div style={{ marginTop: 12, borderTop: '1px solid var(--gray-100)', paddingTop: 12, fontSize: 12, color: 'var(--gray-400)', textAlign: 'center' }}>
                      No milestones yet. <button className="btn btn-primary btn-xs" style={{ marginLeft: 8 }} onClick={() => openAddMs(p.id)}>Add one</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal modal-lg">
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Project' : 'New Project'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <FieldLabel label="Project Name" required tip="A clear, descriptive name for the project. Shown on dashboards and milestone trackers." />
                    <input required className="form-control" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. E-Commerce Website for ABC Corp" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Client" required tip="Must be an existing client in the registry. Add the client first if they don't appear here." />
                    <select required className="form-control" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Project Type" tip="Category of work — used for filtering and reporting across all projects." />
                    <select className="form-control" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                      {TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Start Date" tip="Planned kickoff date. Informational — does not trigger any automation." />
                    <input type="date" className="form-control" value={form.startDate?.split('T')[0] || ''} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Deadline" tip="Final delivery date. Shown in the project card and used for overdue tracking." />
                    <input type="date" className="form-control" value={form.deadline?.split('T')[0] || ''} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Budget (₹)" tip="Estimated budget for reference. Does not auto-generate invoices — raise invoices separately." />
                    <input type="number" className="form-control" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} placeholder="150000" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Estimated Hours" tip="Total hours planned for this project. Useful for resource planning and time tracking." />
                    <input type="number" className="form-control" value={form.estimatedHours} onChange={e => setForm(f => ({ ...f, estimatedHours: e.target.value }))} placeholder="120" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Status" tip="Lifecycle stage: Not Started → In Progress → Completed → On Hold." />
                    <select className="form-control" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label={`Progress (${form.progress}%)`} tip="Type a value OR drag the slider — both stay in sync." />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="number" min={0} max={100} className="form-control"
                        style={{ width: 72, flexShrink: 0, textAlign: 'center', MozAppearance: 'textfield' } as any}
                        value={form.progress}
                        onChange={e => {
                          const v = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                          setForm(f => ({ ...f, progress: v }));
                        }}
                      />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>%</span>
                      <input
                        type="range" min={0} max={100}
                        style={{ flex: 1, accentColor: '#7c3aed', cursor: 'pointer' }}
                        value={form.progress}
                        onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1/-1' }}>
                    <FieldLabel label="Description" tip="Internal notes about the project scope, goals, or technical requirements." />
                    <textarea className="form-control" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Project scope and description..." />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Milestone Modal */}
      {showMsModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowMsModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{editingMs ? 'Edit Milestone' : 'Add Milestone'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowMsModal(false)}>✕</button>
            </div>
            <form onSubmit={handleMsSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Milestone Title *</label>
                  <input required className="form-control" value={msForm.title} onChange={e => setMsForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="e.g. Design Mockups" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" value={msForm.description} onChange={e => setMsForm((f: any) => ({ ...f, description: e.target.value }))} placeholder="Milestone details..." />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-control" value={msForm.dueDate?.split('T')[0] || ''} onChange={e => setMsForm((f: any) => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-control" value={msForm.status} onChange={e => setMsForm((f: any) => ({ ...f, status: e.target.value }))}>
                      {(config.milestoneStatuses || STATUSES).map((s: string) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Completion ({msForm.completion || 0}%)</label>
                  <input type="range" min={0} max={100} className="form-control" style={{ padding: '6px 0' }} value={msForm.completion || 0} onChange={e => setMsForm((f: any) => ({ ...f, completion: Number(e.target.value) }))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMsModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingMs ? 'Update' : 'Add Milestone'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
