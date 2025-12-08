import React, { useState, useEffect } from 'react';
import { PlayfulCard, SkeletonLoader, PlayfulButton, PlayfulInput, ErrorBoundary } from './CashierTheme';
import { api } from '../../services/api.ts';
import { formatCurrencyGHS } from '../../utils/formatters';

interface CashDrawer {
  id: string;
  status: string;
  opening_balance: number;
  current_balance: number;
  closing_balance?: number;
  opened_at: string;
  closed_at?: string;
  opened_by: string;
}

const CashDrawerTab: React.FC = () => {
  const [cashDrawers, setCashDrawers] = useState<CashDrawer[]>([]);
  const [currentDrawer, setCurrentDrawer] = useState<CashDrawer | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [showOpenDrawer, setShowOpenDrawer] = useState(false);
  const [showCloseDrawer, setShowCloseDrawer] = useState(false);
  const [showReconcile, setShowReconcile] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [denominations, setDenominations] = useState({
    '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
    '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchCashDrawers();
  }, []);

  const fetchCashDrawers = async () => {
    try {
      setLoading(true);
      const response = await api.get('banking/cash-drawers/');
      setCashDrawers(response.data || []);
      const openDrawer = response.data?.find((drawer: CashDrawer) => drawer.status === 'open');
      if (openDrawer) setCurrentDrawer(openDrawer);
      else if (response.data?.length > 0) setCurrentDrawer(response.data[0]);
    } catch (error) {
      console.error('Error fetching cash drawers:', error);
      setMessage({ type: 'error', text: 'Failed to load cash drawers' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async () => {
    if (!openingBalance || parseFloat(openingBalance) <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid opening balance' });
      return;
    }

    try {
      setDrawerLoading(true);
      await api.post('banking/cash-drawers/open/', {
        opening_balance: parseFloat(openingBalance)
      });
      setMessage({ type: 'success', text: 'Cash drawer opened successfully' });
      setShowOpenDrawer(false);
      setOpeningBalance('');
      fetchCashDrawers();
    } catch (error) {
      console.error('Error opening drawer:', error);
      setMessage({ type: 'error', text: 'Failed to open cash drawer' });
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleCloseDrawer = async () => {
    if (!closingBalance || parseFloat(closingBalance) < 0) {
      setMessage({ type: 'error', text: 'Please enter a valid closing balance' });
      return;
    }

    try {
      setDrawerLoading(true);
      await api.post(`banking/cash-drawers/${currentDrawer?.id}/close/`, {
        closing_balance: parseFloat(closingBalance),
        denominations: denominations
      });
      setMessage({ type: 'success', text: 'Cash drawer closed successfully' });
      setShowCloseDrawer(false);
      setClosingBalance('');
      setDenominations({
        '100.00': 0, '50.00': 0, '20.00': 0, '10.00': 0, '5.00': 0, '2.00': 0, '1.00': 0,
        '0.50': 0, '0.25': 0, '0.10': 0, '0.05': 0, '0.01': 0
      });
      fetchCashDrawers();
    } catch (error) {
      console.error('Error closing drawer:', error);
      setMessage({ type: 'error', text: 'Failed to close cash drawer' });
    } finally {
      setDrawerLoading(false);
    }
  };

  const calculateTotalFromDenominations = () => {
    return Object.entries(denominations).reduce((total, [denom, count]) => {
      return total + (parseFloat(denom) * count);
    }, 0);
  };

  if (loading) {
    return (
      <PlayfulCard>
        <h2>🗄️ Cash Drawer</h2>
        <SkeletonLoader height="40px" />
        <SkeletonLoader height="200px" style={{ marginTop: '20px' }} />
      </PlayfulCard>
    );
  }

  return (
    <ErrorBoundary>
      <PlayfulCard>
        <h2>🗄️ Cash Drawer Management</h2>
        <p>Manage cash drawer operations and balances.</p>

        {message.text && (
          <div style={{
            padding: '10px',
            marginBottom: '20px',
            borderRadius: '8px',
            backgroundColor: message.type === 'error' ? '#FFEBEE' : '#E8F5E8',
            color: message.type === 'error' ? '#C62828' : '#2E7D32',
            border: `1px solid ${message.type === 'error' ? '#FFCDD2' : '#C8E6C9'}`
          }}>
            {message.text}
          </div>
        )}

        {/* Current Drawer Status */}
        <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #DFE6E9', borderRadius: '12px' }}>
          <h3>Current Drawer Status</h3>
          {currentDrawer ? (
            <div>
              <p><strong>Status:</strong> <span style={{
                color: currentDrawer.status === 'open' ? '#00B894' : '#FF7675',
                fontWeight: 'bold'
              }}>{currentDrawer.status.toUpperCase()}</span></p>
              <p><strong>Opening Balance:</strong> {formatCurrencyGHS(currentDrawer.opening_balance)}</p>
              <p><strong>Current Balance:</strong> {formatCurrencyGHS(currentDrawer.current_balance)}</p>
              {currentDrawer.closing_balance && <p><strong>Closing Balance:</strong> {formatCurrencyGHS(currentDrawer.closing_balance)}</p>}
              <p><strong>Opened At:</strong> {new Date(currentDrawer.opened_at).toLocaleString()}</p>
              {currentDrawer.closed_at && <p><strong>Closed At:</strong> {new Date(currentDrawer.closed_at).toLocaleString()}</p>}
              <p><strong>Opened By:</strong> {currentDrawer.opened_by}</p>
            </div>
          ) : (
            <p>No active cash drawer</p>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '30px' }}>
          {!currentDrawer || currentDrawer.status !== 'open' ? (
            <PlayfulButton onClick={() => setShowOpenDrawer(true)} variant="success">
              Open Drawer 🚪
            </PlayfulButton>
          ) : (
            <>
              <PlayfulButton onClick={() => setShowCloseDrawer(true)} variant="danger">
                Close Drawer 🔒
              </PlayfulButton>
              <PlayfulButton onClick={() => setShowReconcile(true)} variant="primary">
                Reconcile 💰
              </PlayfulButton>
            </>
          )}
        </div>

        {/* Open Drawer Modal */}
        {showOpenDrawer && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%'
            }}>
              <h3>Open Cash Drawer</h3>
              <PlayfulInput
                label="Opening Balance"
                type="number"
                step="0.01"
                value={openingBalance}
                onChange={(e) => setOpeningBalance(e.target.value)}
                placeholder="0.00"
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <PlayfulButton onClick={() => setShowOpenDrawer(false)} variant="danger">
                  Cancel
                </PlayfulButton>
                <PlayfulButton onClick={handleOpenDrawer} disabled={drawerLoading} variant="success">
                  {drawerLoading ? 'Opening...' : 'Open Drawer'}
                </PlayfulButton>
              </div>
            </div>
          </div>
        )}

        {/* Close Drawer Modal */}
        {showCloseDrawer && currentDrawer && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '500px',
              maxWidth: '90%',
              maxHeight: '80vh',
              overflowY: 'auto'
            }}>
              <h3>Close Cash Drawer</h3>
              <p>Expected Balance: {formatCurrencyGHS(currentDrawer.current_balance)}</p>

              <PlayfulInput
                label="Actual Closing Balance"
                type="number"
                step="0.01"
                value={closingBalance}
                onChange={(e) => setClosingBalance(e.target.value)}
                placeholder="0.00"
              />

              <h4>Denomination Count</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' }}>
                {Object.entries(denominations).map(([denom, count]) => (
                  <div key={denom}>
                    <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                      ₵{denom}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={count}
                      onChange={(e) => setDenominations(prev => ({
                        ...prev,
                        [denom]: parseInt(e.target.value) || 0
                      }))}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #DFE6E9',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                ))}
              </div>
              <p style={{ marginTop: '10px', fontWeight: 'bold' }}>
                Total from Denominations: {formatCurrencyGHS(calculateTotalFromDenominations())}
              </p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <PlayfulButton onClick={() => setShowCloseDrawer(false)} variant="danger">
                  Cancel
                </PlayfulButton>
                <PlayfulButton onClick={handleCloseDrawer} disabled={drawerLoading} variant="success">
                  {drawerLoading ? 'Closing...' : 'Close Drawer'}
                </PlayfulButton>
              </div>
            </div>
          </div>
        )}

        {/* Reconcile Modal */}
        {showReconcile && currentDrawer && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              width: '400px',
              maxWidth: '90%'
            }}>
              <h3>Reconcile Cash Drawer</h3>
              <p>Current Balance: {formatCurrencyGHS(currentDrawer.current_balance)}</p>
              <p>This feature is under development.</p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                <PlayfulButton onClick={() => setShowReconcile(false)} variant="primary">
                  Close
                </PlayfulButton>
              </div>
            </div>
          </div>
        )}

        {/* Drawer History */}
        <div>
          <h3>Drawer History</h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #DFE6E9', borderRadius: '8px' }}>
            {cashDrawers.map((drawer) => (
              <div key={drawer.id} style={{
                padding: '10px 15px',
                borderBottom: '1px solid #F0F0F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Drawer #{drawer.id.slice(-8)}</span>
                  <span style={{ marginLeft: '10px', color: '#636E72' }}>
                    {drawer.status} • {formatCurrencyGHS(drawer.opening_balance)}
                  </span>
                </div>
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: 'white',
                  backgroundColor: drawer.status === 'open' ? '#00B894' : '#636E72'
                }}>
                  {drawer.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </PlayfulCard>
    </ErrorBoundary>
  );
};

export default CashDrawerTab;