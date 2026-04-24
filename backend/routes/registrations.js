const express = require('express');
const pool = require('../db');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/registrations/my
// @desc    Get current student's registrations
// @access  Private (student)
router.get('/my', protect, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id AS registration_id, r.status, r.grade, r.created_at,
              c.id, c.name, c.code, c.faculty_name, c.schedule, c.credits, c.max_capacity, c.enrolled,
              COALESCE(
                (SELECT json_agg(json_build_object('test_name', tg.test_name, 'grade', tg.grade))
                 FROM test_grades tg WHERE tg.registration_id = r.id),
                '[]'::json
              ) as test_grades
       FROM registrations r
       JOIN courses c ON r.course_id = c.id
       WHERE r.student_id = $1
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/registrations/:courseId
// @desc    Enroll in a course (or join waitlist if full)
// @access  Private (student)
router.post('/:courseId', protect, async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  try {
    // Check course exists
    const courseResult = await pool.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    const course = courseResult.rows[0];

    // Check already registered
    const existing = await pool.query(
      "SELECT * FROM registrations WHERE student_id = $1 AND course_id = $2 AND status != 'dropped'",
      [studentId, courseId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'You are already enrolled or waitlisted in this course' });
    }

    // Schedule conflict check – same schedule slot already enrolled
    const conflictCheck = await pool.query(
      `SELECT c.name, c.schedule FROM registrations r
       JOIN courses c ON r.course_id = c.id
       WHERE r.student_id = $1 AND r.status = 'enrolled' AND c.schedule = $2`,
      [studentId, course.schedule]
    );
    if (conflictCheck.rows.length > 0) {
      return res.status(400).json({
        message: `Schedule conflict with "${conflictCheck.rows[0].name}" (${conflictCheck.rows[0].schedule})`
      });
    }

    // Determine status: enrolled or waitlisted
    const status = course.enrolled < course.max_capacity ? 'enrolled' : 'waitlisted';

    // Insert registration
    const newReg = await pool.query(
      'INSERT INTO registrations (student_id, course_id, status) VALUES ($1, $2, $3) RETURNING *',
      [studentId, courseId, status]
    );

    // Increment enrolled count if actually enrolled
    if (status === 'enrolled') {
      await pool.query('UPDATE courses SET enrolled = enrolled + 1 WHERE id = $1', [courseId]);
    }

    res.status(201).json({
      registration: newReg.rows[0],
      message: status === 'enrolled'
        ? 'Successfully enrolled in course!'
        : 'Course is full. You have been added to the waitlist.'
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/registrations/:courseId
// @desc    Drop a course
// @access  Private (student)
router.delete('/:courseId', protect, async (req, res) => {
  const { courseId } = req.params;
  const studentId = req.user.id;

  try {
    // Find registration
    const regResult = await pool.query(
      "SELECT * FROM registrations WHERE student_id = $1 AND course_id = $2 AND status != 'dropped'",
      [studentId, courseId]
    );
    if (regResult.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    const reg = regResult.rows[0];

    // Mark as dropped
    await pool.query(
      "UPDATE registrations SET status = 'dropped' WHERE id = $1",
      [reg.id]
    );

    // If they were enrolled (not just waitlisted), decrement count and promote first waitlisted student
    if (reg.status === 'enrolled') {
      await pool.query('UPDATE courses SET enrolled = GREATEST(enrolled - 1, 0) WHERE id = $1', [courseId]);

      // Promote first waitlisted student
      const waitlisted = await pool.query(
        "SELECT * FROM registrations WHERE course_id = $1 AND status = 'waitlisted' ORDER BY created_at ASC LIMIT 1",
        [courseId]
      );
      if (waitlisted.rows.length > 0) {
        await pool.query(
          "UPDATE registrations SET status = 'enrolled' WHERE id = $1",
          [waitlisted.rows[0].id]
        );
        await pool.query('UPDATE courses SET enrolled = enrolled + 1 WHERE id = $1', [courseId]);
      }
    }

    res.json({ message: 'Successfully dropped the course' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
