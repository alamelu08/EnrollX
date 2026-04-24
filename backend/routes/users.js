const express = require('express');
const pool = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone_number, address, designation, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('GET Profile Error:', error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  const { phone_number, address, designation } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET phone_number = $1, address = $2, designation = $3 
       WHERE id = $4 
       RETURNING id, name, email, role, phone_number, address, designation, created_at`,
      [phone_number, address, designation, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT Profile Error:', error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
