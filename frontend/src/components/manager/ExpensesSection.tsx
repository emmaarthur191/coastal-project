import React from 'react';

interface Expense {
  id?: string;
  category: string;
  amount: string;
  description: string;
  date_incurred: string;
}

interface ExpensesSectionProps {
  newExpense: Expense;
  setNewExpense: React.Dispatch<React.SetStateAction<Expense>>;
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
    <div>
      <h3 style={{ margin: '0 0 24px 0', fontSize: '24px', fontWeight: '900' }}>📉 Expense Management</h3>
      <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
        <div style={{ fontSize: '60px', marginBottom: '16px' }}>💸</div>
        <h4>Expense Tracking</h4>
        <p>Track and manage bank operational expenses.</p>
        <p style={{ fontSize: '14px', marginTop: '16px' }}>Feature coming soon! 🚧</p>
      </div>
    </div>
  );
};

export default ExpensesSection;