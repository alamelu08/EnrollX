const express = require('express');
const pool = require('../db');
const { protect, admin } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/courses
// @desc    Get all courses
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM courses ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST /api/courses
// @desc    Create a course
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  const { name, code, faculty_name, schedule, credits, max_capacity, syllabus } = req.body;

  if (!name || !code || !faculty_name || !schedule || !credits || !max_capacity) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const courseExists = await pool.query('SELECT * FROM courses WHERE code = $1', [code]);
    if (courseExists.rows.length > 0) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }

    const newCourse = await pool.query(
      'INSERT INTO courses (name, code, faculty_name, schedule, credits, max_capacity, syllabus) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, code, faculty_name, schedule, credits, max_capacity, syllabus || '']
    );

    res.status(201).json(newCourse.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/courses/:id
// @desc    Update a course
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;
  const { name, code, faculty_name, schedule, credits, max_capacity, syllabus } = req.body;

  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if code is being updated to an existing code
    if (code && code !== course.rows[0].code) {
        const codeExists = await pool.query('SELECT * FROM courses WHERE code = $1', [code]);
        if (codeExists.rows.length > 0) {
            return res.status(400).json({ message: 'Course with this code already exists' });
        }
    }

    const updatedCourse = await pool.query(
      'UPDATE courses SET name = $1, code = $2, faculty_name = $3, schedule = $4, credits = $5, max_capacity = $6, syllabus = $7 WHERE id = $8 RETURNING *',
      [
        name || course.rows[0].name,
        code || course.rows[0].code,
        faculty_name || course.rows[0].faculty_name,
        schedule || course.rows[0].schedule,
        credits || course.rows[0].credits,
        max_capacity || course.rows[0].max_capacity,
        syllabus !== undefined ? syllabus : course.rows[0].syllabus,
        id
      ]
    );

    res.json(updatedCourse.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/courses/:id
// @desc    Delete a course
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  const { id } = req.params;

  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await pool.query('DELETE FROM courses WHERE id = $1', [id]);

    res.json({ message: 'Course removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
