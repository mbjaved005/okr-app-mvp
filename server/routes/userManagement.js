const express = require('express');
const UserService = require('../services/user.js');
const { requireUser } = require('./middleware/auth.js');
const logger = require('../utils/log.js');

const router = express.Router();
const log = logger('api/routes/userManagement');

// Middleware to check if the user is an admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

// Get all users
router.get('/', requireUser, async (req, res) => {
  try {
    const users = await UserService.list();
    res.json({ users: users.map(user => user.toJSON()) });
  } catch (error) {
    log.error('Error fetching users:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Update user role
router.put('/:id/role', requireUser, requireAdmin, async (req, res) => {
  const { role } = req.body;
  const { id } = req.params;

  if (!['Admin', 'Manager', 'Employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    const updatedUser = await UserService.update(id, { role });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User role updated successfully' });
  } catch (error) {
    log.error('Error updating user role:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

// Delete user
router.delete('/:id', requireUser, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    // Delete user and handle OKRs
    const success = await UserService.deleteUserAndHandleOKRs(id);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User and associated OKRs updated successfully' });
  } catch (error) {
    log.error('Error deleting user:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

module.exports = router;