import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, FileCheck, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { proposalsAPI, clientsAPI, pdfAPI } from '../services/api';
import FieldLabel from '../components/FieldLabel';
import { useConfig } from '../hooks/useConfig';
import type { Client, Proposal } from '../types';

const emptyForm: any = {
  clientId: '', clientName: '', clientEmail: '', clientCompany: '',
  title: '', overview: '', scope: '', deliverables: '', terms: '',
  baseAmount: 0, discount: 0, taxRate: 18, investmentAmount: 0,
  paymentSplits: [
    { label: 'Kickoff / Advance', percent: 40 },
    { label: 'Mid-Point', percent: 30 },
    { label: 'Final Delivery', percent: 30 },
  ],
  paymentSchedule: '',
  phases: [{ name: 'Phase 1: Discovery', description: 'Requirement gathering, research & wireframing', duration: '1 Week' }],
  technologies: ['React.js', 'Node.js', 'MongoDB'],
  validUntil: '', status: 'Draft'
};

export default function Proposals() {
  const { config } = useConfig();
  const STATUSES = config.proposalStatuses || [];
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [genLoading, setGenLoading] = useState<string | null>(null);
  const [techInput, setTechInput] = useState('');

  const load = async () => {
    try {
      const [pRes, cRes] = await Promise.all([proposalsAPI.getAll(), clientsAPI.getAll()]);
      setProposals(pRes.data); setClients(cRes.data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, phases: [...emptyForm.phases.map((p: any) => ({ ...p }))], technologies: [...emptyForm.technologies] });
    setShowModal(true);
  };
  const openEdit = (p: any) => {
    setEditing(p);
    const taxRate = p.taxRate ?? 18;
    const discount = p.discount ?? 0;
    const investmentAmount = Number(p.investmentAmount) || 0;
    const baseAmount = p.baseAmount
      ? p.baseAmount
      : Math.round((investmentAmount + discount) / (1 + taxRate / 100));
    // Restore paymentSplits — use stored or default 3-way split
    const paymentSplits = p.paymentSplits?.length
      ? p.paymentSplits
      : [{ label: 'Kickoff / Advance', percent: 40 }, { label: 'Mid-Point', percent: 30 }, { label: 'Final Delivery', percent: 30 }];
    setForm({ ...emptyForm, ...p, baseAmount, taxRate, discount, paymentSplits });
    setShowModal(true);
  };

  const handleClientChange = (clientId: string) => {
    const c = clients.find(x => x.id === clientId);
    if (c) setForm((f: any) => ({ ...f, clientId: c.id, clientName: c.name, clientEmail: c.email, clientCompany: c.company || '' }));
  };

  const updatePhase = (idx: number, field: string, val: string) => {
    setForm((f: any) => { const phases = [...f.phases]; phases[idx] = { ...phases[idx], [field]: val }; return { ...f, phases }; });
  };

  const addPhase = () => setForm((f: any) => ({ ...f, phases: [...f.phases, { name: `Phase ${f.phases.length + 1}`, description: '', duration: '1 Week' }] }));
  const removePhase = (idx: number) => setForm((f: any) => ({ ...f, phases: f.phases.filter((_: any, i: number) => i !== idx) }));

  const addTech = () => {
    if (techInput.trim()) {
      setForm((f: any) => ({ ...f, technologies: [...(f.technologies || []), techInput.trim()] }));
      setTechInput('');
    }
  };
  const removeTech = (t: string) => setForm((f: any) => ({ ...f, technologies: f.technologies.filter((x: string) => x !== t) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) { await proposalsAPI.update(editing.id, form); toast.success('Proposal updated!'); }
      else { await proposalsAPI.create(form); toast.success('Proposal created!'); }
      setShowModal(false); load();
    } catch { toast.error('Failed to save'); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this proposal?')) return;
    try { await proposalsAPI.delete(id); toast.success('Deleted'); load(); }
    catch { toast.error('Failed to delete'); }
  };

  const generatePDF = async (id: string) => {
    setGenLoading(id);
    try {
      const r = await pdfAPI.generateProposal(id);
      const baseUrl = process.env.NODE_ENV === 'production' ? window.location.origin : 'http://localhost:5001';
      window.open(`${baseUrl}${r.data.url}`, '_blank');
      toast.success('Proposal PDF generated!');
    } catch { toast.error('PDF generation failed.'); }
    finally { setGenLoading(null); }
  };

  const fmt = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Proposal</button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr>
              <th>Proposal #</th><th>Title</th><th>Client</th>
              <th>Investment</th><th>Valid Until</th><th>Status</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>Loading...</td></tr>
              : proposals.length === 0 ? (
                <tr><td colSpan={7}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><FileCheck size={26} /></div>
                    <h3>No Proposals Yet</h3>
                    <button className="btn btn-primary" onClick={openCreate}><Plus size={15} /> New Proposal</button>
                  </div>
                </td></tr>
              ) : proposals.map(p => (
                <tr key={p.id}>
                  <td><strong style={{ color: 'var(--primary)' }}>{p.number}</strong></td>
                  <td style={{ maxWidth: 200 }}><div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div></td>
                  <td><div style={{ fontWeight: 600 }}>{p.clientName}</div><div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{p.clientCompany}</div></td>
                  <td><strong>{p.investmentAmount ? fmt(p.investmentAmount) : '-'}</strong></td>
                  <td style={{ fontSize: 12 }}>{p.validUntil ? new Date(p.validUntil).toLocaleDateString('en-IN') : '-'}</td>
                  <td><span className={`badge badge-${(p.status || 'draft').toLowerCase().replace(' ', '')}`}>{p.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-ghost btn-xs" onClick={() => openEdit(p)}><Pencil size={12} /></button>
                      <button className="btn btn-ghost btn-xs" style={{ color: 'var(--success)' }} onClick={() => generatePDF(p.id)} disabled={genLoading === p.id}>
                        {genLoading === p.id ? '...' : <Download size={12} />}
                      </button>
                      <button className="btn btn-xs" style={{ background: '#fee2e2', color: '#ef4444' }} onClick={() => handleDelete(p.id)}><Trash2 size={12} /></button>
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
              <span className="modal-title">{editing ? 'Edit Proposal' : 'New Project Proposal'}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <FieldLabel label="Client" required tip="Selecting a client auto-fills their name, email and company on the proposal PDF." />
                    <select required className="form-control" value={form.clientId} onChange={e => handleClientChange(e.target.value)}>
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Proposal Title" required tip="A clear project title shown at the top of the PDF. E.g. 'Custom E-Commerce Platform Development'." />
                    <input required className="form-control" value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} placeholder="e.g. Custom E-Commerce Platform Development" />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Base Amount (₹)" tip="Pre-discount project value. Discount and GST are applied to this to calculate the final Investment Amount." />
                    <input
                      type="number" className="form-control"
                      value={form.baseAmount}
                      onChange={e => {
                        const base = Number(e.target.value) || 0;
                        const disc = Math.min(Number(form.discount) || 0, base);
                        const tax  = Math.round(((base - disc) * (Number(form.taxRate) || 0)) / 100);
                        setForm((f: any) => ({ ...f, baseAmount: base, investmentAmount: base - disc + tax }));
                      }}
                      placeholder="e.g. 150000"
                    />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Valid Until" tip="Expiry date of this proposal. After this date, pricing and scope are subject to review." />
                    <input type="date" className="form-control" value={form.validUntil?.split('T')[0] || ''} onChange={e => setForm((f: any) => ({ ...f, validUntil: e.target.value }))} />
                  </div>
                </div>

                {/* Live Investment Calculation */}
                {(() => {
                  const base = Number(form.baseAmount) || 0;
                  const disc = Math.min(Number(form.discount) || 0, base);
                  const tax  = Math.round(((base - disc) * (Number(form.taxRate) || 0)) / 100);
                  const total = base - disc + tax;
                  return (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
                      <div style={{ width: 340, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '16px 20px' }}>
                        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>LIVE INVESTMENT CALCULATION</div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ color: 'rgba(255,255,255,0.6)' }}>Base Amount</span>
                          <strong style={{ color: '#f9fafb' }}>{fmt(base)}</strong>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)' }}>Discount (₹)</span>
                          <input
                            type="number" min={0} className="form-control"
                            style={{ width: 90, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                            value={form.discount}
                            onChange={e => {
                              const d = Math.min(Number(e.target.value) || 0, base);
                              const t = Math.round(((base - d) * (Number(form.taxRate) || 0)) / 100);
                              setForm((f: any) => ({ ...f, discount: Number(e.target.value), investmentAmount: base - d + t }));
                            }}
                            placeholder="0"
                          />
                          <span style={{ minWidth: 80, textAlign: 'right', color: '#34d399', fontWeight: 600 }}>
                            {disc > 0 ? `−${fmt(disc)}` : '—'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <span style={{ flex: 1, color: 'rgba(255,255,255,0.6)' }}>GST (%)</span>
                          <input
                            type="number" min={0} max={30} className="form-control"
                            style={{ width: 90, padding: '4px 8px', fontSize: 13, textAlign: 'right' }}
                            value={form.taxRate}
                            onChange={e => {
                              const r = Number(e.target.value) || 0;
                              const d = Math.min(Number(form.discount) || 0, base);
                              const t = Math.round(((base - d) * r) / 100);
                              setForm((f: any) => ({ ...f, taxRate: r, investmentAmount: base - d + t }));
                            }}
                          />
                          <span style={{ minWidth: 80, textAlign: 'right', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>+{fmt(tax)}</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 900, fontSize: 20, padding: '12px 0 4px', color: '#a78bfa' }}>
                          <span>Total</span><span>{fmt(total)}</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4, fontFamily: 'monospace' }}>
                          investmentAmount = {fmt(total)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="form-group">
                  <FieldLabel label="Project Overview" tip="A 2–3 sentence summary of the project, its goals, and business value. Shown at the top of the proposal PDF." />
                  <textarea className="form-control" value={form.overview} onChange={e => setForm((f: any) => ({ ...f, overview: e.target.value }))} placeholder="Brief description of the project and its objectives..." />
                </div>
                <div className="form-group">
                  <FieldLabel label="Scope of Work" tip="Detailed breakdown of what is included — features, modules, pages, or services. Be specific to avoid scope creep." />
                  <textarea className="form-control" value={form.scope} onChange={e => setForm((f: any) => ({ ...f, scope: e.target.value }))} placeholder="Detailed scope of work, features, and deliverables..." />
                </div>

                {/* Phases */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <FieldLabel label="Project Phases / Timeline" tip="Break the project into phases with estimated durations. Each phase prints as a timeline row in the PDF." style={{ marginBottom: 0 }} />
                    <button type="button" className="btn btn-primary btn-xs" onClick={addPhase}><Plus size={11} /> Add Phase</button>
                  </div>
                  {(form.phases || []).map((phase: any, idx: number) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 100px 30px', gap: 8, marginBottom: 8, alignItems: 'start' }}>
                      <input className="form-control" value={phase.name} onChange={e => updatePhase(idx, 'name', e.target.value)} placeholder="Phase name" />
                      <input className="form-control" value={phase.description || phase.deliverables || ''} onChange={e => updatePhase(idx, 'description', e.target.value)} placeholder="Description / deliverables" />
                      <input className="form-control" value={phase.duration} onChange={e => updatePhase(idx, 'duration', e.target.value)} placeholder="Duration" />
                      <button type="button" onClick={() => removePhase(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 18 }} disabled={form.phases.length === 1}>✕</button>
                    </div>
                  ))}
                </div>

                {/* Technologies */}
                <div className="form-group">
                  <FieldLabel label="Technologies & Stack" tip="Add each technology/tool used. Press Enter or click Add. These appear as tags in the proposal PDF." />
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input className="form-control" style={{ flex: 1 }} value={techInput} onChange={e => setTechInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTech())} placeholder="e.g. React.js, press Enter" />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={addTech}>Add</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {(form.technologies || []).map((t: string) => (
                      <span key={t} style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
                        {t}<button type="button" onClick={() => removeTech(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', fontSize: 14, lineHeight: 1 }}>×</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <FieldLabel label="Deliverables" tip="Final outputs the client will receive — source code, designs, documentation, deployment, etc." />
                    <textarea className="form-control" value={form.deliverables} onChange={e => setForm((f: any) => ({ ...f, deliverables: e.target.value }))} placeholder="List of deliverables..." />
                  </div>

                  {/* Payment Schedule — auto-calc */}
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <FieldLabel label="Payment Schedule" tip="Split the Investment Amount into milestone-based tranches. Percentages must total exactly 100% (footer turns green)." style={{ margin: 0 }} />
                      <button type="button" className="btn btn-secondary" style={{ padding: '4px 12px', fontSize: 12 }}
                        onClick={() => setForm((f: any) => ({ ...f, paymentSplits: [...(f.paymentSplits || []), { label: 'Milestone', percent: 0 }] }))}>
                        <Plus size={12} /> Add Split
                      </button>
                    </div>
                    {(() => {
                      const total = Number(form.investmentAmount) || 0;
                      const splits: any[] = form.paymentSplits || [];
                      const usedPct = splits.reduce((s: number, x: any) => s + (Number(x.percent) || 0), 0);
                      const remaining = 100 - usedPct;
                      return (
                        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                          {/* Header */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 130px 32px', gap: 8, padding: '8px 14px', fontSize: 11, fontWeight: 700, letterSpacing: 0.8, color: 'rgba(255,255,255,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            <span>MILESTONE</span><span style={{ textAlign: 'center' }}>%</span><span style={{ textAlign: 'right' }}>AMOUNT</span><span></span>
                          </div>
                          {splits.map((split: any, idx: number) => {
                            const amt = Math.round((total * (Number(split.percent) || 0)) / 100);
                            return (
                              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 130px 32px', gap: 8, padding: '8px 14px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                <input
                                  className="form-input" style={{ padding: '5px 8px', fontSize: 13 }}
                                  value={split.label}
                                  onChange={e => {
                                    const sp = [...splits]; sp[idx] = { ...sp[idx], label: e.target.value };
                                    setForm((f: any) => ({ ...f, paymentSplits: sp }));
                                  }}
                                  placeholder="Milestone name"
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="form-input"
                                    style={{ padding: '5px 8px', fontSize: 13, textAlign: 'center', width: '100%' }}
                                    value={split.percent}
                                    onChange={e => {
                                      const raw = e.target.value.replace(/[^0-9]/g, '');
                                      const sp = [...splits];
                                      sp[idx] = { ...sp[idx], percent: raw === '' ? '' : Math.min(100, Number(raw)) };
                                      setForm((f: any) => ({ ...f, paymentSplits: sp }));
                                    }}
                                  />
                                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>%</span>
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 14, color: '#a78bfa' }}>
                                  {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt)}
                                </div>
                                <button type="button" onClick={() => { const sp = splits.filter((_: any, i: number) => i !== idx); setForm((f: any) => ({ ...f, paymentSplits: sp })); }}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16, lineHeight: 1 }}
                                  disabled={splits.length === 1}>✕</button>
                              </div>
                            );
                          })}
                          {/* Footer */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 130px 32px', gap: 8, padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>TOTAL</span>
                            <span style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: remaining === 0 ? '#34d399' : remaining < 0 ? '#ef4444' : '#f59e0b' }}>
                              {usedPct}% {remaining !== 0 && <span style={{ fontSize: 11 }}>({remaining > 0 ? `${remaining}% left` : `${Math.abs(remaining)}% over`})</span>}
                            </span>
                            <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 900, color: remaining === 0 ? '#34d399' : '#f59e0b' }}>
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(total)}
                            </span>
                            <span></span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Terms & Conditions" tip="Standard project terms: revision limits, IP ownership, confidentiality, cancellation policy, etc." />
                    <textarea className="form-control" value={form.terms} onChange={e => setForm((f: any) => ({ ...f, terms: e.target.value }))} placeholder="Terms and conditions..." />
                  </div>
                  <div className="form-group">
                    <FieldLabel label="Status" tip="Draft: internal only. Sent: shared with client. Under Review → Accepted → Rejected." />
                    <select className="form-control" value={form.status} onChange={e => setForm((f: any) => ({ ...f, status: e.target.value }))}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update Proposal' : 'Create Proposal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
