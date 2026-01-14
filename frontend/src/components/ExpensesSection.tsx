import React from 'react';
import { authService, ExpenseData, ExpenseCategory } from '../services/api';
import { formatCurrencyGHS } from '../utils/formatters';
import './ExpensesSection.css';

interface Expense {
  category: string;
  description: string;
  date_incurred: string;
  recorded_by_name: string;
  amount: number | string;
  is_approved: boolean;
}

interface NewExpense {
  category: string;
  amount: string;
  description: string;
  date_incurred: string;
}

interface ExpensesSectionProps {
  newExpense: NewExpense;
  setNewExpense: React.Dispatch<React.SetStateAction<NewExpense>>;
  expenses: Expense[];
  fetchExpenses: () => void;
}

const ExpensesSection: React.FC<ExpensesSectionProps> = ({
  newExpense,
  setNewExpense,
  expenses,
  fetchExpenses
}) => {
  return (
    <div className="expenses-container">
      <h3 className="expenses-title">
        Company Expenses Management
      </h3>

      <div className="expenses-grid">
        {/* Add New Expense */}
        <div className="expense-form-container">
          <h4 className="section-subtitle">Record New Expense</h4>

          <div className="expense-form-stack">
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
              className="expense-input"
              title="Expense Category"
            >
              <option value="">Select Category</option>
              <option value="Operational">Operational</option>
              <option value="Utilities">Utilities</option>
              <option value="Payroll">Payroll</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="number"
              placeholder="Amount (GHS)"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="expense-input"
              title="Expense Amount"
            />

            <input
              type="date"
              value={newExpense.date_incurred}
              onChange={(e) => setNewExpense({ ...newExpense, date_incurred: e.target.value })}
              className="expense-input"
              title="Date Incurred"
            />

            <textarea
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="expense-input expense-textarea"
              title="Expense Description"
            />

            <button
              onClick={async () => {
                const expenseData: ExpenseData = {
                  category: newExpense.category as ExpenseCategory,
                  amount: parseFloat(newExpense.amount) || 0,
                  description: newExpense.description,
                  date: newExpense.date_incurred // Map UI date_incurred to API date
                };

                const result = await authService.createExpense(expenseData);
                if (result.success) {
                  alert('Expense recorded successfully!');
                  setNewExpense({
                    category: '',
                    amount: '',
                    description: '',
                    date_incurred: new Date().toISOString().split('T')[0]
                  });
                  fetchExpenses();
                } else {
                  alert('Failed to record expense: ' + result.error);
                }
              }}
              className="record-button"
            >
              Record Expense
            </button>
          </div>
        </div>

        {/* Expenses List */}
        <div>
          <h4 className="expense-title-list">Recent Expenses</h4>
          <div className="expense-list">
            {expenses.map((expense, index) => (
              <div
                key={index}
                className={`expense-card ${expense.is_approved ? 'approved' : 'pending'}`}
              >
                <div>
                  <div className="expense-category">
                    {expense.category.replace('_', ' ').toUpperCase()}
                  </div>
                  <div className="expense-description">
                    {expense.description}
                  </div>
                  <div className="expense-meta">
                    {expense.date_incurred} • {expense.recorded_by_name}
                  </div>
                </div>
                <div className="expense-amount-status">
                  <div className="expense-amount">
                    {formatCurrencyGHS(expense.amount)}
                  </div>
                  <div className={`status-badge ${expense.is_approved ? 'approved' : 'pending'}`}>
                    {expense.is_approved ? 'Approved' : 'Pending'}
                  </div>
                </div>
              </div>
            ))}

            {expenses.length === 0 && (
              <div className="no-expenses">
                No expenses recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExpensesSection;
