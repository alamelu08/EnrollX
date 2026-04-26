import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'student', roll_number: '', department: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', form);
      localStorage.setItem('user', JSON.stringify(res.data));
      navigate(res.data.role === 'admin' ? '/admin-dashboard' : '/student-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const isFaculty = form.role === 'admin';

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 28, height: 28, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>EX</div>
          <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>EnrollX</span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 4 }}>Create account</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Already registered? <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Sign in</Link>
          </p>
        </div>

        {error && <div className="error">{error}</div>}

        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>Full Name</label>
            <input type="text" value={form.name} onChange={set('name')} required placeholder="Priya Sharma" />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="you@university.edu" autoComplete="email" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={form.password} onChange={set('password')} required minLength={6} placeholder="min. 6 characters" autoComplete="new-password" />
          </div>

          {/* Role toggle */}
          <div className="field">
            <label>Account type</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
              {[{ v: 'student', l: 'Student' }, { v: 'admin', l: 'Faculty' }].map(({ v, l }) => (
                <button
                  key={v} type="button"
                  onClick={() => setForm(f => ({ ...f, role: v }))}
                  className={form.role === v ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  style={{ flex: 1 }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>{isFaculty ? 'Employee ID' : 'Roll Number'}</label>
            <input
              type="text"
              value={form.roll_number}
              onChange={set('roll_number')}
              required
              placeholder={isFaculty ? 'EMP-001' : 'CS21B001'}
            />
          </div>
          <div className="field">
            <label>Department</label>
            <input type="text" value={form.department} onChange={set('department')} required placeholder="Computer Science and Engineering" />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 4, padding: '9px 12px' }}
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}
