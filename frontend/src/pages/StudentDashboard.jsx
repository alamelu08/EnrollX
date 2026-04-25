import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const StudentDashboard = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const [courses, setCourses] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // courseId being acted on
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message }
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'enrolled'

  const config = { headers: { Authorization: `Bearer ${user?.token}` } };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchCourses = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/courses`, config);
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching courses:', err);
    }
  }, []);

  const fetchMyRegistrations = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/registrations/my`, config);
      setMyRegistrations(res.data);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCourses(), fetchMyRegistrations()]);
      setLoading(false);
    };
    init();
  }, [fetchCourses, fetchMyRegistrations]);

  const handleEnroll = async (courseId) => {
    setActionLoading(courseId);
    try {
      const res = await axios.post(`${API}/registrations/${courseId}`, {}, config);
      showToast('success', res.data.message);
      await Promise.all([fetchCourses(), fetchMyRegistrations()]);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Enrollment failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrop = async (courseId) => {
    if (!window.confirm('Are you sure you want to drop this course?')) return;
    setActionLoading(courseId);
    try {
      const res = await axios.delete(`${API}/registrations/${courseId}`, config);
      showToast('success', res.data.message);
      await Promise.all([fetchCourses(), fetchMyRegistrations()]);
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Failed to drop course');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Map courseId → registration status for quick lookup
  const registrationMap = myRegistrations.reduce((acc, r) => {
    if (r.status !== 'dropped') acc[r.id] = r.status;
    return acc;
  }, {});

  const enrolledCourses = myRegistrations.filter(r => r.status === 'enrolled');
  const waitlistedCourses = myRegistrations.filter(r => r.status === 'waitlisted');

  const getAvailableSeats = (course) => course.max_capacity - course.enrolled;
  const isFull = (course) => getAvailableSeats(course) <= 0;

  return (
    <div className="dashboard">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '1rem 1.5rem', borderRadius: '10px', fontWeight: '600',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'success' ? '✅ ' : '❌ '}{toast.message}
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div className="user-info">
          <button onClick={toggleTheme} className="btn" style={{ width: 'auto', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <span>Welcome, {user?.name}</span>
          <button onClick={() => navigate('/attendance')} className="btn" style={{ width: 'auto', background: '#10b981' }}>Attendance</button>
          <button onClick={() => navigate('/profile')} className="btn" style={{ width: 'auto', background: '#3b82f6' }}>My Profile</button>
          <button onClick={handleLogout} className="btn btn-logout">Logout</button>
        </div>
      </header>

      {/* Stats Bar */}
      <div style={{ display: 'flex', gap: '1rem', padding: '1.5rem 2rem 0', flexWrap: 'wrap' }}>
        {[
          { label: 'Enrolled', value: enrolledCourses.length, color: '#10b981' },
          { label: 'Waitlisted', value: waitlistedCourses.length, color: '#f59e0b' },
          { label: 'Available Courses', value: courses.length, color: '#6366f1' },
        ].map(stat => (
          <div key={stat.label} style={{
            background: '#fff', border: `2px solid ${stat.color}20`,
            borderRadius: '12px', padding: '1rem 1.5rem', minWidth: '140px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', fontWeight: '500' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <main className="dashboard-content" style={{ display: 'block' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
          {['browse', 'enrolled'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '0.75rem 1.5rem', border: 'none', cursor: 'pointer',
              fontWeight: '600', fontSize: '0.95rem', borderRadius: '8px 8px 0 0',
              background: activeTab === tab ? '#6366f1' : 'transparent',
              color: activeTab === tab ? '#fff' : '#6b7280',
              borderBottom: activeTab === tab ? '2px solid #6366f1' : 'none',
              transition: 'all 0.2s'
            }}>
              {tab === 'browse' ? '🔍 Browse Courses' : `📚 My Courses (${enrolledCourses.length + waitlistedCourses.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading courses...
          </div>
        ) : activeTab === 'browse' ? (
          /* ── Browse Tab ── */
          <section className="card">
            <h2>Available Courses</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              Browse and enroll in courses. Full courses will add you to the waitlist automatically.
            </p>
            {courses.length === 0 ? (
              <p>No courses are currently available.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {courses.map(course => {
                  const regStatus = registrationMap[course.id];
                  const seats = getAvailableSeats(course);
                  const full = isFull(course);
                  const isActing = actionLoading === course.id;

                  return (
                    <div key={course.id} style={{
                      border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem',
                      display: 'flex', flexDirection: 'column', background: '#fafafa',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      transition: 'box-shadow 0.2s',
                    }}>
                      {/* Course Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111827', lineHeight: 1.3 }}>{course.name}</h3>
                        <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', whiteSpace: 'nowrap', marginLeft: '0.5rem' }}>
                          {course.code}
                        </span>
                      </div>

                      {/* Details */}
                      <div style={{ flex: 1, fontSize: '0.875rem', color: '#374151' }}>
                        <p style={{ margin: '0.35rem 0' }}>👨‍🏫 <strong>Faculty:</strong> {course.faculty_name}</p>
                        <p style={{ margin: '0.35rem 0' }}>🗓️ <strong>Schedule:</strong> {course.schedule}</p>
                        <p style={{ margin: '0.35rem 0' }}>📊 <strong>Credits:</strong> {course.credits}</p>
                        <p style={{ margin: '0.35rem 0' }}>
                          💺 <strong>Seats:</strong>{' '}
                          <span style={{ color: full ? '#ef4444' : '#10b981', fontWeight: '700' }}>
                            {full ? 'Full' : `${seats} / ${course.max_capacity} available`}
                          </span>
                        </p>
                      </div>

                      {/* Status Badge */}
                      {regStatus && (
                        <div style={{
                          marginTop: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', textAlign: 'center',
                          background: regStatus === 'enrolled' ? '#d1fae5' : '#fef3c7',
                          color: regStatus === 'enrolled' ? '#065f46' : '#92400e'
                        }}>
                          {regStatus === 'enrolled' ? '✅ Enrolled' : '⏳ Waitlisted'}
                        </div>
                      )}

                      {/* Action Button */}
                      {regStatus ? (
                        <button
                          className="btn"
                          onClick={() => handleDrop(course.id)}
                          disabled={isActing}
                          style={{ marginTop: '0.75rem', width: '100%', background: '#ef4444', opacity: isActing ? 0.7 : 1 }}
                        >
                          {isActing ? 'Dropping...' : 'Drop Course'}
                        </button>
                      ) : (
                        <button
                          className="btn"
                          onClick={() => handleEnroll(course.id)}
                          disabled={isActing}
                          style={{ marginTop: '0.75rem', width: '100%', background: full ? '#f59e0b' : undefined, opacity: isActing ? 0.7 : 1 }}
                        >
                          {isActing ? 'Processing...' : full ? '⏳ Join Waitlist' : '✅ Enroll'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          /* ── My Courses Tab ── */
          <section className="card">
            <h2>My Courses</h2>

            {enrolledCourses.length === 0 && waitlistedCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                <p>You are not enrolled in any courses yet.</p>
                <button className="btn" onClick={() => setActiveTab('browse')} style={{ marginTop: '1rem' }}>Browse Courses</button>
              </div>
            ) : (
              <>
                {enrolledCourses.length > 0 && (
                  <>
                    <h3 style={{ color: '#10b981', marginBottom: '1rem' }}>✅ Enrolled ({enrolledCourses.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                      {enrolledCourses.map(reg => (
                        <div key={reg.registration_id} style={{ border: '2px solid #d1fae5', borderRadius: '12px', padding: '1.25rem', background: '#f0fdf4' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h4 style={{ margin: 0, color: '#111827' }}>{reg.name}</h4>
                            <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{reg.code}</span>
                          </div>
                          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#374151' }}>👨‍🏫 {reg.faculty_name}</p>
                          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#374151' }}>🗓️ {reg.schedule}</p>
                          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#374151' }}>📊 {reg.credits} Credits</p>
                          <div style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#374151' }}>
                            <span style={{ fontWeight: 'bold' }}>🎓 Grades: </span>
                            {(!reg.test_grades || reg.test_grades.length === 0) ? (
                              <span style={{ color: '#9ca3af', fontWeight: 'bold' }}>Not Graded Yet</span>
                            ) : (
                              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                                {reg.test_grades.map((tg, idx) => (
                                  <span key={idx} style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                    {tg.test_name}: {tg.grade}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn"
                            onClick={() => handleDrop(reg.id)}
                            disabled={actionLoading === reg.id}
                            style={{ marginTop: '0.75rem', width: '100%', background: '#ef4444', fontSize: '0.85rem' }}
                          >
                            {actionLoading === reg.id ? 'Dropping...' : 'Drop Course'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {waitlistedCourses.length > 0 && (
                  <>
                    <h3 style={{ color: '#f59e0b', marginBottom: '1rem' }}>⏳ Waitlisted ({waitlistedCourses.length})</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                      {waitlistedCourses.map(reg => (
                        <div key={reg.registration_id} style={{ border: '2px solid #fde68a', borderRadius: '12px', padding: '1.25rem', background: '#fffbeb' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <h4 style={{ margin: 0, color: '#111827' }}>{reg.name}</h4>
                            <span style={{ background: '#e0e7ff', color: '#4f46e5', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700' }}>{reg.code}</span>
                          </div>
                          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#374151' }}>👨‍🏫 {reg.faculty_name}</p>
                          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#374151' }}>🗓️ {reg.schedule}</p>
                          <p style={{ margin: '0.3rem 0', fontSize: '0.85rem', color: '#92400e' }}>⚠️ You'll be auto-enrolled when a seat opens</p>
                          <button
                            className="btn"
                            onClick={() => handleDrop(reg.id)}
                            disabled={actionLoading === reg.id}
                            style={{ marginTop: '0.75rem', width: '100%', background: '#6b7280', fontSize: '0.85rem' }}
                          >
                            {actionLoading === reg.id ? 'Removing...' : 'Leave Waitlist'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
