import React, { useState } from 'react';
import { THEME } from './ManagerTheme';

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
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>📉 Expense Management</h3>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

        {/* Add Expense Form */}
        <div style={{
          background: '#fff',
          padding: '24px',
          borderRadius: THEME.radius.card,
          border: '2px solid #000',
          boxShadow: THEME.shadows.card,
          height: 'fit-content'
        }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '900' }}>
            ➕ Record Expense
          </h4>

          <form onSubmit={handleAddExpense}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>Category</label>
              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif"
                }}
              >
                <option value="Operational">Operational</option>
                <option value="Utilities">Utilities</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Payroll">Payroll</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>Amount (GHS)</label>
              <input
                type="number"
                required
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                placeholder="0.00"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif"
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontWeight: '700', marginBottom: '8px' }}>Description</label>
              <textarea
                required
                value={newExpense.description}
                onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                rows={3}
                placeholder="Details of the expense..."
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #000',
                  borderRadius: THEME.radius.input,
                  fontFamily: "'Nunito', sans-serif",
                  resize: 'vertical'
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: THEME.colors.danger,
                color: '#fff',
                border: '2px solid #000',
                borderRadius: THEME.radius.button,
                fontWeight: '900',
                cursor: 'pointer',
                boxShadow: THEME.shadows.button
              }}
            >
              Record Expense
            </button>
          </form>
        </div>

        {/* Expenses List */}
        <div>
          {/* Summary Card */}
          <div style={{
            background: THEME.colors.bg,
            padding: '24px',
            borderRadius: THEME.radius.card,
            border: '2px solid #000',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '900' }}>Total Expenses</h4>
              <p style={{ margin: 0, color: '#666' }}>This Month</p>
            </div>
            <div style={{ fontSize: '32px', fontWeight: '900', color: THEME.colors.danger }}>
              {formatCurrency(totalExpenses)}
            </div>
          </div>

          <div style={{
            background: '#fff',
            borderRadius: THEME.radius.card,
            border: '2px solid #000',
            boxShadow: THEME.shadows.card,
            overflow: 'hidden'
          }}>
            <h4 style={{ margin: 0, padding: '20px', borderBottom: '2px solid #000', fontSize: '18px', fontWeight: '900', background: '#f8f9fa' }}>
              📋 Recent Expenses
            </h4>

            {allExpenses.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                No expenses recorded yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#eee' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #000' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #000' }}>Category</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #000' }}>Description</th>
                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #000' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #000' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {allExpenses.map((expense) => (
                    <tr key={expense.id} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '12px' }}>{expense.date || expense.date_incurred}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: '#eee',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          {expense.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>{expense.description}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: '700', color: THEME.colors.danger }}>
                        {formatCurrency(expense.amount)}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: expense.status === 'paid' ? THEME.colors.success : '#ffc107',
                          color: expense.status === 'paid' ? '#fff' : '#000',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: '700',
                          textTransform: 'uppercase'
                        }}>
                          {expense.status || 'pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesSection;