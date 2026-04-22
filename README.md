
# University Course Registration System
EnrollX

An intuitive and scalable course registration platform built to modernize university enrollment systems. It features a clean UI, efficient backend processing, and role-based access control for students and administrators. Designed as a real-world academic management solution.


## Database Setup

1. Create a PostgreSQL database named `enrollx` (or your preferred name).
2. Run the SQL script found in `db_init/init.sql` to create the required `users` table.

## Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the database credentials and JWT secret:
   ```bash
   cp .env.example .env
   ```
4. Start the backend server:
   ```bash
   npm start
   # or for development (if nodemon is installed globally)
   nodemon server.js
   ```
   The backend will run on `http://localhost:5000`.

## Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at `http://localhost:5173`.


