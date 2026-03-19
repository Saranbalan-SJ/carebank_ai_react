import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

const API_URL = 'http://localhost:8000';

function Login({ setAuth }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false); // 👈 NEW
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await axios.post(`${API_URL}/api/login`, formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, role } = res.data;
      setAuth(access_token, role);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🏦</div>
          <h2>Welcome Back</h2>
          <p>Login to CareBank AI</p>
        </div>
        
        {error && <div className="alert-item danger"><span>{error}</span></div>}
        
        <form onSubmit={handleLogin}>
          
          {/* Username */}
          <div className="form-group">
            <label>Username</label>
            <div className="input-with-icon">
              <User size={18} />
              <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
                placeholder="Enter your username"
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon" style={{ position: "relative" }}>
              <Lock size={18} />
              <input 
                type={show ? "text" : "password"}   // 👈 CHANGED
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
              />

              {/* Eye Icon */}
              <span 
                onClick={() => setShow(!show)} 
                style={{
                  position: "absolute",
                  right: "10px",
                  cursor: "pointer"
                }}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </span>
            </div>
          </div>
          <p style={{ marginTop: "6px", textAlign: "right" }}>
  <Link to="/forgot-password">Forgot Password?</Link>
</p>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;