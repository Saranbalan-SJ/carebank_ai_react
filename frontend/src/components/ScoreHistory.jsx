import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertCircle } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function ScoreHistory({ token }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/score-history`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [token]);

  if (history.length === 0) {
    return (
      <div className="chart-card" style={{ textAlign: 'center', padding: 40 }}>
        <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
        <p>No health score history recorded yet. Run an analysis to start tracking.</p>
      </div>
    );
  }

  return (
    <div className="score-history-container">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Activity size={24} style={{ color: '#6366f1' }} />
          <h3>Financial Health Trend</h3>
        </div>
      </div>

      <div className="chart-card" style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis domain={[0, 100]} stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Line 
              type="monotone" 
              dataKey="score" 
              stroke="#6366f1" 
              strokeWidth={3} 
              dot={{ fill: '#6366f1', strokeWidth: 2 }} 
              activeDot={{ r: 8 }}
              name="Health Score"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="kpi-grid" style={{ marginTop: 24 }}>
        <div className="kpi-card">
          <div className="kpi-label">Average Score</div>
          <div className="kpi-value">
            {Math.round(history.reduce((acc, curr) => acc + curr.score, 0) / history.length)}
          </div>
        </div>
        <div className="kpi-card income">
          <div className="kpi-label">Latest Score</div>
          <div className="kpi-value income">{history[history.length - 1].score}</div>
        </div>
      </div>
    </div>
  );
}
