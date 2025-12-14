import React, { useState } from 'react';
import { formatCurrencyGHS } from '../utils/formatters';
import GlassCard from './ui/modern/GlassCard';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface ServiceChargesTabProps {
  serviceCharges: any[];
  newCharge: any;
  setNewCharge: React.Dispatch<React.SetStateAction<any>>;
  serviceChargeCalculation: any;
  setServiceChargeCalculation: React.Dispatch<React.SetStateAction<any>>;
  authService: any;
  refetchCharges: () => void;
}

const ServiceChargesTab: React.FC<ServiceChargesTabProps> = ({
  serviceCharges, newCharge, setNewCharge, serviceChargeCalculation,
  setServiceChargeCalculation, authService, refetchCharges
}) => {

  const handleCreateCharge = async () => {
    const result = await authService.createServiceCharge(newCharge);
    if (result.success) {
      alert('Service charge created successfully!');
      setNewCharge({
        name: '',
        description: '',
        charge_type: 'percentage',
        rate: '',
        applicable_to: []
      });
      refetchCharges();
    } else {
      alert('Failed to create service charge: ' + result.error);
    }
  };

  const handleCalculateCharge = async () => {
    if (!serviceChargeCalculation?.transaction_type || !serviceChargeCalculation?.amount) {
      alert('Please select transaction type and enter amount');
      return;
    }

    const result = await authService.calculateServiceCharge({
      transaction_type: serviceChargeCalculation.transaction_type,
      amount: serviceChargeCalculation.amount
    });

    if (result.success) {
      setServiceChargeCalculation(result.data);
    } else {
      alert('Failed to calculate service charge: ' + result.error);
    }
  };

  const applicableTypes = ['deposit', 'withdrawal', 'transfer'];

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <span>💸</span> Service Charge Management
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Service Charge */}
        <GlassCard className="p-6 border-t-[6px] border-t-purple-500">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm">➕</span>
            Create New Service Charge
          </h4>
          <div className="space-y-4">
            <Input
              label="Charge Name"
              placeholder="e.g. Withdrawal Fee"
              value={newCharge.name}
              onChange={(e) => setNewCharge({ ...newCharge, name: e.target.value })}
            />

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Description
              </label>
              <textarea
                placeholder="Short description..."
                value={newCharge.description}
                onChange={(e) => setNewCharge({ ...newCharge, description: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50 resize-y"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                  Type
                </label>
                <select
                  value={newCharge.charge_type}
                  onChange={(e) => setNewCharge({ ...newCharge, charge_type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                </select>
              </div>
              <Input
                label={newCharge.charge_type === 'percentage' ? 'Rate (%)' : 'Fixed Amount (GHS)'}
                type="number"
                value={newCharge.rate}
                onChange={(e) => setNewCharge({ ...newCharge, rate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                Applicable to:
              </label>
              <div className="flex flex-wrap gap-2">
                {applicableTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const updated = newCharge.applicable_to.includes(type)
                        ? newCharge.applicable_to.filter((t: string) => t !== type)
                        : [...newCharge.applicable_to, type];
                      setNewCharge({ ...newCharge, applicable_to: updated });
                    }}
                    type="button"
                    className={`
                            px-3 py-2 rounded-lg text-xs font-bold transition-all border
                            ${newCharge.applicable_to.includes(type)
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:bg-purple-50'}
                        `}
                  >
                    {newCharge.applicable_to.includes(type) && <span className="mr-1">✓</span>}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleCreateCharge} variant="primary" className="w-full shadow-lg shadow-purple-100">
              Create Service Charge
            </Button>
          </div>
        </GlassCard>

        {/* Service Charge Calculator */}
        <GlassCard className="p-6 border-t-[6px] border-t-amber-500 flex flex-col h-full">
          <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-sm">🧮</span>
            Service Charge Calculator
          </h4>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">
                Transaction Type
              </label>
              <select
                onChange={(e) => setServiceChargeCalculation(c => ({ ...c, transaction_type: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
              >
                <option value="">Select Transaction Type</option>
                {applicableTypes.map(type => <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>)}
              </select>
            </div>

            <Input
              label="Transaction Amount (GHS)"
              type="number"
              onChange={(e) => setServiceChargeCalculation(c => ({ ...c, amount: parseFloat(e.target.value) }))}
            />

            <Button onClick={handleCalculateCharge} variant="secondary" className="w-full flex-1">
              Calculate Charge
            </Button>

            {serviceChargeCalculation && serviceChargeCalculation.charge_breakdown && (
              <div className="mt-4 p-4 bg-white rounded-xl border border-gray-100 shadow-sm animate-fade-in-up">
                <h5 className="font-bold text-gray-800 mb-3 border-b border-gray-100 pb-2">Calculation Result</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction Amount:</span>
                    <span className="font-mono font-bold">{formatCurrencyGHS(serviceChargeCalculation.transaction_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Service Charge:</span>
                    <span className="font-mono font-bold text-red-600">-{formatCurrencyGHS(serviceChargeCalculation.total_service_charge)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-dashed border-gray-200">
                    <span className="font-bold text-gray-700">Net Amount:</span>
                    <span className="font-mono font-black text-emerald-600">{formatCurrencyGHS(serviceChargeCalculation.net_amount)}</span>
                  </div>

                  <div className="mt-4">
                    <h6 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Breakdown:</h6>
                    <div className="space-y-1">
                      {serviceChargeCalculation.charge_breakdown.map((charge: any, index: number) => (
                        <div key={index} className="flex justify-between items-center text-xs p-2 bg-gray-50 rounded">
                          <span>{charge.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="bg-gray-200 text-gray-600 px-1.5 rounded">{charge.rate}{charge.type === 'percentage' ? '%' : ''}</span>
                            <span className="font-bold">{formatCurrencyGHS(charge.amount)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Active Service Charges List */}
      <GlassCard className="p-6">
        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm">📋</span>
          Active Service Charges
        </h4>

        {serviceCharges.length === 0 ? (
          <div className="text-center py-8 text-gray-400">No active service charges found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serviceCharges.map((charge: any, index: number) => (
              <div key={index} className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                {/* Decorative background circle */}
                <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-gray-50 group-hover:bg-blue-50 transition-colors z-0"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-bold text-gray-800 pr-8">{charge.name}</h5>
                    <span className={`
                                text-[10px] font-bold px-2 py-0.5 rounded-full uppercase
                                ${charge.charge_type === 'percentage' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}
                            `}>
                      {charge.charge_type}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{charge.description}</p>

                  <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                    <div>
                      <h6 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Applies To</h6>
                      <div className="flex flex-wrap gap-1">
                        {charge.applicable_to.map((t: string, i: number) => (
                          <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded capitalize">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xl font-black text-gray-800">
                      {charge.rate}{charge.charge_type === 'percentage' ? '%' : <span className="text-xs text-gray-400 font-normal ml-0.5">GHS</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export default ServiceChargesTab;