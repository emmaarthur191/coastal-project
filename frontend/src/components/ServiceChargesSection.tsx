import React from 'react';
import { apiService } from '../services/api.ts';
import { formatCurrencyGHS } from '../utils/formatters';

interface ServiceCharge {
  id?: number;
  name: string;
  description: string;
  charge_type: string;
  rate: string | number;
  [key: string]: any;
}

interface ServiceChargesSectionProps {
  newCharge: ServiceCharge;
  setNewCharge: (charge: ServiceCharge) => void;
  serviceChargeCalculation: any;
  setServiceChargeCalculation: (calc: any) => void;
  serviceCharges: ServiceCharge[];
  fetchServiceCharges: () => void;
}

const ServiceChargesSection: React.FC<ServiceChargesSectionProps> = ({
  newCharge,
  setNewCharge,
  serviceChargeCalculation,
  setServiceChargeCalculation,
  serviceCharges,
  fetchServiceCharges
}) => {
  return (
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '30px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0'
    }}>
      <h3 style={{
        margin: '0 0 24px 0',
        color: '#1e293b',
        fontSize: '20px',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        Service Charge Management
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Create Service Charge */}
        <div style={{
          background: '#f8fafc',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Create New Service Charge</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              type="text"
              placeholder="Charge Name"
              value={newCharge.name}
              onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />

            <textarea
              placeholder="Description"
              value={newCharge.description}
              onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '60px'
              }}
            />

            <select
              value={newCharge.charge_type}
              onChange={(e) => setNewCharge({ ...newCharge, charge_type: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>

            <input
              type="number"
              placeholder={newCharge.charge_type === 'percentage' ? 'Rate (%)' : 'Fixed Amount (GHS)'}
              value={newCharge.rate}
              onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />

            <div>
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                Applicable to:
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                {['deposit', 'withdrawal', 'transfer'].map(type => (
                  <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input
                      type="checkbox"
                      checked={newCharge.applicable_to.includes(type)}
                      onChange={(e) => {
                        const updated = e.target.checked
                          ? [...newCharge.applicable_to, type]
                          : newCharge.applicable_to.filter(t => t !== type);
                        setNewCharge({ ...newCharge, applicable_to: updated });
                      }}
                    />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={async () => {
                const result = await apiService.createServiceCharge(newCharge);
                if (result.success) {
                  alert('Service charge created successfully!');
                  setNewCharge({
                    name: '',
                    description: '',
                    charge_type: 'percentage',
                    rate: '',
                    applicable_to: []
                  });
                  // Refresh service charges
                  fetchServiceCharges();
                } else {
                  alert('Failed to create service charge: ' + result.error);
                }
              }}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Create Service Charge
            </button>
          </div>
        </div>

        {/* Service Charge Calculator */}
        <div style={{
          background: '#f8fafc',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Service Charge Calculator</h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <select
              onChange={(e) => setServiceChargeCalculation({ ...serviceChargeCalculation, transaction_type: e.target.value })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            >
              <option value="">Select Transaction Type</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer">Transfer</option>
            </select>

            <input
              type="number"
              placeholder="Transaction Amount (GHS)"
              onChange={(e) => setServiceChargeCalculation({ ...serviceChargeCalculation, amount: parseFloat(e.target.value) })}
              style={{
                padding: '10px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px'
              }}
            />

            <button
              onClick={async () => {
                if (!serviceChargeCalculation?.transaction_type || !serviceChargeCalculation?.amount) {
                  alert('Please select transaction type and enter amount');
                  return;
                }

                const result = await apiService.calculateServiceCharge({
                  transaction_type: serviceChargeCalculation.transaction_type,
                  amount: serviceChargeCalculation.amount
                });

                if (result.success) {
                  setServiceChargeCalculation(result.data);
                } else {
                  alert('Failed to calculate service charge: ' + result.error);
                }
              }}
              style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Calculate Charge
            </button>

            {serviceChargeCalculation && serviceChargeCalculation.charge_breakdown && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                background: 'white',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h5 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Calculation Result</h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div>Transaction Amount: {formatCurrencyGHS(serviceChargeCalculation.transaction_amount)}</div>
                  <div>Total Service Charge: {formatCurrencyGHS(serviceChargeCalculation.total_service_charge)}</div>
                  <div>Net Amount: {formatCurrencyGHS(serviceChargeCalculation.net_amount)}</div>

                  {serviceChargeCalculation.charge_breakdown.map((charge, index) => (
                    <div key={index} style={{ padding: '8px', background: '#f3f4f6', borderRadius: '4px' }}>
                      {charge.name}: {formatCurrencyGHS(charge.amount)} ({charge.type}: {charge.rate}{charge.type === 'percentage' ? '%' : ' GHS'})
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interest Calculator */}
      <div style={{
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginTop: '24px'
      }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Interest Calculator</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Calculate interest on all active loans based on client behavior and contribution history.
          </p>

          <button
            onClick={async () => {
              const result = await apiService.calculateInterest();
              if (result.success) {
                setServiceChargeCalculation({ ...serviceChargeCalculation, interestCalculation: result.data });
              } else {
                alert('Failed to calculate interest: ' + result.error);
              }
            }}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Calculate Interest
          </button>

          {serviceChargeCalculation?.interestCalculation && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h5 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Interest Calculation Results</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div>Principal Amount: {formatCurrencyGHS(serviceChargeCalculation.interestCalculation.principal)}</div>
                <div>Annual Interest Rate: {serviceChargeCalculation.interestCalculation.annual_rate}%</div>
                <div>Time Period: {serviceChargeCalculation.interestCalculation.time_period_months} months</div>
                <div>Compounding Frequency: {serviceChargeCalculation.interestCalculation.compounding_frequency}</div>
                <div>Interest Amount: {formatCurrencyGHS(serviceChargeCalculation.interestCalculation.interest_amount)}</div>
                <div>Final Amount: {formatCurrencyGHS(serviceChargeCalculation.interestCalculation.final_amount)}</div>
                <div>Account Type: {serviceChargeCalculation.interestCalculation.account_type}</div>
                {serviceChargeCalculation.interestCalculation.monthly_payment && (
                  <div>Monthly Payment: {formatCurrencyGHS(serviceChargeCalculation.interestCalculation.monthly_payment)}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Commission Calculator */}
      <div style={{
        background: '#f8fafc',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginTop: '24px'
      }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Commission Calculator</h4>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Calculate commissions based on transaction activity and service charges.
          </p>

          <button
            onClick={async () => {
              const result = await apiService.calculateCommission();
              if (result.success) {
                setServiceChargeCalculation({ ...serviceChargeCalculation, commissionCalculation: result.data });
              } else {
                alert('Failed to calculate commission: ' + result.error);
              }
            }}
            style={{
              padding: '12px',
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Calculate Commission
          </button>

          {serviceChargeCalculation?.commissionCalculation && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h5 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Commission Summary</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div>All Time Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.all_time_total)}</div>

                <div style={{ marginTop: '12px' }}>
                  <h6 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Daily Summary</h6>
                  <div>Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.daily.total)}</div>
                  <div style={{ marginLeft: '12px' }}>
                    {Object.entries(serviceChargeCalculation.commissionCalculation.daily.by_type).map(([type, amount]) => (
                      <div key={type}>{type}: {formatCurrencyGHS(amount)}</div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <h6 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Weekly Summary</h6>
                  <div>Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.weekly.total)}</div>
                  <div style={{ marginLeft: '12px' }}>
                    {Object.entries(serviceChargeCalculation.commissionCalculation.weekly.by_type).map(([type, amount]) => (
                      <div key={type}>{type}: {formatCurrencyGHS(amount)}</div>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <h6 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>Monthly Summary</h6>
                  <div>Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.monthly.total)}</div>
                  <div style={{ marginLeft: '12px' }}>
                    {Object.entries(serviceChargeCalculation.commissionCalculation.monthly.by_type).map(([type, amount]) => (
                      <div key={type}>{type}: {formatCurrencyGHS(amount)}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Service Charges */}
      <div style={{ marginTop: '24px' }}>
        <h4 style={{ margin: '0 0 16px 0', color: '#1e293b' }}>Active Service Charges</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {serviceCharges?.map((charge, index) => (
            <div key={index} style={{
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h5 style={{ margin: 0, color: '#1e293b' }}>{charge.name}</h5>
                <span style={{
                  background: charge.charge_type === 'percentage' ? '#dbeafe' : '#fef3c7',
                  color: charge.charge_type === 'percentage' ? '#1e40af' : '#92400e',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  {charge.charge_type}
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', color: '#64748b', fontSize: '14px' }}>{charge.description}</p>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                {charge.rate}{charge.charge_type === 'percentage' ? '%' : ' GHS'}
              </div>
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                Applies to: {charge.applicable_to.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ServiceChargesSection;
