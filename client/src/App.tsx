import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, FolderKanban, FileText,
  FileQuestion, FileCheck, Headphones, ChevronRight, BookOpen
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Projects from './pages/Projects';
import Invoices from './pages/Invoices';
import Quotations from './pages/Quotations';
import Proposals from './pages/Proposals';
import Support from './pages/Support';
import Help from './pages/Help';
import Tooltip from './components/Tooltip';

type Page = 'dashboard' | 'clients' | 'projects' | 'invoices' | 'quotations' | 'proposals' | 'support' | 'help';

const navItems: { id: Page; label: string; icon: React.ReactNode; section?: string; tooltip: string }[] = [
  { id: 'dashboard',  label: 'Dashboard',   icon: <LayoutDashboard size={17} />, section: 'MAIN',       tooltip: 'Overview — stats, revenue & project charts' },
  { id: 'clients',    label: 'Clients',     icon: <Users size={17} />,           section: 'MANAGEMENT', tooltip: 'Add & manage client profiles' },
  { id: 'projects',   label: 'Projects',    icon: <FolderKanban size={17} />,                           tooltip: 'Track projects, status & milestones' },
  { id: 'invoices',   label: 'Invoices',    icon: <FileText size={17} />,        section: 'DOCUMENTS',  tooltip: 'Create invoices with GST & flat discount' },
  { id: 'quotations', label: 'Quotations',  icon: <FileQuestion size={17} />,                           tooltip: 'Generate price quotes for clients' },
  { id: 'proposals',  label: 'Proposals',   icon: <FileCheck size={17} />,                              tooltip: 'Build proposals with payment splits' },
  { id: 'support',    label: 'Support',     icon: <Headphones size={17} />,      section: 'POST-LAUNCH', tooltip: 'Post-launch tickets & maintenance tracking' },
  { id: 'help',       label: 'Help & Docs', icon: <BookOpen size={17} />,        section: 'TEAM',       tooltip: 'Team docs, field guide & FAQ' },
];

const pageInfo: Record<Page, { title: string; subtitle: string }> = {
  dashboard:  { title: 'Dashboard',  subtitle: 'SYS://OVERVIEW — LOADED' },
  clients:    { title: 'Clients',    subtitle: 'SYS://CLIENT_REGISTRY — ACTIVE' },
  projects:   { title: 'Projects',   subtitle: 'SYS://PROJECT_TRACKER — RUNNING' },
  invoices:   { title: 'Invoices',   subtitle: 'SYS://BILLING_ENGINE — ONLINE' },
  quotations: { title: 'Quotations', subtitle: 'SYS://QUOTATION_MODULE — READY' },
  proposals:  { title: 'Proposals',  subtitle: 'SYS://PROPOSAL_BUILDER — ACTIVE' },
  support:    { title: 'Support',    subtitle: 'SYS://TICKET_SYSTEM — MONITORING' },
  help:       { title: 'Help & Docs', subtitle: 'SYS://KNOWLEDGE_BASE — ONLINE' },
};

function App() {
  const [page, setPage] = useState<Page>('dashboard');

  const renderPage = () => {
    switch (page) {
      case 'dashboard':  return <Dashboard />;
      case 'clients':    return <Clients />;
      case 'projects':   return <Projects />;
      case 'invoices':   return <Invoices />;
      case 'quotations': return <Quotations />;
      case 'proposals':  return <Proposals />;
      case 'support':    return <Support />;
      case 'help':       return <Help />;
      default:           return <Dashboard />;
    }
  };

  return (
    <div className="app-layout">
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <img
              src="/logo.png"
              alt="IzaXpro"
              style={{ width: 52, height: 52, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.5))' }}
            />
            <div>
              <h1 style={{ letterSpacing: '-0.5px', whiteSpace: 'nowrap', margin: 0, lineHeight: 1.1, fontSize: 24 }}>
                <span style={{ color: 'white' }}>Iza</span><span style={{ color: '#a78bfa' }}>Xpro</span>
              </h1>
              <span style={{ display: 'block', fontSize: 9, color: 'rgba(255,255,255,0.35)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.6px', marginTop: 3 }}>BUSINESS SUITE</span>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <React.Fragment key={item.id}>
              {item.section && <div className="nav-section-label">{item.section}</div>}
              <div className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
                <Tooltip text={item.tooltip} position="right">{item.icon}</Tooltip>
                <span>{item.label}</span>
                {page === item.id && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
              </div>
            </React.Fragment>
          ))}
        </nav>
        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '8px', padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4, color: '#c4b5fd', fontWeight: 800, fontSize: 13, letterSpacing: '-0.3px' }}>
              <img src="/logo.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.6))' }} />
              IzaXpro
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.3px' }}>izaxpro.onrender.com</span>
          </div>
        </div>
      </aside>
      <div className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{pageInfo[page].title}</div>
            <div className="topbar-subtitle">{pageInfo[page].subtitle}</div>
          </div>
          <div className="topbar-right">
            <div style={{ width: 42, height: 42, borderRadius: '10px', background: 'linear-gradient(135deg,#2d1b69,#1a0a3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(124,58,237,0.5)', overflow: 'hidden', padding: 5 }}>
              <img src="/logo.png" alt="IX" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 6px rgba(124,58,237,0.5))' }} />
            </div>
          </div>
        </header>
        <main className="page-content">{renderPage()}</main>
      </div>
    </div>
  );
}


export default App;
