import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = 'http://localhost:8000';

function Register({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/api/register`, {
        username,
        password,
        role
      });

      const { access_token, role: userRole } = res.data;

      setAuth(access_token, userRole);
      navigate('/');

    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Create Account</h2>

        {error && <div className="alert-item danger">{error}</div>}

        <form onSubmit={handleRegister}>
          
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {/* Role Selection */}
         <div className="role-selection">
  <div
    className={`role-card ${role === "customer" ? "active" : ""}`}
    onClick={() => setRole("customer")}
  >
    <div className="role-icon">👤</div>
    <h4>Customer</h4>
    <p>Manage your finances</p>
  </div>

  <div
    className={`role-card ${role === "banker" ? "active" : ""}`}
    onClick={() => setRole("banker")}
  >
    <div className="role-icon">🏦</div>
    <h4>Banker</h4>
    <p>Monitor customers</p>
  </div>
</div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <p>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;