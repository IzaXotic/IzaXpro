# ⚡ TechBiz Suite — Business Document Generator

A comprehensive business management and document generation platform for **YourTech Solutions** — a web development, software, and UI/UX design company.

## 🚀 Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time analytics, revenue charts, project status breakdown |
| **Clients** | Full client onboarding, service selection, status management |
| **Projects** | Project tracking with milestones, progress bars, deadlines |
| **Invoices** | Professional invoice generation with GST, PDF export |
| **Quotations** | Quotations with auto-conversion to invoices |
| **Proposals** | Detailed project proposals with phases, tech stack, investment |
| **Support** | Post-launch support tickets, priority management |

## 🏃 Quick Start

### 1. Install dependencies
```bash
npm run install-deps
```

### 2. Start the application
```bash
npm start
```

This starts:
- **Backend** → http://localhost:5000
- **Frontend** → http://localhost:3000

## 📁 Project Structure
```
Doc Generator/
├── server/              # Node.js/Express backend
│   ├── routes/          # API routes (clients, invoices, etc.)
│   ├── utils/           # Database utilities
│   ├── data/            # JSON data storage + PDFs
│   └── index.js         # Server entry point
├── client/              # React.js frontend (TypeScript)
│   └── src/
│       ├── pages/       # All page components
│       └── services/    # API service layer
└── package.json         # Root package with scripts
```

## 📄 Document Generation
PDF generation requires the server to be running. Click the **Download** (⬇) button on any invoice, quotation, or proposal to generate a professional PDF.

## 🔧 Customization
Update your company details in `server/routes/pdf.js`:
```js
const COMPANY = {
  name: 'YourTech Solutions',
  email: 'hello@yourtech.com',
  phone: '+91 98765 43210',
  // ...
};
```
