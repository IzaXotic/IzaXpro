import React, { useState } from 'react';
import { Plus, Trash2, Save, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { configAPI } from '../services/api';
import { useConfig, invalidateConfig } from '../hooks/useConfig';

const SECTIONS = [
  { label: 'Clients & Services', icon: '👤', keys: ['clientStatuses', 'services'] },
  { label: 'Projects', icon: '📁', keys: ['projectStatuses', 'projectTypes', 'milestoneStatuses'] },
  { label: 'Finance', icon: '💰', keys: ['invoiceStatuses', 'quotationStatuses', 'proposalStatuses', 'paymentTerms'] },
  { label: 'Support', icon: '🎧', keys: ['supportStatuses', 'supportPriorities', 'supportTypes'] },
];

const CONFIG_LABELS: Record<string, string> = {
  clientStatuses: 'Client Statuses', services: 'Services / Skills',
  projectStatuses: 'Project Statuses', projectTypes: 'Project Types', milestoneStatuses: 'Milestone Statuses',
  invoiceStatuses: 'Invoice Statuses', quotationStatuses: 'Quotation Statuses',
  proposalStatuses: 'Proposal Statuses', paymentTerms: 'Payment Terms',
  supportStatuses: 'Ticket Statuses', supportPriorities: 'Priorities', supportTypes: 'Ticket Types',
};

const TAG_COLORS: Record<string, { bg: string; color: string }> = {
  clientStatuses:    { bg: '#e0f2fe', color: '#0369a1' },
  services:          { bg: '#f0fdf4', color: '#15803d' },
  projectStatuses:   { bg: '#fef9c3', color: '#a16207' },
  projectTypes:      { bg: '#fce7f3', color: '#be185d' },
  milestoneStatuses: { bg: '#ede9fe', color: '#7c3aed' },
  invoiceStatuses:   { bg: '#fff7ed', color: '#c2410c' },
  quotationStatuses: { bg: '#ecfdf5', color: '#065f46' },
  proposalStatuses:  { bg: '#fdf4ff', color: '#9333ea' },
  paymentTerms:      { bg: '#f0f9ff', color: '#0c4a6e' },
  supportStatuses:   { bg: '#fef2f2', color: '#b91c1c' },
  supportPriorities: { bg: '#fff1f2', color: '#e11d48' },
  supportTypes:      { bg: '#f8fafc', color: '#475569' },
};

export default function Settings() {
  const { config, loading } = useConfig();
  const [activeTab, setActiveTab] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  const getValues = (key: string): string[] => drafts[key] ?? config[key] ?? [];
  const isDirty   = (key: string) => !!drafts[key];

  const add = (key: string) => {
    const val = (inputs[key] || '').trim();
    if (!val) return;
    if (getValues(key).map(v => v.toLowerCase()).includes(val.toLowerCase())) { toast.error('Already exists'); return; }
    setDrafts(d => ({ ...d, [key]: [...getValues(key), val] }));
    setInputs(i => ({ ...i, [key]: '' }));
  };

  const remove = (key: string, val: string) =>
    setDrafts(d => ({ ...d, [key]: getValues(key).filter(v => v !== val) }));

  const saveKey = async (key: string) => {
    if (!isDirty(key)) return;
    setSaving(key);
    try {
      await configAPI.update(key, drafts[key]);
      invalidateConfig();
      setDrafts(d => { const nd = { ...d }; delete nd[key]; return nd; });
      setSaved(key); setTimeout(() => setSaved(k => k === key ? null : k), 2000);
      toast.success(`${CONFIG_LABELS[key]} saved!`);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(null); }
  };

  const saveAll = async () => {
    const keys = Object.keys(drafts);
    if (!keys.length) { toast('Nothing to save'); return; }
    for (const k of keys) await saveKey(k);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--gray-400)', gap: 10 }}>
      Loading settings…
    </div>
  );

  const section = SECTIONS[activeTab];
  const anyDirty = Object.keys(drafts).length > 0;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>⚙️ App Settings</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--gray-400)', fontSize: 13 }}>
            Manage all dropdown options. Changes reflect instantly across the app.
          </p>
        </div>
        {anyDirty && (
          <button className="btn btn-primary" onClick={saveAll} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Save size={14} /> Save All Changes
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '2px solid var(--gray-100)' }}>
        {SECTIONS.map((s, i) => {
          const hasDirty = s.keys.some(k => isDirty(k));
          return (
            <button key={s.label} onClick={() => setActiveTab(i)} style={{
              padding: '9px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: 13,
              color: activeTab === i ? 'var(--primary)' : 'var(--gray-400)',
              borderBottom: activeTab === i ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap'
            }}>
              {s.icon} {s.label}
              {hasDirty && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />}
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(370px, 1fr))', gap: 16 }}>
        {section.keys.map(key => {
          const values = getValues(key);
          const dirty   = isDirty(key);
          const { bg, color } = TAG_COLORS[key] || { bg: 'var(--primary-light)', color: 'var(--primary)' };

          return (
            <div key={key} className="card" style={{ padding: '18px 20px', border: dirty ? '1.5px solid var(--primary)' : undefined }}>
              {/* Card header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{CONFIG_LABELS[key]}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                    {values.length} option{values.length !== 1 ? 's' : ''}
                    {dirty && <span style={{ color: '#f59e0b', marginLeft: 6 }}>● unsaved</span>}
                  </div>
                </div>
                {dirty && (
                  <button className="btn btn-primary btn-xs" onClick={() => saveKey(key)}
                    disabled={saving === key}
                    style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 72 }}>
                    {saved === key
                      ? <><CheckCircle size={11} /> Saved</>
                      : saving === key ? 'Saving…' : <><Save size={11} /> Save</>}
                  </button>
                )}
              </div>

              {/* Tag area */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, minHeight: 42, padding: '8px 10px', background: 'var(--gray-50)', borderRadius: 8, marginBottom: 10 }}>
                {values.length === 0
                  ? <span style={{ color: 'var(--gray-300)', fontSize: 12, alignSelf: 'center' }}>No options yet — add one below</span>
                  : values.map(val => (
                    <span key={val} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      background: bg, color, borderRadius: 20,
                      padding: '4px 12px 4px 13px', fontSize: 12, fontWeight: 600
                    }}>
                      {val}
                      <button type="button" onClick={() => remove(key, val)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, display: 'flex', alignItems: 'center', color, opacity: 0.6 }}>
                        <Trash2 size={10} />
                      </button>
                    </span>
                  ))
                }
              </div>

              {/* Add row */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input className="form-control"
                  style={{ fontSize: 12, height: 34, flex: 1 }}
                  placeholder={`Add new ${CONFIG_LABELS[key].replace(/s$/, '').toLowerCase()}…`}
                  value={inputs[key] || ''}
                  onChange={e => setInputs(i => ({ ...i, [key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add(key))}
                />
                <button className="btn btn-primary" onClick={() => add(key)}
                  style={{ height: 34, padding: '0 14px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: 28, fontSize: 12, color: 'var(--gray-300)', textAlign: 'center' }}>
        💡 Press <kbd style={{ background: 'var(--gray-100)', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>Enter</kbd> to quickly add a new option.
      </p>
    </div>
  );
}
