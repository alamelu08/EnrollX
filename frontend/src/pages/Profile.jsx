import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Profile = ({ theme, toggleTheme }) => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phone_number: '',
    address: '',
    designation: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${user?.token}` }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users/profile', axiosConfig);
      setProfile(res.data);
      setFormData({
        phone_number: res.data.phone_number || '',
        address: res.data.address || '',
        designation: res.data.designation || ''
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Ensure the backend and database migrations are running.');
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await axios.put('http://localhost:5000/api/users/profile', formData, axiosConfig);
      setProfile(res.data);
      setIsEditing(false);
      showToast('success', 'Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      showToast('error', 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (error) return <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{error}</div>;
  if (!profile) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading profile...</div>;

  const isFaculty = profile.role === 'admin'; // Admin corresponds to faculty in this app

  return (
    <div className="dashboard">
      {toast && (
        <div style={{
          position: 'fixed', top: '1.5rem', right: '1.5rem', zIndex: 9999,
          padding: '1rem 1.5rem', borderRadius: '10px', fontWeight: '600',
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {toast.message}
        </div>
      )}

      <header className="dashboard-header">
        <h1>My Profile</h1>
        <div className="user-info">
          <button onClick={toggleTheme} className="btn" style={{ width: 'auto', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-color)' }}>
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button onClick={() => navigate(isFaculty ? '/admin-dashboard' : '/student-dashboard')} className="btn" style={{ width: 'auto', background: '#6366f1' }}>
            Dashboard
          </button>
          <button onClick={handleLogout} className="btn btn-logout">Logout</button>
        </div>
      </header>

      <main className="dashboard-content" style={{ display: 'block' }}>
        <section className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>{isEditing ? 'Edit Profile' : 'Profile Details'}</h2>
            {!isEditing && (
              <button onClick={() => setIsEditing(true)} className="btn" style={{ width: 'auto' }}>Edit Profile</button>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <p style={{ margin: '0.5rem 0' }}><strong>Name:</strong> {profile.name}</p>
            <p style={{ margin: '0.5rem 0' }}><strong>Email:</strong> {profile.email}</p>
            <p style={{ margin: '0.5rem 0' }}><strong>Role:</strong> {isFaculty ? 'Faculty' : 'Student'}</p>
          </div>

          {isEditing ? (
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} placeholder="e.g. +1 234 567 8900" />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea name="address" value={formData.address} onChange={handleInputChange} rows="3" placeholder="Enter your full address" style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-color)' }}></textarea>
              </div>
              {isFaculty && (
                <div className="form-group">
                  <label>Designation</label>
                  <input type="text" name="designation" value={formData.designation} onChange={handleInputChange} placeholder="e.g. Professor of Computer Science" />
                </div>
              )}
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="btn" style={{ flex: 1 }} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" className="btn" style={{ flex: 1, backgroundColor: '#6b7280' }} onClick={() => setIsEditing(false)} disabled={isSaving}>
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p style={{ margin: '0.75rem 0' }}><strong>Phone Number:</strong> {profile.phone_number || <span style={{ color: '#9ca3af' }}>Not provided</span>}</p>
              <p style={{ margin: '0.75rem 0' }}><strong>Address:</strong> {profile.address || <span style={{ color: '#9ca3af' }}>Not provided</span>}</p>
              {isFaculty && (
                <p style={{ margin: '0.75rem 0' }}><strong>Designation:</strong> {profile.designation || <span style={{ color: '#9ca3af' }}>Not provided</span>}</p>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Profile;
