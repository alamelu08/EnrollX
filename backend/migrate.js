const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  try {
    console.log('Running migrations...');
    await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS faculty_id INTEGER REFERENCES users(id);');
    console.log('Added faculty_id to courses.');
    await pool.query('ALTER TABLE registrations ADD COLUMN IF NOT EXISTS grade VARCHAR(5);');
    console.log('Added grade to registrations.');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS test_grades (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
        test_name VARCHAR(100) NOT NULL,
        grade VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (registration_id, test_name)
      );
    `);
    await pool.query('CREATE INDEX IF NOT EXISTS idx_test_grades_registration ON test_grades(registration_id);');
    console.log('Created test_grades table and index.');
    
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS designation VARCHAR(100);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number VARCHAR(50);');
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS department VARCHAR(100);');
    console.log('Added profile fields, roll_number, and department to users.');

    await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS section VARCHAR(10);');
    await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS days VARCHAR(100);');
    await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS start_date DATE;');
    await pool.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS time VARCHAR(50);');
    console.log('Added section, days, start_date, and time to courses.');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
        attended_classes INTEGER DEFAULT 0,
        total_classes INTEGER DEFAULT 0,
        UNIQUE(registration_id)
      );
    `);
    console.log('Attendance table ensured.');

    console.log('Migrations complete.');
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await pool.end();
  }
}

migrate();
