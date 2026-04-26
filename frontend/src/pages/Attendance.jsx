import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './AttendanceTemplate.css'; // The scoped template CSS

export default function Attendance() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const cfg = { headers: { Authorization: `Bearer ${user?.token}` } };

  const [records, setRecords] = useState([]);
  const [showResult, setShowResult] = useState(false);
  
  // Form State
  const [university, setUniversity] = useState('');
  const [rollNo, setRollNo] = useState(user.roll_number || '');
  const [semester, setSemester] = useState('');

  // Fetch actual data from backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/attendance/my', cfg)
      .then(r => setRecords(r.data))
      .catch(console.error);
    // eslint-disable-next-line
  }, []);

  const totalAttended = records.reduce((s, r) => s + r.attended, 0);
  const totalClasses  = records.reduce((s, r) => s + r.total, 0);
  const overallPct    = totalClasses === 0 ? 0 : Math.round((totalAttended / totalClasses) * 100);

  const getStatus = (percent) => {
    if (percent >= 75) return { label: 'Eligible', className: 'ok', note: 'You meet the minimum attendance requirement.' };
    if (percent >= 65) return { label: 'Warning', className: 'mid', note: 'Attend upcoming classes to avoid shortage.' };
    return { label: 'Shortage', className: 'low', note: 'Attendance is below requirement; contact your department.' };
  };

  const status = getStatus(overallPct);

  const onSubmit = (e) => {
    e.preventDefault();
    if (!university || !rollNo || !semester) {
      alert('Please fill all required fields.');
      return;
    }
    setShowResult(true);
  };

  const onReset = () => {
    setUniversity('');
    setRollNo(user.roll_number || '');
    setSemester('');
    setShowResult(false);
  };

  return (
    <div className="attendance-template-root">
      <Link to="/student-dashboard" className="back-btn">
        ← Back to Dashboard
      </Link>
      
      <main className="shell">
        <section className="hero">
          <h1 className="title">Student Attendance Check</h1>
          <p className="subtitle">Quickly view attendance status by student roll number and semester. This is connected to your actual backend records.</p>
        </section>

        <section className="layout">
          <article className="card">
            <h2>Lookup</h2>
            <form className="stack" onSubmit={onSubmit} noValidate>
              <div>
                <label htmlFor="university">University</label>
                <select id="university" value={university} onChange={e => setUniversity(e.target.value)} required>
                  <option value="">Select university</option>
                  <option>National University</option>
                  <option>City Technical University</option>
                  <option>State Engineering College</option>
                </select>
              </div>

              <div>
                <label htmlFor="rollNo">Student Roll Number</label>
                <input id="rollNo" type="text" placeholder="Ex: CS21B001" value={rollNo} onChange={e => setRollNo(e.target.value)} required />
              </div>

              <div>
                <label htmlFor="semester">Semester</label>
                <select id="semester" value={semester} onChange={e => setSemester(e.target.value)} required>
                  <option value="">Select semester</option>
                  <option>Semester 1</option>
                  <option>Semester 2</option>
                  <option>Semester 3</option>
                  <option>Semester 4</option>
                  <option>Semester 5</option>
                  <option>Semester 6</option>
                  <option>Semester 7</option>
                  <option>Semester 8</option>
                </select>
              </div>

              <div className="actions">
                <button type="submit" className="btn-primary">Check Attendance</button>
                <button type="button" onClick={onReset} className="btn-secondary">Reset</button>
              </div>
            </form>

            <div className={`result ${showResult ? 'show' : ''}`} aria-live="polite">
              <div className="topline">
                <strong>{rollNo} • {semester}</strong>
                <span className="pill" style={{
                  background: status.className === 'ok' ? '#d6f3ed' : status.className === 'mid' ? '#fff2d5' : '#fde1e5',
                  color: status.className === 'ok' ? '#126052' : status.className === 'mid' ? '#8f6207' : '#9f2030'
                }}>
                  {status.label}
                </span>
              </div>
              <div className="bar">
                <div className="fill" style={{
                  width: showResult ? `${overallPct}%` : '0%',
                  background: status.className === 'ok' 
                    ? 'linear-gradient(90deg, #2ac58f, #1b8a78)'
                    : status.className === 'mid' 
                      ? 'linear-gradient(90deg, #f3c55f, #d19212)'
                      : 'linear-gradient(90deg, #f37886, #d7263d)'
                }}></div>
              </div>
              <div className="stats">
                <div className="stat"><span>Attendance</span><strong>{overallPct}%</strong></div>
                <div className="stat"><span>Classes Attended</span><strong>{totalAttended}</strong></div>
                <div className="stat"><span>Total Classes</span><strong>{totalClasses}</strong></div>
              </div>
              <p className="small">{status.note} University: {university}.</p>
            </div>
          </article>

          <article className="card">
            <h2>Course-Wise Snapshot</h2>
            <p className="small">Showing actual records for {user.name}. Submit the lookup form to see the aggregate results on the left.</p>
            {records.length === 0 ? (
              <p className="small" style={{ marginTop: 12 }}>No course records found. Enroll in some courses first!</p>
            ) : (
              <table aria-label="Course attendance details">
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Attended</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => {
                    const pct = r.total === 0 ? 0 : Math.round((r.attended / r.total) * 100);
                    const st = getStatus(pct);
                    return (
                      <tr key={i}>
                        <td>{r.course_name}</td>
                        <td>{r.attended}</td>
                        <td>{r.total}</td>
                        <td className={`status-${st.className}`}>{st.label}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </article>
        </section>
      </main>
    </div>
  );
}
