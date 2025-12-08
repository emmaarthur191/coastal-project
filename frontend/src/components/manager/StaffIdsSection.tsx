import React, { useState } from 'react';
import { THEME } from './ManagerTheme';

interface StaffId {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  staff_id: string;
  employment_date: string;
  is_active: boolean;
  date_joined: string;
}

interface StaffIdsSectionProps {
  staffIds: StaffId[];
  staffIdFilters: any;
  setStaffIdFilters: (filters: any) => void;
  fetchStaffIds: () => void;
}

const StaffIdsSection: React.FC<StaffIdsSectionProps> = ({
  staffIds,
  staffIdFilters,
  setStaffIdFilters,
  fetchStaffIds
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showExport, setShowExport] = useState(false);

  const handleSearch = () => {
    const filters = {
      search: searchTerm,
      role: selectedRole,
      status: selectedStatus
    };
    setStaffIdFilters(filters);
  };

  const handleExport = (format: string) => {
    // Implement export functionality
    alert(`Exporting staff IDs in ${format} format...`);
    setShowExport(false);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedRole('');
    setSelectedStatus('');
    setStaffIdFilters({});
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: THEME.radius.card,
        border: '2px solid #000000',
        boxShadow: THEME.shadows.card,
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h2 style={{
          fontFamily: "'Nunito', sans-serif",
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '20px',
          color: THEME.colors.primary
        }}>
          🆔 Staff IDs Management
        </h2>

        {/* Filters Section */}
        <div style={{
          background: THEME.colors.bg,
          padding: '15px',
          borderRadius: THEME.radius.card,
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '10px', color: THEME.colors.primary }}>Filters & Search</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by name, email, or staff ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minWidth: '200px'
              }}
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Roles</option>
              <option value="cashier">Cashier</option>
              <option value="mobile_banker">Mobile Banker</option>
              <option value="manager">Manager</option>
              <option value="operations_manager">Operations Manager</option>
              <option value="administrator">Administrator</option>
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <button
              onClick={handleSearch}
              style={{
                padding: '8px 16px',
                background: THEME.colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Search
            </button>
            <button
              onClick={handleClearFilters}
              style={{
                padding: '8px 16px',
                background: THEME.colors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Clear
            </button>
            <button
              onClick={() => setShowExport(!showExport)}
              style={{
                padding: '8px 16px',
                background: THEME.colors.success,
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Export
            </button>
          </div>

          {showExport && (
            <div style={{
              marginTop: '10px',
              padding: '10px',
              background: 'white',
              borderRadius: '4px',
              border: '1px solid #ccc'
            }}>
              <p style={{ margin: '0 0 10px 0' }}>Export Options:</p>
              <button onClick={() => handleExport('csv')} style={{ marginRight: '10px', padding: '5px 10px' }}>CSV</button>
              <button onClick={() => handleExport('excel')} style={{ marginRight: '10px', padding: '5px 10px' }}>Excel</button>
              <button onClick={() => handleExport('pdf')} style={{ padding: '5px 10px' }}>PDF</button>
            </div>
          )}
        </div>

        {/* Staff IDs Table */}
        <div style={{
          background: THEME.colors.bg,
          borderRadius: THEME.radius.card,
          overflow: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ background: THEME.colors.primary, color: 'white' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Staff ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Employment Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {staffIds.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: '#666'
                  }}>
                    No staff IDs found matching the criteria.
                  </td>
                </tr>
              ) : (
                staffIds.map((staff, index) => (
                  <tr key={staff.id} style={{
                    background: index % 2 === 0 ? 'white' : '#f9f9f9',
                    borderBottom: '1px solid #eee'
                  }}>
                    <td style={{ padding: '12px', fontWeight: 'bold', color: THEME.colors.primary }}>
                      {staff.staff_id || 'Not Generated'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {staff.first_name} {staff.last_name}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {staff.email}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {staff.role.replace('_', ' ').toUpperCase()}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {staff.employment_date ? new Date(staff.employment_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        background: staff.is_active ? THEME.colors.success : THEME.colors.danger,
                        color: 'white'
                      }}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {new Date(staff.date_joined).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div style={{
          marginTop: '20px',
          display: 'flex',
          gap: '20px',
          flexWrap: 'wrap'
        }}>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: THEME.radius.card,
            border: '1px solid #eee',
            flex: 1,
            minWidth: '150px'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: THEME.colors.primary }}>Total Staff</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{staffIds.length}</p>
          </div>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: THEME.radius.card,
            border: '1px solid #eee',
            flex: 1,
            minWidth: '150px'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: THEME.colors.success }}>Active Staff</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {staffIds.filter(s => s.is_active).length}
            </p>
          </div>
          <div style={{
            background: 'white',
            padding: '15px',
            borderRadius: THEME.radius.card,
            border: '1px solid #eee',
            flex: 1,
            minWidth: '150px'
          }}>
            <h4 style={{ margin: '0 0 5px 0', color: THEME.colors.warning }}>Generated IDs</h4>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>
              {staffIds.filter(s => s.staff_id).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffIdsSection;