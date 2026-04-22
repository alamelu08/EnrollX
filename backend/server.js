const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const authRoutes = require('./routes/auth');
const coursesRoutes = require('./routes/courses');
const registrationsRoutes = require('./routes/registrations');

const app = express();

app.use(cors());
app.use(express.json());
pool.query('SELECT NOW()')
  .then(res => console.log('✅ DB Connected:', res.rows))
  .catch(err => console.error('❌ DB Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/registrations', registrationsRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
