import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Attendance = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${user?.token}` }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/attendance/my', axiosConfig);
      setAttendance(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching attendance:', err);
      setLoading(false);
    }
  };

  const calculateTotalPercentage = () => {
    if (attendance.length === 0) return 0;
    const totalAttended = attendance.reduce((sum, item) => sum + item.attended, 0);
    const totalClasses = attendance.reduce((sum, item) => sum + item.total, 0);
    return totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);
  };

  const getStatus = (percent) => {
    if (percent >= 75) return { label: 'Eligible', color: '#126052', bg: '#d6f3ed', note: 'You meet the minimum attendance requirement.' };
    if (percent >= 65) return { label: 'Warning', color: '#8f6207', bg: '#fff2d5', note: 'Attend upcoming classes to avoid shortage.' };
    return { label: 'Shortage', color: '#9f2030', bg: '#fde1e5', note: 'Attendance is below requirement; contact your department.' };
  };

  const totalPercent = calculateTotalPercentage();
  const status = getStatus(totalPercent);

  return (
    <div className="dashboard attendance-page">
      <header className="dashboard-header">
        <h1>Attendance Portal</h1>
        <div className="user-info">
          <button onClick={toggleTheme} className="btn" style={{ width: 'auto', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <span>{user?.name} ({user?.roll_number})</span>
          <button onClick={() => navigate(-1)} className="btn" style={{ width: 'auto', background: '#6b7280' }}>Back</button>
        </div>
      </header>

      <main className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
        <section className="card">
          <h2>Overall Status</h2>
          {loading ? (
            <p>Loading attendance data...</p>
          ) : (
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <strong style={{ fontSize: '1.2rem' }}>{user?.roll_number} • {user?.department || 'Current Semester'}</strong>
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  borderRadius: '999px', 
                  fontWeight: 'bold', 
                  backgroundColor: status.bg, 
                  color: status.color 
                }}>
                  {status.label}
                </span>
              </div>
              
              <div style={{ height: '12px', background: 'var(--border-color)', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ 
                  height: '100%', 
                  width: `${totalPercent}%`, 
                  background: totalPercent >= 75 ? 'linear-gradient(90deg, #2ac58f, #1b8a78)' : totalPercent >= 65 ? 'linear-gradient(90deg, #f3c55f, #d19212)' : 'linear-gradient(90deg, #f37886, #d7263d)',
                  transition: 'width 0.5s ease'
                }}></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="stat-box" style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Aggregate</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{totalPercent}%</div>
                </div>
                <div className="stat-box" style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Attended</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{attendance.reduce((sum, item) => sum + item.attended, 0)}</div>
                </div>
                <div className="stat-box" style={{ background: 'var(--card-bg)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Total Classes</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{attendance.reduce((sum, item) => sum + item.total, 0)}</div>
                </div>
              </div>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', fontStyle: 'italic' }}>
                {status.note}
              </p>
            </div>
          )}
        </section>

        <section className="card">
          <h2>Course-Wise Details</h2>
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '0.75rem' }}>Course</th>
                  <th style={{ padding: '0.75rem' }}>Attended</th>
                  <th style={{ padding: '0.75rem' }}>Total</th>
                  <th style={{ padding: '0.75rem' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '1rem', textAlign: 'center' }}>No attendance records found.</td>
                  </tr>
                ) : (
                  attendance.map((item, index) => {
                    const percent = item.total === 0 ? 0 : Math.round((item.attended / item.total) * 100);
                    return (
                      <tr key={index} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '0.75rem' }}>
                          <div style={{ fontWeight: 'bold' }}>{item.course_name}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.course_code}</div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{item.attended}</td>
                        <td style={{ padding: '0.75rem' }}>{item.total}</td>
                        <td style={{ padding: '0.75rem', fontWeight: 'bold', color: percent >= 75 ? '#10b981' : percent >= 65 ? '#f59e0b' : '#ef4444' }}>
                          {percent}%
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Attendance;
