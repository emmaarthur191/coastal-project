import React, { useState } from 'react';
import { THEME } from './ManagerTheme';
import { authService } from '../../services/api';

interface CommissionSectionProps {
  commissionData: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount);
};

const CommissionSection: React.FC<CommissionSectionProps> = ({ commissionData: initialData }) => {
  const [formData, setFormData] = useState({
    agent_id: '',
    amount: ''
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await authService.calculateCommission(formData);
      if (response.success) {
        setResult(response.data);
      } else {
        setError(response.error || 'Calculation failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>🤝 Commission Management</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Calculator Form */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card,
          height: 'fit-content'
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '900' }}>
            🧮 Commission Calculator
          </h4>

          <form onSubmit={handleCalculate}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                Agent ID (Optional)
              </label>
              <input
                type="text"
                name="agent_id"
                value={formData.agent_id}
                onChange={handleChange}
                placeholder="e.g. AGT-001"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                Transaction Amount (GHS)
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '18px',
                  fontWeight: '700'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: loading ? '#ccc' : THEME.colors.primary,
                color: '#fff',
                border: '2px solid #000',
                borderRadius: THEME.radius.button,
                fontWeight: '900',
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : THEME.shadows.button
              }}
            >
              {loading ? 'Calculating...' : 'Run Calculation'}
            </button>
          </form>

          {error && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#ffebee',
              color: '#d32f2f',
              border: '2px solid #d32f2f',
              borderRadius: '8px',
              fontWeight: '700'
            }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div style={{
          background: THEME.colors.bg,
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          opacity: result ? 1 : 0.6,
          transition: 'opacity 0.3s'
        }}>
          {!result ? (
            <div style={{ textAlign: 'center', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🤖</div>
              <p>Enter a transaction amount to calculate the agent commission.</p>
            </div>
          ) : (
            <>
              <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '900', textAlign: 'center' }}>
                Calculation Result
              </h4>

              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Transaction</span>
                <span style={{ fontWeight: '700' }}>{formatCurrency(parseFloat(result.transaction_amount))}</span>
              </div>

              <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#666' }}>Applied Rate</span>
                <span style={{ fontWeight: '700', color: THEME.colors.info }}>{result.commission_rate}</span>
              </div>

              <div style={{
                marginTop: 'auto',
                background: '#fff',
                padding: '24px',
                borderRadius: '12px',
                border: '2px solid #000',
                textAlign: 'center',
                boxShadow: '4px 4px 0 #000'
              }}>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>COMISSION AMOUNT</div>
                <div style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.success }}>
                  {formatCurrency(parseFloat(result.commission_amount))}
                </div>
              </div>

              <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                Calculated at: {new Date(result.calculated_at).toLocaleTimeString()}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommissionSection;