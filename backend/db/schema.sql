-- =========================================================
-- EnrollX – Database Schema
-- Run once against the `enrollx` PostgreSQL database
-- =========================================================

-- ── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100)        NOT NULL,
  email       VARCHAR(150) UNIQUE NOT NULL,
  password    VARCHAR(255)        NOT NULL,
  role        VARCHAR(20)         NOT NULL CHECK (role IN ('student', 'admin')),
  phone_number VARCHAR(20),
  address     TEXT,
  designation VARCHAR(100),
  created_at  TIMESTAMP           DEFAULT NOW()
);

-- ── Courses ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(150)  NOT NULL,
  code          VARCHAR(20)   UNIQUE NOT NULL,
  faculty_name  VARCHAR(100)  NOT NULL,
  schedule      VARCHAR(100)  NOT NULL,   -- e.g. "Mon/Wed 10:00-11:30"
  credits       INTEGER       NOT NULL,
  max_capacity  INTEGER       NOT NULL,
  enrolled      INTEGER       NOT NULL DEFAULT 0,
  syllabus      TEXT          DEFAULT '',
  faculty_id    INTEGER       REFERENCES users(id),
  created_at    TIMESTAMP     DEFAULT NOW()
);

-- ── Registrations ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id          SERIAL PRIMARY KEY,
  student_id  INTEGER REFERENCES users(id)   ON DELETE CASCADE,
  course_id   INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'enrolled'
                CHECK (status IN ('enrolled', 'waitlisted', 'dropped')),
  grade       VARCHAR(5),
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE (student_id, course_id)
);

-- ── Indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_registrations_course  ON registrations(course_id);

-- ── Test Grades ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS test_grades (
  id SERIAL PRIMARY KEY,
  registration_id INTEGER REFERENCES registrations(id) ON DELETE CASCADE,
  test_name VARCHAR(100) NOT NULL,
  grade VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (registration_id, test_name)
);

CREATE INDEX IF NOT EXISTS idx_test_grades_registration ON test_grades(registration_id);
