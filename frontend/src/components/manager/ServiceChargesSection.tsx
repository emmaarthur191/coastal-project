import React, { useState, useEffect } from 'react';
import { authService } from '../../services/api';
import GlassCard from '../ui/modern/GlassCard';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface ServiceCharge {
  id: number;
  name: string;
  description: string;
  charge_type: 'fixed' | 'percentage';
  rate: string;
  applicable_to: string[];
  is_active: boolean;
}

interface ServiceChargesSectionProps {
  newCharge: any;
  setNewCharge: React.Dispatch<React.SetStateAction<any>>;
  serviceChargeCalculation: any;
  setServiceChargeCalculation: React.Dispatch<React.SetStateAction<any>>;
  serviceCharges: any[];
  fetchServiceCharges: () => void;
}

const ServiceChargesSection: React.FC<ServiceChargesSectionProps> = ({
  newCharge,
  setNewCharge,
  serviceChargeCalculation,
  setServiceChargeCalculation,
  serviceCharges: propServiceCharges,
  fetchServiceCharges: propFetchServiceCharges
}) => {
  const [charges, setCharges] = useState<ServiceCharge[]>([]);
  const [loading, setLoading] = useState(true);

  // Banking operations that can have service charges
  const operations = [
    'withdrawal',
    'deposit',
    'daily_susu',
    'monthly_susu',
    'transfer',
    'account_maintenance',
    'loan_processing',
    'check_deposit',
    'balance_inquiry'
  ];

  useEffect(() => {
    fetchCharges();
  }, []);

  const fetchCharges = async () => {
    setLoading(true);
    try {
      const response = await authService.getServiceCharges();
      if (response.success) {
        const chargesData = Array.isArray(response.data) ? response.data : [];
        setCharges(chargesData);
      }
    } catch (error) {
      console.error('Failed to fetch service charges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API call to create charge
    alert('Service charge created! (API integration pending)');
    // Reset form
    setNewCharge({
      name: '',
      description: '',
      charge_type: 'fixed',
      rate: '',
      applicable_to: []
    });
    fetchCharges();
  };

  const handleToggleOperation = (operation: string) => {
    const current = newCharge.applicable_to || [];
    if (current.includes(operation)) {
      setNewCharge({
        ...newCharge,
        applicable_to: current.filter((op: string) => op !== operation)
      });
    } else {
      setNewCharge({
        ...newCharge,
        applicable_to: [...current, operation]
      });
    }
  };

  const handleDeleteCharge = (id: number) => {
    if (confirm('Are you sure you want to delete this service charge?')) {
      // TODO: API call to delete
      setCharges(charges.filter(c => c.id !== id));
      alert('Service charge deleted! (API integration pending)');
    }
  };

  const handleToggleActive = (id: number) => {
    // TODO: API call to toggle
    setCharges(charges.map(c =>
      c.id === id ? { ...c, is_active: !c.is_active } : c
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <h3 className="text-2xl font-bold text-gray-800">🏷️ Service Charge Management</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create New Charge Form */}
        <GlassCard className="p-6 border-t-[6px] border-t-blue-500">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm">➕</span>
            Create New Charge
          </h4>

          <form onSubmit={handleCreateCharge} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Charge Name *"
                required
                placeholder="e.g., Withdrawal Fee"
                value={newCharge.name || ''}
                onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Charge Type *
                </label>
                <select
                  required
                  value={newCharge.charge_type || 'fixed'}
                  onChange={(e) => setNewCharge({ ...newCharge, charge_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
                >
                  <option value="fixed">Fixed Amount (GHS)</option>
                  <option value="percentage">Percentage (%)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Description
              </label>
              <textarea
                placeholder="Describe when this charge applies..."
                value={newCharge.description || ''}
                onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50 resize-y"
              />
            </div>

            <div>
              <Input
                label="Rate/Amount *"
                type="number"
                step="0.01"
                required
                placeholder={newCharge.charge_type === 'percentage' ? 'e.g., 2.5' : 'e.g., 5.00'}
                value={newCharge.rate || ''}
                onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })}
              />
              <p className="text-xs text-gray-500 mt-1 ml-1">
                {newCharge.charge_type === 'percentage'
                  ? 'Enter percentage value (e.g., 2.5 for 2.5%)'
                  : 'Enter amount in Ghana Cedis (GHS)'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                Apply to Operations * (Select at least one)
              </label>
              <div className="flex flex-wrap gap-2">
                {operations.map((operation) => {
                  const isSelected = (newCharge.applicable_to || []).includes(operation);
                  return (
                    <button
                      key={operation}
                      type="button"
                      onClick={() => handleToggleOperation(operation)}
                      className={`
                                        px-3 py-2 rounded-lg text-xs font-bold transition-all border
                                        ${isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'}
                                    `}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {operation.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button type="submit" variant="primary" className="w-full py-3 shadow-lg shadow-blue-100">
              💾 Create Service Charge
            </Button>
          </form>
        </GlassCard>

        {/* Existing Charges List */}
        <GlassCard className="p-6">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">📋</span>
            Existing Service Charges ({charges.length})
          </h4>

          {loading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500 font-medium">Loading charges...</p>
            </div>
          ) : charges.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <div className="text-4xl mb-4">📭</div>
              <p>No service charges configured yet.</p>
              <p className="text-sm">Create one using the form.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {charges.map((charge) => (
                <div
                  key={charge.id}
                  className={`
                        p-4 rounded-xl border transition-all
                        ${charge.is_active
                      ? 'bg-white border-gray-100 shadow-sm hover:shadow-md'
                      : 'bg-gray-50 border-gray-100 opacity-75'}
                    `}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-bold text-gray-800">{charge.name}</h5>
                        {charge.applicable_to.length > 0 && (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase">
                            {charge.applicable_to.length} Ops
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${charge.charge_type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {charge.charge_type}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${charge.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
                          {charge.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-coastal-primary">
                        {charge.charge_type === 'percentage' ? `${charge.rate}%` : `GHS ${charge.rate}`}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                    {charge.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {charge.applicable_to.slice(0, 3).map((op, i) => (
                      <span key={i} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {op.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {charge.applicable_to.length > 3 && (
                      <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        +{charge.applicable_to.length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="flex-1 text-xs py-1"
                      onClick={() => handleToggleActive(charge.id)}
                    >
                      {charge.is_active ? '⏸️ Deactivate' : '▶️ Activate'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      className="flex-1 text-xs py-1"
                      onClick={() => handleDeleteCharge(charge.id)}
                    >
                      🗑️ Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
};

export default ServiceChargesSection;