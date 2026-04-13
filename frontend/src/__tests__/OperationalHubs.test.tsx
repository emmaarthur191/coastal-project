import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdministrativeHub from '../components/operational/AdministrativeHub';
import OnboardingHub from '../components/operational/OnboardingHub';
import FinancialRequestsHub from '../components/operational/FinancialRequestsHub';
import SupportHub from '../components/operational/SupportHub';
import FinancialOperationsHub from '../components/operational/FinancialOperationsHub';
import { apiService, authService } from '../services/api';
import { useAuth, AuthContextType, User } from '../context/AuthContext';
import type { AccountWithDetails, UserExtended, StaffId } from '../types';
import type { Loan } from '../api/models/Loan';
import type { AccountOpeningRequest } from '../api/models/AccountOpeningRequest';
import { Status669Enum } from '../api/models/Status669Enum';
import { LoanStatusEnum } from '../api/models/LoanStatusEnum';
import { AccountOpeningRequestAccountTypeEnum } from '../api/models/AccountOpeningRequestAccountTypeEnum';
import { RoleEnum } from '../api/models/RoleEnum';
import type { Expense } from '../components/operational/FinancialOperationsHub';
import React from 'react';

// Mocks
vi.mock('../services/api', () => ({
  apiService: {
    getAccounts: vi.fn(),
    getAccountOpenings: vi.fn(),
    approveAndPrintAccountOpening: vi.fn(),
    rejectAccountOpening: vi.fn(),
    getLoans: vi.fn().mockResolvedValue({ success: true, data: [] }),
    getCashAdvances: vi.fn(),
    getRefunds: vi.fn(),
    getReports: vi.fn(),
    getComplaints: vi.fn().mockResolvedValue({ 
      success: true, 
      data: [{ id: 'c1', subject: 'Test Complaint', status: 'pending', category: 'billing' }] 
    }),
    getComplaintSummary: vi.fn().mockResolvedValue({ success: true, data: { total_complaints: 0, resolved_complaints: 0, open_complaints: 0, escalated_complaints: 0 } }),
    getServiceRequests: vi.fn().mockResolvedValue({ success: true, data: [] }),
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
    getStaffUsers: vi.fn().mockResolvedValue({ success: true, data: [] }),
  }
}));

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Operational Unified Hubs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 1, role: 'manager', email: 'manager@coastal.com', username: 'manager' } as User,
      isAuthenticated: true,
      isManager: true,
      isCashier: false,
      isMobileBanker: false,
      isOperationsManager: false,
      isMember: false,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
      getDashboardRoute: vi.fn(),
      updateUser: vi.fn(),
      loading: false,
    } as AuthContextType);
  });

  describe('AdministrativeHub', () => {
    const mockAccounts: AccountWithDetails[] = [
      {
        id: 1,
        account_number: '123456',
        user: { id: 1, full_name: 'John Doe', email: 'john@test.com' },
        account_type: 'savings',
        balance: '1000.00',
        calculated_balance: '1000.00',
        customer_name: 'John Doe',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        account_type_display: 'Savings',
      },
      {
        id: 2,
        account_number: '999888',
        user: { id: 2, full_name: 'Jane Smith', email: 'jane@test.com' },
        account_type: 'current',
        balance: '500.00',
        calculated_balance: '500.00',
        customer_name: 'Jane Smith',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        account_type_display: 'Current',
      },
    ];

    it('renders accounts view and handles search', async () => {
      vi.mocked(authService.getStaffAccounts).mockResolvedValue({ success: true, data: mockAccounts });

      render(<AdministrativeHub mode="manager" initialTab="accounts" />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Filter account matrix/i);
      fireEvent.change(searchInput, { target: { value: 'Jane' } });

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });

    it('switches to Staff IDs tab', async () => {
      const mockStaff: UserExtended[] = [{
        id: 1,
        username: 'alice.smith',
        email: 'alice@coastal.com',
        first_name: 'Alice',
        last_name: 'Smith',
        name: 'Alice Smith',
        role: RoleEnum.CASHIER,
        is_active: true,
        is_staff: true,
        is_superuser: false,
        staff_id: 'CA001',
        is_approved: false,
      }];
      vi.mocked(authService.getStaffIds).mockResolvedValue({ success: true, data: mockStaff as unknown as StaffId[] });
      vi.mocked(authService.getStaffAccounts).mockResolvedValue({ success: true, data: [] });

      render(<AdministrativeHub mode="manager" initialTab="staff-ids" />);

      await waitFor(() => {
        expect(screen.getByText(/Staff IDs Management/i)).toBeInTheDocument();
        expect(screen.getByText(/Alice Smith/i)).toBeInTheDocument();
      });
    });

    it('switches to Charges tab', async () => {
      render(<AdministrativeHub mode="manager" />);

      const chargesTab = screen.getByText(/Charges/);
      fireEvent.click(chargesTab);

      await waitFor(() => {
        expect(screen.getByText(/Establish Charge Identity/i)).toBeInTheDocument();
      });
    });
  });

  describe('FinancialOperationsHub', () => {
    it('renders expenses and allows recording', async () => {
      const mockExpenses: Expense[] = [{ date: '2026-04-01', category: 'Utilities', description: 'Power bill', amount: 500, status: 'pending' }];
      vi.mocked(authService.getExpenses).mockResolvedValue({ success: true, data: mockExpenses });

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
         expect(screen.getByText(/Generate Staff Payslip/i)).toBeInTheDocument();
       });
    });

    it('switches to Cash Flow tab', async () => {
        vi.mocked(authService.getCashFlow).mockResolvedValue({
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
      const mockRequests: AccountOpeningRequest[] = [{
        id: 1,
        first_name: 'John',
        last_name: 'Doe',
        phone_number: '1234567890',
        account_type: AccountOpeningRequestAccountTypeEnum.DAILY_SUSU,
        id_type: 'passport',
        id_number: 'P123',
        status: Status669Enum.PENDING,
        email: 'john@test.com',
        date_of_birth: '1990-01-01',
        address: '123 Main St',
        occupation: 'Engineer',
        work_address: '456 Work Ave',
        position: 'Senior',
        digital_address: 'GA-000-0001',
        location: 'Accra',
        next_of_kin_data: '{}',
        photo: '',
        full_name: 'John Doe',
        processed_by: null,
        submitted_by: null,
        created_account: null,
        credentials_approved_by: null,
        credentials_sent_at: null,
        rejection_reason: '',
        notes: '',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
        approved_at: null,
      }];

      vi.mocked(apiService.getAccountOpenings).mockResolvedValue({ success: true, data: mockRequests });

      render(<OnboardingHub mode="manager" />);

      await waitFor(() => {
        expect(screen.getByText(/Secure Paper-First Queue/i)).toBeInTheDocument();
        const matches = screen.getAllByText((_, el) => el?.textContent?.replace(/\s+/g, ' ').includes('John Doe') ?? false);
        expect(matches.length).toBeGreaterThan(0);
      });
    });
  });

  describe('FinancialRequestsHub', () => {
     it('renders manager mode with loans', async () => {
        const mockLoans: Loan[] = [{
          id: 1,
          user: 1,
          borrower_name: 'John',
          borrower_email: 'john@test.com',
          amount: '5000',
          interest_rate: '10.00',
          term_months: 12,
          purpose: 'business',
          date_of_birth: '1990-01-01',
          id_number: 'GH123456',
          digital_address: 'GA-000-0001',
          next_of_kin_1_name: 'Jane Doe',
          next_of_kin_1_phone: '0551234567',
          next_of_kin_1_address: '123 Main St',
          next_of_kin_2_name: 'Bob Doe',
          next_of_kin_2_phone: '0559876543',
          next_of_kin_2_address: '456 Side St',
          guarantor_1_name: 'Guarantor One',
          guarantor_1_id_number: 'GH111111',
          guarantor_1_phone: '0551111111',
          guarantor_1_address: '1 Guarantor Rd',
          guarantor_2_name: 'Guarantor Two',
          guarantor_2_id_number: 'GH222222',
          guarantor_2_phone: '0552222222',
          guarantor_2_address: '2 Guarantor Rd',
          outstanding_balance: '5000.00',
          status: LoanStatusEnum.PENDING,
          approved_at: null,
          created_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
        }];

        vi.mocked(apiService.getLoans).mockResolvedValue({ 
            success: true, 
            data: mockLoans,
        });

        render(<FinancialRequestsHub mode="manager" initialView="pending-loans" />);

        await waitFor(() => {
            expect(screen.getByText('John')).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Approve/i })).toBeInTheDocument();
        });
     });
  });

  describe('SupportHub', () => {
    it('renders complaints view correctly', async () => {
      render(<SupportHub mode="manager" initialTab="complaints" />);
      await waitFor(() => {
        const headings = screen.getAllByText(/Active Complaints/i);
        expect(headings.length).toBeGreaterThan(0);
        expect(headings[0]).toBeInTheDocument();
      });
    });
  });
});
