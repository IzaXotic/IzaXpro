const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs-extra');
const connectDB = require('./db');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB if URI is set (non-blocking, falls back to JSON)
connectDB();

// Ensure data directory exists
fs.ensureDirSync(path.join(__dirname, 'data'));
fs.ensureDirSync(path.join(__dirname, 'data/pdfs'));

// Initialize JSON data files
const dataFiles = ['clients', 'projects', 'invoices', 'quotations', 'proposals', 'milestones', 'support'];
dataFiles.forEach(file => {
  const filePath = path.join(__dirname, `data/${file}.json`);
  if (!fs.existsSync(filePath)) fs.writeJsonSync(filePath, []);
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL
    ? [process.env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:3001']
    : true,
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/pdfs', express.static(path.join(__dirname, 'data/pdfs')));

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Routes
app.use('/api/clients',    require('./routes/clients'));
app.use('/api/projects',   require('./routes/projects'));
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/quotations', require('./routes/quotations'));
app.use('/api/proposals',  require('./routes/proposals'));
app.use('/api/milestones', require('./routes/milestones'));
app.use('/api/support',    require('./routes/support'));
app.use('/api/dashboard',  require('./routes/dashboard'));
app.use('/api/pdf',        require('./routes/pdf'));
app.use('/api/config',     require('./routes/config'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Catch-all: serve React app for any non-API route (in production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
