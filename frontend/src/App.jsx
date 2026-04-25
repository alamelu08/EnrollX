import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Attendance from './pages/Attendance';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/profile" 
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <Profile theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/attendance" 
            element={
              <ProtectedRoute allowedRoles={['student', 'admin']}>
                <Attendance theme={theme} toggleTheme={toggleTheme} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
