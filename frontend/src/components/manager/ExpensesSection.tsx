import React, { useState } from 'react';
import GlassCard from '../ui/modern/GlassCard';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface Expense {
  id?: string | number;
  category: string;
  amount: string | number;
  description: string;
  date_incurred?: string;
  date?: string; // Backend returns date
  status?: string;
}

interface ExpensesSectionProps {
  newExpense: Expense;
  setNewExpense: React.Dispatch<React.SetStateAction<Expense>>;
  expenses: Expense[];
  fetchExpenses: () => void;
}

const formatCurrency = (amount: string | number) => {
  const val = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS'
  }).format(val || 0);
};

const ExpensesSection: React.FC<ExpensesSectionProps> = ({
  newExpense,
  setNewExpense,
  expenses = [], // Default to empty array
  fetchExpenses
}) => {
  const [localExpenses, setLocalExpenses] = React.useState<Expense[]>([]);

  // Merge props expenses with any locally added ones for demo
  const allExpenses = [...expenses, ...localExpenses];

  const totalExpenses = allExpenses.reduce((sum, exp) => {
    const val = typeof exp.amount === 'string' ? parseFloat(exp.amount) : exp.amount;
    return sum + (val || 0);
  }, 0);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate adding expense
    const added: Expense = {
      ...newExpense,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      status: 'pending'
    };
    setLocalExpenses([added, ...localExpenses]);
    setNewExpense({ category: 'Operational', amount: '', description: '', date_incurred: '' });
    alert('Expense recorded! (Local simulation)');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
        <span>📉</span> Expense Management
      </h3>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Add Expense Form */}
        <div className="lg:col-span-1">
          <GlassCard className="p-6 border-t-[6px] border-t-red-500 sticky top-4">
            <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-sm">➕</span>
              Record Expense
            </h4>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Category</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50"
                >
                  <option value="Operational">Operational</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Payroll">Payroll</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <Input
                label="Amount (GHS)"
                type="number"
                required
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="0.00"
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1 ml-1">Description</label>
                <textarea
                  required
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  rows={3}
                  placeholder="Details of the expense..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-coastal-primary focus:ring-4 focus:ring-coastal-primary/10 transition-all outline-none bg-gray-50 resize-y"
                />
              </div>

              <Button
                type="submit"
                variant="danger"
                className="w-full py-3 shadow-lg shadow-red-100"
              >
                Record Expense
              </Button>
            </form>
          </GlassCard>
        </div>

        {/* Expenses List */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <GlassCard className="p-6 flex justify-between items-center bg-gradient-to-r from-red-50 to-white border-l-4 border-l-red-500">
            <div>
              <h4 className="text-xl font-bold text-gray-800">Total Expenses</h4>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">This Month</p>
            </div>
            <div className="text-4xl font-black text-red-600">
              {formatCurrency(totalExpenses)}
            </div>
          </GlassCard>

          <GlassCard className="overflow-hidden p-0">
            <h4 className="p-5 border-b border-gray-100 bg-gray-50 text-lg font-bold text-gray-800 flex items-center gap-2">
              <span>📋</span> Recent Expenses
            </h4>

            {allExpenses.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <div className="text-4xl mb-3 opacity-30">📭</div>
                <p>No expenses recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50/50 text-gray-500 text-xs uppercase font-bold tracking-wider">
                    <tr>
                      <th className="p-4 border-b border-gray-100">Date</th>
                      <th className="p-4 border-b border-gray-100">Category</th>
                      <th className="p-4 border-b border-gray-100">Description</th>
                      <th className="p-4 border-b border-gray-100 text-right">Amount</th>
                      <th className="p-4 border-b border-gray-100 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allExpenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm font-medium text-gray-600 whitespace-nowrap">
                          {expense.date || expense.date_incurred}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 text-gray-600 uppercase">
                            {expense.category}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-600 max-w-xs truncate">
                          {expense.description}
                        </td>
                        <td className="p-4 text-right font-bold text-red-600 whitespace-nowrap">
                          {formatCurrency(expense.amount)}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`
                                px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide
                                ${expense.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700'}
                            `}>
                            {expense.status || 'pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

export default ExpensesSection;
