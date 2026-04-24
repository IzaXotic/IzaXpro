const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs-extra');
const mongoose = require('mongoose');
const { useMongo } = require('../utils/db');

const CONFIG_PATH = path.join(__dirname, '../data/config.json');

// Config is stored as a single document in MongoDB; fields mirror config.json keys.
const ConfigModel = mongoose.models.Config ||
  mongoose.model('Config', new mongoose.Schema({ data: mongoose.Schema.Types.Mixed }, { timestamps: true }));

const readConfig = () => fs.readJsonSync(CONFIG_PATH);
const writeConfig = (data) => fs.writeJsonSync(CONFIG_PATH, data, { spaces: 2 });

// GET full config
router.get('/', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await ConfigModel.findOne().lean();
      return res.json(doc ? doc.data : readConfig());
    }
    res.json(readConfig());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update a single config key (e.g. PATCH /api/config/services)
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { values } = req.body; // array of strings
    if (!Array.isArray(values)) return res.status(400).json({ error: 'values must be an array' });

    if (useMongo()) {
      let doc = await ConfigModel.findOne();
      if (!doc) {
        const defaults = readConfig();
        doc = await ConfigModel.create({ data: defaults });
      }
      doc.data = { ...doc.data, [key]: values };
      doc.markModified('data');
      await doc.save();
      return res.json(doc.data);
    }
    const config = readConfig();
    config[key] = values;
    writeConfig(config);
    res.json(config);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
