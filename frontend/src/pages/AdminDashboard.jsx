import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useTheme from '../hooks/useTheme';

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const BLANK_FORM = { name: '', code: '', faculty_name: '', schedule: '', credits: '', max_capacity: '', syllabus: '', section: '', days: [], start_date: '', time: '' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const { theme, toggle } = useTheme();
  const cfg  = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [courses,    setCourses]    = useState([]);
  const [view,       setView]       = useState('courses'); // courses | addEdit | grades | attendance
  const [editId,     setEditId]     = useState(null);
  const [formData,   setFormData]   = useState(BLANK_FORM);
  const [toast,      setToast]      = useState(null);

  // grades
  const [gradeCtx,   setGradeCtx]   = useState(null);
  const [students,   setStudents]   = useState([]);
  const [testCols,   setTestCols]   = useState([]);
  const [gradeData,  setGradeData]  = useState({});
  const [newTest,    setNewTest]    = useState('');

  // attendance
  const [attCtx,    setAttCtx]    = useState(null);
  const [attData,   setAttData]   = useState({});
  const [bulkTotal, setBulkTotal] = useState('');

  const notify = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const logout = () => { localStorage.removeItem('user'); navigate('/login'); };

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    try { const r = await axios.get('http://localhost:5000/api/courses', cfg); setCourses(r.data); }
    catch (e) { console.error(e); }
  };

  /* ── Form helpers ── */
  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'days') {
      setFormData(f => ({ ...f, days: checked ? [...f.days, value] : f.days.filter(d => d !== value) }));
    } else {
      setFormData(f => ({ ...f, [name]: value }));
    }
  };

  const openAdd = () => { setFormData(BLANK_FORM); setEditId(null); setView('addEdit'); };

  const openEdit = (c) => {
    setEditId(c.id);
    setFormData({
      name: c.name, code: c.code, faculty_name: c.faculty_name, schedule: c.schedule,
      credits: c.credits, max_capacity: c.max_capacity, syllabus: c.syllabus || '',
      section: c.section || '', days: c.days ? c.days.split(', ') : [],
      start_date: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : '',
      time: c.time || '',
    });
    setView('addEdit');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) await axios.put(`http://localhost:5000/api/courses/${editId}`, formData, cfg);
      else        await axios.post('http://localhost:5000/api/courses', formData, cfg);
      fetchCourses(); setView('courses'); notify('success', editId ? 'Course updated.' : 'Course created.');
    } catch (e) { notify('error', e.response?.data?.message || 'Save failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await axios.delete(`http://localhost:5000/api/courses/${id}`, cfg); fetchCourses(); notify('success', 'Course deleted.'); }
    catch (e) { notify('error', e.response?.data?.message || 'Delete failed'); }
  };

  /* ── Grades ── */
  const openGrades = async (c) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/${c.id}/students`, cfg);
      setStudents(res.data);
      setGradeCtx(c);
      const tests = new Set(); const init = {};
      res.data.forEach(s => {
        init[s.student_id] = {};
        (s.test_grades || []).forEach(tg => { tests.add(tg.test_name); init[s.student_id][tg.test_name] = tg.grade; });
      });
      setTestCols([...tests]); setGradeData(init); setView('grades');
    } catch (e) { notify('error', 'Failed to load students'); }
  };

  const addTestCol = () => {
    if (!newTest.trim() || testCols.includes(newTest.trim())) return;
    setTestCols(c => [...c, newTest.trim()]); setNewTest('');
  };

  const saveGrades = async () => {
    try {
      const ps = [];
      Object.keys(gradeData).forEach(sid => {
        Object.keys(gradeData[sid]).forEach(tn => {
          if (gradeData[sid][tn]?.trim())
            ps.push(axios.put(`http://localhost:5000/api/courses/${gradeCtx.id}/students/${sid}/grade`, { test_name: tn, grade: gradeData[sid][tn] }, cfg));
        });
      });
      if (!ps.length) { notify('error', 'No grades to save.'); return; }
      await Promise.all(ps); notify('success', 'Grades saved.');
    } catch { notify('error', 'Failed to save some grades.'); }
  };

  /* ── Attendance ── */
  const openAttendance = async (c) => {
    try {
      const res = await axios.get(`http://localhost:5000/api/courses/${c.id}/students`, cfg);
      setStudents(res.data);
      setAttCtx(c);
      const init = {};
      res.data.forEach(s => { init[s.registration_id] = { attended: s.attended_classes || 0, total: s.total_classes || 0 }; });
      setAttData(init); setView('attendance');
    } catch { notify('error', 'Failed to load students'); }
  };

  const saveAttendance = async () => {
    try {
      await Promise.all(Object.keys(attData).map(rid =>
        axios.put(`http://localhost:5000/api/attendance/${rid}`, { attended_classes: attData[rid].attended, total_classes: attData[rid].total }, cfg)
      ));
      notify('success', 'Attendance saved.');
    } catch { notify('error', 'Failed to save.'); }
  };

  const applyBulk = () => {
    const t = parseInt(bulkTotal) || 0;
    setAttData(d => { const n = { ...d }; Object.keys(n).forEach(k => { n[k] = { ...n[k], total: t }; }); return n; });
  };

  const backToCourses = () => { setView('courses'); setGradeCtx(null); setAttCtx(null); };

  /* ── Render ── */
  const sideLinks = [
    { id: 'courses', label: 'Courses' },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">EX</div>
          <span className="sidebar-logo-name">EnrollX</span>
          <span className="sidebar-logo-badge">Faculty</span>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Dashboard</div>
          <nav className="sidebar-nav">
            <button className={`sidebar-link ${view === 'courses' || view === 'addEdit' ? 'active' : ''}`} onClick={backToCourses}>Courses</button>
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
              <div className="sidebar-user-name">{user?.name || 'Faculty'}</div>
              <div className="sidebar-user-role">Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">
            <strong>EnrollX</strong>&nbsp;/&nbsp;
            {view === 'courses'    && 'Courses'}
            {view === 'addEdit'    && (editId ? 'Edit Course' : 'New Course')}
            {view === 'grades'     && `Grades — ${gradeCtx?.name}`}
            {view === 'attendance' && `Attendance — ${attCtx?.name}`}
          </div>
          <div className="topbar-actions">
            {(view === 'grades' || view === 'attendance' || view === 'addEdit') && (
              <button className="btn btn-ghost btn-sm" onClick={backToCourses}>← Back</button>
            )}
            {view === 'courses' && (
              <button className="btn btn-primary btn-sm" onClick={openAdd}>New Course</button>
            )}
            {view === 'grades' && (
              <button className="btn btn-primary btn-sm" onClick={saveGrades}>Save Grades</button>
            )}
            {view === 'attendance' && (
              <button className="btn btn-primary btn-sm" onClick={saveAttendance}>Save Attendance</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
          </div>
        </div>

        <div className="page-body">

          {/* ── COURSES VIEW ── */}
          {view === 'courses' && (
            <>
              <div className="stat-row" style={{ marginBottom: 24 }}>
                <div className="stat-cell"><div className="stat-value accent">{courses.length}</div><div className="stat-label">Total Courses</div></div>
                <div className="stat-cell"><div className="stat-value">{courses.reduce((s, c) => s + (c.enrolled || 0), 0)}</div><div className="stat-label">Total Enrolled</div></div>
                <div className="stat-cell"><div className="stat-value">{courses.filter(c => c.faculty_id === user?.id).length}</div><div className="stat-label">My Courses</div></div>
              </div>
              {courses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">◻</div>
                  <p>No courses yet.</p>
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={openAdd}>Create first course</button>
                </div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Section</th>
                        <th>Course Name</th>
                        <th>Faculty</th>
                        <th>Schedule</th>
                        <th>Enrollment</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {courses.map(c => {
                        const pct = c.max_capacity > 0 ? Math.round((c.enrolled / c.max_capacity) * 100) : 0;
                        const isMine = c.faculty_id === user?.id;
                        return (
                          <tr key={c.id}>
                            <td><span className="pill pill-code">{c.code}</span></td>
                            <td className="muted">{c.section || '—'}</td>
                            <td style={{ fontWeight: 500 }}>{c.name}</td>
                            <td className="secondary">{c.faculty_name}</td>
                            <td className="muted">{c.schedule || '—'}</td>
                            <td>
                              <div className="att-bar-wrap">
                                <div className="att-bar-track" style={{ width: 80 }}>
                                  <div className="att-bar-fill" style={{ width: `${pct}%`, background: pct >= 90 ? 'var(--red)' : pct >= 60 ? 'var(--amber)' : 'var(--green)' }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{c.enrolled}/{c.max_capacity}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => openEdit(c)}>Edit</button>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c.id)}>Delete</button>
                                {isMine && (
                                  <>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openGrades(c)}>Grades</button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => openAttendance(c)}>Attendance</button>
                                  </>
                                )}
                              </div>
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

          {/* ── ADD/EDIT FORM ── */}
          {view === 'addEdit' && (
            <div className="form-panel">
              <div className="form-panel-title">{editId ? 'Edit Course' : 'Create New Course'}</div>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="field"><label>Course Name</label><input name="name" value={formData.name} onChange={handleInput} required placeholder="e.g. Data Structures" /></div>
                </div>
                <div className="form-row cols-2">
                  <div className="field"><label>Faculty</label><input name="faculty_name" value={formData.faculty_name} onChange={handleInput} required placeholder="Dr. Smith" /></div>
                  <div className="field"><label>Course Code</label><input name="code" value={formData.code} onChange={handleInput} required placeholder="CS301" /></div>
                </div>
                <div className="form-row cols-3">
                  <div className="field"><label>Section</label><input name="section" value={formData.section} onChange={handleInput} placeholder="A" /></div>
                  <div className="field"><label>Credits</label><input name="credits" type="number" value={formData.credits} onChange={handleInput} required /></div>
                  <div className="field"><label>Max Capacity</label><input name="max_capacity" type="number" value={formData.max_capacity} onChange={handleInput} required /></div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Days</label>
                    <div className="checkbox-group">
                      {DAYS.map(d => (
                        <label key={d} className="checkbox-pill">
                          <input type="checkbox" name="days" value={d} checked={formData.days.includes(d)} onChange={handleInput} />
                          {d}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="form-row cols-2">
                  <div className="field"><label>Start Date</label><input name="start_date" type="date" value={formData.start_date} onChange={handleInput} required /></div>
                  <div className="field"><label>Time</label><input name="time" type="time" value={formData.time} onChange={handleInput} required /></div>
                </div>
                <div className="form-row">
                  <div className="field"><label>Syllabus (optional)</label><textarea name="syllabus" value={formData.syllabus} onChange={handleInput} rows={3} placeholder="URL or description…" /></div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">{editId ? 'Update' : 'Create Course'}</button>
                  <button type="button" className="btn btn-ghost" onClick={backToCourses}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* ── GRADES VIEW ── */}
          {view === 'grades' && (
            <>
              <div className="action-row">
                <input className="inline-input" value={newTest} onChange={e => setNewTest(e.target.value)} placeholder="Test name (e.g. Midterm)" style={{ width: 220 }} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTestCol())} />
                <button className="btn btn-secondary btn-sm" onClick={addTestCol}>Add Column</button>
              </div>
              {students.length === 0 ? (
                <div className="empty-state">No students enrolled in this course.</div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        {testCols.map(t => <th key={t}>{t}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => (
                        <tr key={s.student_id}>
                          <td style={{ fontWeight: 500 }}>{s.name}</td>
                          <td className="secondary">{s.email}</td>
                          {testCols.map(t => (
                            <td key={t}>
                              <input
                                className="num-input"
                                value={gradeData[s.student_id]?.[t] || ''}
                                onChange={e => setGradeData(d => ({ ...d, [s.student_id]: { ...d[s.student_id], [t]: e.target.value } }))}
                                placeholder="—"
                                style={{ width: 72 }}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ── ATTENDANCE VIEW ── */}
          {view === 'attendance' && (
            <>
              <div className="action-row">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Set total classes for all:</span>
                <input className="inline-input num-input" type="number" value={bulkTotal} onChange={e => setBulkTotal(e.target.value)} placeholder="e.g. 36" style={{ width: 80 }} />
                <button className="btn btn-secondary btn-sm" onClick={applyBulk}>Apply to all</button>
              </div>
              {students.length === 0 ? (
                <div className="empty-state">No students enrolled.</div>
              ) : (
                <div className="data-table-wrap">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Student</th>
                        <th>Email</th>
                        <th>Attended</th>
                        <th>Total</th>
                        <th>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(s => {
                        const a = attData[s.registration_id];
                        const pct = a?.total > 0 ? Math.round((a.attended / a.total) * 100) : 0;
                        const color = pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
                        return (
                          <tr key={s.registration_id}>
                            <td style={{ fontWeight: 500 }}>{s.name}</td>
                            <td className="secondary">{s.email}</td>
                            <td>
                              <input
                                type="number" className="num-input"
                                value={a?.attended || 0}
                                onChange={e => setAttData(d => ({ ...d, [s.registration_id]: { ...d[s.registration_id], attended: parseInt(e.target.value) || 0 } }))}
                                style={{ width: 72 }}
                              />
                            </td>
                            <td>
                              <input
                                type="number" className="num-input"
                                value={a?.total || 0}
                                onChange={e => setAttData(d => ({ ...d, [s.registration_id]: { ...d[s.registration_id], total: parseInt(e.target.value) || 0 } }))}
                                style={{ width: 72 }}
                              />
                            </td>
                            <td>
                              <div className="att-bar-wrap">
                                <div className="att-bar-track">
                                  <div className="att-bar-fill" style={{ width: `${pct}%`, background: color }} />
                                </div>
                                <span style={{ fontSize: '0.72rem', color, minWidth: 32 }}>{pct}%</span>
                              </div>
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

      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
        </div>
      )}
    </div>
  );
}
