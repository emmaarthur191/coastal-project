import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatCurrencyGHS } from '../../utils/formatters';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';

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
      const data = response.data?.results || response.data || [];
      const drawersArray = Array.isArray(data) ? data : [];
      setCashDrawers(drawersArray);
      const openDrawer = drawersArray.find((drawer: CashDrawer) => drawer.status === 'open');
      if (openDrawer) setCurrentDrawer(openDrawer);
      else if (drawersArray.length > 0) setCurrentDrawer(drawersArray[0]);
    } catch (error) {
      console.error('Error fetching cash drawers:', error);
      setCashDrawers([]);
      setMessage({ type: 'error', text: 'Failed to load cash drawers' });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = async () => {
    if (!openingBalance || parseFloat(openingBalance) < 0) {
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
    return <div className="p-12 text-center text-gray-400"><div className="animate-spin text-4xl mb-4">⏳</div>Loading Cash Drawer...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <span>🗄️</span> Cash Drawer Management
        </h2>
        <p className="text-gray-500">Manage cash drawer operations and balances.</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-700' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Drawer Status */}
        <GlassCard className="lg:col-span-2 p-6 flex flex-col justify-between">
          <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-2">Current Drawer Status</h3>
          {currentDrawer ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl">
                <span className="text-gray-600 font-medium">Status</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${currentDrawer.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {currentDrawer.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <span className="text-xs text-blue-600 font-bold uppercase tracking-wider">Opening Balance</span>
                  <div className="text-2xl font-bold text-blue-900 mt-1">{formatCurrencyGHS(currentDrawer.opening_balance)}</div>
                </div>
                <div className="bg-indigo-50 p-4 rounded-xl">
                  <span className="text-xs text-indigo-600 font-bold uppercase tracking-wider">Current Balance</span>
                  <div className="text-2xl font-bold text-indigo-900 mt-1">{formatCurrencyGHS(currentDrawer.current_balance)}</div>
                </div>
                {currentDrawer.closing_balance && (
                  <div className="bg-gray-100 p-4 rounded-xl sm:col-span-2">
                    <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Closing Balance</span>
                    <div className="text-2xl font-bold text-gray-900 mt-1">{formatCurrencyGHS(currentDrawer.closing_balance)}</div>
                  </div>
                )}
              </div>

              <div className="text-xs text-gray-400 mt-4 flex justify-between">
                <span>Opened: {new Date(currentDrawer.opened_at).toLocaleString()}</span>
                <span>By: {currentDrawer.opened_by}</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 italic">
              No active cash drawer found.
            </div>
          )}
        </GlassCard>

        {/* Actions */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {!currentDrawer || currentDrawer.status !== 'open' ? (
                <Button onClick={() => setShowOpenDrawer(true)} variant="success" className="w-full justify-center py-4 text-lg shadow-lg shadow-green-200">
                  Open Drawer 🚪
                </Button>
              ) : (
                <>
                  <Button onClick={() => setShowCloseDrawer(true)} variant="danger" className="w-full justify-center py-4 text-lg shadow-lg shadow-red-200">
                    Close Drawer 🔒
                  </Button>
                  <Button onClick={() => setShowReconcile(true)} variant="primary" className="w-full justify-center py-3">
                    Reconcile 💰
                  </Button>
                </>
              )}
            </div>
          </GlassCard>
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-amber-800 text-sm">
            <strong>Note:</strong> Ensure all cash is counted accurately before opening or closing the drawer. Discrepancies will be flagged.
          </div>
        </div>
      </div>

      {/* Drawer History */}
      <GlassCard className="p-0 overflow-hidden mt-6">
        <div className="p-4 bg-gray-50/50 border-b border-gray-100">
          <h3 className="font-bold text-gray-700">Drawer History</h3>
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {cashDrawers.map((drawer) => (
            <div key={drawer.id} className="p-4 border-b border-gray-50 flex justify-between items-center last:border-0 hover:bg-gray-50">
              <div>
                <div className="font-mono font-bold text-gray-600 text-sm">#{drawer.id.slice(-8)}</div>
                <div className="text-xs text-gray-400 mt-1">{new Date(drawer.opened_at).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">{formatCurrencyGHS(drawer.opening_balance)}</div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold uppercase ${drawer.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}`}>
                  {drawer.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Open Drawer Modal */}
      {showOpenDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-xl font-bold mb-4">Open Cash Drawer</h3>
            <Input
              label="Opening Balance"
              type="number"
              step="0.01"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              placeholder="0.00"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={() => setShowOpenDrawer(false)} disabled={drawerLoading}>Cancel</Button>
              <Button variant="success" onClick={handleOpenDrawer} disabled={drawerLoading}>
                {drawerLoading ? 'Opening...' : 'Open Drawer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Close Drawer Modal */}
      {showCloseDrawer && currentDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-2">Close Cash Drawer</h3>
            <p className="text-gray-500 mb-6">Expected Balance: <span className="font-bold text-gray-800">{formatCurrencyGHS(currentDrawer.current_balance)}</span></p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6">
              <div className="col-span-2 md:col-span-1">
                <Input
                  label="Actual Closing Balance"
                  type="number"
                  step="0.01"
                  value={closingBalance}
                  onChange={(e) => setClosingBalance(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-bold"
                />
              </div>
              <div className="col-span-2 md:col-span-1 flex flex-col justify-end">
                <div className="bg-white p-3 rounded-lg border border-gray-200 text-right">
                  <span className="text-xs text-gray-500 block">Calculated Total</span>
                  <span className="text-xl font-bold text-coastal-primary">{formatCurrencyGHS(calculateTotalFromDenominations())}</span>
                </div>
              </div>
            </div>

            <h4 className="font-bold text-gray-700 mb-3 text-sm uppercase tracking-wide">Denomination Count (GHS)</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {Object.entries(denominations).map(([denom, count]) => (
                <div key={denom}>
                  <label className="block text-xs font-bold text-gray-500 mb-1">₵{denom}</label>
                  <input
                    type="number"
                    min="0"
                    value={count}
                    onChange={(e) => setDenominations(prev => ({
                      ...prev,
                      [denom]: parseInt(e.target.value) || 0
                    }))}
                    className="w-full p-2 border border-gray-200 rounded-lg text-center font-mono focus:border-coastal-primary focus:ring-2 focus:ring-coastal-primary/20 outline-none transition-all"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
              <Button variant="secondary" onClick={() => setShowCloseDrawer(false)} disabled={drawerLoading}>Cancel</Button>
              <Button variant="danger" onClick={handleCloseDrawer} disabled={drawerLoading}>
                {drawerLoading ? 'Closing...' : 'Close Drawer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reconcile Modal */}
      {showReconcile && currentDrawer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="text-4xl mb-2">💰</div>
            <h3 className="text-xl font-bold mb-2">Reconcile Cash Drawer</h3>
            <p className="text-gray-600 mb-4">Current Balance: <span className="font-bold">{formatCurrencyGHS(currentDrawer.current_balance)}</span></p>
            <p className="text-sm text-gray-400 italic mb-6">This feature is currently under development.</p>
            <Button onClick={() => setShowReconcile(false)} variant="primary" className="w-full">Close</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashDrawerTab;