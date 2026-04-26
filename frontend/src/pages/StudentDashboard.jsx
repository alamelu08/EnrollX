import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useTheme from '../hooks/useTheme';

const API = 'http://localhost:5000/api';

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

export default function StudentDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { theme, toggle } = useTheme();
  const cfg  = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [courses,   setCourses]   = useState([]);
  const [myRegs,    setMyRegs]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState(null);
  const [toast,     setToast]     = useState(null);
  const [activeTab, setActiveTab] = useState('browse');

  const notify = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const fetchAll = useCallback(async () => {
    const [c, r] = await Promise.all([
      axios.get(`${API}/courses`, cfg),
      axios.get(`${API}/registrations/my`, cfg),
    ]);
    setCourses(c.data);
    setMyRegs(r.data);
  }, []);

  useEffect(() => { (async () => { setLoading(true); await fetchAll().catch(console.error); setLoading(false); })(); }, []);

  const handleEnroll = async (id) => {
    setActing(id);
    try { const r = await axios.post(`${API}/registrations/${id}`, {}, cfg); notify('success', r.data.message); await fetchAll(); }
    catch (e) { notify('error', e.response?.data?.message || 'Enrollment failed'); }
    finally { setActing(null); }
  };

  const handleDrop = async (id) => {
    if (!window.confirm('Drop this course?')) return;
    setActing(id);
    try { const r = await axios.delete(`${API}/registrations/${id}`, cfg); notify('success', r.data.message); await fetchAll(); }
    catch (e) { notify('error', e.response?.data?.message || 'Drop failed'); }
    finally { setActing(null); }
  };

  const logout = () => { localStorage.removeItem('user'); navigate('/login'); };

  const regMap   = myRegs.reduce((a, r) => { if (r.status !== 'dropped') a[r.id] = r; return a; }, {});
  const enrolled = myRegs.filter(r => r.status === 'enrolled');
  const waiting  = myRegs.filter(r => r.status === 'waitlisted');
  const totalCr  = enrolled.reduce((s, r) => s + (r.credits || 0), 0);

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
            {[
              { id: 'browse',   label: 'Browse Courses' },
              { id: 'enrolled', label: 'My Courses' },
            ].map(t => (
              <button key={t.id} className={`sidebar-link ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
                {t.label}
              </button>
            ))}
            <button className="sidebar-link" onClick={() => navigate('/attendance')}>Attendance</button>
            <button className="sidebar-link" onClick={() => navigate('/profile')}>Profile</button>
          </nav>
        </div>
        <div className="sidebar-footer">
          <button
            onClick={toggle}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '6px 8px', borderRadius: 'var(--radius)', border: 'none',
              background: 'none', cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: '0.75rem', marginBottom: 4, transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {theme === 'dark' ? '☀' : '◑'}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
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
            <strong>EnrollX</strong>&nbsp;/&nbsp;{activeTab === 'browse' ? 'Browse Courses' : 'My Courses'}
          </div>
          <div className="topbar-actions">
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
          </div>
        </div>

        <div className="page-body">
          {/* Stats */}
          <div className="stat-row">
            <div className="stat-cell"><div className="stat-value green">{enrolled.length}</div><div className="stat-label">Enrolled</div></div>
            <div className="stat-cell"><div className="stat-value amber">{waiting.length}</div><div className="stat-label">Waitlisted</div></div>
            <div className="stat-cell"><div className="stat-value accent">{courses.length}</div><div className="stat-label">Available</div></div>
            <div className="stat-cell"><div className="stat-value">{totalCr}</div><div className="stat-label">Credits</div></div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button className={`tab-btn ${activeTab === 'browse'   ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>Browse</button>
            <button className={`tab-btn ${activeTab === 'enrolled' ? 'active' : ''}`} onClick={() => setActiveTab('enrolled')}>
              My Courses {enrolled.length + waiting.length > 0 ? `(${enrolled.length + waiting.length})` : ''}
            </button>
          </div>

          {loading ? (
            <div className="loading-state">Loading…</div>
          ) : activeTab === 'browse' ? (
            /* ── Browse ── */
            <div className="section-panel">
              <div className="section-panel-header">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
              </div>
              {courses.length === 0 ? (
                <div className="empty-state">No courses available.</div>
              ) : (
                <div style={{ padding: '0 20px' }}>
                  {courses.map(c => {
                    const reg   = regMap[c.id];
                    const avail = c.max_capacity - c.enrolled;
                    const isFull = avail <= 0;
                    const isAct  = acting === c.id;
                    return (
                      <div key={c.id} className="course-row">
                        <div className="course-row-main">
                          <div className="course-row-name">
                            {c.name}
                            {reg?.status === 'enrolled'   && <span className="pill pill-green" style={{ marginLeft: 8 }}>Enrolled</span>}
                            {reg?.status === 'waitlisted' && <span className="pill pill-amber" style={{ marginLeft: 8 }}>Waitlisted</span>}
                          </div>
                          <div className="course-row-meta">
                            <span className="pill pill-code">{c.code}{c.section ? ` · ${c.section}` : ''}</span>
                            <span>{c.faculty_name}</span>
                            <span>{c.schedule || '—'}</span>
                            <span>{c.credits} cr</span>
                            <span style={{ color: isFull ? 'var(--red)' : 'var(--text-muted)' }}>
                              {isFull ? 'Full' : `${avail}/${c.max_capacity} seats`}
                            </span>
                          </div>
                        </div>
                        <div className="course-row-actions">
                          {reg ? (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDrop(c.id)} disabled={isAct}>
                              {isAct ? '…' : 'Drop'}
                            </button>
                          ) : (
                            <button
                              className={isFull ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm'}
                              onClick={() => handleEnroll(c.id)} disabled={isAct}
                            >
                              {isAct ? '…' : isFull ? 'Waitlist' : 'Enroll'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* ── My Courses ── */
            <>
              {enrolled.length === 0 && waiting.length === 0 ? (
                <div className="empty-state">
                  <p>Not enrolled in any courses.</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => setActiveTab('browse')}>Browse courses</button>
                </div>
              ) : (
                <>
                  {enrolled.length > 0 && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <h3>Enrolled</h3>
                        <span className="pill pill-green">{enrolled.length}</span>
                      </div>
                      <div className="data-table-wrap" style={{ marginBottom: 24 }}>
                        <table className="data-table">
                          <thead><tr><th>Course</th><th>Code</th><th>Faculty</th><th>Schedule</th><th>Cr</th><th>Grades</th><th></th></tr></thead>
                          <tbody>
                            {enrolled.map(r => (
                              <tr key={r.registration_id}>
                                <td style={{ fontWeight: 500 }}>{r.name}</td>
                                <td><span className="pill pill-code">{r.code}</span></td>
                                <td className="secondary">{r.faculty_name}</td>
                                <td className="muted">{r.schedule || '—'}</td>
                                <td className="muted">{r.credits}</td>
                                <td>
                                  {(!r.test_grades || r.test_grades.length === 0)
                                    ? <span style={{ color: 'var(--text-disabled)', fontSize: '0.72rem' }}>—</span>
                                    : r.test_grades.map((tg, i) => <span key={i} className="grade-badge">{tg.test_name}: {tg.grade}</span>)
                                  }
                                </td>
                                <td>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDrop(r.id)} disabled={acting === r.id}>
                                    {acting === r.id ? '…' : 'Drop'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                  {waiting.length > 0 && (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <h3>Waitlisted</h3>
                        <span className="pill pill-amber">{waiting.length}</span>
                      </div>
                      <div className="data-table-wrap">
                        <table className="data-table">
                          <thead><tr><th>Course</th><th>Code</th><th>Faculty</th><th>Schedule</th><th></th></tr></thead>
                          <tbody>
                            {waiting.map(r => (
                              <tr key={r.registration_id}>
                                <td style={{ fontWeight: 500 }}>{r.name}</td>
                                <td><span className="pill pill-code">{r.code}</span></td>
                                <td className="secondary">{r.faculty_name}</td>
                                <td className="muted">{r.schedule || '—'}</td>
                                <td>
                                  <button className="btn btn-ghost btn-sm" onClick={() => handleDrop(r.id)} disabled={acting === r.id}>
                                    {acting === r.id ? '…' : 'Leave'}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  );
}
