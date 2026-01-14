import React, { useState, useEffect } from 'react';
import { formatCurrencyGHS } from '../utils/formatters';
import { sanitizeUserInput } from '../utils/sanitizer';
import { apiService } from '../services/api';
import { Account } from '../api/models/Account';
import { Input } from '../components/ui/Input';
import './Transfer.css';

function Transfer() {
  const [formData, setFormData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    description: '',
    pin: ''
  });
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const result = await apiService.getAccounts();
        if (result.success && result.data) {
          setAccounts(result.data);
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      }
    };
    fetchAccounts();
  }, []);

  const transferHistory = [
    { to: 'Kwame Asare', amount: -500, date: '2025-10-08', status: 'completed' },
    { to: 'Abena Mensah', amount: -1000, date: '2025-10-05', status: 'completed' },
    { to: 'Coastal Utilities', amount: -250, date: '2025-10-01', status: 'completed' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else {
      setIsSubmitting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsSubmitting(false);
      setShowConfirmation(true);
    }
  };

  const handleNewTransfer = () => {
    setFormData({
      fromAccount: '',
      toAccount: '',
      amount: '',
      description: '',
      pin: ''
    });
    setStep(1);
    setShowConfirmation(false);
  };

  const selectedFromAccount = accounts.find(acc => acc.id === Number(formData.fromAccount));
  const transferFee = 1.50; // GHS
  const totalAmount = parseFloat(formData.amount || "0") + transferFee;

  return (
    <div className="transfer-page">
      {/* Header */}
      <div className="transfer-header-section">
        <div className="header-content">
          <div>
            <h1 className="header-title">
              Transfer Funds
            </h1>
            <p className="header-subtitle">
              Send money securely to other accounts
            </p>
          </div>
          {/* Progress Steps */}
          <div className="progress-steps">
            {[1, 2].map((stepNumber) => (
              <div key={stepNumber} className="step-item">
                <div className={`step-badge ${step >= stepNumber ? 'active' : ''}`}>
                  {stepNumber}
                </div>
                <div className={`step-label ${step >= stepNumber ? 'active' : ''}`}>
                  {stepNumber === 1 ? 'Details' : 'Confirm'}
                </div>
                {stepNumber < 2 && (
                  <div className={`step-connector ${step > stepNumber ? 'active' : ''}`}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="transfer-main-grid">
        {/* Transfer Form */}
        <div className="transfer-card">
          {!showConfirmation ? (
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <>
                  <h3 className="section-title">
                    Transfer Details
                  </h3>

                  {/* From Account */}
                  <div className="form-group">
                    <Input
                      as="select"
                      label="From Account"
                      name="fromAccount"
                      id="fromAccount"
                      title="Select source account"
                      value={formData.fromAccount}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select source account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          Account {account.account_number} - {formatCurrencyGHS(parseFloat(account.balance || "0"))}
                        </option>
                      ))}
                    </Input>
                  </div>


                  {/* To Account */}
                  <div className="form-group">
                    <Input
                      label="To Account"
                      name="toAccount"
                      id="toAccount"
                      title="Enter recipient account number or member name"
                      value={formData.toAccount}
                      onChange={handleInputChange}
                      placeholder="Enter account number or member name"
                      required
                    />
                  </div>


                  {/* Amount */}
                  <div className="form-group">
                    <Input
                      type="number"
                      label="Amount (GHS)"
                      name="amount"
                      id="amount"
                      title="Enter transfer amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>


                  {/* Description */}
                  <div className="form-group">
                    <Input
                      label="Description"
                      name="description"
                      id="description"
                      title="Enter a description for the transfer"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="e.g. For project expenses"
                      required
                    />
                  </div>


                  <button
                    type="submit"
                    className="btn-continue"
                  >
                    Continue to Review
                  </button>
                </>
              ) : (
                <>
                  <h3 className="section-title">
                    Confirm Transfer
                  </h3>

                  {/* Transfer Summary */}
                  <div className="confirm-summary">
                    <div className="summary-row-value summary-align-right">
                      <div>{selectedFromAccount && `Account ${selectedFromAccount.account_number}`}</div>
                    </div>
                    <div className="summary-row">
                      <div className="summary-row-label">To Account</div>
                      <div className="summary-row-value">{sanitizeUserInput(formData.toAccount)}</div>
                    </div>
                    <div className="summary-row">
                      <div className="summary-row-label">Amount</div>
                      <div className="summary-row-value amount">
                        -{formatCurrencyGHS(parseFloat(formData.amount))}
                      </div>
                    </div>
                    <div className="summary-row">
                      <div className="summary-row-label">Transfer Fee</div>
                      <div className="summary-row-value">{formatCurrencyGHS(transferFee)}</div>
                    </div>
                    <div className="summary-row total">
                      <div className="summary-row-label">Total</div>
                      <div className="summary-row-value total">
                        {formatCurrencyGHS(totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* PIN Verification */}
                  <div className="form-group">
                    <Input
                      type="password"
                      label="Enter PIN for Authorization"
                      name="pin"
                      id="pin"
                      title="Enter your 4-digit security PIN"
                      value={formData.pin}
                      onChange={handleInputChange}
                      placeholder="Enter your 4-digit PIN"
                      maxLength={4}
                      required
                      className="text-center pin-input"
                    />
                  </div>


                  <div className="btn-group">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn-back"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-confirm"
                    >
                      {isSubmitting ? (
                        <div className="spinner-wrapper">
                          <div className="spinner"></div>
                          Processing...
                        </div>
                      ) : (
                        'Confirm Transfer'
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          ) : (
            /* Success Confirmation */
            <div className="success-section">
              <div className="success-icon-badge">
                {/* Icon placeholder or SVG can go here */}
              </div>
              <h3 className="section-title">
                Transfer Successful!
              </h3>
              <p className="header-subtitle success-subtitle">
                Your transfer of {formatCurrencyGHS(parseFloat(formData.amount))} has been processed successfully.
              </p>
              <div className="success-summary-box">
                <div className="success-row">
                  <span className="success-row-label">Reference:</span>
                  <span className="mono">TX-987654</span>
                </div>
                <div className="success-row">
                  <span className="success-row-label">Date:</span>
                  <span>{new Date().toLocaleDateString()}</span>
                </div>
                <div className="success-row">
                  <span className="success-row-label">Status:</span>
                  <span className="status">Completed</span>
                </div>
              </div>
              <div className="receipt-btn-group">
                <button className="btn-receipt">
                  Download Receipt
                </button>
                <button
                  onClick={handleNewTransfer}
                  className="btn-new-transfer"
                >
                  New Transfer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transfer History */}
        <div className="history-card">
          <h4 className="section-title history-title">
            Recent Transfers
          </h4>

          <div className="history-list">
            {transferHistory.map((transfer, index) => (
              <div key={index} className="history-item">
                <div className="history-icon">
                  ↗
                </div>
                <div className="history-details">
                  <div className="history-name">
                    {sanitizeUserInput(transfer.to)}
                  </div>
                  <div className="history-date">
                    {transfer.date}
                  </div>
                </div>
                <div className={`history-amount ${transfer.amount < 0 ? 'amount-negative' : 'amount-positive'}`}>
                  {formatCurrencyGHS(transfer.amount)}
                </div>
              </div>
            ))}
          </div>

          <button className="btn-history-view">
            View Full History
          </button>
        </div>
      </div>
    </div>
  );
}

export default Transfer;
