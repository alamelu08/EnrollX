const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function test() {
  try {
    const res = await pool.query(
      "UPDATE users SET roll_number = $1 WHERE email = (SELECT email FROM users LIMIT 1) RETURNING *",
      ['TEST-ROLL-123']
    );
    console.log('Update result:', res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

test();
