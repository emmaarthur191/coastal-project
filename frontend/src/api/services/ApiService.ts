/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Account } from '../models/Account';
import type { AccountClosureRequest } from '../models/AccountClosureRequest';
import type { AccountOpeningRequest } from '../models/AccountOpeningRequest';
import type { AccountStatement } from '../models/AccountStatement';
import type { BlockedUser } from '../models/BlockedUser';
import type { CashAdvance } from '../models/CashAdvance';
import type { CashDrawer } from '../models/CashDrawer';
import type { ChatRoom } from '../models/ChatRoom';
import type { CheckDeposit } from '../models/CheckDeposit';
import type { ClientAssignment } from '../models/ClientAssignment';
import type { Complaint } from '../models/Complaint';
import type { Device } from '../models/Device';
import type { FraudAlert } from '../models/FraudAlert';
import type { Loan } from '../models/Loan';
import type { Message } from '../models/Message';
import type { MessageThread } from '../models/MessageThread';
import type { OperationsMessage } from '../models/OperationsMessage';
import type { PaginatedAccountClosureRequestList } from '../models/PaginatedAccountClosureRequestList';
import type { PaginatedAccountList } from '../models/PaginatedAccountList';
import type { PaginatedAccountOpeningRequestList } from '../models/PaginatedAccountOpeningRequestList';
import type { PaginatedAccountStatementList } from '../models/PaginatedAccountStatementList';
import type { PaginatedCashAdvanceList } from '../models/PaginatedCashAdvanceList';
import type { PaginatedCashDrawerList } from '../models/PaginatedCashDrawerList';
import type { PaginatedChatMessageList } from '../models/PaginatedChatMessageList';
import type { PaginatedChatRoomList } from '../models/PaginatedChatRoomList';
import type { PaginatedCheckDepositList } from '../models/PaginatedCheckDepositList';
import type { PaginatedClientAssignmentList } from '../models/PaginatedClientAssignmentList';
import type { PaginatedComplaintList } from '../models/PaginatedComplaintList';
import type { PaginatedDeviceList } from '../models/PaginatedDeviceList';
import type { PaginatedFraudAlertList } from '../models/PaginatedFraudAlertList';
import type { PaginatedLoanList } from '../models/PaginatedLoanList';
import type { PaginatedMessageList } from '../models/PaginatedMessageList';
import type { PaginatedMessageThreadList } from '../models/PaginatedMessageThreadList';
import type { PaginatedOperationsMessageList } from '../models/PaginatedOperationsMessageList';
import type { PaginatedPayslipList } from '../models/PaginatedPayslipList';
import type { PaginatedProductList } from '../models/PaginatedProductList';
import type { PaginatedPromotionList } from '../models/PaginatedPromotionList';
import type { PaginatedRefundList } from '../models/PaginatedRefundList';
import type { PaginatedReportList } from '../models/PaginatedReportList';
import type { PaginatedReportScheduleList } from '../models/PaginatedReportScheduleList';
import type { PaginatedReportTemplateList } from '../models/PaginatedReportTemplateList';
import type { PaginatedServiceRequestList } from '../models/PaginatedServiceRequestList';
import type { PaginatedTransactionList } from '../models/PaginatedTransactionList';
import type { PaginatedUserList } from '../models/PaginatedUserList';
import type { PaginatedVisitScheduleList } from '../models/PaginatedVisitScheduleList';
import type { PatchedAccount } from '../models/PatchedAccount';
import type { PatchedAccountStatement } from '../models/PatchedAccountStatement';
import type { PatchedClientAssignment } from '../models/PatchedClientAssignment';
import type { PatchedComplaint } from '../models/PatchedComplaint';
import type { PatchedFraudAlert } from '../models/PatchedFraudAlert';
import type { PatchedLoan } from '../models/PatchedLoan';
import type { PatchedOperationsMessage } from '../models/PatchedOperationsMessage';
import type { PatchedPayslip } from '../models/PatchedPayslip';
import type { PatchedProduct } from '../models/PatchedProduct';
import type { PatchedRefund } from '../models/PatchedRefund';
import type { PatchedReportSchedule } from '../models/PatchedReportSchedule';
import type { PatchedServiceRequest } from '../models/PatchedServiceRequest';
import type { PatchedUser } from '../models/PatchedUser';
import type { PatchedVisitSchedule } from '../models/PatchedVisitSchedule';
import type { Payslip } from '../models/Payslip';
import type { Product } from '../models/Product';
import type { Promotion } from '../models/Promotion';
import type { Refund } from '../models/Refund';
import type { Report } from '../models/Report';
import type { ReportSchedule } from '../models/ReportSchedule';
import type { ReportTemplate } from '../models/ReportTemplate';
import type { ServiceRequest } from '../models/ServiceRequest';
import type { TokenRefresh } from '../models/TokenRefresh';
import type { Transaction } from '../models/Transaction';
import type { User } from '../models/User';
import type { UserRegistration } from '../models/UserRegistration';
import type { VisitSchedule } from '../models/VisitSchedule';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApiService {
    /**
     * @param accountType * `daily_susu` - Daily Susu
     * * `shares` - Shares
     * * `monthly_contribution` - Monthly Contribution
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAccountList
     * @throws ApiError
     */
    public static apiAccountsList(
        accountType?: 'daily_susu' | 'monthly_contribution' | 'shares',
        isActive?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/',
            query: {
                'account_type': accountType,
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsCreate(
        requestBody: Account,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this account.
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsRetrieve(
        id: number,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsUpdate(
        id: number,
        requestBody: Account,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsPartialUpdate(
        id: number,
        requestBody?: PatchedAccount,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Stub view for audit dashboard.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiAuditDashboardRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audit/dashboard/',
        });
    }
    /**
     * ViewSet for handling account closure requests.
     * @param closureReason * `customer_request` - Customer Request
     * * `account_inactive` - Account Inactive
     * * `fraud_suspected` - Fraud Suspected
     * * `compliance` - Compliance Issue
     * * `other` - Other
     * @param ordering Which field to use when ordering the results.
     * @param otpVerified
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending Review
     * * `approved` - Approved
     * * `rejected` - Rejected
     * * `completed` - Completed
     * @returns PaginatedAccountClosureRequestList
     * @throws ApiError
     */
    public static apiBankingAccountClosuresList(
        closureReason?: 'account_inactive' | 'compliance' | 'customer_request' | 'fraud_suspected' | 'other',
        ordering?: string,
        otpVerified?: boolean,
        page?: number,
        status?: 'approved' | 'completed' | 'pending' | 'rejected',
    ): CancelablePromise<PaginatedAccountClosureRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-closures/',
            query: {
                'closure_reason': closureReason,
                'ordering': ordering,
                'otp_verified': otpVerified,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for handling account closure requests.
     * @param requestBody
     * @returns AccountClosureRequest
     * @throws ApiError
     */
    public static apiBankingAccountClosuresCreate(
        requestBody: AccountClosureRequest,
    ): CancelablePromise<AccountClosureRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-closures/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling account closure requests.
     * @param id A unique integer value identifying this Account Closure Request.
     * @returns AccountClosureRequest
     * @throws ApiError
     */
    public static apiBankingAccountClosuresRetrieve(
        id: number,
    ): CancelablePromise<AccountClosureRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-closures/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve an account closure request and close the account.
     * @param id A unique integer value identifying this Account Closure Request.
     * @param requestBody
     * @returns AccountClosureRequest
     * @throws ApiError
     */
    public static apiBankingAccountClosuresApproveCreate(
        id: number,
        requestBody: AccountClosureRequest,
    ): CancelablePromise<AccountClosureRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-closures/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject an account closure request.
     * @param id A unique integer value identifying this Account Closure Request.
     * @param requestBody
     * @returns AccountClosureRequest
     * @throws ApiError
     */
    public static apiBankingAccountClosuresRejectCreate(
        id: number,
        requestBody: AccountClosureRequest,
    ): CancelablePromise<AccountClosureRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-closures/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling account opening requests.
     * @param accountType * `daily_susu` - Daily Susu
     * * `shares` - Shares
     * * `monthly_contribution` - Monthly Contribution
     * @param cardType * `standard` - Standard Card
     * * `gold` - Gold Card
     * * `platinum` - Platinum Card
     * * `none` - No Card Required
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending Review
     * * `approved` - Approved
     * * `rejected` - Rejected
     * * `completed` - Completed
     * @returns PaginatedAccountOpeningRequestList
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsList(
        accountType?: 'daily_susu' | 'monthly_contribution' | 'shares',
        cardType?: 'gold' | 'none' | 'platinum' | 'standard',
        ordering?: string,
        page?: number,
        status?: 'approved' | 'completed' | 'pending' | 'rejected',
    ): CancelablePromise<PaginatedAccountOpeningRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-openings/',
            query: {
                'account_type': accountType,
                'card_type': cardType,
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for handling account opening requests.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsCreate(
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling account opening requests.
     * @param id A unique integer value identifying this Account Opening Request.
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsRetrieve(
        id: number,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-openings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve an account opening request.
     * @param id A unique integer value identifying this Account Opening Request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsApproveCreate(
        id: number,
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject an account opening request.
     * @param id A unique integer value identifying this Account Opening Request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsRejectCreate(
        id: number,
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send OTP to customer phone number for account opening verification.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsSendOtpCreate(
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/send_otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify OTP and submit account opening request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsVerifyAndSubmitCreate(
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/verify_and_submit/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing cash advance requests.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCashAdvanceList
     * @throws ApiError
     */
    public static apiBankingCashAdvancesList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedCashAdvanceList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-advances/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing cash advance requests.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesCreate(
        requestBody: CashAdvance,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing cash advance requests.
     * @param id
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesRetrieve(
        id: string,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-advances/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve a cash advance request.
     *
     * SECURITY: Only managers can approve, or staff within same branch.
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesApproveCreate(
        id: string,
        requestBody: CashAdvance,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Disburse an approved cash advance.
     *
     * SECURITY: Only managers can disburse, or staff within same branch.
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesDisburseCreate(
        id: string,
        requestBody: CashAdvance,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/{id}/disburse/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark a cash advance as repaid.
     *
     * SECURITY: Only managers can mark repaid, or staff within same branch.
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesRepayCreate(
        id: string,
        requestBody: CashAdvance,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/{id}/repay/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing cash drawers.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCashDrawerList
     * @throws ApiError
     */
    public static apiBankingCashDrawersList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedCashDrawerList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-drawers/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing cash drawers.
     * @param requestBody
     * @returns CashDrawer
     * @throws ApiError
     */
    public static apiBankingCashDrawersCreate(
        requestBody: CashDrawer,
    ): CancelablePromise<CashDrawer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-drawers/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing cash drawers.
     * @param id
     * @returns CashDrawer
     * @throws ApiError
     */
    public static apiBankingCashDrawersRetrieve(
        id: string,
    ): CancelablePromise<CashDrawer> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-drawers/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Close a cash drawer.
     * @param id
     * @param requestBody
     * @returns CashDrawer
     * @throws ApiError
     */
    public static apiBankingCashDrawersCloseCreate(
        id: string,
        requestBody: CashDrawer,
    ): CancelablePromise<CashDrawer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-drawers/{id}/close/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reconcile a closed cash drawer.
     * @param id
     * @param requestBody
     * @returns CashDrawer
     * @throws ApiError
     */
    public static apiBankingCashDrawersReconcileCreate(
        id: string,
        requestBody: CashDrawer,
    ): CancelablePromise<CashDrawer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-drawers/{id}/reconcile/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handle client registration form submission.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsSubmitRegistrationCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/submit_registration/',
        });
    }
    /**
     * ViewSet for handling customer complaints.
     * @param category * `account` - Account Issues
     * * `transaction` - Transaction Issues
     * * `service` - Service Quality
     * * `staff` - Staff Behavior
     * * `technical` - Technical Issues
     * * `fees` - Fees and Charges
     * * `other` - Other
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param priority * `low` - Low
     * * `medium` - Medium
     * * `high` - High
     * * `critical` - Critical
     * @param status * `open` - Open
     * * `in_progress` - In Progress
     * * `resolved` - Resolved
     * * `closed` - Closed
     * @returns PaginatedComplaintList
     * @throws ApiError
     */
    public static apiBankingComplaintsList(
        category?: 'account' | 'fees' | 'other' | 'service' | 'staff' | 'technical' | 'transaction',
        ordering?: string,
        page?: number,
        priority?: 'critical' | 'high' | 'low' | 'medium',
        status?: 'closed' | 'in_progress' | 'open' | 'resolved',
    ): CancelablePromise<PaginatedComplaintList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/complaints/',
            query: {
                'category': category,
                'ordering': ordering,
                'page': page,
                'priority': priority,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for handling customer complaints.
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsCreate(
        requestBody: Complaint,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling customer complaints.
     * @param id A unique integer value identifying this Complaint.
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsRetrieve(
        id: number,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/complaints/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for handling customer complaints.
     * @param id A unique integer value identifying this Complaint.
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsUpdate(
        id: number,
        requestBody: Complaint,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/complaints/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling customer complaints.
     * @param id A unique integer value identifying this Complaint.
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsPartialUpdate(
        id: number,
        requestBody?: PatchedComplaint,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/complaints/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resolve a complaint.
     * @param id A unique integer value identifying this Complaint.
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsResolveCreate(
        id: number,
        requestBody: Complaint,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/{id}/resolve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get summary report of complaints.
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsSummaryRetrieve(): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/complaints/reports/summary/',
        });
    }
    /**
     * Return devices for the current user.
     * @param page A page number within the paginated result set.
     * @returns PaginatedDeviceList
     * @throws ApiError
     */
    public static apiBankingDevicesList(
        page?: number,
    ): CancelablePromise<PaginatedDeviceList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/devices/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Register a device for push notifications.
     * @param requestBody
     * @returns Device
     * @throws ApiError
     */
    public static apiBankingDevicesCreate(
        requestBody: Device,
    ): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/devices/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for device registration for push notifications.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingDevicesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/devices/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Sync endpoint to check connection status.
     * @returns Device
     * @throws ApiError
     */
    public static apiBankingDevicesSyncDataRetrieve(): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/devices/sync_data/',
        });
    }
    /**
     * View to generate account statements.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingGenerateStatementCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/generate-statement/',
        });
    }
    /**
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending
     * * `approved` - Approved
     * * `active` - Active
     * * `paid_off` - Paid Off
     * * `defaulted` - Defaulted
     * * `rejected` - Rejected
     * @returns PaginatedLoanList
     * @throws ApiError
     */
    public static apiBankingLoansList(
        ordering?: string,
        page?: number,
        status?: 'active' | 'approved' | 'defaulted' | 'paid_off' | 'pending' | 'rejected',
    ): CancelablePromise<PaginatedLoanList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/loans/',
            query: {
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansCreate(
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/loans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansRetrieve(
        id: number,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/loans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansUpdate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/loans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansPartialUpdate(
        id: number,
        requestBody?: PatchedLoan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/loans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansApproveCreate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/loans/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all pending loan applications filtered by role authority.
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansPendingRetrieve(): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/loans/pending/',
        });
    }
    /**
     * Return threads for the current user.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedMessageThreadList
     * @throws ApiError
     */
    public static apiBankingMessageThreadsList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedMessageThreadList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/message-threads/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * Create a new message thread.
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsCreate(
        requestBody: MessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve a message thread with messages.
     * @param id
     * @returns MessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsRetrieve(
        id: string,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/message-threads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Archive a thread.
     * @param id
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsArchiveCreate(
        id: string,
        requestBody: MessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/{id}/archive/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark all messages in thread as read by current user.
     * @param id
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsMarkAsReadCreate(
        id: string,
        requestBody: MessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/{id}/mark_as_read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send a message to a thread.
     * @param id
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsSendMessageCreate(
        id: string,
        requestBody: MessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/{id}/send_message/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for new messaging system messages.
     * @param page A page number within the paginated result set.
     * @returns PaginatedMessageList
     * @throws ApiError
     */
    public static apiBankingMessagesList(
        page?: number,
    ): CancelablePromise<PaginatedMessageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/messages/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for new messaging system messages.
     * @param requestBody
     * @returns Message
     * @throws ApiError
     */
    public static apiBankingMessagesCreate(
        requestBody: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for new messaging system messages.
     * @param id
     * @param requestBody
     * @returns Message
     * @throws ApiError
     */
    public static apiBankingMessagesAddReactionCreate(
        id: string,
        requestBody: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/{id}/add_reaction/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for new messaging system messages.
     * @param id
     * @param requestBody
     * @returns Message
     * @throws ApiError
     */
    public static apiBankingMessagesRemoveReactionCreate(
        id: string,
        requestBody: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/{id}/remove_reaction/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload media for a message.
     * @param requestBody
     * @returns Message
     * @throws ApiError
     */
    public static apiBankingMessagesUploadMediaCreate(
        requestBody: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/upload_media/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling refund requests.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param reason * `duplicate_charge` - Duplicate Charge
     * * `unauthorized` - Unauthorized Transaction
     * * `service_issue` - Service Issue
     * * `product_return` - Product Return
     * * `billing_error` - Billing Error
     * * `other` - Other
     * @param status * `pending` - Pending
     * * `approved` - Approved
     * * `rejected` - Rejected
     * * `processed` - Processed
     * @returns PaginatedRefundList
     * @throws ApiError
     */
    public static apiBankingRefundsList(
        ordering?: string,
        page?: number,
        reason?: 'billing_error' | 'duplicate_charge' | 'other' | 'product_return' | 'service_issue' | 'unauthorized',
        status?: 'approved' | 'pending' | 'processed' | 'rejected',
    ): CancelablePromise<PaginatedRefundList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/refunds/',
            query: {
                'ordering': ordering,
                'page': page,
                'reason': reason,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for handling refund requests.
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsCreate(
        requestBody: Refund,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/refunds/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling refund requests.
     * @param id A unique integer value identifying this Refund.
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsRetrieve(
        id: number,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/refunds/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for handling refund requests.
     * @param id A unique integer value identifying this Refund.
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsUpdate(
        id: number,
        requestBody: Refund,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/refunds/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling refund requests.
     * @param id A unique integer value identifying this Refund.
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsPartialUpdate(
        id: number,
        requestBody?: PatchedRefund,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/refunds/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve a refund request.
     * @param id A unique integer value identifying this Refund.
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsApproveCreate(
        id: number,
        requestBody: Refund,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/refunds/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a refund request.
     * @param id A unique integer value identifying this Refund.
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsRejectCreate(
        id: number,
        requestBody: Refund,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/refunds/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List all accounts with user details for staff dashboard.
     * @param accountType * `daily_susu` - Daily Susu
     * * `shares` - Shares
     * * `monthly_contribution` - Monthly Contribution
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAccountList
     * @throws ApiError
     */
    public static apiBankingStaffAccountsList(
        accountType?: 'daily_susu' | 'monthly_contribution' | 'shares',
        isActive?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/',
            query: {
                'account_type': accountType,
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for staff to view and manage customer accounts.
     * @param id A unique integer value identifying this account.
     * @returns Account
     * @throws ApiError
     */
    public static apiBankingStaffAccountsRetrieve(
        id: number,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get summary statistics for all accounts.
     * @returns Account
     * @throws ApiError
     */
    public static apiBankingStaffAccountsSummaryRetrieve(): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/summary/',
        });
    }
    /**
     * GET /api/chat/rooms/
     * List all chat rooms for authenticated user.
     * @param page A page number within the paginated result set.
     * @returns PaginatedChatRoomList
     * @throws ApiError
     */
    public static apiChatRoomsList(
        page?: number,
    ): CancelablePromise<PaginatedChatRoomList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * GET /api/chat/rooms/<id>/
     * Get details of a specific chat room.
     * @param id
     * @returns ChatRoom
     * @throws ApiError
     */
    public static apiChatRoomsRetrieve(
        id: number,
    ): CancelablePromise<ChatRoom> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * GET /api/chat/rooms/<room_id>/messages/
     * Get message history for a room.
     * @param roomId
     * @param page A page number within the paginated result set.
     * @returns PaginatedChatMessageList
     * @throws ApiError
     */
    public static apiChatRoomsMessagesList(
        roomId: number,
        page?: number,
    ): CancelablePromise<PaginatedChatMessageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/chat/rooms/{room_id}/messages/',
            path: {
                'room_id': roomId,
            },
            query: {
                'page': page,
            },
        });
    }
    /**
     * POST /api/chat/rooms/<room_id>/messages/
     * Send a message via REST (fallback for WebSocket issues).
     * @param roomId
     * @returns any No response body
     * @throws ApiError
     */
    public static apiChatRoomsMessagesSendCreate(
        roomId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/{room_id}/messages/send/',
            path: {
                'room_id': roomId,
            },
        });
    }
    /**
     * POST /api/chat/rooms/<room_id>/read/
     * Mark all messages in room as read for current user.
     * @param roomId
     * @returns any No response body
     * @throws ApiError
     */
    public static apiChatRoomsReadCreate(
        roomId: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/{room_id}/read/',
            path: {
                'room_id': roomId,
            },
        });
    }
    /**
     * POST /api/chat/rooms/
     * Create a new chat room (direct or group).
     * @returns any No response body
     * @throws ApiError
     */
    public static apiChatRoomsCreateCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/chat/rooms/create/',
        });
    }
    /**
     * ViewSet for managing check deposits.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCheckDepositList
     * @throws ApiError
     */
    public static apiCheckDepositsList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedCheckDepositList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/check-deposits/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing check deposits.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiCheckDepositsCreate(
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing check deposits.
     * @param id
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiCheckDepositsRetrieve(
        id: string,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/check-deposits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve a check deposit and credit the account.
     * @param id
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiCheckDepositsApproveCreate(
        id: string,
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a check deposit.
     * @param id
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiCheckDepositsRejectCreate(
        id: string,
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Process a check deposit from the cashier dashboard.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiCheckDepositsProcessCheckDepositCreate(
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/process_check_deposit/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param isResolved
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param severity * `low` - Low
     * * `medium` - Medium
     * * `high` - High
     * * `critical` - Critical
     * @returns PaginatedFraudAlertList
     * @throws ApiError
     */
    public static apiFraudAlertsList(
        isResolved?: boolean,
        ordering?: string,
        page?: number,
        severity?: 'critical' | 'high' | 'low' | 'medium',
    ): CancelablePromise<PaginatedFraudAlertList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud-alerts/',
            query: {
                'is_resolved': isResolved,
                'ordering': ordering,
                'page': page,
                'severity': severity,
            },
        });
    }
    /**
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsCreate(
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud-alerts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsRetrieve(
        id: number,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud-alerts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsUpdate(
        id: number,
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/fraud-alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsPartialUpdate(
        id: number,
        requestBody?: PatchedFraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/fraud-alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get fraud alert statistics for dashboard.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsDashboardStatsRetrieve(): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud-alerts/dashboard_stats/',
        });
    }
    /**
     * @param isResolved
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param severity * `low` - Low
     * * `medium` - Medium
     * * `high` - High
     * * `critical` - Critical
     * @returns PaginatedFraudAlertList
     * @throws ApiError
     */
    public static apiFraudAlertsList2(
        isResolved?: boolean,
        ordering?: string,
        page?: number,
        severity?: 'critical' | 'high' | 'low' | 'medium',
    ): CancelablePromise<PaginatedFraudAlertList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/alerts/',
            query: {
                'is_resolved': isResolved,
                'ordering': ordering,
                'page': page,
                'severity': severity,
            },
        });
    }
    /**
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsCreate2(
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/alerts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsRetrieve2(
        id: number,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/alerts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsUpdate2(
        id: number,
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/fraud/alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsPartialUpdate2(
        id: number,
        requestBody?: PatchedFraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/fraud/alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get fraud alert statistics for dashboard.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsDashboardStatsRetrieve2(): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/alerts/dashboard_stats/',
        });
    }
    /**
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending
     * * `approved` - Approved
     * * `active` - Active
     * * `paid_off` - Paid Off
     * * `defaulted` - Defaulted
     * * `rejected` - Rejected
     * @returns PaginatedLoanList
     * @throws ApiError
     */
    public static apiLoansList(
        ordering?: string,
        page?: number,
        status?: 'active' | 'approved' | 'defaulted' | 'paid_off' | 'pending' | 'rejected',
    ): CancelablePromise<PaginatedLoanList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loans/',
            query: {
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiLoansCreate(
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @returns Loan
     * @throws ApiError
     */
    public static apiLoansRetrieve(
        id: number,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiLoansUpdate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/loans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiLoansPartialUpdate(
        id: number,
        requestBody?: PatchedLoan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/loans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiLoansApproveCreate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loans/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all pending loan applications filtered by role authority.
     * @returns Loan
     * @throws ApiError
     */
    public static apiLoansPendingRetrieve(): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loans/pending/',
        });
    }
    /**
     * ViewSet for managing blocked users.
     * @returns BlockedUser
     * @throws ApiError
     */
    public static apiMessagingBlockedUsersList(): CancelablePromise<Array<BlockedUser>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/blocked-users/',
        });
    }
    /**
     * ViewSet for managing blocked users.
     * @param requestBody
     * @returns BlockedUser
     * @throws ApiError
     */
    public static apiMessagingBlockedUsersCreate(
        requestBody: BlockedUser,
    ): CancelablePromise<BlockedUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/blocked-users/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing blocked users.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingBlockedUsersDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/blocked-users/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Unblock a user by their ID.
     * @param requestBody
     * @returns BlockedUser
     * @throws ApiError
     */
    public static apiMessagingBlockedUsersUnblockCreate(
        requestBody: BlockedUser,
    ): CancelablePromise<BlockedUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/blocked-users/unblock/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get current user's message preferences.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiMessagingPreferencesRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/preferences/',
        });
    }
    /**
     * Update user's message preferences.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiMessagingPreferencesCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/preferences/',
        });
    }
    /**
     * ViewSet for managing client assignments to mobile bankers.
     *
     * Mobile bankers can view their assigned clients.
     * Managers can manage all assignments.
     * @param isActive
     * @param mobileBanker
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param priority * `low` - Low
     * * `medium` - Medium
     * * `high` - High
     * * `urgent` - Urgent
     * @param status * `pending` - Pending Visit
     * * `due_payment` - Due Payment
     * * `overdue_payment` - Overdue Payment
     * * `loan_application` - Loan Application
     * * `account_opening` - Account Opening
     * * `follow_up` - Follow Up
     * * `completed` - Completed
     * @returns PaginatedClientAssignmentList
     * @throws ApiError
     */
    public static apiOperationsAssignmentsList(
        isActive?: boolean,
        mobileBanker?: number,
        ordering?: string,
        page?: number,
        priority?: 'high' | 'low' | 'medium' | 'urgent',
        status?: 'account_opening' | 'completed' | 'due_payment' | 'follow_up' | 'loan_application' | 'overdue_payment' | 'pending',
    ): CancelablePromise<PaginatedClientAssignmentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/assignments/',
            query: {
                'is_active': isActive,
                'mobile_banker': mobileBanker,
                'ordering': ordering,
                'page': page,
                'priority': priority,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for managing client assignments to mobile bankers.
     *
     * Mobile bankers can view their assigned clients.
     * Managers can manage all assignments.
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static apiOperationsAssignmentsCreate(
        requestBody: ClientAssignment,
    ): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/assignments/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing client assignments to mobile bankers.
     *
     * Mobile bankers can view their assigned clients.
     * Managers can manage all assignments.
     * @param id A unique integer value identifying this Client Assignment.
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static apiOperationsAssignmentsRetrieve(
        id: number,
    ): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/assignments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing client assignments to mobile bankers.
     *
     * Mobile bankers can view their assigned clients.
     * Managers can manage all assignments.
     * @param id A unique integer value identifying this Client Assignment.
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static apiOperationsAssignmentsUpdate(
        id: number,
        requestBody: ClientAssignment,
    ): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/assignments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing client assignments to mobile bankers.
     *
     * Mobile bankers can view their assigned clients.
     * Managers can manage all assignments.
     * @param id A unique integer value identifying this Client Assignment.
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static apiOperationsAssignmentsPartialUpdate(
        id: number,
        requestBody?: PatchedClientAssignment,
    ): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/assignments/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing client assignments to mobile bankers.
     *
     * Mobile bankers can view their assigned clients.
     * Managers can manage all assignments.
     * @param id A unique integer value identifying this Client Assignment.
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsAssignmentsDestroy(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/assignments/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Mark an assignment as completed.
     * @param id A unique integer value identifying this Client Assignment.
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static apiOperationsAssignmentsCompleteCreate(
        id: number,
        requestBody: ClientAssignment,
    ): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/assignments/{id}/complete/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update assignment status.
     * @param id A unique integer value identifying this Client Assignment.
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static apiOperationsAssignmentsUpdateStatusCreate(
        id: number,
        requestBody: ClientAssignment,
    ): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/assignments/{id}/update_status/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all clients assigned to the current mobile banker.
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static apiOperationsAssignmentsMyClientsRetrieve(): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/assignments/my_clients/',
        });
    }
    /**
     * View to return branch activity metrics from real transaction data.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsBranchActivityRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/branch-activity/',
        });
    }
    /**
     * View for calculating staff commissions.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsCalculateCommissionCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/calculate-commission/',
        });
    }
    /**
     * View for calculating loan or savings interest.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsCalculateInterestCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/calculate-interest/',
        });
    }
    /**
     * Calculate service charge for a specific scenario.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsCalculateServiceChargeCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/calculate-service-charge/',
        });
    }
    /**
     * View for retrieving cash flow metrics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsCashFlowRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/cash-flow/',
        });
    }
    /**
     * View for retrieving operational expense metrics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsExpensesRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/expenses/',
        });
    }
    /**
     * View to generate staff payslips.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsGeneratePayslipCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/generate-payslip/',
        });
    }
    /**
     * View to generate reports for operations manager.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsGenerateReportCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/generate-report/',
        });
    }
    /**
     * ViewSet for operations messages.
     * @param page A page number within the paginated result set.
     * @returns PaginatedOperationsMessageList
     * @throws ApiError
     */
    public static apiOperationsMessagesList(
        page?: number,
    ): CancelablePromise<PaginatedOperationsMessageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/messages/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for operations messages.
     * @param requestBody
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesCreate(
        requestBody: OperationsMessage,
    ): CancelablePromise<OperationsMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for operations messages.
     * @param id
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesRetrieve(
        id: string,
    ): CancelablePromise<OperationsMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for operations messages.
     * @param id
     * @param requestBody
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesUpdate(
        id: string,
        requestBody: OperationsMessage,
    ): CancelablePromise<OperationsMessage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for operations messages.
     * @param id
     * @param requestBody
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesPartialUpdate(
        id: string,
        requestBody?: PatchedOperationsMessage,
    ): CancelablePromise<OperationsMessage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for operations messages.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsMessagesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * View for operations metrics used by ManagerDashboard.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsMetricsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/metrics/',
        });
    }
    /**
     * Metrics for mobile banker dashboard.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsMobileBankerMetricsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/mobile-banker-metrics/',
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param isPaid
     * @param month
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param staff
     * @param year
     * @returns PaginatedPayslipList
     * @throws ApiError
     */
    public static apiOperationsPayslipsList(
        isPaid?: boolean,
        month?: number,
        ordering?: string,
        page?: number,
        staff?: number,
        year?: number,
    ): CancelablePromise<PaginatedPayslipList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/payslips/',
            query: {
                'is_paid': isPaid,
                'month': month,
                'ordering': ordering,
                'page': page,
                'staff': staff,
                'year': year,
            },
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param requestBody
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsCreate(
        requestBody: Payslip,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/payslips/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param id A unique integer value identifying this Payslip.
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsRetrieve(
        id: number,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/payslips/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param id A unique integer value identifying this Payslip.
     * @param requestBody
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsUpdate(
        id: number,
        requestBody: Payslip,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/payslips/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param id A unique integer value identifying this Payslip.
     * @param requestBody
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsPartialUpdate(
        id: number,
        requestBody?: PatchedPayslip,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/payslips/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param id A unique integer value identifying this Payslip.
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsPayslipsDestroy(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/payslips/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Download payslip PDF.
     * @param id A unique integer value identifying this Payslip.
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsDownloadRetrieve(
        id: number,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/payslips/{id}/download/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Mark payslip as paid.
     * @param id A unique integer value identifying this Payslip.
     * @param requestBody
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsMarkPaidCreate(
        id: number,
        requestBody: Payslip,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/payslips/{id}/mark_paid/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate a new payslip with PDF.
     * @param requestBody
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsGenerateCreate(
        requestBody: Payslip,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/payslips/generate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get current user's payslips.
     * @returns Payslip
     * @throws ApiError
     */
    public static apiOperationsPayslipsMyPayslipsRetrieve(): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/payslips/my_payslips/',
        });
    }
    /**
     * ViewSet for Mobile Banker operations.
     * Handles RPC-style actions: process_deposit, process_withdrawal, schedule_visit.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsProcessDepositCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/process_deposit/',
        });
    }
    /**
     * ViewSet for Mobile Banker operations.
     * Handles RPC-style actions: process_deposit, process_withdrawal, schedule_visit.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsProcessWithdrawalCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/process_withdrawal/',
        });
    }
    /**
     * ViewSet for Mobile Banker operations.
     * Handles RPC-style actions: process_deposit, process_withdrawal, schedule_visit.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsScheduleVisitCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/schedule_visit/',
        });
    }
    /**
     * Get all service charges.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsServiceChargesRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/service-charges/',
        });
    }
    /**
     * Create a new service charge.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsServiceChargesCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/service-charges/',
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param account
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending
     * * `generated` - Generated
     * * `failed` - Failed
     * @returns PaginatedAccountStatementList
     * @throws ApiError
     */
    public static apiOperationsStatementsList(
        account?: number,
        ordering?: string,
        page?: number,
        status?: 'failed' | 'generated' | 'pending',
    ): CancelablePromise<PaginatedAccountStatementList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/statements/',
            query: {
                'account': account,
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param requestBody
     * @returns AccountStatement
     * @throws ApiError
     */
    public static apiOperationsStatementsCreate(
        requestBody: AccountStatement,
    ): CancelablePromise<AccountStatement> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/statements/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param id A unique integer value identifying this Account Statement.
     * @returns AccountStatement
     * @throws ApiError
     */
    public static apiOperationsStatementsRetrieve(
        id: number,
    ): CancelablePromise<AccountStatement> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/statements/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param id A unique integer value identifying this Account Statement.
     * @param requestBody
     * @returns AccountStatement
     * @throws ApiError
     */
    public static apiOperationsStatementsUpdate(
        id: number,
        requestBody: AccountStatement,
    ): CancelablePromise<AccountStatement> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/statements/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param id A unique integer value identifying this Account Statement.
     * @param requestBody
     * @returns AccountStatement
     * @throws ApiError
     */
    public static apiOperationsStatementsPartialUpdate(
        id: number,
        requestBody?: PatchedAccountStatement,
    ): CancelablePromise<AccountStatement> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/statements/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param id A unique integer value identifying this Account Statement.
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsStatementsDestroy(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/statements/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Download statement PDF.
     * @param id A unique integer value identifying this Account Statement.
     * @returns AccountStatement
     * @throws ApiError
     */
    public static apiOperationsStatementsDownloadRetrieve(
        id: number,
    ): CancelablePromise<AccountStatement> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/statements/{id}/download/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Request a new statement (auto-generates based on account activity).
     * @param requestBody
     * @returns AccountStatement
     * @throws ApiError
     */
    public static apiOperationsStatementsRequestStatementCreate(
        requestBody: AccountStatement,
    ): CancelablePromise<AccountStatement> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/statements/request_statement/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * View to return real system alerts from database.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsSystemAlertsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/system-alerts/',
        });
    }
    /**
     * ViewSet for mobile banker visit schedules.
     * @param page A page number within the paginated result set.
     * @returns PaginatedVisitScheduleList
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesList(
        page?: number,
    ): CancelablePromise<PaginatedVisitScheduleList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/visit_schedules/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * ViewSet for mobile banker visit schedules.
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesCreate(
        requestBody: VisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/visit_schedules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for mobile banker visit schedules.
     * @param id
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesRetrieve(
        id: string,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/visit_schedules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for mobile banker visit schedules.
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesUpdate(
        id: string,
        requestBody: VisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/visit_schedules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for mobile banker visit schedules.
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesPartialUpdate(
        id: string,
        requestBody?: PatchedVisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/visit_schedules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for mobile banker visit schedules.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/visit_schedules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * View to return workflow status metrics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiOperationsWorkflowStatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/workflow-status/',
        });
    }
    /**
     * Stub view for performance dashboard data.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiPerformanceDashboardDataRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/dashboard-data/',
        });
    }
    /**
     * Stub view for performance metrics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiPerformanceMetricsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/metrics/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/system-health/',
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param productType * `savings` - Savings Account
     * * `loan` - Loan
     * * `insurance` - Insurance
     * * `investment` - Investment
     * * `susu` - Susu Account
     * @returns PaginatedProductList
     * @throws ApiError
     */
    public static apiProductsProductsList(
        isActive?: boolean,
        ordering?: string,
        page?: number,
        productType?: 'insurance' | 'investment' | 'loan' | 'savings' | 'susu',
    ): CancelablePromise<PaginatedProductList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'product_type': productType,
            },
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsCreate(
        requestBody: Product,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/products/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param id A unique integer value identifying this Product.
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsRetrieve(
        id: number,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param id A unique integer value identifying this Product.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsUpdate(
        id: number,
        requestBody: Product,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing bank products.
     * @param id A unique integer value identifying this Product.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsPartialUpdate(
        id: number,
        requestBody?: PatchedProduct,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedPromotionList
     * @throws ApiError
     */
    public static apiProductsPromotionsList(
        isActive?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedPromotionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsCreate(
        requestBody: Promotion,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/promotions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing promotions.
     * @param id A unique integer value identifying this Promotion.
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsRetrieve(
        id: number,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Enroll customer in a promotion.
     * @param id A unique integer value identifying this Promotion.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsEnrollCreate(
        id: number,
        requestBody: Promotion,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/promotions/{id}/enroll/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get currently active promotions.
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsActiveRetrieve(): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/active/',
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param format * `pdf` - PDF
     * * `csv` - CSV
     * * `docx` - Word Document
     * * `xlsx` - Excel
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param reportType
     * @param status * `pending` - Pending
     * * `generating` - Generating
     * * `completed` - Completed
     * * `failed` - Failed
     * @returns PaginatedReportList
     * @throws ApiError
     */
    public static apiReportsList(
        format?: 'csv' | 'docx' | 'pdf' | 'xlsx',
        ordering?: string,
        page?: number,
        reportType?: string,
        status?: 'completed' | 'failed' | 'generating' | 'pending',
    ): CancelablePromise<PaginatedReportList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/',
            query: {
                'format': format,
                'ordering': ordering,
                'page': page,
                'report_type': reportType,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param id A unique integer value identifying this Report.
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsRetrieve(
        id: number,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Stub view for report analytics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiReportsAnalyticsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/analytics/',
        });
    }
    /**
     * View to download generated reports.
     * @param reportId
     * @returns any No response body
     * @throws ApiError
     */
    public static apiReportsDownloadRetrieve(
        reportId: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/download/{report_id}/',
            path: {
                'report_id': reportId,
            },
        });
    }
    /**
     * Generate a report from a template.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsGenerateCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/generate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param format * `pdf` - PDF
     * * `csv` - CSV
     * * `docx` - Word Document
     * * `xlsx` - Excel
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param reportType
     * @param status * `pending` - Pending
     * * `generating` - Generating
     * * `completed` - Completed
     * * `failed` - Failed
     * @returns PaginatedReportList
     * @throws ApiError
     */
    public static apiReportsReportsList(
        format?: 'csv' | 'docx' | 'pdf' | 'xlsx',
        ordering?: string,
        page?: number,
        reportType?: string,
        status?: 'completed' | 'failed' | 'generating' | 'pending',
    ): CancelablePromise<PaginatedReportList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/reports/',
            query: {
                'format': format,
                'ordering': ordering,
                'page': page,
                'report_type': reportType,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/reports/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing generated reports.
     * @param id A unique integer value identifying this Report.
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsRetrieve(
        id: number,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/reports/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Generate a report from a template.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsGenerateCreate(
        requestBody: Report,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/reports/generate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param frequency * `daily` - Daily
     * * `weekly` - Weekly
     * * `monthly` - Monthly
     * * `quarterly` - Quarterly
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedReportScheduleList
     * @throws ApiError
     */
    public static apiReportsSchedulesList(
        frequency?: 'daily' | 'monthly' | 'quarterly' | 'weekly',
        isActive?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedReportScheduleList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/schedules/',
            query: {
                'frequency': frequency,
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesCreate(
        requestBody: ReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A unique integer value identifying this Report Schedule.
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesRetrieve(
        id: number,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/schedules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A unique integer value identifying this Report Schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesUpdate(
        id: number,
        requestBody: ReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/reports/schedules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A unique integer value identifying this Report Schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesPartialUpdate(
        id: number,
        requestBody?: PatchedReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/reports/schedules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Toggle schedule active state.
     * @param id A unique integer value identifying this Report Schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesToggleActiveCreate(
        id: number,
        requestBody: ReportSchedule,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/{id}/toggle_active/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param reportType * `transaction` - Transaction Report
     * * `account` - Account Report
     * * `fraud` - Fraud Report
     * * `compliance` - Compliance Report
     * * `financial` - Financial Report
     * * `audit` - Audit Report
     * * `performance` - Performance Report
     * @returns PaginatedReportTemplateList
     * @throws ApiError
     */
    public static apiReportsTemplatesList(
        isActive?: boolean,
        ordering?: string,
        page?: number,
        reportType?: 'account' | 'audit' | 'compliance' | 'financial' | 'fraud' | 'performance' | 'transaction',
    ): CancelablePromise<PaginatedReportTemplateList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/templates/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'report_type': reportType,
            },
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param requestBody
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static apiReportsTemplatesCreate(
        requestBody: ReportTemplate,
    ): CancelablePromise<ReportTemplate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/templates/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param id A unique integer value identifying this Report Template.
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static apiReportsTemplatesRetrieve(
        id: number,
    ): CancelablePromise<ReportTemplate> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param deliveryMethod * `email` - Email
     * * `sms` - SMS
     * * `pickup` - Branch Pickup
     * * `mail` - Postal Mail
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param requestType * `statement` - Account Statement
     * * `checkbook` - Cheque Book
     * * `card_replacement` - Card Replacement
     * * `account_closure` - Account Closure
     * * `address_change` - Address Change
     * * `other` - Other
     * @param status * `pending` - Pending
     * * `processing` - Processing
     * * `completed` - Completed
     * * `rejected` - Rejected
     * * `cancelled` - Cancelled
     * @returns PaginatedServiceRequestList
     * @throws ApiError
     */
    public static apiServicesRequestsList(
        deliveryMethod?: 'email' | 'mail' | 'pickup' | 'sms',
        ordering?: string,
        page?: number,
        requestType?: 'account_closure' | 'address_change' | 'card_replacement' | 'checkbook' | 'other' | 'statement',
        status?: 'cancelled' | 'completed' | 'pending' | 'processing' | 'rejected',
    ): CancelablePromise<PaginatedServiceRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/requests/',
            query: {
                'delivery_method': deliveryMethod,
                'ordering': ordering,
                'page': page,
                'request_type': requestType,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsCreate(
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param id A unique integer value identifying this Service Request.
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsRetrieve(
        id: number,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsUpdate(
        id: number,
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/services/requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for handling service requests.
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsPartialUpdate(
        id: number,
        requestBody?: PatchedServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/services/requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve or reject a checkbook request (Operations Manager only).
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsApproveCheckbookCreate(
        id: number,
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/approve_checkbook/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Staff action to process a service request.
     * @param id A unique integer value identifying this Service Request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsProcessCreate(
        id: number,
        requestBody: ServiceRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/process/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all pending checkbook requests for Operations Manager approval.
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsPendingCheckbooksRetrieve(): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/requests/pending_checkbooks/',
        });
    }
    /**
     * Stub view for service request statistics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiServicesStatsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/stats/',
        });
    }
    /**
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending
     * * `completed` - Completed
     * * `failed` - Failed
     * * `cancelled` - Cancelled
     * @param transactionType * `deposit` - Deposit
     * * `withdrawal` - Withdrawal
     * * `transfer` - Transfer
     * * `payment` - Payment
     * * `fee` - Fee
     * @returns PaginatedTransactionList
     * @throws ApiError
     */
    public static apiTransactionsList(
        ordering?: string,
        page?: number,
        status?: 'cancelled' | 'completed' | 'failed' | 'pending',
        transactionType?: 'deposit' | 'fee' | 'payment' | 'transfer' | 'withdrawal',
    ): CancelablePromise<PaginatedTransactionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/',
            query: {
                'ordering': ordering,
                'page': page,
                'status': status,
                'transaction_type': transactionType,
            },
        });
    }
    /**
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsCreate(
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this transaction.
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsRetrieve(
        id: number,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Process a deposit or withdrawal from cashier dashboard.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsProcessCreate(
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/process/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Search transactions with filters for cashier dashboard.
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsSearchRetrieve(): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/search/',
        });
    }
    /**
     * Endpoint for authenticated users to change their password.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersAuthChangePasswordCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/change-password/',
        });
    }
    /**
     * Check if the user is authenticated.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersAuthCheckRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/auth/check/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersAuthLoginCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/login/',
        });
    }
    /**
     * List recent login attempts (successful and failed).
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersAuthLoginAttemptsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/auth/login-attempts/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersAuthLogoutCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/logout/',
        });
    }
    /**
     * Takes a refresh type JSON web token and returns an access type JSON web
     * token if the refresh token is valid.
     * @param requestBody
     * @returns TokenRefresh
     * @throws ApiError
     */
    public static apiUsersAuthRefreshCreate(
        requestBody: TokenRefresh,
    ): CancelablePromise<TokenRefresh> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/refresh/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns UserRegistration
     * @throws ApiError
     */
    public static apiUsersAuthRegisterCreate(
        requestBody: UserRegistration,
    ): CancelablePromise<UserRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/register/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Admin-only endpoint to create staff users.
     * Auto-generates password and sends via SMS.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersCreateCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/create/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersCsrfRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/csrf/',
        });
    }
    /**
     * @param page A page number within the paginated result set.
     * @returns PaginatedUserList
     * @throws ApiError
     */
    public static apiUsersListList(
        page?: number,
    ): CancelablePromise<PaginatedUserList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/list/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * @returns User
     * @throws ApiError
     */
    public static apiUsersMeRetrieve(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/',
        });
    }
    /**
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static apiUsersMeUpdate(
        requestBody: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static apiUsersMePartialUpdate(
        requestBody?: PatchedUser,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get dashboard data for the authenticated member/customer.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersMemberDashboardRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/member-dashboard/',
        });
    }
    /**
     * List customer members for cashier lookup. Staff only.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersMembersRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/members/',
        });
    }
    /**
     * Send OTP for 2FA setup or verification.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersSendOtpCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/send-otp/',
        });
    }
    /**
     * List active user sessions (simulated via recent activity).
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersSessionsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/sessions/',
        });
    }
    /**
     * Terminate a user session (simulated).
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersSessionsTerminateCreate(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/sessions/{id}/terminate/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * List staff users for messaging.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersStaffRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff/',
        });
    }
    /**
     * List staff with ID information for Manager Dashboard.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersStaffIdsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff-ids/',
        });
    }
    /**
     * Verify OTP for 2FA setup or other purposes.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersVerifyOtpCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/verify-otp/',
        });
    }
}
