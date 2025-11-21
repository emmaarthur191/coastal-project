import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionForm from './TransactionForm';

const members = [
  { id: '1', name: 'Kwame Asare', email: 'kwame@example.com' },
  { id: '2', name: 'Abena Mensah', email: 'abena@example.com' },
];

describe('TransactionForm', () => {
  it('renders correctly for Deposit', () => {
    render(
      <TransactionForm
        type="Deposit"
        amount=""
        setAmount={() => {}}
        memberId=""
        setMemberId={() => {}}
        members={members}
        accountType="Savings"
        setAccountType={() => {}}
        handleSubmit={() => {}}
        loading={false}
      />
    );
    expect(screen.getByLabelText('Select Member')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Deposit Amount (GHS)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Process Deposit/i })).toBeInTheDocument();
  });

  it('renders correctly for Withdrawal', () => {
    render(
      <TransactionForm
        type="Withdrawal"
        amount=""
        setAmount={() => {}}
        memberId=""
        setMemberId={() => {}}
        members={members}
        accountType="Savings"
        setAccountType={() => {}}
        handleSubmit={() => {}}
        loading={false}
      />
    );
    expect(screen.getByLabelText('Select Member')).toBeInTheDocument();
    expect(screen.getByLabelText('Account Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Withdrawal Amount (GHS)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Process Withdrawal/i })).toBeInTheDocument();
  });

  it('calls handleSubmit with correct arguments on form submission', () => {
    const handleSubmit = jest.fn();
    render(
      <TransactionForm
        type="Deposit"
        amount="100"
        setAmount={() => {}}
        memberId="1"
        setMemberId={() => {}}
        members={members}
        accountType="Savings"
        setAccountType={() => {}}
        handleSubmit={handleSubmit}
        loading={false}
      />
    );

    fireEvent.submit(screen.getByRole('button', { name: /Process Deposit/i }));
    expect(handleSubmit).toHaveBeenCalledWith(expect.anything(), 'Deposit');
  });

  it('disables the submit button when loading', () => {
    render(
      <TransactionForm
        type="Deposit"
        amount="100"
        setAmount={() => {}}
        memberId="1"
        setMemberId={() => {}}
        members={members}
        accountType="Savings"
        setAccountType={() => {}}
        handleSubmit={() => {}}
        loading={true}
      />
    );

    expect(screen.getByRole('button', { name: /Processing Deposit.../i })).toBeDisabled();
  });
});