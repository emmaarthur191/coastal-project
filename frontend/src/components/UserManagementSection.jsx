import React from 'react';
import { authService } from '../services/api.ts';

function UserManagementSection({
  formData,
  setFormData,
  otpCode,
  setOtpCode,
  phoneVerified,
  setPhoneVerified,
  otpSent,
  setOtpSent,
  otpExpiresIn,
  setOtpExpiresIn,
  handleSendOTP,
  handleVerifyOTP,
  handleCreateUser,
  staffMembers,
  fetchStaffMembers
}) {
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
         User Management - Create New User
      </h3>
      <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>First Name</label>
          <input
            type="text"
            value={formData.first_name || ''}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>Last Name</label>
          <input
            type="text"
            value={formData.last_name || ''}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>Email</label>
          <input
            type="email"
            value={formData.email || ''}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>Phone Number</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="tel"
              value={formData.phone || ''}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              style={{ flex: 1, padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              required
              placeholder="+233 XX XXX XXXX"
            />
            <button
              type="button"
              onClick={handleSendOTP}
              disabled={otpSent && otpExpiresIn > 0}
              style={{
                padding: '12px 16px',
                background: otpSent && otpExpiresIn > 0 ? '#6b7280' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: otpSent && otpExpiresIn > 0 ? 'not-allowed' : 'pointer'
              }}
            >
              {otpSent && otpExpiresIn > 0 ? `Resend in ${otpExpiresIn}s` : 'Send OTP'}
            </button>
          </div>
        </div>
        {otpSent && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>
              OTP Code {phoneVerified && ''}
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: phoneVerified ? '1px solid #10b981' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  backgroundColor: phoneVerified ? '#f0fdf4' : 'white'
                }}
                placeholder="Enter 6-digit OTP"
                maxLength="6"
              />
              {!phoneVerified && (
                <button
                  type="button"
                  onClick={handleVerifyOTP}
                  style={{
                    padding: '12px 16px',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Verify
                </button>
              )}
            </div>
            {phoneVerified && (
              <div style={{ marginTop: '4px', color: '#10b981', fontSize: '14px' }}>
                 Phone number verified
              </div>
            )}
          </div>
        )}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>Password</label>
          <input
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', color: '#374151', fontWeight: '600' }}>Role</label>
          <select
            value={formData.role || ''}
            onChange={(e) => setFormData({...formData, role: e.target.value})}
            style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            required
          >
            <option value="">Select Role</option>
            <option value="member">Member</option>
            <option value="cashier">Cashier</option>
            <option value="mobile_banker">Mobile Banker</option>
            <option value="manager">Manager</option>
            <option value="operations_manager">Operations Manager</option>
          </select>
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <button
            type="submit"
            disabled={!phoneVerified}
            style={{
              width: '100%',
              padding: '12px',
              background: phoneVerified
                ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
                : '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: phoneVerified ? 'pointer' : 'not-allowed',
              opacity: phoneVerified ? 1 : 0.6
            }}
          >
            {phoneVerified ? 'Create User' : 'Verify Phone to Create User'}
          </button>
        </div>
      </form>

      {/* Staff Management Section */}
      <div style={{ marginTop: '40px', borderTop: '1px solid #e2e8f0', paddingTop: '30px' }}>
        <h3 style={{
          margin: '0 0 24px 0',
          color: '#1e293b',
          fontSize: '20px',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
           Staff Management - Deactivate/Reactivate Staff
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {staffMembers.map((staff) => (
            <div key={staff.id} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px',
              background: staff.is_active ? '#f8fafc' : '#fef2f2',
              borderRadius: '12px',
              border: `1px solid ${staff.is_active ? '#e2e8f0' : '#fecaca'}`,
              opacity: staff.is_active ? 1 : 0.8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: staff.is_active ? '#10b981' : '#ef4444',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '16px'
                }}>
                  {staff.first_name[0]}{staff.last_name[0]}
                </div>
                <div>
                  <div style={{
                    color: '#1e293b',
                    fontWeight: '600',
                    fontSize: '16px',
                    marginBottom: '4px'
                  }}>
                    {staff.first_name} {staff.last_name}
                  </div>
                  <div style={{
                    color: '#64748b',
                    fontSize: '14px',
                    marginBottom: '2px'
                  }}>
                    {staff.email}
                  </div>
                  <div style={{
                    color: '#64748b',
                    fontSize: '12px'
                  }}>
                    {staff.role} • Staff ID: {staff.staff_id || 'Not assigned'} • Joined: {staff.date_joined}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  padding: '6px 12px',
                  background: staff.is_active ? '#dcfce7' : '#fee2e2',
                  color: staff.is_active ? '#166534' : '#dc2626',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'uppercase'
                }}>
                  {staff.is_active ? 'Active' : 'Inactive'}
                </div>

                <button
                  onClick={async () => {
                    const action = staff.is_active ? 'deactivate' : 'reactivate';
                    const confirmMessage = staff.is_active
                      ? `Are you sure you want to deactivate ${staff.first_name} ${staff.last_name}? This will prevent them from logging in and accessing the system.`
                      : `Are you sure you want to reactivate ${staff.first_name} ${staff.last_name}? This will restore their access to the system.`;

                    if (window.confirm(confirmMessage)) {
                      const result = staff.is_active
                        ? await authService.deactivateStaff({ user_id: staff.id, reason: 'Staff termination' })
                        : await authService.reactivateStaff({ user_id: staff.id });

                      if (result.success) {
                        alert(result.data.message);
                        fetchStaffMembers(); // Refresh the list
                      } else {
                        alert('Failed to update staff status: ' + result.error);
                      }
                    }
                  }}
                  style={{
                    padding: '10px 20px',
                    background: staff.is_active ? '#ef4444' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {staff.is_active ? 'Deactivate' : 'Reactivate'}
                </button>
              </div>
            </div>
          ))}

          {staffMembers.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#64748b',
              fontSize: '16px'
            }}>
              No staff members found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManagementSection;