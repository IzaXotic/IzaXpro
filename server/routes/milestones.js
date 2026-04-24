const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { readData, writeData } = require('../utils/db');
const mongoose = require('mongoose');
const { Milestone, Project } = require('../models');

const useMongo = () => mongoose.connection.readyState === 1;

router.get('/', async (req, res) => {
  try {
    const { projectId } = req.query;
    if (useMongo()) {
      const query = projectId ? { projectId } : {};
      return res.json(await Milestone.find(query).lean());
    }
    const milestones = readData('milestones');
    res.json(projectId ? milestones.filter(m => m.projectId === projectId) : milestones);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const milestone = { id: uuidv4(), status: 'Not Started', completion: 0, ...req.body };
    if (useMongo()) {
      const doc = await Milestone.create(milestone);
      return res.status(201).json(doc);
    }
    const milestones = readData('milestones');
    milestones.push({ ...milestone, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    writeData('milestones', milestones);
    res.status(201).json(milestone);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      const doc = await Milestone.findOneAndUpdate({ id: req.params.id }, req.body, { new: true }).lean();
      if (!doc) return res.status(404).json({ error: 'Milestone not found' });
      // Auto-update project progress
      if (doc.projectId) {
        const projectMilestones = await Milestone.find({ projectId: doc.projectId }).lean();
        const avg = projectMilestones.reduce((s, m) => s + (m.completion || 0), 0) / (projectMilestones.length || 1);
        const status = avg >= 100 ? 'Completed' : avg > 0 ? 'In Progress' : undefined;
        await Project.findOneAndUpdate({ id: doc.projectId }, { progress: Math.round(avg), ...(status ? { status } : {}) });
      }
      return res.json(doc);
    }
    const milestones = readData('milestones');
    const idx = milestones.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Milestone not found' });
    milestones[idx] = { ...milestones[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('milestones', milestones);
    const projectId = milestones[idx].projectId;
    if (projectId) {
      const projectMilestones = milestones.filter(m => m.projectId === projectId);
      const avgCompletion = projectMilestones.reduce((s, m) => s + (m.completion || 0), 0) / (projectMilestones.length || 1);
      const projects = readData('projects');
      const pIdx = projects.findIndex(p => p.id === projectId);
      if (pIdx !== -1) {
        projects[pIdx].progress = Math.round(avgCompletion);
        if (avgCompletion >= 100) projects[pIdx].status = 'Completed';
        else if (avgCompletion > 0) projects[pIdx].status = 'In Progress';
        writeData('projects', projects);
      }
    }
    res.json(milestones[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    if (useMongo()) {
      await Milestone.deleteOne({ id: req.params.id });
      return res.json({ message: 'Milestone deleted' });
    }
    const milestones = readData('milestones').filter(m => m.id !== req.params.id);
    writeData('milestones', milestones);
    res.json({ message: 'Milestone deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

router.post('/', (req, res) => {
  try {
    const milestones = readData('milestones');
    const milestone = {
      id: uuidv4(),
      ...req.body,
      status: req.body.status || 'Not Started',
      completion: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    milestones.push(milestone);
    writeData('milestones', milestones);
    res.status(201).json(milestone);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', (req, res) => {
  try {
    const milestones = readData('milestones');
    const idx = milestones.findIndex(m => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Milestone not found' });
    milestones[idx] = { ...milestones[idx], ...req.body, updatedAt: new Date().toISOString() };
    writeData('milestones', milestones);

    // Auto-update project progress
    const projectId = milestones[idx].projectId;
    if (projectId) {
      const projectMilestones = milestones.filter(m => m.projectId === projectId);
      const avgCompletion = projectMilestones.reduce((s, m) => s + (m.completion || 0), 0) / (projectMilestones.length || 1);
      const projects = readData('projects');
      const pIdx = projects.findIndex(p => p.id === projectId);
      if (pIdx !== -1) {
        projects[pIdx].progress = Math.round(avgCompletion);
        if (avgCompletion >= 100) projects[pIdx].status = 'Completed';
        else if (avgCompletion > 0) projects[pIdx].status = 'In Progress';
        writeData('projects', projects);
      }
    }
    res.json(milestones[idx]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', (req, res) => {
  try {
    let milestones = readData('milestones');
    milestones = milestones.filter(m => m.id !== req.params.id);
    writeData('milestones', milestones);
    res.json({ message: 'Milestone deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
