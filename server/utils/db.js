const path = require('path');
const fs = require('fs-extra');

const dataDir = path.join(__dirname, '../data');

const readData = (file) => fs.readJsonSync(path.join(dataDir, `${file}.json`), { throws: false }) || [];
const writeData = (file, data) => fs.writeJsonSync(path.join(dataDir, `${file}.json`), data, { spaces: 2 });

module.exports = { readData, writeData };
