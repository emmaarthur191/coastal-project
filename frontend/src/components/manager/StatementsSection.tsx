import React, { useState, useEffect } from 'react';
import { THEME } from './ManagerTheme';
import { authService } from '../../services/api';

interface StatementsSectionProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  handleGenerateStatement: () => void;
}

const StatementsSection: React.FC<StatementsSectionProps> = ({
  formData,
  setFormData,
  handleGenerateStatement
}) => {
  const [generating, setGenerating] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const response = await authService.getStaffAccounts();
        if (response.success && response.data) {
          // Handle both paginated and list responses
          const accountData = response.data.results || response.data;
          setAccounts(Array.isArray(accountData) ? accountData : []);
        }
      } catch (error) {
        console.error('Error fetching accounts for statements:', error);
      } finally {
        setLoadingAccounts(false);
      }
    };
    fetchAccounts();
  }, []);

  const handleGenerate = () => {
    setGenerating(true);
    // Simulate generation delay
    setTimeout(() => {
      handleGenerateStatement();
      setGenerating(false);
    }, 1500);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>📜 Account Statements</h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(300px, 1fr) 1fr',
        gap: '24px'
      }}>
        {/* Generation Form */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card,
          height: 'fit-content'
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '900' }}>
            🛠️ Generate New Statement
          </h4>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
              Select Account
            </label>
            <select
              name="account_number"
              value={formData.account_number || ''}
              onChange={handleChange}
              disabled={loadingAccounts}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #000',
                borderRadius: THEME.radius.input,
                fontFamily: "'Nunito', sans-serif"
              }}
            >
              <option value="">
                {loadingAccounts ? 'Loading accounts...' : '-- Choose Account --'}
              </option>
              {accounts.map((account) => (
                <option key={account.id} value={account.account_number}>
                  {account.account_number} - {account.owner?.first_name} {account.owner?.last_name} ({account.type})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                Start Date
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                End Date
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date || ''}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!formData.account_number || !formData.start_date || generating}
            style={{
              width: '100%',
              padding: '14px',
              background: generating ? '#ccc' : THEME.colors.primary,
              color: '#fff',
              border: '2px solid #000',
              borderRadius: THEME.radius.button,
              fontWeight: '900',
              cursor: generating ? 'not-allowed' : 'pointer',
              boxShadow: generating ? 'none' : THEME.shadows.button,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {generating ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Generating PDF...
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </>
            ) : (
              <>📄 Generate PDF</>
            )}
          </button>
        </div>

        {/* Info / Preview Panel */}
        <div style={{
          background: THEME.colors.bg,
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '24px' }}>🖨️</div>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '900' }}>
            Ready to Print
          </h4>
          <p style={{ maxWidth: '300px', color: '#666', lineHeight: '1.6' }}>
            Select an account and date range to generate a comprehensive PDF statement including all transactions, fees, and interest applied.
          </p>
          <div style={{ marginTop: '24px', padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px' }}>
            <strong>Note:</strong> Statements are generated in PDF format and will be automatically downloaded properly.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatementsSection;