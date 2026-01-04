import React, { useState, useEffect } from 'react';
import { formatCurrencyGHS } from '../utils/formatters';
import { sanitizeUserInput } from '../utils/sanitizer';
import { apiService } from '../services/api';

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

  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await apiService.getAccounts();
        if (Array.isArray(data)) {
          setAccounts(data);
        } else if ((data as any).results && Array.isArray((data as any).results)) {
          setAccounts((data as any).results);
        }
      } catch (err) {
        console.error("Failed to fetch accounts", err);
      } finally {
        setAccountsLoading(false);
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

  const selectedFromAccount = accounts.find(acc => acc.id === formData.fromAccount);
  const transferFee = 1.50; // GHS
  const totalAmount = parseFloat(formData.amount || 0) + transferFee;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '30px',
        marginBottom: '24px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <h1 style={{
              margin: '0 0 8px 0',
              color: '#1e293b',
              fontSize: '28px',
              fontWeight: '700'
            }}>
              Transfer Funds
            </h1>
            <p style={{
              margin: 0,
              color: '#64748b',
              fontSize: '16px'
            }}>
              Send money securely to other accounts
            </p>
          </div>
          {/* Progress Steps */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {[1, 2].map((stepNumber) => (
              <div key={stepNumber} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  background: step >= stepNumber ? '#3b82f6' : '#e2e8f0',
                  color: step >= stepNumber ? 'white' : '#64748b',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                  {stepNumber}
                </div>
                <div style={{
                  color: step >= stepNumber ? '#3b82f6' : '#64748b',
                  fontWeight: '600',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}>
                  {stepNumber === 1 ? 'Details' : 'Confirm'}
                </div>
                {stepNumber < 2 && (
                  <div style={{
                    width: '20px',
                    height: '2px',
                    background: step > stepNumber ? '#3b82f6' : '#e2e8f0',
                    marginLeft: '8px'
                  }}></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        gap: '24px'
      }}>
        {/* Transfer Form */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '30px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          {!showConfirmation ? (
            <form onSubmit={handleSubmit}>
              {step === 1 ? (
                <>
                  <h3 style={{
                    margin: '0 0 24px 0',
                    color: '#1e293b',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    Transfer Details
                  </h3>

                  {/* From Account */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#374151',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      From Account
                    </label>
                    <select
                      name="fromAccount"
                      value={formData.fromAccount}
                      onChange={handleInputChange}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        background: 'white'
                      }}
                    >
                      <option value="">Select source account</option>
                      {accounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.number}) - {formatCurrencyGHS(account.balance)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To Account */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#374151',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      To Account
                    </label>
                    <input
                      type="text"
                      name="toAccount"
                      value={formData.toAccount}
                      onChange={handleInputChange}
                      placeholder="Enter account number or member name"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  {/* Amount */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#374151',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Amount (GHS)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    />
                  </div>

                  {/* Description */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#374151',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Description
                    </label>
                    <input
                      type="text"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Add a note for this transfer"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px'
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 15px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    Continue to Review
                  </button>
                </>
              ) : (
                <>
                  <h3 style={{
                    margin: '0 0 24px 0',
                    color: '#1e293b',
                    fontSize: '20px',
                    fontWeight: '600'
                  }}>
                    Confirm Transfer
                  </h3>

                  {/* Transfer Summary */}
                  <div style={{
                    background: '#f8fafc',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ color: '#64748b', fontSize: '14px' }}>From Account</div>
                      <div style={{ color: '#1e293b', fontWeight: '600', textAlign: 'right' }}>
                        {selectedFromAccount?.name}<br />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>{selectedFromAccount?.number}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ color: '#64748b', fontSize: '14px' }}>To Account</div>
                      <div style={{ color: '#1e293b', fontWeight: '600' }}>{sanitizeUserInput(formData.toAccount)}</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ color: '#64748b', fontSize: '14px' }}>Amount</div>
                      <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '18px' }}>
                        -{formatCurrencyGHS(parseFloat(formData.amount))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ color: '#64748b', fontSize: '14px' }}>Transfer Fee</div>
                      <div style={{ color: '#64748b', fontWeight: '600' }}>{formatCurrencyGHS(transferFee)}</div>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingTop: '16px',
                      borderTop: '1px solid #e2e8f0'
                    }}>
                      <div style={{ color: '#1e293b', fontSize: '16px', fontWeight: '600' }}>Total</div>
                      <div style={{ color: '#dc2626', fontWeight: '700', fontSize: '20px' }}>
                        -{formatCurrencyGHS(totalAmount)}
                      </div>
                    </div>
                  </div>

                  {/* PIN Verification */}
                  <div style={{ marginBottom: '24px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#374151',
                      fontWeight: '500',
                      fontSize: '14px'
                    }}>
                      Enter PIN for Authorization
                    </label>
                    <input
                      type="password"
                      name="pin"
                      value={formData.pin}
                      onChange={handleInputChange}
                      placeholder="Enter your 4-digit PIN"
                      maxLength="4"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '16px',
                        textAlign: 'center',
                        letterSpacing: '8px'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      style={{
                        flex: 1,
                        padding: '16px',
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '10px',
                        color: '#374151',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#e2e8f0';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = '#f8fafc';
                      }}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        flex: 2,
                        padding: '16px',
                        background: isSubmitting ? '#9ca3af' : 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        border: 'none',
                        borderRadius: '10px',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '600',
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 15px rgba(5, 150, 105, 0.3)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSubmitting) {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                    >
                      {isSubmitting ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <div style={{
                            width: '16px',
                            height: '16px',
                            border: '2px solid transparent',
                            borderTop: '2px solid white',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite'
                          }}></div>
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
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: '#d1fae5',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                color: '#059669',
                margin: '0 auto 24px'
              }}>

              </div>
              <h3 style={{
                margin: '0 0 12px 0',
                color: '#1e293b',
                fontSize: '24px',
                fontWeight: '700'
              }}>
                Transfer Successful!
              </h3>
              <p style={{
                margin: '0 0 24px 0',
                color: '#64748b',
                fontSize: '16px'
              }}>
                Your transfer of {formatCurrencyGHS(parseFloat(formData.amount))} has been processed successfully.
              </p>
              <div style={{
                background: '#f8fafc',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Reference:</span>
                  <span style={{ fontWeight: '600', fontFamily: 'monospace' }}>TX-987654</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ color: '#64748b' }}>Date:</span>
                  <span style={{ fontWeight: '600' }}>{new Date().toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Status:</span>
                  <span style={{ color: '#059669', fontWeight: '600' }}>Completed</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button style={{
                  flex: 1,
                  padding: '12px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  color: '#374151',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}>
                  Download Receipt
                </button>
                <button
                  onClick={handleNewTransfer}
                  style={{
                    flex: 1,
                    padding: '12px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  New Transfer
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transfer History */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          alignSelf: 'flex-start'
        }}>
          <h4 style={{
            margin: '0 0 20px 0',
            color: '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Recent Transfers
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {transferHistory.map((transfer, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  background: '#dbeafe',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  color: '#1e40af',
                  marginRight: '12px'
                }}>
                  ↗
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    color: '#1e293b',
                    fontWeight: '600',
                    fontSize: '14px'
                  }}>
                    {sanitizeUserInput(transfer.to)}
                  </div>
                  <div style={{
                    color: '#64748b',
                    fontSize: '12px'
                  }}>
                    {transfer.date}
                  </div>
                </div>
                <div style={{
                  color: transfer.amount < 0 ? '#dc2626' : '#059669',
                  fontWeight: '700',
                  fontSize: '14px'
                }}>
                  {formatCurrencyGHS(transfer.amount)}
                </div>
              </div>
            ))}
          </div>

          <button style={{
            width: '100%',
            padding: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            color: '#374151',
            fontWeight: '600',
            marginTop: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.color = '#374151';
            }}>
            View Full History
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}

export default Transfer;
