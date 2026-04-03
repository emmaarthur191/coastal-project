import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdministrativeHub from '../components/operational/AdministrativeHub';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import FinancialOperationsHub from '../components/operational/FinancialOperationsHub';
import { apiService, authService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import React from 'react';

// Mocks
vi.mock('../services/api', () => ({
  apiService: {
    getAccounts: vi.fn(),
    getAccountOpenings: vi.fn(),
    approveAndPrintAccountOpening: vi.fn(),
    rejectAccountOpening: vi.fn(),
    getLoans: vi.fn(),
    getCashAdvances: vi.fn(),
    getRefunds: vi.fn(),
    getReports: vi.fn(),
    getComplaints: vi.fn().mockResolvedValue({ success: true, data: { results: [] } }),
    getComplaintSummary: vi.fn().mockResolvedValue({ success: true, data: { total_complaints: 0, resolved_complaints: 0, open_complaints: 0, escalated_complaints: 0 } }),
    getServiceRequests: vi.fn().mockResolvedValue({ success: true, data: { results: [] } }),
    getServiceRequestStats: vi.fn().mockResolvedValue({ success: true, data: {} }),
  },
  authService: {
    getStaffAccounts: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getAccountClosures: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getAllStaff: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getStaffIds: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getServiceCharges: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getExpenses: vi.fn().mockResolvedValue({ success: true, data: [] }),
    createExpense: vi.fn().mockResolvedValue({ success: true }),
    getCashFlow: vi.fn().mockResolvedValue({ success: true, data: { inflow: { total: 0 }, outflow: { total: 0 }, net_cash_flow: 0, period: 'April' } }),
    calculateInterest: vi.fn().mockResolvedValue({ success: true, data: {} }),
    calculateCommission: vi.fn().mockResolvedValue({ success: true, data: {} }),
    generatePayslip: vi.fn().mockResolvedValue({ success: true }),
    generateStatement: vi.fn().mockResolvedValue({ success: true }),
  }
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
      { 
        id: '1', 
        account_number: '123456', 
        user: { full_name: 'John Doe' }, 
        account_type: 'savings', 
        balance: 1000, 
        status: 'active' 
      },
      { 
        id: '2', 
        account_number: '999888', 
        user: { full_name: 'Jane Smith' }, 
        account_type: 'current', 
        balance: 500, 
        status: 'active' 
      },
    ];

    it('renders accounts view and handles search', async () => {
      (authService.getStaffAccounts as any).mockResolvedValue({ success: true, data: mockAccounts });
      
      render(<AdministrativeHub mode="manager" initialTab="accounts" />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });
      
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('switches to Staff IDs tab', async () => {
      const mockStaff = [{ id: 's1', first_name: 'Alice', last_name: 'Smith', staff_id: 'CA001', is_approved: true }];
      (authService.getStaffIds as any).mockResolvedValue({ success: true, data: mockStaff });
      
      render(<AdministrativeHub mode="manager" />);
      
      const idsTab = screen.getByText(/IDs/);
      fireEvent.click(idsTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Staff IDs Management/i)).toBeInTheDocument();
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
      });
    });

    it('switches to Charges tab', async () => {
      render(<AdministrativeHub mode="manager" />);
      
      const chargesTab = screen.getByText(/Charges/);
      fireEvent.click(chargesTab);
      
      await waitFor(() => {
        expect(screen.getByText(/Create New Charge/i)).toBeInTheDocument();
      });
    });
  });

  describe('FinancialOperationsHub', () => {
    it('renders expenses and allows recording', async () => {
      const mockExpenses = [{ date: '2026-04-01', category: 'Utilities', description: 'Power bill', amount: 500 }];
      (authService.getExpenses as any).mockResolvedValue({ success: true, data: mockExpenses });
      
      render(<FinancialOperationsHub mode="manager" initialTab="expenses" />);
      
      await waitFor(() => {
        expect(screen.getByText(/Record New Expense/i)).toBeInTheDocument();
        expect(screen.getByText('Power bill')).toBeInTheDocument();
      });
    });

    it('switches to Payroll tab', async () => {
       render(<FinancialOperationsHub mode="manager" />);
       
       const payrollTab = screen.getByText(/Payroll/);
       fireEvent.click(payrollTab);
       
       await waitFor(() => {
         expect(screen.getByText(/Staff Payslip Generation/i)).toBeInTheDocument();
       });
    });

    it('switches to Cash Flow tab', async () => {
        (authService.getCashFlow as any).mockResolvedValue({ 
            success: true, 
            data: { 
                inflow: { total: 5000, deposits: 4000, loan_repayments: 1000 },
                outflow: { total: 2000, withdrawals: 1500, loan_disbursements: 500 },
                net_cash_flow: 3000,
                period: 'April 2026'
            } 
        });

        render(<FinancialOperationsHub mode="manager" />);
        
        const cfTab = screen.getByText(/Cash Flow/);
        fireEvent.click(cfTab);
        
        await waitFor(() => {
            expect(screen.getByText(/Net Cash Flow/i)).toBeInTheDocument();
            expect(screen.getByText(/3,000.00/)).toBeInTheDocument();
        });
     });
  });

  describe('OnboardingHub', () => {
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
        expect(screen.getByRole('button', { name: /Approve & Print/i })).toBeInTheDocument();
      });
    });
  });

  describe('FinancialRequestsHub', () => {
     it('renders manager mode with loans', async () => {
        const mockLoans = [{ id: 'loan1', amount: '5000', status: 'pending', purpose: 'business', borrower_name: 'John' }];
        (apiService.getLoans as any).mockResolvedValue({ success: true, data: mockLoans });

        render(<FinancialRequestsHub mode="manager" initialView="loans" />);
        
        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
        });
     });
  });

  describe('SupportHub', () => {
    it('renders complaints view correctly', () => {
      render(<SupportHub mode="manager" initialTab="complaints" />);
      expect(screen.getByText(/Recent Complaints/i)).toBeInTheDocument();
    });
  });
});
