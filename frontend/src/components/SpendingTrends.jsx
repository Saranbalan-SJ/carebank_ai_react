import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

export default function SpendingTrends({ monthlyData }) {
  if (!monthlyData || monthlyData.length === 0) {
    return (
      <div className="chart-card" style={{ textAlign: 'center', padding: 40 }}>
        <AlertCircle size={40} style={{ opacity: 0.2, marginBottom: 16 }} />
        <p>No historical data available to show trends.</p>
      </div>
    );
  }

  // Calculate monthly change for the last month
  const lastMonth = monthlyData[monthlyData.length - 1];
  const prevMonth = monthlyData.length > 1 ? monthlyData[monthlyData.length - 2] : null;
  const change = prevMonth ? ((lastMonth.expense - prevMonth.expense) / prevMonth.expense) * 100 : 0;

  return (
    <div className="trends-container">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingUp size={24} style={{ color: '#6366f1' }} />
          <h3>Month-over-Month Spending</h3>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card expense">
          <div className="kpi-label">Current Month Expense</div>
          <div className="kpi-value expense">₹{lastMonth.expense.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Spending Change</div>
          <div className={`kpi-value ${change > 0 ? 'expense' : 'income'}`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip 
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
            <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
