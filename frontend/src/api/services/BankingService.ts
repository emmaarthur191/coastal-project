/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Account } from '../models/Account';
import type { AccountClosureRequest } from '../models/AccountClosureRequest';
import type { AccountOpeningRequest } from '../models/AccountOpeningRequest';
import type { CashAdvance } from '../models/CashAdvance';
import type { CashDrawer } from '../models/CashDrawer';
import type { Complaint } from '../models/Complaint';
import type { Device } from '../models/Device';
import type { FraudAlert } from '../models/FraudAlert';
import type { Loan } from '../models/Loan';
import type { Message } from '../models/Message';
import type { MessageThread } from '../models/MessageThread';
import type { PaginatedAccountClosureRequestList } from '../models/PaginatedAccountClosureRequestList';
import type { PaginatedAccountList } from '../models/PaginatedAccountList';
import type { PaginatedCashAdvanceList } from '../models/PaginatedCashAdvanceList';
import type { PaginatedCashDrawerList } from '../models/PaginatedCashDrawerList';
import type { PaginatedComplaintList } from '../models/PaginatedComplaintList';
import type { PaginatedDeviceList } from '../models/PaginatedDeviceList';
import type { PaginatedFraudAlertList } from '../models/PaginatedFraudAlertList';
import type { PaginatedLoanList } from '../models/PaginatedLoanList';
import type { PaginatedMessageList } from '../models/PaginatedMessageList';
import type { PaginatedMessageThreadList } from '../models/PaginatedMessageThreadList';
import type { PaginatedRefundList } from '../models/PaginatedRefundList';
import type { PatchedComplaint } from '../models/PatchedComplaint';
import type { PatchedFraudAlert } from '../models/PatchedFraudAlert';
import type { PatchedLoan } from '../models/PatchedLoan';
import type { PatchedMessageThread } from '../models/PatchedMessageThread';
import type { PatchedRefund } from '../models/PatchedRefund';
import type { Refund } from '../models/Refund';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class BankingService {
    /**
     * ViewSet for handling account closure requests.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending Review
     * * `approved` - Approved
     * * `rejected` - Rejected
     * * `completed` - Completed
     * @returns PaginatedAccountClosureRequestList
     * @throws ApiError
     */
    public static bankingAccountClosuresList(
        ordering?: string,
        page?: number,
        status?: 'approved' | 'completed' | 'pending' | 'rejected',
    ): CancelablePromise<PaginatedAccountClosureRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-closures/',
            query: {
                'ordering': ordering,
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
    public static bankingAccountClosuresCreate(
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
    public static bankingAccountClosuresRetrieve(
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
    public static bankingAccountClosuresApproveCreate(
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
    public static bankingAccountClosuresRejectCreate(
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
     * Approve an account opening request, create the account/user, and return a PDF letter.
     * @param id A unique integer value identifying this Account Opening Request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static bankingAccountOpeningsApproveAndPrintCreate(
        id: number,
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/{id}/approve-and-print/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Stage 2: Approve and dispatch login credentials to the client.
     * @param id A unique integer value identifying this Account Opening Request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static bankingAccountOpeningsDispatchCredentialsCreate(
        id: number,
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/{id}/dispatch-credentials/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send OTP for account opening request (Legacy/Security flow).
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static bankingAccountOpeningsSendOtpCreate(
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/send-otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Submit a new account opening request without OTP verification.
     *
     * This is the new entry point for the manual approval workflow.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static bankingAccountOpeningsSubmitRequestCreate(
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/submit-request/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify OTP and submit account opening request (Legacy/Security flow).
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static bankingAccountOpeningsVerifyAndSubmitCreate(
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/verify-and-submit/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing cash advance requests.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending
     * * `approved` - Approved
     * * `rejected` - Rejected
     * * `disbursed` - Disbursed
     * * `repaid` - Repaid
     * @returns PaginatedCashAdvanceList
     * @throws ApiError
     */
    public static bankingCashAdvancesList(
        ordering?: string,
        page?: number,
        status?: 'approved' | 'disbursed' | 'pending' | 'rejected' | 'repaid',
    ): CancelablePromise<PaginatedCashAdvanceList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-advances/',
            query: {
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for managing cash advance requests.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static bankingCashAdvancesCreate(
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
     * @param id A unique integer value identifying this Cash Advance.
     * @returns CashAdvance
     * @throws ApiError
     */
    public static bankingCashAdvancesRetrieve(
        id: number,
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
     * @param id A unique integer value identifying this Cash Advance.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static bankingCashAdvancesApproveCreate(
        id: number,
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
     * @param id A unique integer value identifying this Cash Advance.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static bankingCashAdvancesDisburseCreate(
        id: number,
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
     * Reject a cash advance request.
     * @param id A unique integer value identifying this Cash Advance.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static bankingCashAdvancesRejectCreate(
        id: number,
        requestBody: CashAdvance,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark a cash advance as repaid.
     * @param id A unique integer value identifying this Cash Advance.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static bankingCashAdvancesRepayCreate(
        id: number,
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
     * Allow cashiers to process a standard loan repayment.
     * @param id A unique integer value identifying this Cash Advance.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static bankingCashAdvancesRepayLoanCreate(
        id: number,
        requestBody: CashAdvance,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/{id}/repay_loan/',
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
     * @param status * `open` - Open
     * * `closed` - Closed
     * * `reconciled` - Reconciled
     * @returns PaginatedCashDrawerList
     * @throws ApiError
     */
    public static bankingCashDrawersList(
        ordering?: string,
        page?: number,
        status?: 'closed' | 'open' | 'reconciled',
    ): CancelablePromise<PaginatedCashDrawerList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-drawers/',
            query: {
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * ViewSet for managing cash drawers.
     * @param requestBody
     * @returns CashDrawer
     * @throws ApiError
     */
    public static bankingCashDrawersCreate(
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
     * @param id A unique integer value identifying this Cash Drawer.
     * @returns CashDrawer
     * @throws ApiError
     */
    public static bankingCashDrawersRetrieve(
        id: number,
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
     * @param id A unique integer value identifying this Cash Drawer.
     * @param requestBody
     * @returns CashDrawer
     * @throws ApiError
     */
    public static bankingCashDrawersCloseCreate(
        id: number,
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
     * @param id A unique integer value identifying this Cash Drawer.
     * @param requestBody
     * @returns CashDrawer
     * @throws ApiError
     */
    public static bankingCashDrawersReconcileCreate(
        id: number,
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
     * Open a new cash drawer.
     * @param requestBody
     * @returns CashDrawer
     * @throws ApiError
     */
    public static bankingCashDrawersOpenCreate(
        requestBody: CashDrawer,
    ): CancelablePromise<CashDrawer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-drawers/open/',
            body: requestBody,
            mediaType: 'application/json',
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
    public static bankingComplaintsList(
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
    public static bankingComplaintsCreate(
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
    public static bankingComplaintsRetrieve(
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
    public static bankingComplaintsUpdate(
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
    public static bankingComplaintsPartialUpdate(
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
    public static bankingComplaintsResolveCreate(
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
    public static bankingComplaintsReportsSummaryRetrieve(): CancelablePromise<Complaint> {
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
    public static bankingDevicesList(
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
    public static bankingDevicesCreate(
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
     * Sync endpoint to check connection status.
     * @param requestBody
     * @returns Device
     * @throws ApiError
     */
    public static bankingDevicesSyncDataCreate(
        requestBody: Device,
    ): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/devices/sync-data/',
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
    public static bankingFraudAlertsList(
        isResolved?: boolean,
        ordering?: string,
        page?: number,
        severity?: 'critical' | 'high' | 'low' | 'medium',
    ): CancelablePromise<PaginatedFraudAlertList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/fraud-alerts/',
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
    public static bankingFraudAlertsCreate(
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/fraud-alerts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static bankingFraudAlertsRetrieve(
        id: number,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/fraud-alerts/{id}/',
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
    public static bankingFraudAlertsUpdate(
        id: number,
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/fraud-alerts/{id}/',
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
    public static bankingFraudAlertsPartialUpdate(
        id: number,
        requestBody?: PatchedFraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/fraud-alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark a fraud alert as resolved.
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static bankingFraudAlertsResolveCreate(
        id: number,
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/fraud-alerts/{id}/resolve/',
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
    public static bankingFraudAlertsDashboardStatsRetrieve(): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/fraud-alerts/dashboard-stats/',
        });
    }
    /**
     * Trigger an automated fraud detection sweep (Mock/Placeholder).
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static bankingFraudAlertsRunCheckCreate(
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/fraud-alerts/run_check/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handle manual account statement generation requests for staff.
     * @returns any No response body
     * @throws ApiError
     */
    public static bankingGenerateStatementCreate(): CancelablePromise<any> {
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
    public static bankingLoansList(
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
    public static bankingLoansCreate(
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
    public static bankingLoansRetrieve(
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
    public static bankingLoansUpdate(
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
    public static bankingLoansPartialUpdate(
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
     * Approve a loan application and initiate disbursement.
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static bankingLoansApproveCreate(
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
     * Reject a loan application.
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static bankingLoansRejectCreate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/loans/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Allow customers or staff to initiate a loan repayment.
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static bankingLoansRepayCreate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/loans/{id}/repay/',
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
    public static bankingLoansPendingRetrieve(): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/loans/pending/',
        });
    }
    /**
     * Search loans by member name, email or ID using HMAC hashes.
     * @returns Loan
     * @throws ApiError
     */
    public static bankingLoansSearchRetrieve(): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/loans/search/',
        });
    }
    /**
     * Return threads for the current user.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedMessageThreadList
     * @throws ApiError
     */
    public static bankingMessageThreadsList(
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
     * ViewSet for message threads with full messaging functionality.
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static bankingMessageThreadsCreate(
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
    public static bankingMessageThreadsRetrieve(
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
     * ViewSet for message threads with full messaging functionality.
     * @param id
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static bankingMessageThreadsUpdate(
        id: string,
        requestBody: MessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/message-threads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for message threads with full messaging functionality.
     * @param id
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static bankingMessageThreadsPartialUpdate(
        id: string,
        requestBody?: PatchedMessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/message-threads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for message threads with full messaging functionality.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static bankingMessageThreadsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/message-threads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Archive a thread to hide it from the active inbox.
     * @param id
     * @param requestBody
     * @returns MessageThread
     * @throws ApiError
     */
    public static bankingMessageThreadsArchiveCreate(
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
    public static bankingMessageThreadsMarkAsReadCreate(
        id: string,
        requestBody: MessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/{id}/mark-as-read/',
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
    public static bankingMessageThreadsSendMessageCreate(
        id: string,
        requestBody: MessageThread,
    ): CancelablePromise<MessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/{id}/send-message/',
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
    public static bankingMessagesList(
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
     * @param formData
     * @returns Message
     * @throws ApiError
     */
    public static bankingMessagesCreate(
        formData: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * ViewSet for new messaging system messages.
     * @param id
     * @returns Message
     * @throws ApiError
     */
    public static bankingMessagesRetrieve(
        id: string,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Add an emoji reaction to a message.
     * @param id
     * @param formData
     * @returns Message
     * @throws ApiError
     */
    public static bankingMessagesAddReactionCreate(
        id: string,
        formData: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/{id}/add-reaction/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Remove a previously added emoji reaction from a message.
     * @param id
     * @param formData
     * @returns Message
     * @throws ApiError
     */
    public static bankingMessagesRemoveReactionCreate(
        id: string,
        formData: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/{id}/remove-reaction/',
            path: {
                'id': id,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Placeholder for media upload.
     * @param formData
     * @returns Message
     * @throws ApiError
     */
    public static bankingMessagesUploadMediaCreate(
        formData: Message,
    ): CancelablePromise<Message> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/upload-media/',
            formData: formData,
            mediaType: 'multipart/form-data',
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
    public static bankingRefundsList(
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
    public static bankingRefundsCreate(
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
    public static bankingRefundsRetrieve(
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
    public static bankingRefundsUpdate(
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
    public static bankingRefundsPartialUpdate(
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
    public static bankingRefundsApproveCreate(
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
    public static bankingRefundsRejectCreate(
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
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAccountList
     * @throws ApiError
     */
    public static bankingStaffAccountsList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * Get summary statistics for all accounts.
     * @returns Account
     * @throws ApiError
     */
    public static bankingStaffAccountsSummaryRetrieve(): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/summary/',
        });
    }
}
