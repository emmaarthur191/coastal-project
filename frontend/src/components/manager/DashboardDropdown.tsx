import React from 'react';

interface DashboardDropdownProps {
  showDropdown: boolean;
  setShowDropdown: React.Dispatch<React.SetStateAction<boolean>>;
}

const DashboardDropdown: React.FC<DashboardDropdownProps> = ({
  showDropdown,
  setShowDropdown
}) => {
  return (
    <div style={{
      position: 'relative',
      display: 'inline-block'
    }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          background: '#fff',
          border: '2px solid #000',
          padding: '8px 12px',
          borderRadius: '8px',
          cursor: 'pointer'
        }}
      >
        ⚙️ Options
      </button>

      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          background: '#fff',
          border: '2px solid #000',
          borderRadius: '8px',
          padding: '8px 0',
          minWidth: '150px',
          zIndex: 1000,
          boxShadow: '4px 4px 0px rgba(0,0,0,0.2)'
        }}>
          <div style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Settings
          </div>
          <div style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Reports
          </div>
          <div style={{ padding: '8px 16px', cursor: 'pointer' }}>
            Export Data
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardDropdown;
