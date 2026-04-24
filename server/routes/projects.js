const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');

router.get('/', (req, res) => {
  try {
    const projects = readData('projects');
    const { clientId } = req.query;
    const result = clientId ? projects.filter(p => p.clientId === clientId) : projects;
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', (req, res) => {
  try {
    const projects = readData('projects');
    const project = projects.find(p => p.id === req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(project);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', (req, res) => {
  try {
    const projects = readData('projects');
    const newProject = {
      id: uuidv4(),
      ...req.body,
      progress: 0,
      status: req.body.status || 'Not Started',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.push(newProject);
    writeData('projects', projects);
    res.status(201).json(newProject);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const projects = readData('projects');
    const idx = projects.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Project not found' });
    projects[idx] = { ...projects[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('projects', projects);
    res.json(projects[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    let projects = readData('projects');
    projects = projects.filter(p => p.id !== req.params.id);
    writeData('projects', projects);
    res.json({ message: 'Project deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
