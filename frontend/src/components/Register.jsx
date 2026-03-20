import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User } from 'lucide-react';

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
        <div className="auth-header">
          <div className="auth-icon">🏦</div>
          <h2>Create Account</h2>
          <p>Join CareBank</p>
        </div>
        
        {error && <div className="alert-item danger"><span>{error}</span></div>}
        
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label>Username</label>
            <div className="input-with-icon">
              <User size={18} />
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="Choose a username"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
               <Lock size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="Create a password"
              />
            </div>
          </div>

          <label style={{ fontSize: '0.9rem', marginBottom: '10px', display: 'block' }}>I am a...</label>
          <div className="role-selection">
            <div
              className={`role-card ${role === "customer" ? "active" : ""}`}
              onClick={() => setRole("customer")}
            >
              <div className="role-icon">👤</div>
              <h4>Customer</h4>
              <p>Manage finances</p>
            </div>

            <div
              className={`role-card ${role === "banker" ? "active" : ""}`}
              onClick={() => setRole("banker")}
            >
              <div className="role-icon">👔</div>
              <h4>Banker</h4>
              <p>Monitor portal</p>
            </div>
          </div>

          <button type="submit" className="primary-btn" disabled={loading} style={{ marginTop: '20px' }}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
