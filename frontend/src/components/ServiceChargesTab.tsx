import React from 'react';
import { formatCurrencyGHS } from '../utils/formatters';

// --- PLAYFUL UI THEME CONSTANTS ---
const THEME = {
  colors: {
    bg: '#FFF0F5', // Lavender Blush
    primary: '#6C5CE7', // Purple
    secondary: '#00CEC9', // Teal
    success: '#00B894', // Green
    danger: '#FF7675', // Salmon
    warning: '#FDCB6E', // Mustard
    sidebar: '#FFFFFF',
    text: '#2D3436',
    border: '#dfe6e9',
  },
  shadows: {
    card: '0 8px 0px rgba(0,0,0,0.1)',
    button: '0 4px 0px rgba(0,0,0,0.2)',
    active: '0 2px 0px rgba(0,0,0,0.2)',
  },
  radius: {
    card: '24px',
    button: '50px',
  }
};

// --- STYLED WRAPPERS ---
const PlayfulCard = ({ children, color = '#FFFFFF', style = {} }) => (
  <div style={{
    background: color,
    borderRadius: THEME.radius.card,
    border: '3px solid #000000',
    boxShadow: THEME.shadows.card,
    padding: '24px',
    marginBottom: '24px',
    overflow: 'hidden',
    ...style
  }}>
    {children}
  </div>
);

const PlayfulButton = ({ children, onClick, variant = 'primary', style = {} }) => (
  <button
    onClick={onClick}
    style={{
      background: variant === 'danger' ? THEME.colors.danger : THEME.colors.primary,
      color: 'white',
      border: '3px solid #000000',
      padding: '12px 24px',
      borderRadius: THEME.radius.button,
      fontWeight: '900',
      fontSize: '16px',
      cursor: 'pointer',
      boxShadow: THEME.shadows.button,
      transition: 'all 0.1s',
      ...style
    }}
    onMouseDown={e => {
      e.currentTarget.style.transform = 'translateY(4px)';
      e.currentTarget.style.boxShadow = THEME.shadows.active;
    }}
    onMouseUp={e => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = THEME.shadows.button;
    }}
  >
    {children}
  </button>
);

interface ServiceChargesTabProps {
  serviceCharges: any[];
  newCharge: any;
  setNewCharge: React.Dispatch<React.SetStateAction<any>>;
  serviceChargeCalculation: any;
  setServiceChargeCalculation: React.Dispatch<React.SetStateAction<any>>;
  authService: any;
  refetchCharges: () => void;
}

