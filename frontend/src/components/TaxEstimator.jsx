import { Calculator, ShieldCheck, Download } from 'lucide-react';

export default function TaxEstimator({ taxInfo }) {
  if (!taxInfo) return null;

  return (
    <div className="tax-container">
      <div className="section-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Calculator size={24} style={{ color: '#6366f1' }} />
          <h3>Tax Estimator (Beta)</h3>
        </div>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        <div className="kpi-card income">
          <div className="kpi-label">Total Taxable Income</div>
          <div className="kpi-value income">₹{taxInfo.taxable_income.toLocaleString()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Estimated Tax (15%)</div>
          <div className="kpi-value">₹{taxInfo.estimated_tax.toLocaleString()}</div>
        </div>
        <div className="kpi-card score">
          <div className="kpi-label">Total Deductions Found</div>
          <div className="kpi-value score">₹{taxInfo.total_deductions.toLocaleString()}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">
          <ShieldCheck size={18} style={{ color: '#10b981' }} />
          Identified Deductible Expenses
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 20 }}>
          The following transactions were identified as potentially tax-deductible based on keywords like Insurance, Investment, etc.
        </p>

        <table className="manager-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <th style={{ padding: '12px' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '12px' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {taxInfo.deductibles.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.9rem' }}>
                <td style={{ padding: '12px' }}>{item.description}</td>
                <td style={{ textAlign: 'right', padding: '12px', fontWeight: 500 }}>₹{item.amount.toLocaleString()}</td>
              </tr>
            ))}
            {taxInfo.deductibles.length === 0 && (
              <tr>
                <td colSpan="2" style={{ textAlign: 'center', padding: 24, opacity: 0.5 }}>No deductible expenses identified yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="alert-item" style={{ marginTop: 24, background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
        <Calculator size={18} style={{ color: '#6366f1' }} />
        <span style={{ fontSize: '0.85rem' }}>
          <strong>Disclaimer:</strong> This is a rough automated estimate. Please consult a certified tax professional for accurate filing.
        </span>
      </div>
    </div>
  );
}
