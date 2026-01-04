import React from 'react';

function DashboardDropdown({ showDropdown, setShowDropdown, dashboardData, staffPerformance }) {
  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      right: '20px',
      transform: 'translateY(-50%)',
      zIndex: 1000
    }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
          transition: 'all 0.3s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(220, 38, 38, 0.4)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.3)';
        }}
      >
        {showDropdown ? '' : ''}
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '70px',
          right: '0',
          background: 'white',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          border: '2px solid #dc2626',
          minWidth: '400px',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          {/* Staff Performance */}
          <div style={{
            marginBottom: '24px',
            borderBottom: '1px solid #e5e7eb',
            paddingBottom: '20px'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              color: '#1e293b',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}></span>
              Staff Performance
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {staffPerformance.map((staff, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#1e40af';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = 'inherit';
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: '600',
                    marginRight: '10px',
                    fontSize: '12px'
                  }}>
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: 'inherit',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>
                      {staff.name}
                    </div>
                    <div style={{
                      color: 'inherit',
                      fontSize: '11px',
                      opacity: 0.8
                    }}>
                      {staff.role}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: 'inherit',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {staff.efficiency}
                    </div>
                    <div style={{
                      color: 'inherit',
                      fontSize: '11px',
                      opacity: 0.8
                    }}>
                      Efficiency
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Approvals */}
          <div>
            <h3 style={{
              margin: '0 0 16px 0',
              color: '#1e293b',
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ fontSize: '20px' }}>⏳</span>
              Pending Approvals
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {(dashboardData?.pending_approvals || [
                { type: 'Loan Application', applicant: 'Kofi Asare', amount: 'GHS 25,000', days: 2 },
                { type: 'Overdraft Request', applicant: 'Abena Konadu', amount: 'GHS 5,000', days: 1 },
                { type: 'Account Upgrade', applicant: 'Yaw Boateng', amount: 'Premium', days: 3 }
              ]).map((approval, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#fef2f2',
                  borderRadius: '8px',
                  border: '1px solid #fecaca'
                }}>
                  <div>
                    <div style={{
                      color: '#1e293b',
                      fontWeight: '600',
                      fontSize: '13px'
                    }}>
                      {approval.type}
                    </div>
                    <div style={{
                      color: '#64748b',
                      fontSize: '11px'
                    }}>
                      {approval.applicant}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      color: '#1e293b',
                      fontWeight: '700',
                      fontSize: '13px'
                    }}>
                      {approval.amount}
                    </div>
                    <div style={{
                      color: '#dc2626',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {approval.days}d ago
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button style={{
              width: '100%',
              padding: '10px',
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              marginTop: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(220, 38, 38, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}>
              Review All Approvals
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardDropdown;