const ServiceChargesTab: React.FC<ServiceChargesTabProps> = ({
  serviceCharges, newCharge, setNewCharge, serviceChargeCalculation,
  setServiceChargeCalculation, authService, refetchCharges
}) => {

  const handleCreateCharge = async () => {
    const result = await authService.createServiceCharge(newCharge);
    if (result.success) {
      alert('Service charge created successfully!');
      setNewCharge({
        name: '',
        description: '',
        charge_type: 'percentage',
        rate: '',
        applicable_to: []
      });
      refetchCharges();
    } else {
      alert('Failed to create service charge: ' + result.error);
    }
  };

  const handleCalculateCharge = async () => {
    if (!serviceChargeCalculation?.transaction_type || !serviceChargeCalculation?.amount) {
      alert('Please select transaction type and enter amount');
      return;
    }

    const result = await authService.calculateServiceCharge({
      transaction_type: serviceChargeCalculation.transaction_type,
      amount: serviceChargeCalculation.amount
    });

    if (result.success) {
      setServiceChargeCalculation(result.data);
    } else {
      alert('Failed to calculate service charge: ' + result.error);
    }
  };

  const applicableTypes = ['deposit', 'withdrawal', 'transfer'];

  return (
    <PlayfulCard>
      <h3 style={{ fontSize: '24px', fontWeight: '900', color: THEME.colors.text, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        💸 Service Charge Management
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
        {/* Create Service Charge */}
        <PlayfulCard color="#f8f9fa" style={{ marginBottom: '0' }}>
          <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: THEME.colors.text }}>➕ Create New Service Charge</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="text" placeholder="Charge Name" value={newCharge.name} onChange={(e) => setNewCharge({...newCharge, name: e.target.value})}
              style={{ padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px' }} />
            <textarea placeholder="Description" value={newCharge.description} onChange={(e) => setNewCharge({...newCharge, description: e.target.value})}
              style={{ padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px', minHeight: '60px' }} />

            <select value={newCharge.charge_type} onChange={(e) => setNewCharge({...newCharge, charge_type: e.target.value})}
              style={{ padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px' }}>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>

            <input type="number" placeholder={newCharge.charge_type === 'percentage' ? 'Rate (%)' : 'Fixed Amount (GHS)'} value={newCharge.rate} onChange={(e) => setNewCharge({...newCharge, rate: e.target.value})}
              style={{ padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px' }} />

            <div>
              <label style={{ fontSize: '16px', fontWeight: '600', color: THEME.colors.text, display: 'block', marginBottom: '8px' }}>
                Applicable to:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {applicableTypes.map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '2px solid #ddd' }}>
                    <input type="checkbox" checked={newCharge.applicable_to.includes(type)} onChange={(e) => {
                      const updated = e.target.checked ? [...newCharge.applicable_to, type] : newCharge.applicable_to.filter((t: string) => t !== type);
                      setNewCharge({...newCharge, applicable_to: updated});
                    }} />
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <PlayfulButton onClick={handleCreateCharge} style={{ width: '100%', justifyContent: 'center' }}>
              Create Service Charge
            </PlayfulButton>
          </div>
        </PlayfulCard>

        {/* Service Charge Calculator */}
        <PlayfulCard color="#f8f9fa" style={{ marginBottom: '0' }}>
          <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: THEME.colors.text }}>🧮 Service Charge Calculator</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select onChange={(e) => setServiceChargeCalculation(c => ({...c, transaction_type: e.target.value}))}
              style={{ padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px' }}>
              <option value="">Select Transaction Type</option>
              {applicableTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
            </select>

            <input type="number" placeholder="Transaction Amount (GHS)" onChange={(e) => setServiceChargeCalculation(c => ({...c, amount: parseFloat(e.target.value)}))}
              style={{ padding: '12px', borderRadius: '8px', border: '2px solid #ddd', fontSize: '16px' }} />

            <PlayfulButton onClick={handleCalculateCharge} variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Calculate Charge
            </PlayfulButton>

            {serviceChargeCalculation && serviceChargeCalculation.charge_breakdown && (
              <div style={{ marginTop: '16px', padding: '16px', background: '#fff', borderRadius: '12px', border: '2px solid #ddd' }}>
                <h5 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', color: THEME.colors.text }}>Calculation Result</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                    <p><strong>Transaction Amount:</strong> {formatCurrencyGHS(serviceChargeCalculation.transaction_amount)}</p>
                    <p><strong>Total Service Charge:</strong> {formatCurrencyGHS(serviceChargeCalculation.total_service_charge)}</p>
                    <p><strong>Net Amount:</strong> {formatCurrencyGHS(serviceChargeCalculation.net_amount)}</p>

                    <h6 style={{ fontSize: '14px', fontWeight: '600', marginTop: '8px', color: THEME.colors.text }}>Breakdown:</h6>
                    {serviceChargeCalculation.charge_breakdown.map((charge: any, index: number) => (
                        <div key={index} style={{ padding: '8px', background: '#f0f0f0', borderRadius: '8px', border: '1px solid #ddd' }}>
                            {charge.name}: {formatCurrencyGHS(charge.amount)} ({charge.type}: <strong>{charge.rate}{charge.type === 'percentage' ? '%' : ' GHS'}</strong>)
                        </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </PlayfulCard>
      </div>

      {/* Active Service Charges List */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: THEME.colors.text }}>📋 Active Service Charges</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {serviceCharges.map((charge: any, index: number) => (
            <div key={index} style={{ padding: '16px', background: '#f8f9fa', borderRadius: '12px', border: '2px solid #ddd' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h5 style={{ fontSize: '16px', fontWeight: '700', color: THEME.colors.text }}>{charge.name}</h5>
                <span style={{
                  background: charge.charge_type === 'percentage' ? THEME.colors.primary : THEME.colors.warning,
                  color: 'white',
                  border: 'none', padding: '4px 8px', fontSize: '11px', borderRadius: '12px', fontWeight: 'bold'
                }}>
                  {charge.charge_type.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>{charge.description}</p>
              <div style={{ fontSize: '16px', fontWeight: '700', color: THEME.colors.text }}>
                  <strong>{charge.rate}{charge.charge_type === 'percentage' ? '%' : ' GHS'}</strong>
              </div>
              <div style={{ fontSize: '12px', marginTop: '8px', color: '#666', textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Applies to: <strong>{charge.applicable_to.map((t: string) => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PlayfulCard>
  );
};

export default ServiceChargesTab;