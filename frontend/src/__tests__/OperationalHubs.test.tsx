import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdministrativeHub from '../components/operational/AdministrativeHub';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import React from 'react';

// Mocks
vi.mock('../services/api', () => ({
  apiService: {
    getAccountOpenings: vi.fn(),
    approveAndPrintAccountOpening: vi.fn(),
    rejectAccountOpening: vi.fn(),
  },
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Operational Unified Hubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { role: 'manager', email: 'manager@coastal.com' },
    });
  });

  describe('AdministrativeHub', () => {
    const mockAccounts = [
      { id: '1', account_number: '123456', account_type: 'savings', balance: 1000, status: 'active' },
      { id: '2', account_number: '789012', account_type: 'current', balance: 500, status: 'inactive' },
    ];

    it('renders accounts view correctly', () => {
      render(<AdministrativeHub view="accounts" accounts={mockAccounts as any} loading={false} />);
      expect(screen.getByText('#123456')).toBeInTheDocument();
      expect(screen.getByText('#789012')).toBeInTheDocument();
      expect(screen.getByText('savings')).toBeInTheDocument();
    });

    it('filters accounts by search term', () => {
      render(<AdministrativeHub view="accounts" accounts={mockAccounts as any} loading={false} />);
      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: '123456' } });
      expect(screen.getByText('#123456')).toBeInTheDocument();
      expect(screen.queryByText('#789012')).not.toBeInTheDocument();
    });

    it('renders complaints view correctly', () => {
      const mockComplaints = [
        { id: '1', subject: 'Late payment', category: 'service', priority: 'high', status: 'open' }
      ];
      render(<AdministrativeHub view="complaints" complaints={mockComplaints as any} loading={false} />);
      expect(screen.getByText('Late payment')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
    });
  });

  describe('OnboardingHub', () => {
    it('renders staff mode with AccountOpeningTab', () => {
      render(<OnboardingHub mode="staff" />);
      expect(screen.getByText(/Personal Information/i)).toBeInTheDocument();
    });

    it('renders manager mode with approval queue', async () => {
      const mockRequests = [{
        id: 'req1',
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '1234567890',
        account_type: 'savings_account',
        id_type: 'passport',
        id_number: 'P123',
        status: 'pending'
      }];

      (apiService.getAccountOpenings as any).mockResolvedValue({ success: true, data: mockRequests });

      render(<OnboardingHub mode="manager" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText(/Approve & Print/i)).toBeInTheDocument();
      });
    });

    it('triggers approveAndPrintAccountOpening on click', async () => {
        const mockRequests = [{
          id: 'req1',
          first_name: 'John',
          last_name: 'Doe',
          status: 'pending',
          account_type: 'savings',
          phone_number: '123',
          id_type: 'id',
          id_number: '456'
        }];
        (apiService.getAccountOpenings as any).mockResolvedValue({ success: true, data: mockRequests });
        (apiService.approveAndPrintAccountOpening as any).mockResolvedValue({ success: true, blob: new Blob() });

        render(<OnboardingHub mode="manager" />);

        const approveBtn = await screen.findByText(/Approve & Print/i);
        fireEvent.click(approveBtn);

        expect(apiService.approveAndPrintAccountOpening).toHaveBeenCalledWith('req1');
    });
  });

  describe('FinancialRequestsHub', () => {
     it('triggers onApproveLoan when clicking approve', () => {
        const mockLoans = [{ id: 'loan1', amount: 5000, status: 'pending', purpose: 'business' }];
        const onApprove = vi.fn();
        render(<FinancialRequestsHub view="pending-loans" pendingLoans={mockLoans as any} onApproveLoan={onApprove} />);

        const approveBtn = screen.getByText(/Approve/i);
        fireEvent.click(approveBtn);
        expect(onApprove).toHaveBeenCalledWith('loan1');
     });

     it('triggers onApproveCashAdvance when clicking approve', () => {
        const mockAdvances = [{ id: 'adv1', amount: 1000, status: 'pending', requester_name: 'Bob' }];
        const onApprove = vi.fn();
        render(<FinancialRequestsHub view="cash-advances" cashAdvances={mockAdvances as any} onApproveCashAdvance={onApprove} />);

        const approveBtn = screen.getByText(/Approve/i);
        fireEvent.click(approveBtn);
        expect(onApprove).toHaveBeenCalledWith('adv1');
     });
  });
});
