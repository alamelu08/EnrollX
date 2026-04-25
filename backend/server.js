const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const registrationsRoutes = require('./routes/registrations');
const attendanceRoutes = require('./routes/attendance');
const usersRoutes = require('./routes/users');

const app = express();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

pool.query('SELECT NOW()')
  .then(res => console.log('✅ DB Connected:', res.rows))
  .catch(err => console.error('❌ DB Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/registrations', registrationsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', usersRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
