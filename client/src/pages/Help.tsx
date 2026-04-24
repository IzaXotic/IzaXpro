import React, { useState } from 'react';
import {
  BookOpen, HelpCircle, ChevronDown, ChevronUp,
  LayoutDashboard, Users, FolderKanban, FileText,
  FileQuestion, FileCheck, Headphones, Zap, Info,
  Calculator, FileDown, Split, AlertTriangle, CheckCircle2
} from 'lucide-react';

/* ─── Types ───────────────────────────────────────────── */
interface FAQItem { q: string; a: React.ReactNode; }
interface DocSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  badge: string;
  color: string;
  overview: string;
  tips: string[];
  fields?: { name: string; desc: string }[];
}

/* ─── Documentation Data ─────────────────────────────── */
const docSections: DocSection[] = [
  {
    id: 'dashboard',
    icon: <LayoutDashboard size={16} />,
    title: 'Dashboard',
    badge: 'SYS://OVERVIEW',
    color: '#7c3aed',
    overview:
      'The Dashboard is your real-time command centre. It aggregates live counts from every module — clients, projects, invoices, quotations, proposals, and support tickets — into stat cards. The Revenue Trend chart tracks monthly invoice totals, and the Project Status pie chart shows the current distribution across all project states.',
    tips: [
      'Stat cards update instantly when you add/edit records in any module.',
      'Revenue chart reads from all saved invoices — keep them up to date for accurate reporting.',
      'Use the Project Status pie to spot bottlenecks (too many "In Progress" with no "Completed").',
      'All data is stored locally in JSON files under server/data/ — no cloud dependency.',
    ],
  },
  {
    id: 'clients',
    icon: <Users size={16} />,
    title: 'Clients',
    badge: 'SYS://CLIENT_REGISTRY',
    color: '#0ea5e9',
    overview:
      'The Client Registry is the foundation of the entire system. Every invoice, project, quotation, and proposal must be linked to a client. Add a client first before creating any documents.',
    tips: [
      'Client Name and Email are required; Company and Phone are optional but recommended for PDFs.',
      'Deleting a client does NOT cascade-delete linked invoices or projects — clean those up manually first.',
      'The search bar filters by name, email, or company in real time.',
    ],
    fields: [
      { name: 'Name', desc: 'Full name of the primary contact person.' },
      { name: 'Company', desc: 'Business / organisation name — appears on all generated PDFs.' },
      { name: 'Email', desc: 'Primary contact email for the client.' },
      { name: 'Phone', desc: 'Optional mobile / landline number.' },
    ],
  },
  {
    id: 'projects',
    icon: <FolderKanban size={16} />,
    title: 'Projects',
    badge: 'SYS://PROJECT_TRACKER',
    color: '#10b981',
    overview:
      'Projects track ongoing engagements. Each project has a status, linked client, start/end dates, and a budget. Milestones can be added per project to track deliverable checkpoints.',
    tips: [
      'Status options: Planning → In Progress → Review → Completed → On Hold.',
      'Budget shown here is informational only; actual billing is via Invoices.',
      'Milestones are shown inside each project — use them to communicate progress to clients.',
      'A project can exist without a linked invoice (e.g. internal/retainer work).',
    ],
    fields: [
      { name: 'Status', desc: 'Current lifecycle stage: Planning / In Progress / Review / Completed / On Hold.' },
      { name: 'Budget (₹)', desc: 'Estimated project budget — for reference, not auto-invoiced.' },
      { name: 'Start / End Date', desc: 'Planned timeline for the project.' },
      { name: 'Client', desc: 'Must be an existing client in the registry.' },
    ],
  },
  {
    id: 'invoices',
    icon: <FileText size={16} />,
    title: 'Invoices',
    badge: 'SYS://BILLING_ENGINE',
    color: '#f59e0b',
    overview:
      'Invoices are the primary billing documents sent to clients after work is delivered. They support line items with per-item rates, a flat-rupee discount, and a percentage GST on the discounted subtotal.',
    tips: [
      'Discount is a flat ₹ amount, NOT a percentage — e.g. "500" means ₹500 off.',
      'GST is applied AFTER the discount: Tax = (Subtotal − Discount) × GST%.',
      'The live calculation panel updates as you type — check it before saving.',
      'Change status to "Paid" once payment is received to keep revenue tracking accurate.',
      'Click "PDF" on any row to generate and download a branded PDF instantly.',
    ],
    fields: [
      { name: 'Line Items', desc: 'Each item has a description, quantity, and unit rate. Subtotal = Σ(qty × rate).' },
      { name: 'Discount (₹)', desc: 'Flat rupee discount applied to the subtotal.' },
      { name: 'GST (%)', desc: 'Tax percentage applied to (Subtotal − Discount).' },
      { name: 'Total', desc: 'Final = Subtotal − Discount + Tax.' },
      { name: 'Status', desc: 'Draft → Sent → Paid → Overdue.' },
    ],
  },
  {
    id: 'quotations',
    icon: <FileQuestion size={16} />,
    title: 'Quotations',
    badge: 'SYS://QUOTATION_MODULE',
    color: '#8b5cf6',
    overview:
      'Quotations are pre-work price estimates shared with prospects. The calculation engine is identical to Invoices. Once a client approves, use "Convert to Invoice" to promote it without re-entering data.',
    tips: [
      '"Convert to Invoice" duplicates all line items, discount, and GST into a new Draft invoice.',
      'Quotation status: Draft → Sent → Accepted → Rejected.',
      'Keep rejected quotations for reference — do not delete them.',
      'A quotation does NOT affect revenue charts; only paid invoices do.',
    ],
    fields: [
      { name: 'Line Items', desc: 'Same structure as invoices — description, qty, rate.' },
      { name: 'Discount (₹)', desc: 'Flat rupee discount.' },
      { name: 'GST (%)', desc: 'Applied after discount.' },
      { name: 'Valid Until', desc: 'Expiry date of the quote — communicate this to clients.' },
    ],
  },
  {
    id: 'proposals',
    icon: <FileCheck size={16} />,
    title: 'Proposals',
    badge: 'SYS://PROPOSAL_BUILDER',
    color: '#ec4899',
    overview:
      'Proposals are detailed pitch/scope documents sent before a project starts. They include a base investment amount, scope of work, timeline, and a payment schedule split across milestones. The payment splits MUST total exactly 100% before the system will save correctly.',
    tips: [
      'Base Amount → apply Discount (₹) → apply GST (%) → Investment Amount (auto-calculated).',
      'Payment Splits: add rows, set milestone labels and percentages — the footer shows a live total.',
      'Footer turns green at 100%, orange if under, red if over — aim for green before submitting.',
      'A proposal PDF exports the full scope, timeline, investment, and payment schedule.',
      'Accepted proposals should be followed up with a formal Invoice.',
    ],
    fields: [
      { name: 'Base Amount (₹)', desc: 'Pre-discount project value.' },
      { name: 'Discount (₹)', desc: 'Flat discount off the base.' },
      { name: 'GST (%)', desc: 'Tax on discounted base.' },
      { name: 'Investment Amount', desc: 'Auto-calculated final. Shown to client.' },
      { name: 'Payment Splits', desc: 'Milestone label + % of Investment Amount. Must sum to 100%.' },
      { name: 'Scope / Timeline', desc: 'Free-text fields for detailed project scope and delivery plan.' },
    ],
  },
  {
    id: 'support',
    icon: <Headphones size={16} />,
    title: 'Support',
    badge: 'SYS://TICKET_SYSTEM',
    color: '#06b6d4',
    overview:
      'Support tracks post-launch maintenance requests and ongoing retainer tasks. Each ticket is linked to a client and a project (optional). Priority and status help your team triage and schedule work.',
    tips: [
      'Priority levels: Low / Medium / High / Critical — set High/Critical for production issues.',
      'Status flow: Open → In Progress → Resolved → Closed.',
      'Link a ticket to both a client AND a project for better traceability.',
      'Resolved tickets still count in the support stats — close them to remove from active queue.',
    ],
    fields: [
      { name: 'Priority', desc: 'Low / Medium / High / Critical.' },
      { name: 'Status', desc: 'Open → In Progress → Resolved → Closed.' },
      { name: 'Client', desc: 'Which client raised or is affected by this issue.' },
      { name: 'Project', desc: 'Optional — link to specific project for traceability.' },
      { name: 'Description', desc: 'Detailed description of the issue or request.' },
    ],
  },
];

