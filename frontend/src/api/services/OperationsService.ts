/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountStatement } from '../models/AccountStatement';
import type { ClientAssignment } from '../models/ClientAssignment';
import type { OperationsMessage } from '../models/OperationsMessage';
import type { PaginatedAccountStatementList } from '../models/PaginatedAccountStatementList';
import type { PaginatedClientAssignmentList } from '../models/PaginatedClientAssignmentList';
import type { PaginatedOperationsMessageList } from '../models/PaginatedOperationsMessageList';
import type { PaginatedPayslipList } from '../models/PaginatedPayslipList';
import type { PaginatedVisitScheduleList } from '../models/PaginatedVisitScheduleList';
import type { PatchedClientAssignment } from '../models/PatchedClientAssignment';
import type { PatchedVisitSchedule } from '../models/PatchedVisitSchedule';
import type { Payslip } from '../models/Payslip';
import type { VisitSchedule } from '../models/VisitSchedule';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OperationsService {
    /**
     * ViewSet for managing client assignments to mobile bankers.
     *
     * Mobile bankers can view their assigned clients.
     * Managers can manage all assignments.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedClientAssignmentList
     * @throws ApiError
     */
    public static operationsAssignmentsList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedClientAssignmentList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/assignments/',
            query: {
                'ordering': ordering,
                'page': page,
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
    public static operationsAssignmentsCreate(
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
     * @param id
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static operationsAssignmentsRetrieve(
        id: string,
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
     * @param id
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static operationsAssignmentsUpdate(
        id: string,
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
     * @param id
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static operationsAssignmentsPartialUpdate(
        id: string,
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
     * Mark a client assignment or visit as completed.
     * @param id
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static operationsAssignmentsCompleteCreate(
        id: string,
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
     * Update the status of a specific client assignment.
     * @param id
     * @param requestBody
     * @returns ClientAssignment
     * @throws ApiError
     */
    public static operationsAssignmentsUpdateStatusCreate(
        id: string,
        requestBody: ClientAssignment,
    ): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/assignments/{id}/update-status/',
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
    public static operationsAssignmentsMyClientsRetrieve(): CancelablePromise<ClientAssignment> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/assignments/my-clients/',
        });
    }
    /**
     * Return aggregated branch transaction activity for the current day.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsBranchActivityRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/branch-activity/',
        });
    }
    /**
     * Calculate the commission for a given agent based on transaction amount.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsCalculateCommissionCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/calculate-commission/',
        });
    }
    /**
     * Calculate simple interest for a principal amount over a given duration.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsCalculateInterestCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/calculate-interest/',
        });
    }
    /**
     * Calculate the applicable service charge for a specific transaction type and amount.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsCalculateServiceChargeCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/calculate-service-charge/',
        });
    }
    /**
     * Calculate and return cash flow metrics for the current month including inflows and outflows.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsCashFlowRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/cash-flow/',
        });
    }
    /**
     * Retrieve a list of operational expenses.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsExpensesRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/expenses/',
        });
    }
    /**
     * Generate a payslip for a specified staff member.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsGeneratePayslipCreate(): CancelablePromise<any> {
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
    public static operationsGenerateReportCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/generate-report/',
        });
    }
    /**
     * Lookup member name and specific account balance for mobile banker verification.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsMemberLookupRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/member-lookup/',
        });
    }
    /**
     * ViewSet for operations messages.
     * @param page A page number within the paginated result set.
     * @returns PaginatedOperationsMessageList
     * @throws ApiError
     */
    public static operationsMessagesList(
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
    public static operationsMessagesCreate(
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
     * Calculate comprehensive operational metrics for the manager dashboard.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsMetricsRetrieve(): CancelablePromise<any> {
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
    public static operationsMobileBankerMetricsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/mobile-banker-metrics/',
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedPayslipList
     * @throws ApiError
     */
    public static operationsPayslipsList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedPayslipList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/payslips/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing staff payslips with PDF generation.
     * @param id
     * @returns Payslip
     * @throws ApiError
     */
    public static operationsPayslipsRetrieve(
        id: string,
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
     * Download payslip PDF.
     * @param id
     * @returns Payslip
     * @throws ApiError
     */
    public static operationsPayslipsDownloadRetrieve(
        id: string,
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
     * @param id
     * @param requestBody
     * @returns Payslip
     * @throws ApiError
     */
    public static operationsPayslipsMarkPaidCreate(
        id: string,
        requestBody: Payslip,
    ): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/payslips/{id}/mark-paid/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get current user's payslips with filtering support.
     * @returns Payslip
     * @throws ApiError
     */
    public static operationsPayslipsMyPayslipsRetrieve(): CancelablePromise<Payslip> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/payslips/my_payslips/',
        });
    }
    /**
     * Process a deposit from mobile banker (permission check handled by viewset).
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsProcessDepositCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/process-deposit/',
        });
    }
    /**
     * Process a withdrawal from mobile banker (permission check handled by viewset).
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsProcessWithdrawalCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/process-withdrawal/',
        });
    }
    /**
     * Create a new visit schedule for a client (RPC-style action).
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsScheduleVisitCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/schedule-visit/',
        });
    }
    /**
     * Get all service charges.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsServiceChargesRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/service-charges/',
        });
    }
    /**
     * Create or update a service charge configuration.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsServiceChargesCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/service-charges/',
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAccountStatementList
     * @throws ApiError
     */
    public static operationsStatementsList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedAccountStatementList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/statements/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for auto-generated account statements.
     * @param id
     * @returns AccountStatement
     * @throws ApiError
     */
    public static operationsStatementsRetrieve(
        id: string,
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
     * Download statement PDF.
     * @param id
     * @returns AccountStatement
     * @throws ApiError
     */
    public static operationsStatementsDownloadRetrieve(
        id: string,
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
     * Request a new statement.
     * @param requestBody
     * @returns AccountStatement
     * @throws ApiError
     */
    public static operationsStatementsRequestStatementCreate(
        requestBody: AccountStatement,
    ): CancelablePromise<AccountStatement> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/statements/request-statement/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Summarize system alerts, including admin notifications and security events.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsSystemAlertsRetrieve(): CancelablePromise<any> {
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
    public static operationsVisitSchedulesList(
        page?: number,
    ): CancelablePromise<PaginatedVisitScheduleList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/visit-schedules/',
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
    public static operationsVisitSchedulesCreate(
        requestBody: VisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/visit-schedules/',
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
    public static operationsVisitSchedulesUpdate(
        id: string,
        requestBody: VisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/visit-schedules/{id}/',
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
    public static operationsVisitSchedulesPartialUpdate(
        id: string,
        requestBody?: PatchedVisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/visit-schedules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Record GPS check-in for a visit.
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static operationsVisitSchedulesCheckInCreate(
        id: string,
        requestBody: VisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/visit-schedules/{id}/check-in/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark a visit as completed.
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static operationsVisitSchedulesCompleteCreate(
        id: string,
        requestBody: VisitSchedule,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/visit-schedules/{id}/complete/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Calculate and return real-time workflow efficiency and processing metrics.
     * @returns any No response body
     * @throws ApiError
     */
    public static operationsWorkflowStatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/workflow-status/',
        });
    }
}
