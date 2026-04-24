import React, { useEffect, useState } from 'react';
import {
  Users, FolderKanban, FileText, TrendingUp,
  DollarSign, AlertCircle, CheckCircle, Clock
} from 'lucide-react';
import { dashboardAPI } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.get().then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <div style={{ textAlign: 'center', color: 'var(--gray-400)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
        <div>Loading dashboard...</div>
      </div>
    </div>
  );

  const stats = data?.stats || {};

  const statCards = [
    { label: 'Total Clients', value: stats.totalClients || 0, icon: <Users size={20} />, color: '#6366f1', bg: '#e0e7ff' },
    { label: 'Active Projects', value: stats.activeProjects || 0, icon: <FolderKanban size={20} />, color: '#10b981', bg: '#d1fae5' },
    { label: 'Total Revenue', value: fmt(stats.totalRevenue), icon: <DollarSign size={20} />, color: '#8b5cf6', bg: '#ede9fe', big: true },
    { label: 'Pending Amount', value: fmt(stats.pendingRevenue), icon: <Clock size={20} />, color: '#f59e0b', bg: '#fef3c7', big: true },
    { label: 'Total Invoices', value: stats.totalInvoices || 0, icon: <FileText size={20} />, color: '#3b82f6', bg: '#dbeafe' },
    { label: 'Paid Invoices', value: stats.paidInvoices || 0, icon: <CheckCircle size={20} />, color: '#10b981', bg: '#d1fae5' },
    { label: 'Overdue', value: stats.overdueInvoices || 0, icon: <AlertCircle size={20} />, color: '#ef4444', bg: '#fee2e2' },
    { label: 'Open Tickets', value: stats.openTickets || 0, icon: <TrendingUp size={20} />, color: '#f59e0b', bg: '#fef3c7' },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        borderRadius: 16, padding: '28px 32px', marginBottom: 28, color: 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Welcome back! 👋</h2>
          <p style={{ opacity: 0.85, fontSize: 14 }}>
            IzaXotic · Custom Web Development & UI/UX Design Studio
          </p>
        </div>
        <div style={{ textAlign: 'right', opacity: 0.9 }}>
          <div style={{ fontSize: 12 }}>Today</div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div className="stat-card" key={i}>
            <div>
              <div className="stat-card-value" style={{ fontSize: s.big ? 20 : 28 }}>{s.value}</div>
              <div className="stat-card-label">{s.label}</div>
            </div>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(280px,360px)', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Revenue (Last 6 Months)</span></div>
          <div className="card-body" style={{ height: 260 }}>
            {data?.monthlyRevenue?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.monthlyRevenue}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} width={52} />
                  <Tooltip formatter={(v: any) => fmt(v)} />
                  <Area type="monotone" dataKey="revenue" stroke="#6366f1" fill="url(#rev)" strokeWidth={2.5} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No revenue data yet</p></div>
            )}
          </div>
        </div>

        {/* Project Status — overflow:visible so pie labels never clip */}
        <div className="card" style={{ overflow: 'visible' }}>
          <div className="card-header" style={{ borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0' }}><span className="card-title">Project Status</span></div>
          <div className="card-body" style={{ height: 280, overflow: 'visible' }}>
            {data?.projectStatusBreakdown?.some((p: any) => p.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <Pie
                    data={data.projectStatusBreakdown}
                    cx="50%" cy="42%"
                    outerRadius={72}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    labelLine={false}
                    fontSize={10}
                  >
                    {data.projectStatusBreakdown.map((_: any, idx: number) => (
                      <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Tooltip formatter={(v: any) => v} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state"><p>No project data yet</p></div>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Clients</span></div>
          <div>
            {data?.recentClients?.length ? data.recentClients.map((c: any) => (
              <div key={c.id} style={{ padding: '12px 22px', borderBottom: '1px solid var(--gray-50)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                  {(c.name || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{c.company || c.email}</div>
                </div>
                <span className={`badge badge-${(c.status || 'new').toLowerCase().replace(' ', '')}`} style={{ marginLeft: 'auto' }}>{c.status}</span>
              </div>
            )) : <div className="empty-state"><p>No clients yet</p></div>}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Recent Invoices</span></div>
          <div>
            {data?.recentInvoices?.length ? data.recentInvoices.map((inv: any) => (
              <div key={inv.id} style={{ padding: '12px 22px', borderBottom: '1px solid var(--gray-50)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11 }}>INV</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{inv.number}</div>
                  <div style={{ fontSize: 11, color: 'var(--gray-400)' }}>{inv.clientName}</div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{fmt(inv.total)}</div>
                  <span className={`badge badge-${(inv.status || 'draft').toLowerCase()}`}>{inv.status}</span>
                </div>
              </div>
            )) : <div className="empty-state"><p>No invoices yet</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
}
