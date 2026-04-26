import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export default function Attendance() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('user') || '{}');
  const cfg      = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const logout = () => { localStorage.removeItem('user'); navigate('/login'); };

  useEffect(() => {
    axios.get('http://localhost:5000/api/attendance/my', cfg)
      .then(r => setRecords(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalAttended = records.reduce((s, r) => s + r.attended, 0);
  const totalClasses  = records.reduce((s, r) => s + r.total,    0);
  const overallPct    = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

  const statusOf = (pct) => {
    if (pct >= 75) return { label: 'Eligible',  pill: 'pill-green', bar: 'var(--green)', note: 'You meet the minimum attendance requirement.' };
    if (pct >= 65) return { label: 'Warning',   pill: 'pill-amber', bar: 'var(--amber)', note: 'Attend upcoming classes to avoid a shortage.' };
    return          { label: 'Shortage',  pill: 'pill-red',   bar: 'var(--red)',   note: 'Below requirement — contact your department.' };
  };

  const overall = statusOf(overallPct);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">EX</div>
          <span className="sidebar-logo-name">EnrollX</span>
          <span className="sidebar-logo-badge">Student</span>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          <nav className="sidebar-nav">
            <button className="sidebar-link" onClick={() => navigate('/student-dashboard')}>Browse Courses</button>
            <button className="sidebar-link" onClick={() => navigate('/student-dashboard')}>My Courses</button>
            <button className="sidebar-link active">Attendance</button>
            <button className="sidebar-link" onClick={() => navigate('/profile')}>Profile</button>
          </nav>
        </div>
        <div className="sidebar-footer">
          <div className="sidebar-user" onClick={logout} title="Sign out">
            <div className="sidebar-avatar">{initials(user?.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'Student'}</div>
              <div className="sidebar-user-role">Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">
            <strong>EnrollX</strong>&nbsp;/&nbsp;Attendance
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Back</button>
          </div>
        </div>

        <div className="page-body">
          {loading ? (
            <div className="loading-state">Loading attendance records…</div>
          ) : (
            <>
              {/* Overall stat row */}
              <div className="stat-row" style={{ marginBottom: 24 }}>
                <div className="stat-cell">
                  <div className={`stat-value`} style={{ color: overall.bar }}>{overallPct}%</div>
                  <div className="stat-label">Overall</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-value">{totalAttended}</div>
                  <div className="stat-label">Classes Attended</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-value">{totalClasses}</div>
                  <div className="stat-label">Total Classes</div>
                </div>
                <div className="stat-cell">
                  <div className="stat-value">{records.length}</div>
                  <div className="stat-label">Courses</div>
                </div>
              </div>

              {/* Overall status banner */}
              {records.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)', padding: '14px 20px', marginBottom: 24,
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        Attendance summary
                      </span>
                      <span className={`pill ${overall.pill}`}>{overall.label}</span>
                    </div>
                    <div className="att-bar-wrap">
                      <div className="att-bar-track" style={{ width: 240 }}>
                        <div className="att-bar-fill" style={{ width: `${overallPct}%`, background: overall.bar }} />
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{overallPct}%</span>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: 260, textAlign: 'right', margin: 0 }}>
                    {overall.note}
                  </p>
                </div>
              )}

              {/* Per-course table */}
              {records.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">◻</div>
                  <p>No attendance records found.</p>
                </div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Course</th>
                        <th>Code</th>
                        <th>Attended</th>
                        <th>Total</th>
                        <th>Attendance</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((item, i) => {
                        const pct  = item.total === 0 ? 0 : Math.round((item.attended / item.total) * 100);
                        const st   = statusOf(pct);
                        return (
                          <tr key={i}>
                            <td style={{ fontWeight: 500 }}>{item.course_name}</td>
                            <td><span className="pill pill-code">{item.course_code}</span></td>
                            <td className="secondary">{item.attended}</td>
                            <td className="muted">{item.total}</td>
                            <td style={{ minWidth: 160 }}>
                              <div className="att-bar-wrap">
                                <div className="att-bar-track">
                                  <div className="att-bar-fill" style={{ width: `${pct}%`, background: st.bar }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', color: st.bar, minWidth: 36, fontWeight: 600 }}>
                                  {pct}%
                                </span>
                              </div>
                            </td>
                            <td>
                              <span className={`pill ${st.pill}`}>{st.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
