import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import { THEME } from './ManagerTheme';

interface ServiceCharge {
  id: number;
  name: string;
  description: string;
  charge_type: 'fixed' | 'percentage';
  rate: string;
  applicable_to: string[];
  is_active: boolean;
}

interface ServiceChargesSectionProps {
  newCharge: any;
  setNewCharge: React.Dispatch<React.SetStateAction<any>>;
  serviceChargeCalculation: any;
  setServiceChargeCalculation: React.Dispatch<React.SetStateAction<any>>;
  serviceCharges: any[];
  fetchServiceCharges: () => void;
}

const ServiceChargesSection: React.FC<ServiceChargesSectionProps> = ({
  newCharge,
  setNewCharge,
  serviceChargeCalculation,
  setServiceChargeCalculation,
  serviceCharges: propServiceCharges,
  fetchServiceCharges: propFetchServiceCharges
}) => {
  const [charges, setCharges] = useState<ServiceCharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Banking operations that can have service charges
  const operations = [
    'withdrawal',
    'deposit',
    'daily_susu',
    'monthly_susu',
    'transfer',
    'account_maintenance',
    'loan_processing',
    'check_deposit',
    'balance_inquiry'
  ];

  useEffect(() => {
    fetchCharges();
  }, []);

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const response = await authService.getServiceCharges();
      if (response.success) {
        const chargesData = Array.isArray(response.data) ? response.data : [];
        setCharges(chargesData);
      }
    } catch (error) {
      console.error('Failed to fetch service charges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to create charge
    alert('Service charge created! (API integration pending)');
    // Reset form
    setNewCharge({
      name: '',
      description: '',
      charge_type: 'fixed',
      rate: '',
      applicable_to: []
    });
    fetchCharges();
  };

  const handleToggleOperation = (operation: string) => {
    const current = newCharge.applicable_to || [];
    if (current.includes(operation)) {
      setNewCharge({
        ...newCharge,
        applicable_to: current.filter((op: string) => op !== operation)
      });
    } else {
      setNewCharge({
        ...newCharge,
        applicable_to: [...current, operation]
      });
    }
  };

  const handleDeleteCharge = (id: number) => {
    if (confirm('Are you sure you want to delete this service charge?')) {
      // TODO: API call to delete
      setCharges(charges.filter(c => c.id !== id));
      alert('Service charge deleted! (API integration pending)');
    }
  };

  const handleToggleActive = (id: number) => {
    // TODO: API call to toggle
    setCharges(charges.map(c =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    ));
  };

  return (
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>🏷️ Service Charge Management</h3>

      {/* Create New Charge Form */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: THEME.radius.card,
        border: '2px solid #000',
        boxShadow: THEME.shadows.card,
        marginBottom: '24px'
      }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '900' }}>
          ➕ Create New Service Charge
        </h4>

        <form onSubmit={handleCreateCharge}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
                Charge Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., Withdrawal Fee"
                value={newCharge.name || ''}
                onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
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
                Charge Type *
              </label>
              <select
                required
                value={newCharge.charge_type || 'fixed'}
                onChange={(e) => setNewCharge({ ...newCharge, charge_type: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif"
                }}
              >
                <option value="fixed">Fixed Amount (GHS)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
              Description
            </label>
            <textarea
              placeholder="Describe when this charge applies..."
              value={newCharge.description || ''}
              onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
              rows={2}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #000',
                borderRadius: THEME.radius.input,
                fontFamily: "'Nunito', sans-serif",
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>
              Rate/Amount *
            </label>
            <input
              type="number"
              step="0.01"
              required
              placeholder={newCharge.charge_type === 'percentage' ? 'e.g., 2.5' : 'e.g., 5.00'}
              value={newCharge.rate || ''}
              onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })}
              style={{
                width: '100%',
                padding: '10px',
                border: '2px solid #000',
                borderRadius: THEME.radius.input,
                fontFamily: "'Nunito', sans-serif"
              }}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              {newCharge.charge_type === 'percentage'
                ? 'Enter percentage value (e.g., 2.5 for 2.5%)'
                : 'Enter amount in Ghana Cedis (GHS)'}
            </small>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontWeight: '700', marginBottom: '12px' }}>
              Apply to Operations * (Select at least one)
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '10px'
            }}>
              {operations.map((operation) => {
                const isSelected = (newCharge.applicable_to || []).includes(operation);
                return (
                  <label
                    key={operation}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '12px',
                      background: isSelected ? THEME.colors.primary : '#f5f5f5',
                      color: isSelected ? '#fff' : '#000',
                      border: '2px solid #000',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: isSelected ? '700' : '400',
                      transition: 'all 0.2s'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleOperation(operation)}
                      style={{ marginRight: '8px', cursor: 'pointer' }}
                    />
                    {operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </label>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: '12px 32px',
              background: THEME.colors.success,
              color: '#fff',
              border: '2px solid #000',
              borderRadius: THEME.radius.button,
              fontWeight: '900',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: THEME.shadows.button,
              width: '100%'
            }}
          >
            💾 Create Service Charge
          </button>
        </form>
      </div>

      {/* Existing Charges List */}
      <div style={{
        background: '#fff',
        padding: '24px',
        borderRadius: THEME.radius.card,
        border: '2px solid #000',
        boxShadow: THEME.shadows.card
      }}>
        <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '900' }}>
          📋 Existing Service Charges ({charges.length})
        </h4>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', animation: 'spin 1s linear infinite' }}>⏳</div>
            <p>Loading charges...</p>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : charges.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <p>No service charges configured yet. Create one above!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {charges.map((charge) => (
              <div
                key={charge.id}
                style={{
                  padding: '16px',
                  background: charge.is_active ? '#fff' : '#f5f5f5',
                  border: '2px solid #000',
                  borderRadius: '8px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  opacity: charge.is_active ? 1 : 0.6
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: '900' }}>
                      {charge.name}
                    </h5>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: charge.charge_type === 'fixed' ? THEME.colors.info : THEME.colors.warning,
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}>
                      {charge.charge_type}
                    </span>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      background: charge.is_active ? THEME.colors.success : '#95a5a6',
                      color: '#fff',
                      fontSize: '11px',
                      fontWeight: '700'
                    }}>
                      {charge.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 8px 0', color: '#666', fontSize: '14px' }}>
                    {charge.description || 'No description'}
                  </p>
                  <div style={{ fontSize: '20px', fontWeight: '900', color: THEME.colors.primary, marginBottom: '8px' }}>
                    {charge.charge_type === 'percentage' ? `${charge.rate}%` : `GHS ${charge.rate}`}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {charge.applicable_to.map((op, i) => (
                      <span
                        key={i}
                        style={{
                          padding: '4px 8px',
                          background: THEME.colors.secondary,
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: '600'
                        }}
                      >
                        {op.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button
                    onClick={() => handleToggleActive(charge.id)}
                    style={{
                      padding: '8px 16px',
                      background: charge.is_active ? '#ffc107' : THEME.colors.success,
                      color: '#fff',
                      border: '2px solid #000',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {charge.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </button>
                  <button
                    onClick={() => handleDeleteCharge(charge.id)}
                    style={{
                      padding: '8px 16px',
                      background: THEME.colors.danger,
                      color: '#fff',
                      border: '2px solid #000',
                      borderRadius: '6px',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceChargesSection;