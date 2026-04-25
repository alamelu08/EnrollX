import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student', // default role
    roll_number: '',
    department: '',
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const { name, email, password, role, roll_number, department } = formData;

  const onChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        role,
        roll_number,
        department,
      });
      
      localStorage.setItem('user', JSON.stringify(res.data));
      
      if (res.data.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/student-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-container">
      <h2>Register for EnrollX</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={name}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={email}
            onChange={onChange}
            required
          />
        </div>
        <div className="form-group">
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={password}
            onChange={onChange}
            required
            minLength="6"
          />
        </div>
        <div className="form-group">
          <label>{role === 'admin' ? 'Employee ID' : 'Roll Number'}</label>
          <input
            type="text"
            name="roll_number"
            value={roll_number}
            onChange={onChange}
            required
            placeholder={role === 'admin' ? 'Enter Employee ID' : 'Enter Roll Number'}
          />
        </div>
        <div className="form-group">
          <label>Department</label>
          <input
            type="text"
            name="department"
            value={department}
            onChange={onChange}
            required
            placeholder="Enter Department"
          />
        </div>
        <div className="form-group">
          <label>Role</label>
          <select name="role" value={role} onChange={onChange}>
            <option value="student">Student</option>
            <option value="admin">Admin (Faculty)</option>
          </select>
        </div>
        <button type="submit" className="btn">Register</button>
      </form>
      <p>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

export default Register;
