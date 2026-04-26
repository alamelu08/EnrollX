import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import useTheme from '../hooks/useTheme';

const initials = (n = '') => n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

const Row = ({ label, value }) => (
  <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '11px 0' }}>
    <span style={{ width: 160, flexShrink: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
    <span style={{ fontSize: '0.82rem', color: value ? 'var(--text-primary)' : 'var(--text-disabled)' }}>
      {value || '—'}
    </span>
  </div>
);

export default function Profile() {
  const navigate = useNavigate();
  const user     = JSON.parse(localStorage.getItem('user') || '{}');
  const cfg      = { headers: { Authorization: `Bearer ${user?.token}` } };
  const { theme, toggle } = useTheme();

  const [profile,   setProfile]   = useState(null);
  const [error,     setError]     = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData,  setFormData]  = useState({ phone_number: '', address: '', designation: '', department: '' });
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState(null);

  const notify = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const logout = () => { localStorage.removeItem('user'); navigate('/login'); };

  useEffect(() => {
    axios.get('http://localhost:5000/api/users/profile', cfg)
      .then(r => {
        setProfile(r.data);
        setFormData({
          phone_number: r.data.phone_number || '',
          address:      r.data.address      || '',
          designation:  r.data.designation  || '',
          department:   r.data.department   || '',
        });
      })
      .catch(() => setError('Failed to load profile. Make sure the backend is running.'));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await axios.put('http://localhost:5000/api/users/profile', formData, cfg);
      setProfile(r.data);
      setIsEditing(false);
      notify('success', 'Profile updated.');
    } catch {
      notify('error', 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  const isFaculty = profile?.role === 'admin';
  const dashPath  = isFaculty ? '/admin-dashboard' : '/student-dashboard';

  if (error)    return <div className="loading-state" style={{ color: 'var(--red)' }}>{error}</div>;
  if (!profile) return <div className="loading-state">Loading profile…</div>;

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-mark">EX</div>
          <span className="sidebar-logo-name">EnrollX</span>
          <span className="sidebar-logo-badge">{isFaculty ? 'Faculty' : 'Student'}</span>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Navigation</div>
          <nav className="sidebar-nav">
            <button className="sidebar-link" onClick={() => navigate(dashPath)}>Dashboard</button>
            <button className="sidebar-link active">Profile</button>
            {!isFaculty && <button className="sidebar-link" onClick={() => navigate('/attendance')}>Attendance</button>}
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
            <div className="sidebar-avatar">{initials(profile.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{profile.name}</div>
              <div className="sidebar-user-role">Sign out</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-title">
            <strong>EnrollX</strong>&nbsp;/&nbsp;Profile
          </div>
          <div className="topbar-actions">
            {!isEditing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setIsEditing(true)}>Edit profile</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => navigate(dashPath)}>← Dashboard</button>
          </div>
        </div>

        <div className="page-body" style={{ maxWidth: 680 }}>
          {/* Identity block */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent)', flexShrink: 0,
            }}>
              {initials(profile.name)}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{profile.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {profile.email} &nbsp;·&nbsp; {isFaculty ? 'Faculty' : 'Student'}
                {profile.roll_number && <>&nbsp;·&nbsp; {profile.roll_number}</>}
              </div>
            </div>
          </div>

          {isEditing ? (
            /* ── Edit Form ── */
            <div className="form-panel">
              <div className="form-panel-title">Edit Profile</div>
              <form onSubmit={handleSave}>
                <div className="form-row">
                  <div className="field">
                    <label>Phone Number</label>
                    <input
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={e => setFormData(f => ({ ...f, phone_number: e.target.value }))}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Department</label>
                    <input
                      name="department"
                      value={formData.department}
                      onChange={e => setFormData(f => ({ ...f, department: e.target.value }))}
                      placeholder="Computer Science and Engineering"
                    />
                  </div>
                </div>
                {isFaculty && (
                  <div className="form-row">
                    <div className="field">
                      <label>Designation</label>
                      <input
                        name="designation"
                        value={formData.designation}
                        onChange={e => setFormData(f => ({ ...f, designation: e.target.value }))}
                        placeholder="Associate Professor"
                      />
                    </div>
                  </div>
                )}
                <div className="form-row">
                  <div className="field">
                    <label>Address</label>
                    <textarea
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={e => setFormData(f => ({ ...f, address: e.target.value }))}
                      placeholder="Enter your full address"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setIsEditing(false)} disabled={saving}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ── Read View ── */
            <div className="section-panel">
              <div className="section-panel-header">
                <h2>Details</h2>
              </div>
              <div style={{ padding: '4px 20px 12px' }}>
                <Row label="Full Name"        value={profile.name} />
                <Row label="Email"            value={profile.email} />
                <Row label="Roll Number / ID" value={profile.roll_number} />
                <Row label="Role"             value={isFaculty ? 'Faculty' : 'Student'} />
                <Row label="Department"       value={profile.department} />
                {isFaculty && <Row label="Designation" value={profile.designation} />}
                <Row label="Phone"            value={profile.phone_number} />
                <Row label="Address"          value={profile.address} />
              </div>
            </div>
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
