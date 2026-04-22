import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    faculty_name: '',
    schedule: '',
    credits: '',
    max_capacity: '',
    syllabus: ''
  });

  const axiosConfig = {
    headers: { Authorization: `Bearer ${user?.token}` }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/courses', axiosConfig);
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', faculty_name: '', schedule: '', credits: '', max_capacity: '', syllabus: '' });
    setEditingCourse(null);
    setShowForm(false);
  };

  const handleEditClick = (course) => {
    setEditingCourse(course.id);
    setFormData({
      name: course.name,
      code: course.code,
      faculty_name: course.faculty_name,
      schedule: course.schedule,
      credits: course.credits,
      max_capacity: course.max_capacity,
      syllabus: course.syllabus || ''
    });
    setShowForm(true);
  };

  const handleDeleteClick = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`http://localhost:5000/api/courses/${id}`, axiosConfig);
        fetchCourses();
      } catch (err) {
        console.error('Error deleting course:', err);
        alert(err.response?.data?.message || 'Error deleting course');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await axios.put(`http://localhost:5000/api/courses/${editingCourse}`, formData, axiosConfig);
      } else {
        await axios.post('http://localhost:5000/api/courses', formData, axiosConfig);
      }
      fetchCourses();
      resetForm();
    } catch (err) {
      console.error('Error saving course:', err);
      alert(err.response?.data?.message || 'Error saving course');
    }
  };

  return (
    <div className="dashboard admin-dashboard">
      <header className="dashboard-header">
        <h1>Admin Dashboard (Faculty)</h1>
        <div className="user-info">
          <span>Welcome, {user?.name}</span>
          <button onClick={handleLogout} className="btn btn-logout">Logout</button>
        </div>
      </header>
      
      <main className="dashboard-content" style={{ display: 'block' }}>
        
        {showForm ? (
          <section className="card" style={{ marginBottom: '2rem' }}>
            <h2>{editingCourse ? 'Edit Course' : 'Add New Course'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Course Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Course Code</label>
                <input type="text" name="code" value={formData.code} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Faculty Name</label>
                <input type="text" name="faculty_name" value={formData.faculty_name} onChange={handleInputChange} required />
              </div>
              <div className="form-group">
                <label>Schedule (Day and Time)</label>
                <input type="text" name="schedule" value={formData.schedule} onChange={handleInputChange} required />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label>Credits</label>
                  <input type="number" name="credits" value={formData.credits} onChange={handleInputChange} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label>Max Capacity</label>
                  <input type="number" name="max_capacity" value={formData.max_capacity} onChange={handleInputChange} required />
                </div>
              </div>
              <div className="form-group">
                <label>Syllabus (Optional URL or Text)</label>
                <textarea name="syllabus" value={formData.syllabus} onChange={handleInputChange} rows="3" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}></textarea>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }}>{editingCourse ? 'Update Course' : 'Save Course'}</button>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#6b7280' }} onClick={resetForm}>Cancel</button>
              </div>
            </form>
          </section>
        ) : (
          <section className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2>Manage Courses</h2>
              <button className="btn" style={{ width: 'auto' }} onClick={() => setShowForm(true)}>Add New Course</button>
            </div>
            
            {courses.length === 0 ? (
              <p>No courses created yet.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem' }}>Code</th>
                      <th style={{ padding: '0.75rem' }}>Name</th>
                      <th style={{ padding: '0.75rem' }}>Faculty</th>
                      <th style={{ padding: '0.75rem' }}>Schedule</th>
                      <th style={{ padding: '0.75rem' }}>Cap</th>
                      <th style={{ padding: '0.75rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courses.map(course => (
                      <tr key={course.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '0.75rem' }}><strong>{course.code}</strong></td>
                        <td style={{ padding: '0.75rem' }}>{course.name}</td>
                        <td style={{ padding: '0.75rem' }}>{course.faculty_name}</td>
                        <td style={{ padding: '0.75rem' }}>{course.schedule}</td>
                        <td style={{ padding: '0.75rem' }}>{course.max_capacity}</td>
                        <td style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem' }}>
                          <button onClick={() => handleEditClick(course)} style={{ padding: '0.25rem 0.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Edit</button>
                          <button onClick={() => handleDeleteClick(course.id)} style={{ padding: '0.25rem 0.5rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
