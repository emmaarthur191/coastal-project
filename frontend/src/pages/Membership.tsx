import React from 'react';
import { useNavigate } from 'react-router-dom';

function Membership() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--md-sys-color-background)',
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div className="md-elevated-card" style={{
        maxWidth: '500px',
        width: '100%',
        padding: '32px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: 'var(--md-sys-shape-corner-medium)',
          background: 'var(--md-sys-color-error-container)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          margin: '0 auto 24px'
        }}>
          🔒
        </div>
        <h2 className="md-typescale-headline-medium" style={{
          color: 'var(--md-sys-color-on-surface)',
          marginBottom: '16px'
        }}>
          Member Access Required
        </h2>
        <p className="md-typescale-body-large" style={{
          color: 'var(--md-sys-color-on-surface-variant)',
          marginBottom: '24px'
        }}>
          This dashboard is available to club members only. Please upgrade your account to access member-exclusive features.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="md-filled-button md-ripple"
            style={{
              background: 'var(--md-sys-color-primary)',
              color: 'var(--md-sys-color-on-primary)'
            }}
          >
            Become a Member
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="md-outlined-button md-ripple"
          >
            Back to Main Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Membership;