/* ─── FAQ Data ───────────────────────────────────────── */
const faqs: FAQItem[] = [
  {
    q: 'How is the invoice total calculated?',
    a: (
      <div>
        <p>The formula is:</p>
        <pre style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#c4b5fd', margin: '8px 0', overflowX: 'auto' }}>
{`Subtotal        = Σ (quantity × unit rate)
Discount Amount = flat ₹ value entered (e.g. ₹500)
Taxable Amount  = Subtotal − Discount
Tax (GST)       = Taxable Amount × (GST% / 100)
Total           = Taxable Amount + Tax`}
        </pre>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          ⚠ Discount is a <strong style={{ color: '#f9fafb' }}>flat rupee amount</strong>, not a percentage. Enter "500" for ₹500 off — not "10" for 10%.
        </p>
      </div>
    ),
  },
  {
    q: 'What is the difference between a Quotation and a Proposal?',
    a: (
      <p>
        A <strong style={{ color: '#8b5cf6' }}>Quotation</strong> is a price estimate — it lists line items with rates and gives the client a cost breakdown. It's typically 1–2 pages.{' '}
        A <strong style={{ color: '#ec4899' }}>Proposal</strong> is a full pitch document — it includes scope of work, timeline, investment amount, and a payment schedule split into milestone-based tranches. Use a Quotation for quick estimates; use a Proposal for formal project sign-off.
      </p>
    ),
  },
  {
    q: 'How do payment splits in Proposals work?',
    a: (
      <div>
        <p>Each row has a <strong>Milestone label</strong> and a <strong>Percentage (%)</strong>. The rupee amount is auto-calculated:</p>
        <pre style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#c4b5fd', margin: '8px 0' }}>
{`Row Amount (₹) = Investment Amount × (Row % / 100)`}
        </pre>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>The footer total must reach <strong style={{ color: '#10b981' }}>100%</strong> (green). Add/remove rows freely with the + Add Split button.</p>
      </div>
    ),
  },
  {
    q: 'How do I generate a PDF for a document?',
    a: (
      <p>
        On the <strong>Invoices</strong>, <strong>Quotations</strong>, and <strong>Proposals</strong> pages, every row in the table has a <strong style={{ color: '#a78bfa' }}>PDF</strong> button (download icon). Clicking it calls the backend Puppeteer renderer and downloads a branded IzaXpro PDF immediately. Make sure the backend server is running on port <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>5001</code>.
      </p>
    ),
  },
  {
    q: 'How do I convert a Quotation into an Invoice?',
    a: (
      <p>
        Open the <strong>Quotations</strong> page, find the quotation in the table, and click the <strong style={{ color: '#a78bfa' }}>Convert to Invoice</strong> button. This copies all line items, discount, and GST into a new Draft invoice linked to the same client. You can then edit, finalise, and send the invoice.
      </p>
    ),
  },
  {
    q: 'Why isn\'t the revenue chart updating?',
    a: (
      <p>
        The revenue chart reads from invoices with a <strong>non-zero total</strong>. Make sure invoices have at least one line item and are saved correctly. The chart groups by the invoice's <strong>date</strong> field (month/year). If you just added an invoice, navigate away from Dashboard and back to refresh the data fetch.
      </p>
    ),
  },
  {
    q: 'Where is all the data stored?',
    a: (
      <p>
        All data lives in flat JSON files at{' '}
        <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd', background: 'rgba(124,58,237,0.1)', padding: '2px 6px', borderRadius: 4 }}>server/data/</code>.
        Files: <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>clients.json</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>projects.json</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>invoices.json</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>quotations.json</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>proposals.json</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>support.json</code>, <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>milestones.json</code>.
        Back these up regularly. For production, migrate to MongoDB or PostgreSQL.
      </p>
    ),
  },
  {
    q: 'Can I run both servers at the same time?',
    a: (
      <div>
        <p>Yes. You need two terminals:</p>
        <pre style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#c4b5fd', margin: '8px 0' }}>
{`# Terminal 1 — Backend API
cd server && node index.js

# Terminal 2 — Frontend React
cd client && npm start`}
        </pre>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>Backend runs on <strong style={{ color: '#f9fafb' }}>:5001</strong>, frontend on <strong style={{ color: '#f9fafb' }}>:3000</strong>. Do NOT use port 5000 on macOS (reserved by AirPlay/ControlCenter).</p>
      </div>
    ),
  },
  {
    q: 'What should I do if the backend returns a 404 or connection refused?',
    a: (
      <div>
        <p>Check these in order:</p>
        <ol style={{ paddingLeft: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.8, fontSize: 13 }}>
          <li>Is the backend server running? Check your terminal for <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>Server running on port 5001</code>.</li>
          <li>Is something else using port 5001? Run <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>lsof -i :5001</code> and kill the conflicting process.</li>
          <li>Is the <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>server/data/</code> folder missing? Create it and add empty JSON arrays <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>[]</code> in each file.</li>
          <li>Check <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>client/src/api.ts</code> — baseURL should be <code style={{ fontFamily: "'JetBrains Mono', monospace", color: '#c4b5fd' }}>http://localhost:5001</code>.</li>
        </ol>
      </div>
    ),
  },
];

/* ─── Component ──────────────────────────────────────── */
const Help: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string | null>('dashboard');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'docs' | 'faq'>('docs');

  const section = docSections.find(s => s.id === activeSection);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Header Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0.05) 100%)',
        border: '1px solid rgba(124,58,237,0.25)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={20} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: '-0.4px', marginBottom: 3 }}>IzaXpro — Team Knowledge Base</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.4px' }}>
            SYS://DOCS_v1.0 · MODULE_COUNT: {docSections.length} · FAQ_COUNT: {faqs.length}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(['docs', 'faq'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${activeTab === tab ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 7,
                padding: '7px 16px',
                color: activeTab === tab ? '#c4b5fd' : 'rgba(255,255,255,0.5)',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.5px',
                cursor: 'pointer',
                textTransform: 'uppercase',
                transition: 'all 0.15s',
              }}
            >
              {tab === 'docs' ? '📖 Docs' : '❓ FAQ'}
            </button>
          ))}
        </div>
      </div>

      {/* ── DOCS TAB ── */}
      {activeTab === 'docs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 16, alignItems: 'start' }}>

          {/* Sidebar nav */}
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', position: 'sticky', top: 16 }}>
            {docSections.map(s => (
              <div
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '11px 16px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--border)',
                  background: activeSection === s.id ? `rgba(124,58,237,0.12)` : 'transparent',
                  borderLeft: activeSection === s.id ? `3px solid ${s.color}` : '3px solid transparent',
                  transition: 'all 0.15s',
                  color: activeSection === s.id ? '#f9fafb' : 'rgba(255,255,255,0.5)',
                  fontSize: 13,
                  fontWeight: activeSection === s.id ? 700 : 400,
                }}
              >
                <span style={{ color: activeSection === s.id ? s.color : 'rgba(255,255,255,0.3)' }}>{s.icon}</span>
                {s.title}
              </div>
            ))}
          </div>

          {/* Content panel */}
          {section && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Section header */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: `${section.color}22`, border: `1px solid ${section.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: section.color }}>
                    {section.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.3px' }}>{section.title}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: section.color, letterSpacing: '0.4px' }}>{section.badge}</div>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, fontSize: 14, margin: 0 }}>
                  {section.overview}
                </p>
              </div>

              {/* Tips */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7, color: '#a78bfa' }}>
                  <Zap size={14} /> Quick Tips
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {section.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fields */}
              {section.fields && (
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 24px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7, color: '#a78bfa' }}>
                    <Info size={14} /> Field Reference
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.5px', width: 160 }}>FIELD</th>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 600, letterSpacing: '0.5px' }}>DESCRIPTION</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.fields.map((f, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: section.color, fontWeight: 600 }}>{f.name}</td>
                          <td style={{ padding: '10px 12px', fontSize: 13, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>{f.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Warning for Proposals */}
              {section.id === 'proposals' && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fbbf24', marginBottom: 4 }}>Payment Split Validation</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                      Payment splits must total exactly 100%. The footer indicator turns green when valid. Always verify before generating a proposal PDF — the PDF will reflect whatever percentages are saved.
                    </div>
                  </div>
                </div>
              )}

              {/* Warning for Invoices */}
              {section.id === 'invoices' && (
                <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: '#fbbf24', marginBottom: 4 }}>Discount is Flat ₹, Not %</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                      Enter the discount as an absolute rupee value (e.g. 500 = ₹500). Do not enter a percentage. This applies to both Invoices and Quotations.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── FAQ TAB ── */}
      {activeTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 4, letterSpacing: '0.4px' }}>
            SYS://FAQ — {faqs.length} ENTRIES — CLICK TO EXPAND
          </div>
          {faqs.map((faq, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-card)',
                border: `1px solid ${openFaq === i ? 'rgba(124,58,237,0.35)' : 'var(--border)'}`,
                borderRadius: 10,
                overflow: 'hidden',
                transition: 'border-color 0.15s',
              }}
            >
              <div
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '15px 20px',
                  cursor: 'pointer',
                  background: openFaq === i ? 'rgba(124,58,237,0.08)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: openFaq === i ? 'rgba(124,58,237,0.3)' : 'rgba(255,255,255,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                    color: openFaq === i ? '#c4b5fd' : 'rgba(255,255,255,0.3)',
                    fontWeight: 700, flexShrink: 0,
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <span style={{ fontWeight: 600, fontSize: 14, color: openFaq === i ? '#f9fafb' : 'rgba(255,255,255,0.75)' }}>
                    {faq.q}
                  </span>
                </div>
                <span style={{ color: '#7c3aed', flexShrink: 0 }}>
                  {openFaq === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </div>
              {openFaq === i && (
                <div style={{ padding: '4px 20px 18px 56px', color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.7 }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default Help;
