const express = require('express');
const OKRService = require('../services/okr');
const { requireUser } = require('./middleware/auth');
const logger = require('../utils/log');

const router = express.Router();
const log = logger('api/routes/okr');

// Create a new OKR
router.post('/create-okr', requireUser, async (req, res) => {
  try {
    const okr = await OKRService.create(req.body);
    log.info(`OKR created successfully: ${okr._id}`);
    res.status(201).json({ success: true, okr });
  } catch (error) {
    log.error('Error creating OKR:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Retrieve all OKRs
router.get('/', requireUser, async (req, res) => {
  try {
    const okrs = await OKRService.list();
    log.info(`Retrieved ${okrs.length} OKRs`);
    res.json({ okrs });
  } catch (error) {
    log.error('Error fetching OKRs:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Retrieve a specific OKR by ID
router.get('/:id', requireUser, async (req, res) => {
  try {
    const okr = await OKRService.get(req.params.id);
    if (!okr) {
      log.warn(`OKR not found with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'OKR not found' });
    }
    log.info(`OKR retrieved successfully: ${req.params.id}`);
    res.json({ okr });
  } catch (error) {
    log.error('Error fetching OKR:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Update an existing OKR
router.put('/:id', requireUser, async (req, res) => {
  try {
    console.log('Update OKR request received:', req.body);
    const okr = await OKRService.update(req.params.id, req.body);
    if (!okr) {
      log.warn(`OKR not found for update with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'OKR not found' });
    }
    log.info(`OKR updated successfully: ${req.params.id}`);
    res.json({ success: true, okr });
  } catch (error) {
    log.error('Error updating OKR:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Delete an OKR by ID
router.delete('/:id', requireUser, async (req, res) => {
  try {
    const success = await OKRService.delete(req.params.id);
    if (!success) {
      log.warn(`OKR not found for deletion with ID: ${req.params.id}`);
      return res.status(404).json({ error: 'OKR not found' });
    }
    log.info(`OKR deleted successfully: ${req.params.id}`);
    res.json({ success: true, message: 'OKR deleted successfully' });
  } catch (error) {
    log.error('Error deleting OKR:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

module.exports = router;