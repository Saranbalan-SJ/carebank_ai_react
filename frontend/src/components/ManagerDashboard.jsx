import { useState } from 'react';
import axios from 'axios';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Users, Activity, ShieldAlert, Flag, Download, Search, Filter, AlertCircle, Bot, PieChart as PieIcon, TrendingUp, Calendar, Target, X, ChevronRight, Info, Calculator, TrendingDown } from 'lucide-react';

const API_URL = 'http://localhost:8000';

export default function ManagerDashboard({ data, token }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [modalTab, setModalTab] = useState('financials');

  const fetchUserDetail = async (userId) => {
    setIsLoadingDetail(true);
    try {
        const res = await axios.get(`${API_URL}/api/admin/customer/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setUserDetail(res.data);
    } catch (err) {
        console.error("Failed to fetch user detail", err);
    } finally {
        setIsLoadingDetail(false);
    }
  };

  const handleOpenDetail = (user) => {
    setSelectedUser(user);
    fetchUserDetail(user.id);
  };
  const [flaggingUser, setFlaggingUser] = useState(null);
  const [flagReason, setFlagReason] = useState('');

  const totalUsers = data.length;
  const avgHealth = data.length > 0 
    ? Math.round(data.reduce((acc, curr) => acc + curr.health_score, 0) / totalUsers) 
    : 0;
  const avgReliability = data.length > 0
    ? Math.round(data.reduce((acc, curr) => acc + (curr.reliability_score || 0), 0) / totalUsers)
    : 0;
  const riskSystems = data.filter(u => u.risk_alerts > 0).length;

  const filteredData = data.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    user.health_score >= minScore
  );

  const handleExport = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/admin/customers/export`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'customers_export.csv');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handleFlag = async () => {
    if (!flaggingUser || !flagReason) return;
    try {
      await axios.post(`${API_URL}/api/admin/flag/${flaggingUser.id}`, 
        { reason: flagReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Customer ${flaggingUser.username} has been flagged.`);
      setFlaggingUser(null);
      setFlagReason('');
    } catch (err) {
      console.error('Flagging failed', err);
    }
  };

  return (
    <div className="manager-dashboard">
      <div className="dashboard-header" style={{ marginBottom: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>🏦 Bank Management Oversight</h2>
          <p style={{ opacity: 0.7 }}>Real-time financial health monitoring across all bank customers.</p>
        </div>
        <button className="primary-btn" onClick={handleExport}>
          <Download size={18} /> Export Portfolio
        </button>
      </div>

      {minScore < 40 && data.some(u => u.health_score < 40) && (
        <div className="alert-item danger" style={{ marginBottom: 24, padding: '16px 20px' }}>
          <ShieldAlert size={20} />
          <span>
            <strong>Attention:</strong> {data.filter(u => u.health_score < 40).length} customers currently have a health score below 40.
          </span>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card score">
          <div className="kpi-header">
            <span className="kpi-label">Active Customers</span>
            <Users size={20} />
          </div>
          <div className="kpi-value score">{totalUsers}</div>
        </div>

        <div className="kpi-card score">
          <div className="kpi-header">
            <span className="kpi-label">Average Health Score</span>
            <Activity size={20} />
          </div>
          <div className="kpi-value score">
            {avgHealth}
            <span style={{ fontSize: '1rem', fontWeight: 400, opacity: 0.6 }}>/100</span>
          </div>
        </div>

        <div className="kpi-card expense" style={{ borderColor: riskSystems > 0 ? '#ef4444' : 'var(--border-color)' }}>
          <div className="kpi-header">
            <span className="kpi-label">Risk Alerts Active</span>
            <ShieldAlert size={20} />
          </div>
          <div className="kpi-value expense" style={{ color: riskSystems > 0 ? '#fca5a5' : '#88f4be' }}>
            {riskSystems}
          </div>
        </div>

        <div className="kpi-card score" style={{ borderColor: avgReliability < 70 ? '#f59e0b' : 'var(--border-color)' }}>
          <div className="kpi-header">
            <span className="kpi-label">Data Reliability (Avg)</span>
            <AlertCircle size={20} />
          </div>
          <div className="kpi-value score" style={{ color: avgReliability > 80 ? '#10b981' : avgReliability > 50 ? '#f59e0b' : '#ef4444' }}>
            {avgReliability}%
          </div>
        </div>
      </div>

      <div className="chart-card" style={{ marginTop: 30 }}>
        <div className="section-header" style={{ marginBottom: 20 }}>
          <div className="chart-title">
            <Users size={18} style={{ color: '#6366f1' }} />
            Customer Portfolio Analysis
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
             <div style={{ position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  className="budget-input" 
                  style={{ paddingLeft: 36, width: 220 }}
                  placeholder="Search customers..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '0 12px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <Filter size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Min Score:</span>
                <input 
                  type="range" min="0" max="100" value={minScore} 
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  style={{ width: 100 }}
                />
                <span style={{ fontSize: '0.8rem', width: 25 }}>{minScore}</span>
             </div>
          </div>
        </div>
        
        <table className="manager-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px' }}>Customer</th>
              <th>Health Score</th>
              <th>Data Reliability</th>
              <th>Health Analysis</th>
              <th>Risk Anomalies</th>
              <th>Activity</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((user) => (
              <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                <td style={{ padding: '16px 12px', fontWeight: 500 }}>{user.username}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${user.health_score}%`, height: '100%', background: user.health_score > 70 ? '#10b981' : user.health_score > 40 ? '#f59e0b' : '#ef4444' }} />
                    </div>
                    {user.health_score}
                  </div>
                </td>
                <td style={{ verticalAlign: 'top', paddingTop: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '2px 8px', 
                        borderRadius: 10, 
                        border: '1px solid currentColor',
                        display: 'inline-block',
                        width: 'fit-content',
                        color: user.reliability_score > 80 ? '#10b981' : user.reliability_score > 50 ? '#f59e0b' : '#ef4444'
                      }}
                    >
                      {user.data_status || 'Unverified'} ({user.reliability_score || 0}%)
                    </span>
                    {user.fraud_flags && user.fraud_flags.map((flag, idx) => (
                      <div key={idx} style={{ 
                        fontSize: '0.65rem', 
                        color: '#ef4444', 
                        padding: '2px 6px', 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        borderRadius: 4,
                        border: '1px solid rgba(239, 68, 68, 0.2)'
                      }}>
                        🚨 {flag}
                      </div>
                    ))}
                  </div>
                </td>
                <td>
                   <span style={{ fontSize: '0.8rem', padding: '4px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', color: user.status.includes('🟢') ? '#88f4be' : user.status.includes('🟡') ? '#fde68a' : '#fca5a5' }}>
                     {user.status.replace(/[🟢🟡🔴] /, '')}
                   </span>
                </td>
                <td style={{ color: user.risk_alerts > 0 ? '#fca5a5' : 'inherit' }}>
                  {user.risk_alerts > 0 ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ShieldAlert size={14} /> {user.risk_alerts} Detected</span> : 'None'}
                </td>
                <td style={{ opacity: 0.6 }}>{user.total_transactions} txns</td>
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={() => handleOpenDetail(user)}
                    style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', color: '#818cf8', cursor: 'pointer', padding: '6px 12px', borderRadius: 6, fontSize: '0.75rem', marginRight: 8 }}
                  >
                    View Details
                  </button>
                  <button 
                    onClick={() => setFlaggingUser(user)}
                    style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', padding: 8 }}
                    title="Flag customer for review"
                  >
                    <Flag size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: 40, opacity: 0.5 }}>No customers match your search criteria.</td>
              </tr>
            )}
          </tbody>
        </table>

        {selectedUser && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 40 }}>
                <div style={{ background: '#0f172a', width: '100%', maxWidth: 900, maxHeight: '90vh', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <h2 style={{ fontSize: '1.25rem' }}>Command Center: {selectedUser.username}</h2>
                            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 8, padding: 4 }}>
                                {['financials', 'logic', 'forensics'].map(t => (
                                    <button 
                                        key={t}
                                        onClick={() => setModalTab(t)}
                                        style={{ 
                                            background: modalTab === t ? '#6366f1' : 'transparent',
                                            border: 'none',
                                            color: 'white',
                                            padding: '4px 12px',
                                            borderRadius: 6,
                                            fontSize: '0.7rem',
                                            cursor: 'pointer',
                                            textTransform: 'capitalize'
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => { setSelectedUser(null); setUserDetail(null); setModalTab('financials'); }} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}><X size={20} /></button>
                    </div>

                    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
                        {isLoadingDetail ? (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>🔍 Synchronizing Agent Data...</div>
                        ) : userDetail && userDetail.analysis ? (
                            <>
                                {modalTab === 'financials' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <div className="chart-card" style={{ margin: 0, height: 320 }}>
                                            <div className="chart-title">Monthly Cashflow Trend</div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={userDetail.analysis.monthly_trends}>
                                                    <XAxis dataKey="Month" tick={{ fontSize: 10 }} />
                                                    <YAxis tick={{ fontSize: 10 }} />
                                                    <Area type="monotone" dataKey="income" stroke="#10b981" fill="rgba(16, 185, 129, 0.1)" />
                                                    <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="rgba(239, 68, 68, 0.1)" />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="chart-card" style={{ margin: 0, height: 320 }}>
                                            <div className="chart-title">Spending Forecast</div>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={userDetail.analysis.forecast}>
                                                    <XAxis dataKey="Date" tick={{ fontSize: 10 }} />
                                                    <YAxis tick={{ fontSize: 10 }} />
                                                    <Bar dataKey="Forecast" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {modalTab === 'logic' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                                        <div className="advisor-card" style={{ margin: 0, background: 'rgba(99, 102, 241, 0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#818cf8', fontWeight: 600 }}>
                                                <Bot size={18} /> Multi-Agent Logic Trace
                                            </div>
                                            {userDetail.analysis.advice.map((a, i) => (
                                                <div key={i} style={{ fontSize: '0.8rem', padding: 12, borderLeft: '4px solid #6366f1', background: 'rgba(0,0,0,0.2)', marginBottom: 12, borderRadius: '0 8px 8px 0' }}>{a}</div>
                                            ))}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                            <div className="advisor-card" style={{ margin: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#ec4899' }}>
                                                    <Calendar size={18} /> Subscriptions (Agent 6)
                                                </div>
                                                {userDetail.analysis.subscriptions.map((s, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <span>{s.description}</span>
                                                        <span style={{ color: '#ec4899' }}>₹{Math.abs(s.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="advisor-card" style={{ margin: 0 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, color: '#10b981' }}>
                                                    <Target size={18} /> Savings Strategy (Agent 7)
                                                </div>
                                                <div style={{ fontSize: '0.8rem', padding: 10, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>{userDetail.analysis.savings_plan.status}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {modalTab === 'forensics' && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                                        <div className="advisor-card" style={{ margin: 0, border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#ef4444', fontWeight: 600 }}>
                                                <ShieldAlert size={18} /> Forensic Integrity Report
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
                                                <div style={{ fontSize: '3rem', fontWeight: 800 }}>{userDetail.analysis.fraud_analysis.reliability_score}%</div>
                                                <div style={{ fontSize: '0.8rem', color: '#ef4444', textTransform: 'uppercase' }}>{userDetail.analysis.fraud_analysis.status}</div>
                                            </div>
                                            {userDetail.analysis.fraud_analysis.private_flags.map((f, i) => (
                                                <div key={i} style={{ fontSize: '0.8rem', color: '#fca5a5', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                    <Info size={14} /> {f}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="advisor-card" style={{ margin: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: '#f59e0b', fontWeight: 600 }}>
                                                <Calculator size={18} /> Tax & Budget Analysis
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>Taxable Income</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>₹{userDetail.analysis.tax_info.taxable_income.toLocaleString()}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.7rem', opacity: 0.6, color: '#ef4444' }}>Est. Tax</div>
                                                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>₹{userDetail.analysis.tax_info.estimated_tax.toLocaleString()}</div>
                                                </div>
                                            </div>
                                            <div style={{ marginTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Budget Anomalies Trace:</div>
                                                {userDetail.analysis.anomalies.slice(0, 3).map((an, i) => (
                                                    <div key={i} style={{ fontSize: '0.75rem', marginBottom: 4 }}>⚠️ Large spend of ₹{an.Amount} at {an.Description}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>This customer has not uploaded transaction data yet.</div>
                        )}
                    </div>
                </div>
            </div>
        )}
      </div>

      {flaggingUser && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div className="chart-card" style={{ width: '100%', maxWidth: 450 }}>
            <h3>Flag Customer: {flaggingUser.username}</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 20 }}>Enter the reason for flagging this account for internal review.</p>
            <textarea 
              className="budget-input" 
              style={{ width: '100%', height: 100, marginBottom: 20 }}
              placeholder="e.g. Unusual high-value transactions detected..."
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="primary-btn" style={{ background: 'transparent', border: '1px solid var(--border-color)' }} onClick={() => setFlaggingUser(null)}>Cancel</button>
              <button className="primary-btn" style={{ background: '#ef4444' }} onClick={handleFlag}>Confirm Flag</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
