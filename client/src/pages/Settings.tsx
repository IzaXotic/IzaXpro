import React, { useState } from 'react';
import { Plus, Trash2, Settings as SettingsIcon, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { configAPI } from '../services/api';
import { useConfig, invalidateConfig } from '../hooks/useConfig';

const CONFIG_LABELS: Record<string, string> = {
  clientStatuses: 'Client Statuses',
  services: 'Services / Skills',
  projectStatuses: 'Project Statuses',
  projectTypes: 'Project Types',
  invoiceStatuses: 'Invoice Statuses',
  quotationStatuses: 'Quotation Statuses',
  proposalStatuses: 'Proposal Statuses',
  supportStatuses: 'Support Ticket Statuses',
  supportPriorities: 'Support Priorities',
  supportTypes: 'Support Types / Categories',
  milestoneStatuses: 'Milestone Statuses',
  paymentTerms: 'Payment Terms',
};

const CONFIG_ICONS: Record<string, string> = {
  clientStatuses: '👤', services: '🛠️', projectStatuses: '📁', projectTypes: '🔧',
  invoiceStatuses: '🧾', quotationStatuses: '📋', proposalStatuses: '📄',
  supportStatuses: '🎧', supportPriorities: '⚡', supportTypes: '🔖',
  milestoneStatuses: '🏁', paymentTerms: '💳',
};

export default function Settings() {
  const { config, loading } = useConfig();
  const [drafts, setDrafts] = useState<Record<string, string[]>>({});
  const [newValues, setNewValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const getValues = (key: string) => drafts[key] ?? config[key] ?? [];

  const addValue = (key: string) => {
    const val = (newValues[key] || '').trim();
    if (!val) return;
    if (getValues(key).includes(val)) { toast.error('Already exists'); return; }
    setDrafts(d => ({ ...d, [key]: [...getValues(key), val] }));
    setNewValues(v => ({ ...v, [key]: '' }));
  };

  const removeValue = (key: string, val: string) => {
    setDrafts(d => ({ ...d, [key]: getValues(key).filter(v => v !== val) }));
  };

  const save = async (key: string) => {
    if (!drafts[key]) return;
    setSaving(key);
    try {
      await configAPI.update(key, drafts[key]);
      invalidateConfig();
      setDrafts(d => { const nd = { ...d }; delete nd[key]; return nd; });
      toast.success(`${CONFIG_LABELS[key]} saved!`);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(null); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, color: 'var(--gray-400)' }}>
      Loading settings...
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <SettingsIcon size={20} color="var(--primary)" />
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>App Settings</h2>
        </div>
        <p style={{ margin: 0, color: 'var(--gray-400)', fontSize: 13 }}>
          Manage all dropdown options used across the app. Changes are reflected instantly everywhere.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {Object.keys(CONFIG_LABELS).map(key => {
          const values = getValues(key);
          const isDirty = !!drafts[key];
          return (
            <div key={key} className="card" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{CONFIG_ICONS[key]}</span>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{CONFIG_LABELS[key]}</span>
                </div>
                {isDirty && (
                  <button
                    className="btn btn-primary btn-xs"
                    onClick={() => save(key)}
                    disabled={saving === key}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Save size={11} />
                    {saving === key ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>

              {/* Tag list */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 32, marginBottom: 10 }}>
                {values.map(val => (
                  <span key={val} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600
                  }}>
                    {val}
                    <button
                      type="button"
                      onClick={() => removeValue(key, val)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'var(--primary)', opacity: 0.7 }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </span>
                ))}
                {values.length === 0 && (
                  <span style={{ color: 'var(--gray-400)', fontSize: 12 }}>No values — add below</span>
                )}
              </div>

              {/* Add new */}
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="form-control"
                  style={{ fontSize: 12, height: 32, flex: 1 }}
                  placeholder={`Add new ${CONFIG_LABELS[key].toLowerCase().replace(/s$/, '')}...`}
                  value={newValues[key] || ''}
                  onChange={e => setNewValues(v => ({ ...v, [key]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addValue(key))}
                />
                <button
                  className="btn btn-primary btn-xs"
                  onClick={() => addValue(key)}
                  style={{ height: 32, padding: '0 10px' }}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
