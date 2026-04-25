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
  const { name, code, faculty_name, schedule, credits, max_capacity, syllabus, section, days, start_date, time } = req.body;

  if (!name || !code || !faculty_name || !credits || !max_capacity || !section || !days || !start_date || !time) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const courseExists = await pool.query('SELECT * FROM courses WHERE code = $1', [code]);
    if (courseExists.rows.length > 0) {
      return res.status(400).json({ message: 'Course with this code already exists' });
    }

    const formattedDays = Array.isArray(days) ? days.join(', ') : days;
    const formattedSchedule = schedule || `${formattedDays} | ${time} | Starts: ${start_date}`;

    const newCourse = await pool.query(
      'INSERT INTO courses (name, code, faculty_name, schedule, credits, max_capacity, syllabus, faculty_id, section, days, start_date, "time") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
      [name, code, faculty_name, formattedSchedule, credits, max_capacity, syllabus || '', req.user.id, section, formattedDays, start_date, time]
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
  const { name, code, faculty_name, schedule, credits, max_capacity, syllabus, section, days, start_date, time } = req.body;

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

    const formattedDays = days ? (Array.isArray(days) ? days.join(', ') : days) : course.rows[0].days;
    const formattedSchedule = schedule || (days || start_date || time ? `${formattedDays} | ${time || course.rows[0].time} | Starts: ${start_date || course.rows[0].start_date}` : course.rows[0].schedule);

    const updatedCourse = await pool.query(
      'UPDATE courses SET name = $1, code = $2, faculty_name = $3, schedule = $4, credits = $5, max_capacity = $6, syllabus = $7, section = $8, days = $9, start_date = $10, "time" = $11 WHERE id = $12 RETURNING *',
      [
        name || course.rows[0].name,
        code || course.rows[0].code,
        faculty_name || course.rows[0].faculty_name,
        formattedSchedule,
        credits || course.rows[0].credits,
        max_capacity || course.rows[0].max_capacity,
        syllabus !== undefined ? syllabus : course.rows[0].syllabus,
        section || course.rows[0].section,
        formattedDays,
        start_date || course.rows[0].start_date,
        time || course.rows[0].time,
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

// @route   GET /api/courses/:id/students
// @desc    Get all students enrolled in a course (for grading)
// @access  Private/Admin (Course Faculty only)
router.get('/:id/students', protect, admin, async (req, res) => {
  const { id } = req.params;
  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.rows[0].faculty_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to manage grades for this course' });
    }

    const students = await pool.query(
      `SELECT r.id as registration_id, r.status, r.grade, u.id as student_id, u.name, u.email,
              COALESCE(
                (SELECT json_agg(json_build_object('test_name', tg.test_name, 'grade', tg.grade))
                 FROM test_grades tg WHERE tg.registration_id = r.id),
                '[]'::json
              ) as test_grades
       FROM registrations r 
       JOIN users u ON r.student_id = u.id 
       WHERE r.course_id = $1 AND r.status != 'dropped'`,
      [id]
    );

    res.json(students.rows);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/courses/:id/students/:studentId/grade
// @desc    Update a student's grade for a specific test
// @access  Private/Admin (Course Faculty only)
router.put('/:id/students/:studentId/grade', protect, admin, async (req, res) => {
  const { id, studentId } = req.params;
  const { test_name, grade } = req.body;

  if (!test_name || !grade) {
    return res.status(400).json({ message: 'Please provide test_name and grade' });
  }

  try {
    const course = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
    if (course.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.rows[0].faculty_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to manage grades for this course' });
    }

    // Get registration ID
    const regResult = await pool.query(
      "SELECT id FROM registrations WHERE course_id = $1 AND student_id = $2 AND status != 'dropped'",
      [id, studentId]
    );

    if (regResult.rows.length === 0) {
      return res.status(404).json({ message: 'Registration not found' });
    }
    
    const registrationId = regResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO test_grades (registration_id, test_name, grade)
       VALUES ($1, $2, $3)
       ON CONFLICT (registration_id, test_name)
       DO UPDATE SET grade = EXCLUDED.grade
       RETURNING *`,
      [registrationId, test_name, grade]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
