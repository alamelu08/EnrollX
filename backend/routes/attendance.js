const express = require('express');
const pool = require('../db');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/attendance/my
// @desc    Get current student's attendance
// @access  Private (student)
router.get('/my', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.name, c.code, a.attended_classes, a.total_classes
       FROM registrations r
       JOIN courses c ON r.course_id = c.id
       LEFT JOIN attendance a ON a.registration_id = r.id
       WHERE r.student_id = $1 AND r.status = 'enrolled'`,
      [req.user.id]
    );

    // Fill defaults for courses with no attendance record yet
    const attendanceData = result.rows.map(row => ({
      course_name: row.name,
      course_code: row.code,
      attended: row.attended_classes || 0,
      total: row.total_classes || 0
    }));

    res.json(attendanceData);
  } catch (error) {
    console.error('GET Attendance Error:', error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/attendance/:registrationId
// @desc    Update attendance (Admin only)
// @access  Private/Admin
router.put('/:registrationId', protect, admin, async (req, res) => {
  const { registrationId } = req.params;
  const { attended_classes, total_classes } = req.body;

  try {
    // Upsert attendance
    const result = await pool.query(
      `INSERT INTO attendance (registration_id, attended_classes, total_classes)
       VALUES ($1, $2, $3)
       ON CONFLICT (registration_id)
       DO UPDATE SET attended_classes = $2, total_classes = $3
       RETURNING *`,
      [registrationId, attended_classes, total_classes]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('PUT Attendance Error:', error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
