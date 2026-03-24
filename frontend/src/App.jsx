import { useState, useEffect } from 'react';
import axios from 'axios';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ManagerDashboard from './components/ManagerDashboard';
import ChatWidget from './components/ChatWidget';
import Login from './components/Login';
import Register from './components/Register';
import { BarChart3, ShieldCheck } from 'lucide-react';
import './index.css';
import ForgotPassword from "./pages/ForgotPassword";

const API_URL = 'http://localhost:8000';

function MainView({ token, role, onLogout, theme, toggleTheme }) {
  const [data, setData] = useState(null);
  const [adminData, setAdminData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [aiContext, setAiContext] = useState('');

  const loadDashboard = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      if (role === 'banker') {
        const res = await axios.get(`${API_URL}/api/admin/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdminData(res.data);
      } else {
        const res = await axios.get(`${API_URL}/api/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
        setAiContext(res.data?.ai_context || '');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        onLogout();
      } else {
        console.error(err);
        setError('Failed to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (file, budgets) => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      await new Promise((r) => setTimeout(r, 1000));
      await loadDashboard();
    } catch (err) {
      console.error(err);
      if (err.response?.status === 401) {
        onLogout();
      } else {
        setError(err.response?.data?.detail || 'Failed to upload transactions.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, role]);

  return (
    <div className="app-layout">
      <Sidebar
        onAnalyze={handleAnalyze}
        loading={loading}
        onLogout={onLogout}
        role={role}
        token={token}
        theme={theme}
        toggleTheme={toggleTheme}
        activeTab={role === 'banker' ? 'manager' : 'dashboard'}
        notifications={data?.notifications || []}
      />

      <main className="main-content">
        {error && (
          <div className="alert-item danger" style={{ marginBottom: 20, maxWidth: 600 }}>
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', opacity: 0.6 }}>
            <p>Loading dashboard data...</p>
          </div>
        )}

        {!loading && role === 'banker' ? (
          <ManagerDashboard data={adminData} token={token} />
        ) : !loading && data ? (
          <>
            <Dashboard data={data} token={token} />
            <ChatWidget aiContext={aiContext} />
          </>
        ) : !loading ? (
          <div className="welcome-container">
            <div className="welcome-icon">🏦</div>
            <h2 className="welcome-title">Welcome to CareBank</h2>
            <p className="welcome-subtitle">
              Upload your transaction CSV or PDF and set your budget limits to unlock
              financial insights, anomaly detection, and humanized advice.
            </p>
            <div className="welcome-features">
              <div className="welcome-feature">
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                Risk Detection
              </div>
              <div className="welcome-feature">
                <BarChart3 size={18} style={{ color: '#6366f1' }} />
                Smart Forecasting
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [role, setRole] = useState(localStorage.getItem('role') || 'customer');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const handleSetAuth = (newToken, newRole) => {
    const resolvedRole = newRole || 'customer';
    setToken(newToken);
    setRole(resolvedRole);
    localStorage.setItem('token', newToken);
    localStorage.setItem('role', resolvedRole);
  };

  const handleLogout = () => {
    setToken('');
    setRole('customer');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login setAuth={handleSetAuth} />} />
      <Route path="/register" element={<Register setAuth={handleSetAuth} />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/"
        element={
          token ? (
            <MainView 
              token={token} 
              role={role} 
              onLogout={handleLogout} 
              theme={theme} 
              toggleTheme={toggleTheme} 
            />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

export default App;
