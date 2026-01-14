import React from 'react';
import { apiService, ServiceCharge, ServiceChargeCalculation, InterestCalculationResult, CommissionCalculationResult, ChargeBreakdownItem } from '../services/api';
import { formatCurrencyGHS } from '../utils/formatters';
import './ServiceChargesSection.css';



interface ServiceChargesSectionProps {
  newCharge: ServiceCharge;
  setNewCharge: (charge: ServiceCharge) => void;
  serviceChargeCalculation: ServiceChargeCalculation | null;
  setServiceChargeCalculation: (calc: ServiceChargeCalculation | null) => void;
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
    <div className="service-charges-container">
      <h3 className="section-header">
        Service Charge Management
      </h3>

      <div className="grid-layout">
        {/* Create Service Charge */}
        <div className="card-panel">
          <h4 className="card-title">Create New Service Charge</h4>

          <div className="form-group-column">
            <input
              type="text"
              placeholder="Charge Name"
              value={newCharge.name}
              onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
              className="input-field"
            />

            <textarea
              placeholder="Description"
              value={newCharge.description}
              onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
              className="textarea-field"
            />

            <select
              title="Charge Type"
              value={newCharge.charge_type}
              onChange={(e) => setNewCharge({ ...newCharge, charge_type: e.target.value })}
              className="select-field"
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
            </select>

            <input
              type="number"
              placeholder={newCharge.charge_type === 'percentage' ? 'Rate (%)' : 'Fixed Amount (GHS)'}
              value={newCharge.rate}
              onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })}
              className="input-field"
            />

            <div>
              <label className="label-group">
                Applicable to:
              </label>
              <div className="checkbox-group">
                {['deposit', 'withdrawal', 'transfer'].map(type => (
                  <label key={type} className="checkbox-label">
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
              className="btn-submit"
            >
              Create Service Charge
            </button>
          </div>
        </div>

        {/* Service Charge Calculator */}
        <div className="card-panel">
          <h4 className="card-title">Service Charge Calculator</h4>

          <div className="form-group-column">
            <select
              title="Transaction Type"
              onChange={(e) => setServiceChargeCalculation({ ...serviceChargeCalculation, transaction_type: e.target.value })}
              className="select-field"
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
              className="input-field"
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
                  setServiceChargeCalculation(result.data as ServiceChargeCalculation);
                } else {
                  alert('Failed to calculate service charge: ' + result.error);
                }
              }}
              className="btn-submit"
            >
              Calculate Charge
            </button>

            {serviceChargeCalculation && serviceChargeCalculation.charge_breakdown && (
              <div className="result-panel">
                <h5 className="result-title">Calculation Result</h5>
                <div className="result-details">
                  <div>Transaction Amount: {formatCurrencyGHS(serviceChargeCalculation.transaction_amount)}</div>
                  <div>Total Service Charge: {formatCurrencyGHS(serviceChargeCalculation.total_service_charge)}</div>
                  <div>Net Amount: {formatCurrencyGHS(serviceChargeCalculation.net_amount)}</div>

                  {serviceChargeCalculation.charge_breakdown.map((charge: ChargeBreakdownItem, index: number) => (
                    <div key={index} className="breakdown-item">
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
      <div className="card-panel mt-24">
        <h4 className="card-title">Interest Calculator</h4>

        <div className="form-group-column">
          <p className="calculator-desc">
            Calculate interest on all active loans based on client behavior and contribution history.
          </p>

          <button
            onClick={async () => {
              const result = await apiService.calculateInterest();
              if (result.success) {
                setServiceChargeCalculation({
                  ...serviceChargeCalculation,
                  interestCalculation: result.data as InterestCalculationResult
                });
              } else {
                alert('Failed to calculate interest: ' + result.error);
              }
            }}
            className="btn-submit"
          >
            Calculate Interest
          </button>

          {serviceChargeCalculation?.interestCalculation && (
            <div className="result-panel">
              <h5 className="result-title">Interest Calculation Results</h5>
              <div className="result-details">
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
      <div className="card-panel mt-24">
        <h4 className="card-title">Commission Calculator</h4>

        <div className="form-group-column">
          <p className="calculator-desc">
            Calculate commissions based on transaction activity and service charges.
          </p>

          <button
            onClick={async () => {
              const result = await apiService.calculateCommission();
              if (result.success) {
                setServiceChargeCalculation({
                  ...serviceChargeCalculation,
                  commissionCalculation: result.data as CommissionCalculationResult
                });
              } else {
                alert('Failed to calculate commission: ' + result.error);
              }
            }}
            className="btn-submit"
          >
            Calculate Commission
          </button>

          {serviceChargeCalculation?.commissionCalculation && (
            <div className="result-panel">
              <h5 className="result-title">Commission Summary</h5>
              <div className="result-details">
                <div>All Time Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.all_time_total)}</div>

                <div className="commission-summary-section">
                  <h6 className="summary-subtitle">Daily Summary</h6>
                  <div>Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.daily.total)}</div>
                  <div className="summary-list">
                    {Object.entries(serviceChargeCalculation.commissionCalculation.daily.by_type).map(([type, amount]) => (
                      <div key={type}>{type}: {formatCurrencyGHS(Number(amount))}</div>
                    ))}
                  </div>
                </div>

                <div className="commission-summary-section">
                  <h6 className="summary-subtitle">Weekly Summary</h6>
                  <div>Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.weekly.total)}</div>
                  <div className="summary-list">
                    {Object.entries(serviceChargeCalculation.commissionCalculation.weekly.by_type).map(([type, amount]) => (
                      <div key={type}>{type}: {formatCurrencyGHS(Number(amount))}</div>
                    ))}
                  </div>
                </div>

                <div className="commission-summary-section">
                  <h6 className="summary-subtitle">Monthly Summary</h6>
                  <div>Total: {formatCurrencyGHS(serviceChargeCalculation.commissionCalculation.monthly.total)}</div>
                  <div className="summary-list">
                    {Object.entries(serviceChargeCalculation.commissionCalculation.monthly.by_type).map(([type, amount]) => (
                      <div key={type}>{type}: {formatCurrencyGHS(Number(amount))}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Active Service Charges */}
      <div className="active-charges-section">
        <h4 className="card-title">Active Service Charges</h4>
        <div className="active-charges-grid">
          {serviceCharges?.map((charge, index) => (
            <div key={index} className="charge-card">
              <div className="charge-card-header">
                <h5 className="charge-card-name">{charge.name}</h5>
                <span className={`badge ${charge.charge_type === 'percentage' ? 'badge-percentage' : 'badge-fixed'}`}>
                  {charge.charge_type}
                </span>
              </div>
              <p className="charge-card-desc">{charge.description}</p>
              <div className="charge-card-rate">
                {charge.rate}{charge.charge_type === 'percentage' ? '%' : ' GHS'}
              </div>
              <div className="charge-card-footer">
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
