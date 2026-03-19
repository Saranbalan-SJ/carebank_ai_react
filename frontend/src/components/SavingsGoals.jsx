import { useState, useEffect } from 'react';
import axios from 'axios';
import { Target, Plus, Trash2, TrendingUp } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function SavingsGoals({ token }) {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newGoal, setNewGoal] = useState({ name: '', target: '', deadline: '' });
  const [showAdd, setShowAdd] = useState(false);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/goals`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGoals(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/goals`, newGoal, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewGoal({ name: '', target: '', deadline: '' });
      setShowAdd(false);
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/goals/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSaved = async (id, amount) => {
    try {
      await axios.patch(`${API_URL}/api/goals/${id}`, { saved: amount }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchGoals();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="goals-container">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Target size={24} style={{ color: '#6366f1' }} />
          <h3>Savings Goals</h3>
        </div>
        <button className="primary-btn" onClick={() => setShowAdd(!showAdd)}>
          <Plus size={18} /> Add Goal
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddGoal} className="chart-card" style={{ marginBottom: 24 }}>
          <div className="budget-grid">
            <div className="budget-item">
              <label>Goal Name</label>
              <input 
                className="budget-input"
                value={newGoal.name} 
                onChange={(e) => setNewGoal({...newGoal, name: e.target.value})} 
                placeholder="e.g. New Car"
                required
              />
            </div>
            <div className="budget-item">
              <label>Target Amount (₹)</label>
              <input 
                className="budget-input"
                type="number"
                value={newGoal.target} 
                onChange={(e) => setNewGoal({...newGoal, target: e.target.value})} 
                placeholder="50000"
                required
              />
            </div>
            <div className="budget-item">
              <label>Deadline</label>
              <input 
                className="budget-input"
                type="date"
                value={newGoal.deadline} 
                onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})} 
                required
              />
            </div>
          </div>
          <button type="submit" className="primary-btn" style={{ marginTop: 16 }}>Create Goal</button>
        </form>
      )}

      <div className="kpi-grid">
        {goals.map((goal) => {
          const progress = Math.min(100, Math.round((goal.saved / goal.target) * 100));
          return (
            <div key={goal.id} className="chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <h4 style={{ margin: 0 }}>{goal.name}</h4>
                <button onClick={() => handleDeleteGoal(goal.id)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                Target: ₹{goal.target.toLocaleString()} | Deadline: {goal.deadline}
              </div>
              
              <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 12 }}>
                <div style={{ width: `${progress}%`, height: '100%', background: '#6366f1', transition: 'width 0.3s ease' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{progress}% Saved</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>Saved: </span>
                  <input 
                    type="number"
                    style={{ width: 80, padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                    value={goal.saved}
                    onChange={(e) => handleUpdateSaved(goal.id, Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
