import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TellerOperationsHub from '../components/operational/TellerOperationsHub';
import { api } from '../services/api';
import React from 'react';

// Mocks
vi.mock('../services/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
  },
  apiService: {
    closeAccount: vi.fn(),
  },
}));

describe('TellerOperationsHub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders deposit tab by default and handles input', async () => {
    render(<TellerOperationsHub mode="cashier" />);
    
    expect(screen.getByText(/New Deposit/i)).toBeInTheDocument();
    
    const memberIdInput = screen.getByLabelText(/Member ID/i);
    const amountInput = screen.getByLabelText(/Amount \(GHS\)/i);
    
    fireEvent.change(memberIdInput, { target: { value: 'M123' } });
    fireEvent.change(amountInput, { target: { value: '500' } });
    
    expect(memberIdInput).toHaveValue('M123');
    expect(amountInput).toHaveValue(500);
  });

  it('successfully processes a deposit', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    
    render(<TellerOperationsHub mode="mobile_banker" />);
    
    fireEvent.change(screen.getByLabelText(/Member ID/i), { target: { value: 'M123' } });
    fireEvent.change(screen.getByLabelText(/Amount \(GHS\)/i), { target: { value: '500' } });
    
    const submitBtn = screen.getByRole('button', { name: /Confirm Deposit/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('operations/process-deposit/', expect.objectContaining({
        member_id: 'M123',
        amount: 500,
        type: 'Deposit'
      }));
      expect(screen.getByText(/Deposit Success!/i)).toBeInTheDocument();
    });
  });

  it('successfully processes a withdrawal', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: {} });
    
    render(<TellerOperationsHub mode="mobile_banker" initialTab="withdrawal" />);
    
    fireEvent.change(screen.getByLabelText(/Member ID/i), { target: { value: 'M123' } });
    fireEvent.change(screen.getByLabelText(/Amount \(GHS\)/i), { target: { value: '200' } });
    
    const submitBtn = screen.getByRole('button', { name: /Confirm Withdrawal/i });
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('operations/process-withdrawal/', expect.objectContaining({
        member_id: 'M123',
        amount: 200,
        type: 'Withdrawal'
      }));
      expect(screen.getByText(/Withdrawal Success!/i)).toBeInTheDocument();
    });
  });

  it('handles account lookup in closure tab', async () => {
    const mockAccount = {
      account_number: '1234567890',
      balance: '1500.00',
      user: { full_name: 'John Doe' },
      status: 'active',
      account_type: 'daily_susu'
    };
    
    vi.mocked(api.get).mockResolvedValue({ 
      data: { results: [mockAccount] } 
    });
    
    render(<TellerOperationsHub mode="cashier" initialTab="closure" />);
    
    const lookupInput = screen.getByPlaceholderText(/Enter 10-digit account number/i);
    fireEvent.change(lookupInput, { target: { value: '1234567890' } });
    
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(expect.stringContaining('1234567890'));
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText(/1,500.00/)).toBeInTheDocument();
    });
  });
});
