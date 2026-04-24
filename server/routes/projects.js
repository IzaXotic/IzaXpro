const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData, useMongo } = require('../utils/db');
const { Project } = require('../models');

router.get('/', async (req, res) => {
  try {
    const { clientId } = req.query;
    if (useMongo()) {
      const query = clientId ? { clientId } : {};
      return res.json(await Project.find(query).lean());
    }
    const projects = readData('projects');
    res.json(clientId ? projects.filter(p => p.clientId === clientId) : projects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await Project.findOne({ id: req.params.id }).lean();
      if (!doc) return res.status(404).json({ error: 'Project not found' });
      return res.json(doc);
    }
    const project = readData('projects').find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const newProject = { id: uuidv4(), progress: 0, status: 'Not Started', ...req.body };
    if (useMongo()) {
      const doc = await Project.create(newProject);
      return res.status(201).json(doc);
    }
    const projects = readData('projects');
    projects.push(newProject);
    writeData('projects', projects);
    res.status(201).json(newProject);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await Project.findOneAndUpdate({ id: req.params.id }, req.body, { returnDocument: 'after' }).lean();
      if (!doc) return res.status(404).json({ error: 'Project not found' });
      return res.json(doc);
    }
    const projects = readData('projects');
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });
    projects[idx] = { ...projects[idx], ...req.body };
    writeData('projects', projects);
    res.json(projects[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      await Project.deleteOne({ id: req.params.id });
      return res.json({ message: 'Project deleted' });
    }
    const projects = readData('projects').filter(p => p.id !== req.params.id);
    writeData('projects', projects);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
