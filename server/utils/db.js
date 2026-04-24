const path = require('path');
const fs = require('fs-extra');
const mongoose = require('mongoose');

const dataDir = path.join(__dirname, '../data');

const readData = (file) => fs.readJsonSync(path.join(dataDir, `${file}.json`), { throws: false }) || [];
const writeData = (file, data) => fs.writeJsonSync(path.join(dataDir, `${file}.json`), data, { spaces: 2 });

// Always use MongoDB — never fall back to JSON files
const useMongo = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new Error('MongoDB not connected. Check MONGODB_URI environment variable.');
  }
  return true;
};

// Generate a sequential document number: PREFIX-YEAR-0001
const generateNumber = (prefix, list) => {
  const year = new Date().getFullYear();
  const count = list.filter(i => i.number && i.number.startsWith(`${prefix}-${year}`)).length + 1;
  return `${prefix}-${year}-${String(count).padStart(4, '0')}`;
};

module.exports = { readData, writeData, useMongo, generateNumber };
