import React, { useState } from 'react';
import { THEME } from './ManagerTheme';
import { authService } from '../../services/api';

interface InterestSectionProps {
  interestData: any;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(amount);
};

const InterestSection: React.FC<InterestSectionProps> = ({ interestData: initialData }) => {
  const [formData, setFormData] = useState({
    principal: '',
    rate: '',
    months: ''
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
      const response = await authService.calculateInterest(formData);
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
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>📈 Interest Calculations</h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 1fr) 1fr', gap: '24px' }}>
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
            🔢 Loan & Savings Interest
          </h4>

          <form onSubmit={handleCalculate}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                Principal Amount (GHS)
              </label>
              <input
                type="number"
                name="principal"
                value={formData.principal}
                onChange={handleChange}
                required
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                  Annual Rate (%)
                </label>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 5.5"
                  step="0.01"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #000',
                    borderRadius: THEME.radius.input,
                    fontFamily: "'Nunito', sans-serif"
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                  Duration (Months)
                </label>
                <input
                  type="number"
                  name="months"
                  value={formData.months}
                  onChange={handleChange}
                  required
                  placeholder="e.g. 12"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #000',
                    borderRadius: THEME.radius.input,
                    fontFamily: "'Nunito', sans-serif"
                  }}
                />
              </div>
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
              {loading ? 'Calculating...' : 'Calculate Interest'}
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
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📉</div>
              <p>Enter loan or savings details to project interest earnings or costs.</p>
            </div>
          ) : (
            <>
              <h4 style={{ margin: '0 0 24px 0', fontSize: '18px', fontWeight: '900', textAlign: 'center' }}>
                Projection Result
              </h4>

              <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#666' }}>Interest Earned/Due</span>
                  <span style={{ fontWeight: '700', color: THEME.colors.success }}>{formatCurrency(parseFloat(result.interest_amount))}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#666' }}>Est. Monthly Payment</span>
                  <span style={{ fontWeight: '700' }}>{formatCurrency(parseFloat(result.monthly_repayment))}</span>
                </div>
              </div>

              <div style={{
                marginTop: 'auto',
                background: THEME.colors.primary,
                padding: '24px',
                borderRadius: '12px',
                border: '2px solid #000',
                textAlign: 'center',
                boxShadow: '4px 4px 0 #000',
                color: '#fff'
              }}>
                <div style={{ fontSize: '14px', marginBottom: '8px', opacity: 0.9 }}>TOTAL REPAYMENT AMOUNT</div>
                <div style={{ fontSize: '32px', fontWeight: '900' }}>
                  {formatCurrency(parseFloat(result.total_amount))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterestSection;