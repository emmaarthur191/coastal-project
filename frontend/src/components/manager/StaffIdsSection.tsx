import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import GlassCard from '../ui/modern/GlassCard';
import ModernStatCard from '../ui/modern/ModernStatCard';

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
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span>🆔</span> Staff IDs Management
        </h2>

        {/* Filters Section */}
        <div className="bg-gray-50/80 p-6 rounded-2xl border border-gray-100 mb-6">
          <h3 className="text-lg font-bold text-gray-700 mb-4">Filters & Search</h3>
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Search</label>
              <Input
                className="mb-0"
                placeholder="name, email, or staff ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full lg:w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
              >
                <option value="">All Roles</option>
                <option value="cashier">Cashier</option>
                <option value="mobile_banker">Mobile Banker</option>
                <option value="manager">Manager</option>
                <option value="operations_manager">Operations Manager</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            <div className="w-full lg:w-48">
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div className="flex gap-2 w-full lg:w-auto mt-2 lg:mt-0">
              <Button onClick={handleSearch} variant="primary" className="flex-1 lg:flex-none">
                Search
              </Button>
              <Button onClick={handleClearFilters} variant="secondary" className="flex-1 lg:flex-none">
                Clear
              </Button>
              <div className="relative">
                <Button onClick={() => setShowExport(!showExport)} variant="success" className="flex-1 lg:flex-none">
                  Export
                </Button>
                {showExport && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-10 flex flex-col gap-1">
                    <button
                      onClick={() => handleExport('csv')}
                      className="text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition-colors"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleExport('excel')}
                      className="text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition-colors"
                    >
                      Excel
                    </button>
                    <button
                      onClick={() => handleExport('pdf')}
                      className="text-left px-4 py-2 hover:bg-gray-50 rounded-lg text-gray-700 font-medium transition-colors"
                    >
                      PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Staff IDs Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-coastal-primary text-white text-left">
                <th className="p-4 font-bold text-sm tracking-wider">Staff ID</th>
                <th className="p-4 font-bold text-sm tracking-wider">Name</th>
                <th className="p-4 font-bold text-sm tracking-wider">Email</th>
                <th className="p-4 font-bold text-sm tracking-wider">Role</th>
                <th className="p-4 font-bold text-sm tracking-wider">Employment Date</th>
                <th className="p-4 font-bold text-sm tracking-wider">Status</th>
                <th className="p-4 font-bold text-sm tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {staffIds.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    No staff IDs found matching the criteria.
                  </td>
                </tr>
              ) : (
                staffIds.map((staff, index) => (
                  <tr key={staff.id} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-coastal-primary">
                      {staff.staff_id || <span className="text-gray-400 italic">Not Generated</span>}
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                      {staff.first_name} {staff.last_name}
                    </td>
                    <td className="p-4 text-gray-600">{staff.email}</td>
                    <td className="p-4">
                      <span className="capitalize px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">
                        {staff.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      {staff.employment_date ? new Date(staff.employment_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${staff.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                        {staff.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(staff.date_joined).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <ModernStatCard
            label="Total Staff"
            value={String(staffIds.length)}
            icon={<span>👥</span>}
            colorClass="text-blue-600 bg-blue-50"
            trend="neutral"
          />
          <ModernStatCard
            label="Active Staff"
            value={String(staffIds.filter(s => s.is_active).length)}
            icon={<span>✅</span>}
            colorClass="text-emerald-600 bg-emerald-50"
            trend="up"
          />
          <ModernStatCard
            label="Generated IDs"
            value={String(staffIds.filter(s => s.staff_id).length)}
            icon={<span>🆔</span>}
            colorClass="text-purple-600 bg-purple-50"
            trend="neutral"
          />
        </div>
      </GlassCard>
    </div>
  );
};

export default StaffIdsSection;
