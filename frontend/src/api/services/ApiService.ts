/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Account } from '../models/Account';
import type { AccountList } from '../models/AccountList';
import type { APIRateLimit } from '../models/APIRateLimit';
import type { APIRateLimitRequest } from '../models/APIRateLimitRequest';
import type { APIUsage } from '../models/APIUsage';
import type { BankingMessage } from '../models/BankingMessage';
import type { BankingMessageRequest } from '../models/BankingMessageRequest';
import type { BankingMessageThread } from '../models/BankingMessageThread';
import type { BankingMessageThreadRequest } from '../models/BankingMessageThreadRequest';
import type { CallLog } from '../models/CallLog';
import type { CallLogRequest } from '../models/CallLogRequest';
import type { CashAdvance } from '../models/CashAdvance';
import type { CashAdvanceRequest } from '../models/CashAdvanceRequest';
import type { CheckbookRequest } from '../models/CheckbookRequest';
import type { CheckbookRequestRequest } from '../models/CheckbookRequestRequest';
import type { CheckDeposit } from '../models/CheckDeposit';
import type { CheckDepositRequest } from '../models/CheckDepositRequest';
import type { ClientKYC } from '../models/ClientKYC';
import type { ClientKYCRequest } from '../models/ClientKYCRequest';
import type { ClientRegistration } from '../models/ClientRegistration';
import type { ClientRegistrationCreate } from '../models/ClientRegistrationCreate';
import type { ClientRegistrationCreateRequest } from '../models/ClientRegistrationCreateRequest';
import type { ClientRegistrationRequest } from '../models/ClientRegistrationRequest';
import type { Commission } from '../models/Commission';
import type { CommissionRequest } from '../models/CommissionRequest';
import type { Complaint } from '../models/Complaint';
import type { ComplaintRequest } from '../models/ComplaintRequest';
import type { CreateCallLog } from '../models/CreateCallLog';
import type { CreateCallLogRequest } from '../models/CreateCallLogRequest';
import type { CreateMessageThread } from '../models/CreateMessageThread';
import type { CreateMessageThreadRequest } from '../models/CreateMessageThreadRequest';
import type { DashboardWidget } from '../models/DashboardWidget';
import type { DashboardWidgetRequest } from '../models/DashboardWidgetRequest';
import type { Device } from '../models/Device';
import type { DeviceRequest } from '../models/DeviceRequest';
import type { EncryptionKey } from '../models/EncryptionKey';
import type { EncryptionKeyRequest } from '../models/EncryptionKeyRequest';
import type { Expense } from '../models/Expense';
import type { ExpenseRequest } from '../models/ExpenseRequest';
import type { FastTransfer } from '../models/FastTransfer';
import type { FastTransferRequest } from '../models/FastTransferRequest';
import type { FieldCollection } from '../models/FieldCollection';
import type { FieldCollectionRequest } from '../models/FieldCollectionRequest';
import type { FraudAlert } from '../models/FraudAlert';
import type { FraudAlertRequest } from '../models/FraudAlertRequest';
import type { FraudAuditTrail } from '../models/FraudAuditTrail';
import type { FraudAuditTrailRequest } from '../models/FraudAuditTrailRequest';
import type { FraudRule } from '../models/FraudRule';
import type { FraudRuleRequest } from '../models/FraudRuleRequest';
import type { HealthCheck } from '../models/HealthCheck';
import type { HealthCheckRequest } from '../models/HealthCheckRequest';
import type { Loan } from '../models/Loan';
import type { LoanInfoRequest } from '../models/LoanInfoRequest';
import type { LoanInfoRequestRequest } from '../models/LoanInfoRequestRequest';
import type { LoanRequest } from '../models/LoanRequest';
import type { MessageBackup } from '../models/MessageBackup';
import type { MessageBackupRequest } from '../models/MessageBackupRequest';
import type { MessageReadStatus } from '../models/MessageReadStatus';
import type { MessageReadStatusRequest } from '../models/MessageReadStatusRequest';
import type { MessagingMessage } from '../models/MessagingMessage';
import type { MessagingMessageRequest } from '../models/MessagingMessageRequest';
import type { MessagingMessageThread } from '../models/MessagingMessageThread';
import type { MessagingMessageThreadRequest } from '../models/MessagingMessageThreadRequest';
import type { Notification } from '../models/Notification';
import type { NotificationRequest } from '../models/NotificationRequest';
import type { OperationsMessage } from '../models/OperationsMessage';
import type { OperationsMessageRequest } from '../models/OperationsMessageRequest';
import type { PaginatedFraudAlertList } from '../models/PaginatedFraudAlertList';
import type { PaginatedFraudAuditTrailList } from '../models/PaginatedFraudAuditTrailList';
import type { PaginatedPerformanceMetricList } from '../models/PaginatedPerformanceMetricList';
import type { PatchedAPIRateLimitRequest } from '../models/PatchedAPIRateLimitRequest';
import type { PatchedBankingMessageRequest } from '../models/PatchedBankingMessageRequest';
import type { PatchedBankingMessageThreadRequest } from '../models/PatchedBankingMessageThreadRequest';
import type { PatchedCallLogRequest } from '../models/PatchedCallLogRequest';
import type { PatchedCashAdvanceRequest } from '../models/PatchedCashAdvanceRequest';
import type { PatchedCheckDepositRequest } from '../models/PatchedCheckDepositRequest';
import type { PatchedClientKYCRequest } from '../models/PatchedClientKYCRequest';
import type { PatchedClientRegistrationRequest } from '../models/PatchedClientRegistrationRequest';
import type { PatchedCommissionRequest } from '../models/PatchedCommissionRequest';
import type { PatchedComplaintRequest } from '../models/PatchedComplaintRequest';
import type { PatchedDashboardWidgetRequest } from '../models/PatchedDashboardWidgetRequest';
import type { PatchedDeviceRequest } from '../models/PatchedDeviceRequest';
import type { PatchedEncryptionKeyRequest } from '../models/PatchedEncryptionKeyRequest';
import type { PatchedExpenseRequest } from '../models/PatchedExpenseRequest';
import type { PatchedFieldCollectionRequest } from '../models/PatchedFieldCollectionRequest';
import type { PatchedFraudRuleRequest } from '../models/PatchedFraudRuleRequest';
import type { PatchedHealthCheckRequest } from '../models/PatchedHealthCheckRequest';
import type { PatchedLoanRequest } from '../models/PatchedLoanRequest';
import type { PatchedMessageBackupRequest } from '../models/PatchedMessageBackupRequest';
import type { PatchedMessageReadStatusRequest } from '../models/PatchedMessageReadStatusRequest';
import type { PatchedMessagingMessageRequest } from '../models/PatchedMessagingMessageRequest';
import type { PatchedMessagingMessageThreadRequest } from '../models/PatchedMessagingMessageThreadRequest';
import type { PatchedNotificationRequest } from '../models/PatchedNotificationRequest';
import type { PatchedOperationsMessageRequest } from '../models/PatchedOperationsMessageRequest';
import type { PatchedPerformanceAlertRequest } from '../models/PatchedPerformanceAlertRequest';
import type { PatchedPerformanceMetricRequest } from '../models/PatchedPerformanceMetricRequest';
import type { PatchedPerformanceRecommendationRequest } from '../models/PatchedPerformanceRecommendationRequest';
import type { PatchedProductCategoryRequest } from '../models/PatchedProductCategoryRequest';
import type { PatchedProductRecommendationRequest } from '../models/PatchedProductRecommendationRequest';
import type { PatchedProductRequest } from '../models/PatchedProductRequest';
import type { PatchedPromotionRequest } from '../models/PatchedPromotionRequest';
import type { PatchedRefundRequest } from '../models/PatchedRefundRequest';
import type { PatchedReportRequest } from '../models/PatchedReportRequest';
import type { PatchedReportScheduleRequest } from '../models/PatchedReportScheduleRequest';
import type { PatchedReportTemplateRequest } from '../models/PatchedReportTemplateRequest';
import type { PatchedServiceRequestUpdateRequest } from '../models/PatchedServiceRequestUpdateRequest';
import type { PatchedSystemHealthRequest } from '../models/PatchedSystemHealthRequest';
import type { PatchedSystemSettingsRequest } from '../models/PatchedSystemSettingsRequest';
import type { PatchedTransactionRequest } from '../models/PatchedTransactionRequest';
import type { PatchedUserEncryptionKeyRequest } from '../models/PatchedUserEncryptionKeyRequest';
import type { PatchedUserSettingsRequest } from '../models/PatchedUserSettingsRequest';
import type { PatchedVisitScheduleRequest } from '../models/PatchedVisitScheduleRequest';
import type { PatchedWorkflowRequest } from '../models/PatchedWorkflowRequest';
import type { PatchedWorkflowStepRequest } from '../models/PatchedWorkflowStepRequest';
import type { PerformanceAlert } from '../models/PerformanceAlert';
import type { PerformanceAlertRequest } from '../models/PerformanceAlertRequest';
import type { PerformanceMetric } from '../models/PerformanceMetric';
import type { PerformanceMetricRequest } from '../models/PerformanceMetricRequest';
import type { PerformanceRecommendation } from '../models/PerformanceRecommendation';
import type { PerformanceRecommendationRequest } from '../models/PerformanceRecommendationRequest';
import type { Product } from '../models/Product';
import type { ProductCategory } from '../models/ProductCategory';
import type { ProductCategoryRequest } from '../models/ProductCategoryRequest';
import type { ProductRecommendation } from '../models/ProductRecommendation';
import type { ProductRecommendationRequest } from '../models/ProductRecommendationRequest';
import type { ProductRequest } from '../models/ProductRequest';
import type { Promotion } from '../models/Promotion';
import type { PromotionRequest } from '../models/PromotionRequest';
import type { Refund } from '../models/Refund';
import type { RefundRequest } from '../models/RefundRequest';
import type { Report } from '../models/Report';
import type { ReportAnalytics } from '../models/ReportAnalytics';
import type { ReportRequest } from '../models/ReportRequest';
import type { ReportSchedule } from '../models/ReportSchedule';
import type { ReportScheduleCreate } from '../models/ReportScheduleCreate';
import type { ReportScheduleCreateRequest } from '../models/ReportScheduleCreateRequest';
import type { ReportScheduleRequest } from '../models/ReportScheduleRequest';
import type { ReportTemplate } from '../models/ReportTemplate';
import type { ReportTemplateRequest } from '../models/ReportTemplateRequest';
import type { ServiceRequest } from '../models/ServiceRequest';
import type { ServiceRequestCreate } from '../models/ServiceRequestCreate';
import type { ServiceRequestCreateRequest } from '../models/ServiceRequestCreateRequest';
import type { ServiceRequestRequest } from '../models/ServiceRequestRequest';
import type { ServiceRequestUpdate } from '../models/ServiceRequestUpdate';
import type { ServiceRequestUpdateRequest } from '../models/ServiceRequestUpdateRequest';
import type { StatementRequest } from '../models/StatementRequest';
import type { StatementRequestRequest } from '../models/StatementRequestRequest';
import type { SystemHealth } from '../models/SystemHealth';
import type { SystemHealthRequest } from '../models/SystemHealthRequest';
import type { SystemSettings } from '../models/SystemSettings';
import type { SystemSettingsRequest } from '../models/SystemSettingsRequest';
import type { TokenRefresh } from '../models/TokenRefresh';
import type { TokenRefreshRequest } from '../models/TokenRefreshRequest';
import type { Transaction } from '../models/Transaction';
import type { TransactionList } from '../models/TransactionList';
import type { TransactionRequest } from '../models/TransactionRequest';
import type { User } from '../models/User';
import type { UserEncryptionKey } from '../models/UserEncryptionKey';
import type { UserEncryptionKeyRequest } from '../models/UserEncryptionKeyRequest';
import type { UserSettings } from '../models/UserSettings';
import type { UserSettingsRequest } from '../models/UserSettingsRequest';
import type { VisitSchedule } from '../models/VisitSchedule';
import type { VisitScheduleRequest } from '../models/VisitScheduleRequest';
import type { Workflow } from '../models/Workflow';
import type { WorkflowRequest } from '../models/WorkflowRequest';
import type { WorkflowStep } from '../models/WorkflowStep';
import type { WorkflowStepRequest } from '../models/WorkflowStepRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApiService {
    /**
     * Takes a refresh type JSON web token and returns an access type JSON web
     * token if the refresh token is valid.
     * @param requestBody
     * @returns TokenRefresh
     * @throws ApiError
     */
    public static apiUsersAuthRefreshCreate(
        requestBody: TokenRefreshRequest,
    ): CancelablePromise<TokenRefresh> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/refresh/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * POST: Request password reset by sending email with reset token.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersAuthPasswordResetCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/password-reset/',
        });
    }
    /**
     * POST: Confirm password reset with token.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersAuthPasswordResetConfirmCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/password-reset-confirm/',
        });
    }
    /**
     * GET: Retrieve profile.
     * PATCH: Update general profile details.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersProfileRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/profile/',
        });
    }
    /**
     * GET: Retrieve profile.
     * PATCH: Update general profile details.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersProfilePartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/profile/',
        });
    }
    /**
     * PATCH: Update notification preferences (notify_email, notify_sms, notify_push).
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersNotificationsPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/notifications/',
        });
    }
    /**
     * POST: Change user password.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersChangePasswordCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/change-password/',
        });
    }
    /**
     * Handles system notifications for users.
     * Endpoint: /api/banking/notifications/
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsList(): CancelablePromise<Array<Notification>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/notifications/',
        });
    }
    /**
     * Handles system notifications for users.
     * Endpoint: /api/banking/notifications/
     * @param requestBody
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsCreate(
        requestBody: NotificationRequest,
    ): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/notifications/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get count of unread notifications.
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsUnreadCountRetrieve(): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/notifications/unread_count/',
        });
    }
    /**
     * Handles system notifications for users.
     * Endpoint: /api/banking/notifications/
     * @param id
     * @param requestBody
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsUpdate(
        id: string,
        requestBody: NotificationRequest,
    ): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/notifications/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles system notifications for users.
     * Endpoint: /api/banking/notifications/
     * @param id
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsRetrieve(
        id: string,
    ): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/notifications/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles system notifications for users.
     * Endpoint: /api/banking/notifications/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingNotificationsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/notifications/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles system notifications for users.
     * Endpoint: /api/banking/notifications/
     * @param id
     * @param requestBody
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsPartialUpdate(
        id: string,
        requestBody?: PatchedNotificationRequest,
    ): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/notifications/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Archive a notification.
     * @param id
     * @param requestBody
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsArchiveCreate(
        id: string,
        requestBody: NotificationRequest,
    ): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/notifications/{id}/archive/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark a notification as read.
     * @param id
     * @param requestBody
     * @returns Notification
     * @throws ApiError
     */
    public static apiBankingNotificationsMarkReadCreate(
        id: string,
        requestBody: NotificationRequest,
    ): CancelablePromise<Notification> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/notifications/{id}/mark_read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles cash advance requests and processing with approval workflows.
     * Endpoint: /api/banking/cash-advances/
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesList(): CancelablePromise<Array<CashAdvance>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-advances/',
        });
    }
    /**
     * Handles cash advance requests and processing with approval workflows.
     * Endpoint: /api/banking/cash-advances/
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesCreate(
        requestBody: CashAdvanceRequest,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Request a new cash advance.
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesRequestAdvanceCreate(
        requestBody: CashAdvanceRequest,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/request_advance/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles cash advance requests and processing with approval workflows.
     * Endpoint: /api/banking/cash-advances/
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesUpdate(
        id: string,
        requestBody: CashAdvanceRequest,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/cash-advances/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles cash advance requests and processing with approval workflows.
     * Endpoint: /api/banking/cash-advances/
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
     * Handles cash advance requests and processing with approval workflows.
     * Endpoint: /api/banking/cash-advances/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingCashAdvancesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/cash-advances/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles cash advance requests and processing with approval workflows.
     * Endpoint: /api/banking/cash-advances/
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesPartialUpdate(
        id: string,
        requestBody?: PatchedCashAdvanceRequest,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/cash-advances/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve a cash advance request.
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesApproveCreate(
        id: string,
        requestBody: CashAdvanceRequest,
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
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesDisburseCreate(
        id: string,
        requestBody: CashAdvanceRequest,
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
     * Record a repayment against a cash advance.
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesRecordRepaymentCreate(
        id: string,
        requestBody: CashAdvanceRequest,
    ): CancelablePromise<CashAdvance> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/cash-advances/{id}/record_repayment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a cash advance request.
     * @param id
     * @param requestBody
     * @returns CashAdvance
     * @throws ApiError
     */
    public static apiBankingCashAdvancesRejectCreate(
        id: string,
        requestBody: CashAdvanceRequest,
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
     * Handles refund requests and processing with validation and approval.
     * Endpoint: /api/banking/refunds/
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsList(): CancelablePromise<Array<Refund>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/refunds/',
        });
    }
    /**
     * Handles refund requests and processing with validation and approval.
     * Endpoint: /api/banking/refunds/
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsCreate(
        requestBody: RefundRequest,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/refunds/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Request a new refund.
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsRequestRefundCreate(
        requestBody: RefundRequest,
    ): CancelablePromise<Refund> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/refunds/request_refund/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles refund requests and processing with validation and approval.
     * Endpoint: /api/banking/refunds/
     * @param id
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsUpdate(
        id: string,
        requestBody: RefundRequest,
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
     * Handles refund requests and processing with validation and approval.
     * Endpoint: /api/banking/refunds/
     * @param id
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsRetrieve(
        id: string,
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
     * Handles refund requests and processing with validation and approval.
     * Endpoint: /api/banking/refunds/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingRefundsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/refunds/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles refund requests and processing with validation and approval.
     * Endpoint: /api/banking/refunds/
     * @param id
     * @param requestBody
     * @returns Refund
     * @throws ApiError
     */
    public static apiBankingRefundsPartialUpdate(
        id: string,
        requestBody?: PatchedRefundRequest,
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
     * Handles customer complaints logging and management with escalation procedures.
     * Endpoint: /api/banking/complaints/
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsList(): CancelablePromise<Array<Complaint>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/complaints/',
        });
    }
    /**
     * Handles customer complaints logging and management with escalation procedures.
     * Endpoint: /api/banking/complaints/
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsCreate(
        requestBody: ComplaintRequest,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Submit a new customer complaint.
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsSubmitComplaintCreate(
        requestBody: ComplaintRequest,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/submit_complaint/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles customer complaints logging and management with escalation procedures.
     * Endpoint: /api/banking/complaints/
     * @param id
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsUpdate(
        id: string,
        requestBody: ComplaintRequest,
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
     * Handles customer complaints logging and management with escalation procedures.
     * Endpoint: /api/banking/complaints/
     * @param id
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsRetrieve(
        id: string,
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
     * Handles customer complaints logging and management with escalation procedures.
     * Endpoint: /api/banking/complaints/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingComplaintsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/complaints/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles customer complaints logging and management with escalation procedures.
     * Endpoint: /api/banking/complaints/
     * @param id
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsPartialUpdate(
        id: string,
        requestBody?: PatchedComplaintRequest,
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
     * Assign a complaint to a handler.
     * @param id
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsAssignCreate(
        id: string,
        requestBody: ComplaintRequest,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/{id}/assign/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Close a complaint.
     * @param id
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsCloseCreate(
        id: string,
        requestBody: ComplaintRequest,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/{id}/close/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Record customer contact attempt.
     * @param id
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsContactCustomerCreate(
        id: string,
        requestBody: ComplaintRequest,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/{id}/contact_customer/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Escalate a complaint to a higher level.
     * @param id
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsEscalateCreate(
        id: string,
        requestBody: ComplaintRequest,
    ): CancelablePromise<Complaint> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/{id}/escalate/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resolve a complaint.
     * @param id
     * @param requestBody
     * @returns Complaint
     * @throws ApiError
     */
    public static apiBankingComplaintsResolveCreate(
        id: string,
        requestBody: ComplaintRequest,
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
     * Handles loan management and approval workflows.
     * Endpoint: /api/banking/loans/
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansList(): CancelablePromise<Array<Loan>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/loans/',
        });
    }
    /**
     * Handles loan management and approval workflows.
     * Endpoint: /api/banking/loans/
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansCreate(
        requestBody: LoanRequest,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/loans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get pending loans for approval.
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
     * Handles loan management and approval workflows.
     * Endpoint: /api/banking/loans/
     * @param id
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansUpdate(
        id: string,
        requestBody: LoanRequest,
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
     * Handles loan management and approval workflows.
     * Endpoint: /api/banking/loans/
     * @param id
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansRetrieve(
        id: string,
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
     * Handles loan management and approval workflows.
     * Endpoint: /api/banking/loans/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingLoansDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/loans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles loan management and approval workflows.
     * Endpoint: /api/banking/loans/
     * @param id
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiBankingLoansPartialUpdate(
        id: string,
        requestBody?: PatchedLoanRequest,
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
     * Handles account management and viewing.
     * Endpoint: /api/banking/accounts/
     * @returns Account
     * @throws ApiError
     */
    public static apiBankingAccountsList(): CancelablePromise<Array<Account>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/accounts/',
        });
    }
    /**
     * Handles account management and viewing.
     * Endpoint: /api/banking/accounts/
     * @param id
     * @returns Account
     * @throws ApiError
     */
    public static apiBankingAccountsRetrieve(
        id: string,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles account management for staff users.
     * Provides access to all accounts for managers and operations managers.
     * Endpoint: /api/banking/staff-accounts/
     * @returns AccountList
     * @throws ApiError
     */
    public static apiBankingStaffAccountsList(): CancelablePromise<Array<AccountList>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/',
        });
    }
    /**
     * Get account summary statistics for staff.
     * @returns AccountList
     * @throws ApiError
     */
    public static apiBankingStaffAccountsSummaryRetrieve(): CancelablePromise<AccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/summary/',
        });
    }
    /**
     * Handles account management for staff users.
     * Provides access to all accounts for managers and operations managers.
     * Endpoint: /api/banking/staff-accounts/
     * @param id
     * @returns AccountList
     * @throws ApiError
     */
    public static apiBankingStaffAccountsRetrieve(
        id: string,
    ): CancelablePromise<AccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/staff-accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Get account summary for the current user.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingAccountSummaryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-summary/',
        });
    }
    /**
     * Handles user encryption keys for end-to-end messaging.
     * Endpoint: /api/banking/encryption-keys/
     * @returns UserEncryptionKey
     * @throws ApiError
     */
    public static apiBankingEncryptionKeysList(): CancelablePromise<Array<UserEncryptionKey>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/encryption-keys/',
        });
    }
    /**
     * Create or update encryption keys for the current user.
     * @param requestBody
     * @returns UserEncryptionKey
     * @throws ApiError
     */
    public static apiBankingEncryptionKeysCreate(
        requestBody: UserEncryptionKeyRequest,
    ): CancelablePromise<UserEncryptionKey> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/encryption-keys/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate encryption keys for the current user.
     * @param requestBody
     * @returns UserEncryptionKey
     * @throws ApiError
     */
    public static apiBankingEncryptionKeysGenerateKeysCreate(
        requestBody: UserEncryptionKeyRequest,
    ): CancelablePromise<UserEncryptionKey> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/encryption-keys/generate_keys/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles user encryption keys for end-to-end messaging.
     * Endpoint: /api/banking/encryption-keys/
     * @param id
     * @param requestBody
     * @returns UserEncryptionKey
     * @throws ApiError
     */
    public static apiBankingEncryptionKeysUpdate(
        id: string,
        requestBody: UserEncryptionKeyRequest,
    ): CancelablePromise<UserEncryptionKey> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/encryption-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Allow retrieving public keys of other users for encryption purposes.
     * @param id
     * @returns UserEncryptionKey
     * @throws ApiError
     */
    public static apiBankingEncryptionKeysRetrieve(
        id: string,
    ): CancelablePromise<UserEncryptionKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/encryption-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles user encryption keys for end-to-end messaging.
     * Endpoint: /api/banking/encryption-keys/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingEncryptionKeysDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/encryption-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles user encryption keys for end-to-end messaging.
     * Endpoint: /api/banking/encryption-keys/
     * @param id
     * @param requestBody
     * @returns UserEncryptionKey
     * @throws ApiError
     */
    public static apiBankingEncryptionKeysPartialUpdate(
        id: string,
        requestBody?: PatchedUserEncryptionKeyRequest,
    ): CancelablePromise<UserEncryptionKey> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/encryption-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles message threads for staff communication.
     * Endpoint: /api/banking/message-threads/
     * @returns BankingMessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsList(): CancelablePromise<Array<BankingMessageThread>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/message-threads/',
        });
    }
    /**
     * Create a new message thread using MessageThreadCreateSerializer.
     * @param requestBody
     * @returns BankingMessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsCreate(
        requestBody?: BankingMessageThreadRequest,
    ): CancelablePromise<BankingMessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a new message thread.
     * @param requestBody
     * @returns BankingMessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsCreateThreadCreate(
        requestBody?: BankingMessageThreadRequest,
    ): CancelablePromise<BankingMessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/message-threads/create_thread/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles message threads for staff communication.
     * Endpoint: /api/banking/message-threads/
     * @param id
     * @param requestBody
     * @returns BankingMessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsUpdate(
        id: string,
        requestBody?: BankingMessageThreadRequest,
    ): CancelablePromise<BankingMessageThread> {
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
     * Handles message threads for staff communication.
     * Endpoint: /api/banking/message-threads/
     * @param id
     * @returns BankingMessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsRetrieve(
        id: string,
    ): CancelablePromise<BankingMessageThread> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/message-threads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles message threads for staff communication.
     * Endpoint: /api/banking/message-threads/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingMessageThreadsDestroy(
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
     * Handles message threads for staff communication.
     * Endpoint: /api/banking/message-threads/
     * @param id
     * @param requestBody
     * @returns BankingMessageThread
     * @throws ApiError
     */
    public static apiBankingMessageThreadsPartialUpdate(
        id: string,
        requestBody?: PatchedBankingMessageThreadRequest,
    ): CancelablePromise<BankingMessageThread> {
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
     * Handles messages within threads.
     * Endpoint: /api/banking/messages/
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesList(): CancelablePromise<Array<BankingMessage>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/messages/',
        });
    }
    /**
     * Handles messages within threads.
     * Endpoint: /api/banking/messages/
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesCreate(
        requestBody: BankingMessageRequest,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send a new message to a thread.
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesSendMessageCreate(
        requestBody: BankingMessageRequest,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/send_message/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles messages within threads.
     * Endpoint: /api/banking/messages/
     * @param id
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesUpdate(
        id: string,
        requestBody: BankingMessageRequest,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles messages within threads.
     * Endpoint: /api/banking/messages/
     * @param id
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesRetrieve(
        id: string,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles messages within threads.
     * Endpoint: /api/banking/messages/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingMessagesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles messages within threads.
     * Endpoint: /api/banking/messages/
     * @param id
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesPartialUpdate(
        id: string,
        requestBody?: PatchedBankingMessageRequest,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Add a reaction to a message.
     * @param id
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesAddReactionCreate(
        id: string,
        requestBody: BankingMessageRequest,
    ): CancelablePromise<BankingMessage> {
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
     * Mark a specific message as read.
     * @param id
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static apiBankingMessagesMarkReadCreate(
        id: string,
        requestBody: BankingMessageRequest,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/messages/{id}/mark_read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles client registration applications with OTP verification.
     * Endpoint: /api/banking/client-registrations/
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsList(): CancelablePromise<Array<ClientRegistration>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/client-registrations/',
        });
    }
    /**
     * Handles client registration applications with OTP verification.
     * Endpoint: /api/banking/client-registrations/
     * @param requestBody
     * @returns ClientRegistrationCreate
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsCreate(
        requestBody: ClientRegistrationCreateRequest,
    ): CancelablePromise<ClientRegistrationCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Public endpoint to send OTP (used during registration form).
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsSendOtpPublicCreate(
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/send_otp_public/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Submit a new client registration application.
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsSubmitRegistrationCreate(
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/submit_registration/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Public endpoint to verify OTP (used during registration form).
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsVerifyOtpPublicCreate(
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/verify_otp_public/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles client registration applications with OTP verification.
     * Endpoint: /api/banking/client-registrations/
     * @param id
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsUpdate(
        id: string,
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/banking/client-registrations/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles client registration applications with OTP verification.
     * Endpoint: /api/banking/client-registrations/
     * @param id
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsRetrieve(
        id: string,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/client-registrations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles client registration applications with OTP verification.
     * Endpoint: /api/banking/client-registrations/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/banking/client-registrations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles client registration applications with OTP verification.
     * Endpoint: /api/banking/client-registrations/
     * @param id
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsPartialUpdate(
        id: string,
        requestBody?: PatchedClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/banking/client-registrations/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve a client registration.
     * @param id
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsApproveRegistrationCreate(
        id: string,
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/{id}/approve_registration/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark all messages in thread as read for current user.
     * @param id
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsMarkReadCreate(
        id: string,
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/{id}/mark_read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a client registration.
     * @param id
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsRejectRegistrationCreate(
        id: string,
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/{id}/reject_registration/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send OTP to the client's phone number.
     * @param id
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsSendOtpCreate(
        id: string,
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/{id}/send_otp/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify OTP code for client registration.
     * @param id
     * @param requestBody
     * @returns ClientRegistration
     * @throws ApiError
     */
    public static apiBankingClientRegistrationsVerifyOtpCreate(
        id: string,
        requestBody: ClientRegistrationRequest,
    ): CancelablePromise<ClientRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/client-registrations/{id}/verify_otp/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get cash advance status distribution.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingCashAdvancesReportsStatusDistributionRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-advances/reports/status_distribution/',
        });
    }
    /**
     * Get cash advance summary statistics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingCashAdvancesReportsSummaryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/cash-advances/reports/summary/',
        });
    }
    /**
     * Get refund summary statistics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingRefundsReportsSummaryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/refunds/reports/summary/',
        });
    }
    /**
     * Get list of overdue complaints.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsOverdueComplaintsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/complaints/reports/overdue_complaints/',
        });
    }
    /**
     * Get complaint status distribution.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsStatusDistributionRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/complaints/reports/status_distribution/',
        });
    }
    /**
     * Get complaint summary statistics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsSummaryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/complaints/reports/summary/',
        });
    }
    /**
     * Approve a refund request.
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsApproveCreate(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/reports/{id}/approve/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Cancel a refund request.
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsCancelCreate(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/reports/{id}/cancel/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Process an approved refund.
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsProcessRefundCreate(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/reports/{id}/process_refund/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Reject a refund request.
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingComplaintsReportsRejectCreate(
        id: string,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/complaints/reports/{id}/reject/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * API view for account summary with frontend-compatible data.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingBankingAccountSummaryRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/banking/account-summary/',
        });
    }
    /**
     * API view for pending loans for the current user.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingBankingLoansPendingRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/banking/loans/pending/',
        });
    }
    /**
     * Approve a loan application.
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingBankingLoansApproveCreate(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/banking/loans/{id}/approve/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Reject a loan application.
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingBankingLoansRejectCreate(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/banking/loans/{id}/reject/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Disburse an approved loan.
     * @param id
     * @returns any No response body
     * @throws ApiError
     */
    public static apiBankingBankingLoansDisburseCreate(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/banking/loans/{id}/disburse/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Member/Staff: View Transaction History (GET /api/v1/transactions/).
     * Supports advanced filtering, sorting, search, and pagination capabilities.
     * @returns TransactionList
     * @throws ApiError
     */
    public static apiTransactionsTransactionsList(): CancelablePromise<Array<TransactionList>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/transactions/',
        });
    }
    /**
     * Handles transaction operations including history, processing, transfers, and account summaries.
     * Uses TransactionListSerializer for frontend compatibility in list operations.
     * Endpoint: /api/v1/transactions/process/
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsCreate(
        requestBody: TransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/transactions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get account summary data for the current user or all users (if manager).
     * Endpoint: /api/v1/transactions/account-summary/
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsAccountSummaryRetrieve(): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/transactions/account_summary/',
        });
    }
    /**
     * Real-time balance inquiry with account details and recent activity.
     * Endpoint: /api/v1/transactions/balance-inquiry/
     * Supports account_id parameter for specific account inquiry.
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsBalanceInquiryRetrieve(): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/transactions/balance_inquiry/',
        });
    }
    /**
     * Bulk update transaction statuses for multiple transactions.
     * Endpoint: /api/v1/transactions/bulk_update_status/
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsBulkUpdateStatusCreate(
        requestBody: TransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/transactions/bulk_update_status/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Export transaction history in CSV format.
     * Supports all the same filters as the list endpoint.
     * Endpoint: /api/v1/transactions/export-transactions/
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsExportTransactionsRetrieve(): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/transactions/export_transactions/',
        });
    }
    /**
     * Cashier: Fast intake for deposit/withdrawal. (POST /api/v1/transactions/process/)
     * Enhanced with comprehensive security, input validation, and rate limiting.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsProcessCreate(
        requestBody: TransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/transactions/process/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Enhanced transaction processing with automatic fee calculation.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsProcessEnhancedCreate(
        requestBody: TransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/transactions/process_enhanced/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Process account transfer between two accounts.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsTransferCreate(
        requestBody: TransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/transactions/transfer/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles transaction operations including history, processing, transfers, and account summaries.
     * Uses TransactionListSerializer for frontend compatibility in list operations.
     * Endpoint: /api/v1/transactions/process/
     * @param id
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsUpdate(
        id: string,
        requestBody: TransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/transactions/transactions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles transaction operations including history, processing, transfers, and account summaries.
     * Uses TransactionListSerializer for frontend compatibility in list operations.
     * Endpoint: /api/v1/transactions/process/
     * @param id
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsRetrieve(
        id: string,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/transactions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles transaction operations including history, processing, transfers, and account summaries.
     * Uses TransactionListSerializer for frontend compatibility in list operations.
     * Endpoint: /api/v1/transactions/process/
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiTransactionsTransactionsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/transactions/transactions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles transaction operations including history, processing, transfers, and account summaries.
     * Uses TransactionListSerializer for frontend compatibility in list operations.
     * Endpoint: /api/v1/transactions/process/
     * @param id
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsPartialUpdate(
        id: string,
        requestBody?: PatchedTransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/transactions/transactions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate a digital receipt for a specific transaction.
     * Endpoint: /api/v1/transactions/{id}/generate-receipt/
     * @param id
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsGenerateReceiptRetrieve(
        id: string,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/transactions/{id}/generate_receipt/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Retrieve detailed information about a specific transaction.
     * @param id
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsRetrieveTransactionRetrieve(
        id: string,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/transactions/{id}/retrieve_transaction/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Securely update transaction status with audit logging.
     * Only operations managers can update transaction statuses.
     * Endpoint: /api/v1/transactions/{id}/update_status/
     * @param id
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsTransactionsUpdateStatusPartialUpdate(
        id: string,
        requestBody?: PatchedTransactionRequest,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/transactions/transactions/{id}/update_status/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Perform a fast transfer between two accounts.
     * Requires: from_account (UUID), to_account (UUID), amount, description (optional).
     * @param requestBody
     * @returns FastTransfer
     * @throws ApiError
     */
    public static apiTransactionsTransfersFastTransferCreate(
        requestBody: FastTransferRequest,
    ): CancelablePromise<FastTransfer> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/transfers/fast_transfer/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles electronic check deposit processing with OCR and image upload.
     * Endpoint: /api/v1/check-deposits/
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsList(): CancelablePromise<Array<CheckDeposit>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/check-deposits/',
        });
    }
    /**
     * Handles electronic check deposit processing with OCR and image upload.
     * Endpoint: /api/v1/check-deposits/
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsCreate(
        requestBody: CheckDepositRequest,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/check-deposits/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Process a check deposit with image upload and OCR.
     * Requires: member_id, amount, account_type, front_image (required), back_image (optional)
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsProcessCheckDepositCreate(
        requestBody: CheckDepositRequest,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/check-deposits/process_check_deposit/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles electronic check deposit processing with OCR and image upload.
     * Endpoint: /api/v1/check-deposits/
     * @param id A UUID string identifying this check deposit.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsUpdate(
        id: string,
        requestBody: CheckDepositRequest,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/transactions/check-deposits/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles electronic check deposit processing with OCR and image upload.
     * Endpoint: /api/v1/check-deposits/
     * @param id A UUID string identifying this check deposit.
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsRetrieve(
        id: string,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/check-deposits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles electronic check deposit processing with OCR and image upload.
     * Endpoint: /api/v1/check-deposits/
     * @param id A UUID string identifying this check deposit.
     * @returns void
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/transactions/check-deposits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles electronic check deposit processing with OCR and image upload.
     * Endpoint: /api/v1/check-deposits/
     * @param id A UUID string identifying this check deposit.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsPartialUpdate(
        id: string,
        requestBody?: PatchedCheckDepositRequest,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/transactions/check-deposits/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Manually approve a check deposit
     * @param id A UUID string identifying this check deposit.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsApproveCreate(
        id: string,
        requestBody: CheckDepositRequest,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/check-deposits/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate digital receipt for a check deposit.
     * @param id A UUID string identifying this check deposit.
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsReceiptRetrieve(
        id: string,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/check-deposits/{id}/receipt/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Reject a check deposit
     * @param id A UUID string identifying this check deposit.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static apiTransactionsCheckDepositsRejectCreate(
        id: string,
        requestBody: CheckDepositRequest,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/check-deposits/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Calculate and record commission for a transaction.
     * This endpoint can be called when processing transactions.
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
     * Get comprehensive cash flow analysis with detailed breakdown of all inflows.
     * Summarizes all money coming into the company from various sources.
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
     * Get operational metrics for operations manager dashboard.
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
     * Get detailed branch performance analytics.
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
     * Get system alerts and notifications.
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
     * Get workflow status for various operations.
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
     * GET: List all service charges
     * POST: Create a new service charge
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
     * GET: List all service charges
     * POST: Create a new service charge
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
     * Calculate service charge for a transaction.
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
     * Calculate interest for loans or savings accounts.
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
     * Generate various types of reports.
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
     * Get metrics for mobile banker dashboard: scheduled visits, collections today, collections due, new applications.
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
     * Process a deposit transaction for mobile banker.
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
     * Process a withdrawal transaction for mobile banker.
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
     * Handles workflow management for operations managers.
     * @returns Workflow
     * @throws ApiError
     */
    public static apiOperationsWorkflowsList(): CancelablePromise<Array<Workflow>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/workflows/',
        });
    }
    /**
     * Handles workflow management for operations managers.
     * @param requestBody
     * @returns Workflow
     * @throws ApiError
     */
    public static apiOperationsWorkflowsCreate(
        requestBody: WorkflowRequest,
    ): CancelablePromise<Workflow> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/workflows/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles workflow management for operations managers.
     * @param id A UUID string identifying this workflow.
     * @param requestBody
     * @returns Workflow
     * @throws ApiError
     */
    public static apiOperationsWorkflowsUpdate(
        id: string,
        requestBody: WorkflowRequest,
    ): CancelablePromise<Workflow> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/workflows/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles workflow management for operations managers.
     * @param id A UUID string identifying this workflow.
     * @returns Workflow
     * @throws ApiError
     */
    public static apiOperationsWorkflowsRetrieve(
        id: string,
    ): CancelablePromise<Workflow> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/workflows/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles workflow management for operations managers.
     * @param id A UUID string identifying this workflow.
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsWorkflowsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/workflows/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles workflow management for operations managers.
     * @param id A UUID string identifying this workflow.
     * @param requestBody
     * @returns Workflow
     * @throws ApiError
     */
    public static apiOperationsWorkflowsPartialUpdate(
        id: string,
        requestBody?: PatchedWorkflowRequest,
    ): CancelablePromise<Workflow> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/workflows/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles workflow step management.
     * @returns WorkflowStep
     * @throws ApiError
     */
    public static apiOperationsWorkflowStepsList(): CancelablePromise<Array<WorkflowStep>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/workflow-steps/',
        });
    }
    /**
     * Handles workflow step management.
     * @param requestBody
     * @returns WorkflowStep
     * @throws ApiError
     */
    public static apiOperationsWorkflowStepsCreate(
        requestBody: WorkflowStepRequest,
    ): CancelablePromise<WorkflowStep> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/workflow-steps/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles workflow step management.
     * @param id A UUID string identifying this workflow step.
     * @param requestBody
     * @returns WorkflowStep
     * @throws ApiError
     */
    public static apiOperationsWorkflowStepsUpdate(
        id: string,
        requestBody: WorkflowStepRequest,
    ): CancelablePromise<WorkflowStep> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/workflow-steps/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles workflow step management.
     * @param id A UUID string identifying this workflow step.
     * @returns WorkflowStep
     * @throws ApiError
     */
    public static apiOperationsWorkflowStepsRetrieve(
        id: string,
    ): CancelablePromise<WorkflowStep> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/workflow-steps/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles workflow step management.
     * @param id A UUID string identifying this workflow step.
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsWorkflowStepsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/workflow-steps/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles workflow step management.
     * @param id A UUID string identifying this workflow step.
     * @param requestBody
     * @returns WorkflowStep
     * @throws ApiError
     */
    public static apiOperationsWorkflowStepsPartialUpdate(
        id: string,
        requestBody?: PatchedWorkflowStepRequest,
    ): CancelablePromise<WorkflowStep> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/workflow-steps/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles Client KYC submissions and reviews.
     * @returns ClientKYC
     * @throws ApiError
     */
    public static apiOperationsClientKycList(): CancelablePromise<Array<ClientKYC>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/client-kyc/',
        });
    }
    /**
     * Handles Client KYC submissions and reviews.
     * @param requestBody
     * @returns ClientKYC
     * @throws ApiError
     */
    public static apiOperationsClientKycCreate(
        requestBody: ClientKYCRequest,
    ): CancelablePromise<ClientKYC> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/client-kyc/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles Client KYC submissions and reviews.
     * @param id
     * @param requestBody
     * @returns ClientKYC
     * @throws ApiError
     */
    public static apiOperationsClientKycUpdate(
        id: string,
        requestBody: ClientKYCRequest,
    ): CancelablePromise<ClientKYC> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/client-kyc/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles Client KYC submissions and reviews.
     * @param id
     * @returns ClientKYC
     * @throws ApiError
     */
    public static apiOperationsClientKycRetrieve(
        id: string,
    ): CancelablePromise<ClientKYC> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/client-kyc/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles Client KYC submissions and reviews.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsClientKycDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/client-kyc/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles Client KYC submissions and reviews.
     * @param id
     * @param requestBody
     * @returns ClientKYC
     * @throws ApiError
     */
    public static apiOperationsClientKycPartialUpdate(
        id: string,
        requestBody?: PatchedClientKYCRequest,
    ): CancelablePromise<ClientKYC> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/client-kyc/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Operations Manager: Review and approve/reject KYC application.
     * @param id
     * @param requestBody
     * @returns ClientKYC
     * @throws ApiError
     */
    public static apiOperationsClientKycReviewCreate(
        id: string,
        requestBody: ClientKYCRequest,
    ): CancelablePromise<ClientKYC> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/client-kyc/{id}/review/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles field collection operations for mobile bankers.
     * @returns FieldCollection
     * @throws ApiError
     */
    public static apiOperationsFieldCollectionsList(): CancelablePromise<Array<FieldCollection>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/field-collections/',
        });
    }
    /**
     * Handles field collection operations for mobile bankers.
     * @param requestBody
     * @returns FieldCollection
     * @throws ApiError
     */
    public static apiOperationsFieldCollectionsCreate(
        requestBody: FieldCollectionRequest,
    ): CancelablePromise<FieldCollection> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/field-collections/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles field collection operations for mobile bankers.
     * @param id
     * @param requestBody
     * @returns FieldCollection
     * @throws ApiError
     */
    public static apiOperationsFieldCollectionsUpdate(
        id: string,
        requestBody: FieldCollectionRequest,
    ): CancelablePromise<FieldCollection> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/field-collections/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles field collection operations for mobile bankers.
     * @param id
     * @returns FieldCollection
     * @throws ApiError
     */
    public static apiOperationsFieldCollectionsRetrieve(
        id: string,
    ): CancelablePromise<FieldCollection> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/field-collections/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles field collection operations for mobile bankers.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsFieldCollectionsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/field-collections/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles field collection operations for mobile bankers.
     * @param id
     * @param requestBody
     * @returns FieldCollection
     * @throws ApiError
     */
    public static apiOperationsFieldCollectionsPartialUpdate(
        id: string,
        requestBody?: PatchedFieldCollectionRequest,
    ): CancelablePromise<FieldCollection> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/field-collections/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles commission tracking and reporting.
     * @returns Commission
     * @throws ApiError
     */
    public static apiOperationsCommissionsList(): CancelablePromise<Array<Commission>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/commissions/',
        });
    }
    /**
     * Handles commission tracking and reporting.
     * @param requestBody
     * @returns Commission
     * @throws ApiError
     */
    public static apiOperationsCommissionsCreate(
        requestBody: CommissionRequest,
    ): CancelablePromise<Commission> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/commissions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get commission summary with daily, weekly, and monthly breakdowns.
     * @returns Commission
     * @throws ApiError
     */
    public static apiOperationsCommissionsSummaryRetrieve(): CancelablePromise<Commission> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/commissions/summary/',
        });
    }
    /**
     * Handles commission tracking and reporting.
     * @param id A UUID string identifying this commission.
     * @param requestBody
     * @returns Commission
     * @throws ApiError
     */
    public static apiOperationsCommissionsUpdate(
        id: string,
        requestBody: CommissionRequest,
    ): CancelablePromise<Commission> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/commissions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles commission tracking and reporting.
     * @param id A UUID string identifying this commission.
     * @returns Commission
     * @throws ApiError
     */
    public static apiOperationsCommissionsRetrieve(
        id: string,
    ): CancelablePromise<Commission> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/commissions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles commission tracking and reporting.
     * @param id A UUID string identifying this commission.
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsCommissionsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/commissions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles commission tracking and reporting.
     * @param id A UUID string identifying this commission.
     * @param requestBody
     * @returns Commission
     * @throws ApiError
     */
    public static apiOperationsCommissionsPartialUpdate(
        id: string,
        requestBody?: PatchedCommissionRequest,
    ): CancelablePromise<Commission> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/commissions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles expense tracking and management.
     * @returns Expense
     * @throws ApiError
     */
    public static apiOperationsExpensesList(): CancelablePromise<Array<Expense>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/expenses/',
        });
    }
    /**
     * Handles expense tracking and management.
     * @param requestBody
     * @returns Expense
     * @throws ApiError
     */
    public static apiOperationsExpensesCreate(
        requestBody: ExpenseRequest,
    ): CancelablePromise<Expense> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/expenses/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles expense tracking and management.
     * @param id A UUID string identifying this expense.
     * @param requestBody
     * @returns Expense
     * @throws ApiError
     */
    public static apiOperationsExpensesUpdate(
        id: string,
        requestBody: ExpenseRequest,
    ): CancelablePromise<Expense> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/operations/expenses/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles expense tracking and management.
     * @param id A UUID string identifying this expense.
     * @returns Expense
     * @throws ApiError
     */
    public static apiOperationsExpensesRetrieve(
        id: string,
    ): CancelablePromise<Expense> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/expenses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles expense tracking and management.
     * @param id A UUID string identifying this expense.
     * @returns void
     * @throws ApiError
     */
    public static apiOperationsExpensesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/operations/expenses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Handles expense tracking and management.
     * @param id A UUID string identifying this expense.
     * @param requestBody
     * @returns Expense
     * @throws ApiError
     */
    public static apiOperationsExpensesPartialUpdate(
        id: string,
        requestBody?: PatchedExpenseRequest,
    ): CancelablePromise<Expense> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/operations/expenses/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve an expense (Operations Manager only).
     * @param id A UUID string identifying this expense.
     * @param requestBody
     * @returns Expense
     * @throws ApiError
     */
    public static apiOperationsExpensesApproveCreate(
        id: string,
        requestBody: ExpenseRequest,
    ): CancelablePromise<Expense> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/expenses/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject an expense (Operations Manager only).
     * @param id A UUID string identifying this expense.
     * @param requestBody
     * @returns Expense
     * @throws ApiError
     */
    public static apiOperationsExpensesRejectCreate(
        id: string,
        requestBody: ExpenseRequest,
    ): CancelablePromise<Expense> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/expenses/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles visit scheduling for mobile bankers.
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesList(): CancelablePromise<Array<VisitSchedule>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/visit_schedules/',
        });
    }
    /**
     * Handles visit scheduling for mobile bankers.
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesCreate(
        requestBody: VisitScheduleRequest,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/visit_schedules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles visit scheduling for mobile bankers.
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesUpdate(
        id: string,
        requestBody: VisitScheduleRequest,
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
     * Handles visit scheduling for mobile bankers.
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
     * Handles visit scheduling for mobile bankers.
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
     * Handles visit scheduling for mobile bankers.
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesPartialUpdate(
        id: string,
        requestBody?: PatchedVisitScheduleRequest,
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
     * Mark a visit as completed (Mobile Banker only).
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesCompleteVisitCreate(
        id: string,
        requestBody: VisitScheduleRequest,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/visit_schedules/{id}/complete_visit/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark a visit as started (Mobile Banker only).
     * @param id
     * @param requestBody
     * @returns VisitSchedule
     * @throws ApiError
     */
    public static apiOperationsVisitSchedulesStartVisitCreate(
        id: string,
        requestBody: VisitScheduleRequest,
    ): CancelablePromise<VisitSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/visit_schedules/{id}/start_visit/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles messaging functionality for users.
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesList(): CancelablePromise<Array<OperationsMessage>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/operations/messages/',
        });
    }
    /**
     * Handles messaging functionality for users.
     * @param requestBody
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesCreate(
        requestBody: OperationsMessageRequest,
    ): CancelablePromise<OperationsMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handles messaging functionality for users.
     * @param id
     * @param requestBody
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesUpdate(
        id: string,
        requestBody: OperationsMessageRequest,
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
     * Handles messaging functionality for users.
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
     * Handles messaging functionality for users.
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
     * Handles messaging functionality for users.
     * @param id
     * @param requestBody
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesPartialUpdate(
        id: string,
        requestBody?: PatchedOperationsMessageRequest,
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
     * Mark a message as read
     * @param id
     * @param requestBody
     * @returns OperationsMessage
     * @throws ApiError
     */
    public static apiOperationsMessagesMarkReadCreate(
        id: string,
        requestBody: OperationsMessageRequest,
    ): CancelablePromise<OperationsMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/operations/messages/{id}/mark_read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report templates.
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static apiReportsTemplatesList(): CancelablePromise<Array<ReportTemplate>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/templates/',
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param requestBody
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static apiReportsTemplatesCreate(
        requestBody: ReportTemplateRequest,
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
     * @param id A UUID string identifying this report template.
     * @param requestBody
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static apiReportsTemplatesUpdate(
        id: string,
        requestBody: ReportTemplateRequest,
    ): CancelablePromise<ReportTemplate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/reports/templates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param id A UUID string identifying this report template.
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static apiReportsTemplatesRetrieve(
        id: string,
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
     * ViewSet for managing report templates.
     * @param id A UUID string identifying this report template.
     * @returns void
     * @throws ApiError
     */
    public static apiReportsTemplatesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/templates/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing report templates.
     * @param id A UUID string identifying this report template.
     * @param requestBody
     * @returns ReportTemplate
     * @throws ApiError
     */
    public static apiReportsTemplatesPartialUpdate(
        id: string,
        requestBody?: PatchedReportTemplateRequest,
    ): CancelablePromise<ReportTemplate> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/reports/templates/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing reports.
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsList(): CancelablePromise<Array<Report>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/reports/',
        });
    }
    /**
     * ViewSet for managing reports.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsCreate(
        requestBody: ReportRequest,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/reports/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate a new report.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsGenerateCreate(
        requestBody: ReportRequest,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/reports/generate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing reports.
     * @param id A UUID string identifying this report.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsUpdate(
        id: string,
        requestBody: ReportRequest,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/reports/reports/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing reports.
     * @param id A UUID string identifying this report.
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsRetrieve(
        id: string,
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
     * ViewSet for managing reports.
     * @param id A UUID string identifying this report.
     * @returns void
     * @throws ApiError
     */
    public static apiReportsReportsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/reports/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing reports.
     * @param id A UUID string identifying this report.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsPartialUpdate(
        id: string,
        requestBody?: PatchedReportRequest,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/reports/reports/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Download exported report file.
     * @param id A UUID string identifying this report.
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsDownloadRetrieve(
        id: string,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/reports/{id}/download/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Export a report in specified format.
     * @param id A UUID string identifying this report.
     * @param requestBody
     * @returns Report
     * @throws ApiError
     */
    public static apiReportsReportsExportCreate(
        id: string,
        requestBody: ReportRequest,
    ): CancelablePromise<Report> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/reports/{id}/export/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesList(): CancelablePromise<Array<ReportSchedule>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/schedules/',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param requestBody
     * @returns ReportScheduleCreate
     * @throws ApiError
     */
    public static apiReportsSchedulesCreate(
        requestBody: ReportScheduleCreateRequest,
    ): CancelablePromise<ReportScheduleCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A UUID string identifying this report schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesUpdate(
        id: string,
        requestBody: ReportScheduleRequest,
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
     * @param id A UUID string identifying this report schedule.
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesRetrieve(
        id: string,
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
     * @param id A UUID string identifying this report schedule.
     * @returns void
     * @throws ApiError
     */
    public static apiReportsSchedulesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/reports/schedules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing report schedules.
     * @param id A UUID string identifying this report schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesPartialUpdate(
        id: string,
        requestBody?: PatchedReportScheduleRequest,
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
     * Pause a report schedule.
     * @param id A UUID string identifying this report schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesPauseCreate(
        id: string,
        requestBody: ReportScheduleRequest,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/{id}/pause/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resume a paused report schedule.
     * @param id A UUID string identifying this report schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesResumeCreate(
        id: string,
        requestBody: ReportScheduleRequest,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/{id}/resume/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Execute a schedule immediately.
     * @param id A UUID string identifying this report schedule.
     * @param requestBody
     * @returns ReportSchedule
     * @throws ApiError
     */
    public static apiReportsSchedulesRunNowCreate(
        id: string,
        requestBody: ReportScheduleRequest,
    ): CancelablePromise<ReportSchedule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/reports/schedules/{id}/run_now/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for viewing report analytics.
     * @returns ReportAnalytics
     * @throws ApiError
     */
    public static apiReportsAnalyticsList(): CancelablePromise<Array<ReportAnalytics>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/analytics/',
        });
    }
    /**
     * ViewSet for viewing report analytics.
     * @param id A UUID string identifying this report analytics.
     * @returns ReportAnalytics
     * @throws ApiError
     */
    public static apiReportsAnalyticsRetrieve(
        id: string,
    ): CancelablePromise<ReportAnalytics> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/reports/analytics/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * Provides CRUD operations with real-time synchronization.
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesList(): CancelablePromise<Array<FraudRule>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/rules/',
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * Provides CRUD operations with real-time synchronization.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesCreate(
        requestBody: FraudRuleRequest,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/rules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Force reload of rule cache from database.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesReloadCacheCreate(
        requestBody: FraudRuleRequest,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/rules/reload_cache/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get rule engine statistics.
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesStatisticsRetrieve(): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/rules/statistics/',
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * Provides CRUD operations with real-time synchronization.
     * @param id A UUID string identifying this fraud rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesUpdate(
        id: string,
        requestBody: FraudRuleRequest,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/fraud/rules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * Provides CRUD operations with real-time synchronization.
     * @param id A UUID string identifying this fraud rule.
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesRetrieve(
        id: string,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/rules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * Provides CRUD operations with real-time synchronization.
     * @param id A UUID string identifying this fraud rule.
     * @returns void
     * @throws ApiError
     */
    public static apiFraudRulesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/fraud/rules/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * Provides CRUD operations with real-time synchronization.
     * @param id A UUID string identifying this fraud rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesPartialUpdate(
        id: string,
        requestBody?: PatchedFraudRuleRequest,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/fraud/rules/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Activate a fraud rule.
     * @param id A UUID string identifying this fraud rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesActivateCreate(
        id: string,
        requestBody: FraudRuleRequest,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/rules/{id}/activate/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deactivate a fraud rule.
     * @param id A UUID string identifying this fraud rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesDeactivateCreate(
        id: string,
        requestBody: FraudRuleRequest,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/rules/{id}/deactivate/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test a rule against sample data.
     * @param id A UUID string identifying this fraud rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static apiFraudRulesTestRuleCreate(
        id: string,
        requestBody: FraudRuleRequest,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/rules/{id}/test_rule/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for viewing fraud alerts.
     * Provides read-only access with filtering and pagination.
     * @param page A page number within the paginated result set.
     * @returns PaginatedFraudAlertList
     * @throws ApiError
     */
    public static apiFraudAlertsList(
        page?: number,
    ): CancelablePromise<PaginatedFraudAlertList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/alerts/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Get dashboard statistics for fraud alerts.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsDashboardStatsRetrieve(): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/alerts/dashboard_stats/',
        });
    }
    /**
     * Get alert statistics.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsStatisticsRetrieve(): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/alerts/statistics/',
        });
    }
    /**
     * ViewSet for viewing fraud alerts.
     * Provides read-only access with filtering and pagination.
     * @param id A UUID string identifying this fraud alert.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsRetrieve(
        id: string,
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
     * Acknowledge a fraud alert.
     * @param id A UUID string identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsAcknowledgeCreate(
        id: string,
        requestBody: FraudAlertRequest,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/alerts/{id}/acknowledge/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resolve a fraud alert.
     * @param id A UUID string identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsResolveCreate(
        id: string,
        requestBody: FraudAlertRequest,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/alerts/{id}/resolve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for querying audit trails.
     * Provides secure access to fraud detection audit logs.
     * @param page A page number within the paginated result set.
     * @returns PaginatedFraudAuditTrailList
     * @throws ApiError
     */
    public static apiFraudAuditTrailList(
        page?: number,
    ): CancelablePromise<PaginatedFraudAuditTrailList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/audit-trail/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Export audit data for compliance.
     * @param requestBody
     * @returns FraudAuditTrail
     * @throws ApiError
     */
    public static apiFraudAuditTrailExportCreate(
        requestBody: FraudAuditTrailRequest,
    ): CancelablePromise<FraudAuditTrail> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/audit-trail/export/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get audit trail statistics.
     * @returns FraudAuditTrail
     * @throws ApiError
     */
    public static apiFraudAuditTrailStatisticsRetrieve(): CancelablePromise<FraudAuditTrail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/audit-trail/statistics/',
        });
    }
    /**
     * ViewSet for querying audit trails.
     * Provides secure access to fraud detection audit logs.
     * @param id A UUID string identifying this fraud audit trail.
     * @returns FraudAuditTrail
     * @throws ApiError
     */
    public static apiFraudAuditTrailRetrieve(
        id: string,
    ): CancelablePromise<FraudAuditTrail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/audit-trail/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Rollback an audit entry.
     * @param id A UUID string identifying this fraud audit trail.
     * @param requestBody
     * @returns FraudAuditTrail
     * @throws ApiError
     */
    public static apiFraudAuditTrailRollbackCreate(
        id: string,
        requestBody: FraudAuditTrailRequest,
    ): CancelablePromise<FraudAuditTrail> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/audit-trail/{id}/rollback/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify integrity of an audit entry.
     * @param id A UUID string identifying this fraud audit trail.
     * @returns FraudAuditTrail
     * @throws ApiError
     */
    public static apiFraudAuditTrailVerifyIntegrityRetrieve(
        id: string,
    ): CancelablePromise<FraudAuditTrail> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/audit-trail/{id}/verify_integrity/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Evaluate a transaction against fraud detection rules.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiFraudEvaluateTransactionCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/evaluate-transaction/',
        });
    }
    /**
     * Get overall system health status.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiFraudSystemHealthRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/system-health/',
        });
    }
    /**
     * ViewSet for user settings management.
     * @returns UserSettings
     * @throws ApiError
     */
    public static apiSettingsUserSettingsList(): CancelablePromise<Array<UserSettings>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/user-settings/',
        });
    }
    /**
     * ViewSet for user settings management.
     * @param requestBody
     * @returns UserSettings
     * @throws ApiError
     */
    public static apiSettingsUserSettingsCreate(
        requestBody?: UserSettingsRequest,
    ): CancelablePromise<UserSettings> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/user-settings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get current user's settings.
     * @returns UserSettings
     * @throws ApiError
     */
    public static apiSettingsUserSettingsMySettingsRetrieve(): CancelablePromise<UserSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/user-settings/my_settings/',
        });
    }
    /**
     * Update current user's settings.
     * @param requestBody
     * @returns UserSettings
     * @throws ApiError
     */
    public static apiSettingsUserSettingsUpdateMySettingsPartialUpdate(
        requestBody?: PatchedUserSettingsRequest,
    ): CancelablePromise<UserSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/user-settings/update_my_settings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for user settings management.
     * @param id
     * @param requestBody
     * @returns UserSettings
     * @throws ApiError
     */
    public static apiSettingsUserSettingsUpdate(
        id: string,
        requestBody?: UserSettingsRequest,
    ): CancelablePromise<UserSettings> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/user-settings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for user settings management.
     * @param id
     * @returns UserSettings
     * @throws ApiError
     */
    public static apiSettingsUserSettingsRetrieve(
        id: string,
    ): CancelablePromise<UserSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/user-settings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for user settings management.
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiSettingsUserSettingsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/user-settings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for user settings management.
     * @param id
     * @param requestBody
     * @returns UserSettings
     * @throws ApiError
     */
    public static apiSettingsUserSettingsPartialUpdate(
        id: string,
        requestBody?: PatchedUserSettingsRequest,
    ): CancelablePromise<UserSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/user-settings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for system settings management.
     * @returns SystemSettings
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsList(): CancelablePromise<Array<SystemSettings>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/system-settings/',
        });
    }
    /**
     * ViewSet for system settings management.
     * @param requestBody
     * @returns SystemSettings
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsCreate(
        requestBody: SystemSettingsRequest,
    ): CancelablePromise<SystemSettings> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/system-settings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get public system settings.
     * @returns SystemSettings
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsPublicSettingsRetrieve(): CancelablePromise<SystemSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/system-settings/public_settings/',
        });
    }
    /**
     * ViewSet for system settings management.
     * @param id A UUID string identifying this system settings.
     * @param requestBody
     * @returns SystemSettings
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsUpdate(
        id: string,
        requestBody: SystemSettingsRequest,
    ): CancelablePromise<SystemSettings> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/system-settings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for system settings management.
     * @param id A UUID string identifying this system settings.
     * @returns SystemSettings
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsRetrieve(
        id: string,
    ): CancelablePromise<SystemSettings> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/system-settings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for system settings management.
     * @param id A UUID string identifying this system settings.
     * @returns void
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/system-settings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for system settings management.
     * @param id A UUID string identifying this system settings.
     * @param requestBody
     * @returns SystemSettings
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsPartialUpdate(
        id: string,
        requestBody?: PatchedSystemSettingsRequest,
    ): CancelablePromise<SystemSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/system-settings/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update a specific setting value.
     * @param id A UUID string identifying this system settings.
     * @param requestBody
     * @returns SystemSettings
     * @throws ApiError
     */
    public static apiSettingsSystemSettingsUpdateValuePartialUpdate(
        id: string,
        requestBody?: PatchedSystemSettingsRequest,
    ): CancelablePromise<SystemSettings> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/system-settings/{id}/update_value/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API usage analytics.
     * @returns APIUsage
     * @throws ApiError
     */
    public static apiSettingsApiUsageList(): CancelablePromise<Array<APIUsage>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-usage/',
        });
    }
    /**
     * Get API usage analytics.
     * @returns APIUsage
     * @throws ApiError
     */
    public static apiSettingsApiUsageAnalyticsRetrieve(): CancelablePromise<APIUsage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-usage/analytics/',
        });
    }
    /**
     * ViewSet for API usage analytics.
     * @param id A UUID string identifying this api usage.
     * @returns APIUsage
     * @throws ApiError
     */
    public static apiSettingsApiUsageRetrieve(
        id: string,
    ): CancelablePromise<APIUsage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/api-usage/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for API rate limiting configuration.
     * @returns APIRateLimit
     * @throws ApiError
     */
    public static apiSettingsRateLimitsList(): CancelablePromise<Array<APIRateLimit>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/rate-limits/',
        });
    }
    /**
     * ViewSet for API rate limiting configuration.
     * @param requestBody
     * @returns APIRateLimit
     * @throws ApiError
     */
    public static apiSettingsRateLimitsCreate(
        requestBody: APIRateLimitRequest,
    ): CancelablePromise<APIRateLimit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/rate-limits/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API rate limiting configuration.
     * @param id A UUID string identifying this api rate limit.
     * @param requestBody
     * @returns APIRateLimit
     * @throws ApiError
     */
    public static apiSettingsRateLimitsUpdate(
        id: string,
        requestBody: APIRateLimitRequest,
    ): CancelablePromise<APIRateLimit> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/rate-limits/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for API rate limiting configuration.
     * @param id A UUID string identifying this api rate limit.
     * @returns APIRateLimit
     * @throws ApiError
     */
    public static apiSettingsRateLimitsRetrieve(
        id: string,
    ): CancelablePromise<APIRateLimit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/rate-limits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for API rate limiting configuration.
     * @param id A UUID string identifying this api rate limit.
     * @returns void
     * @throws ApiError
     */
    public static apiSettingsRateLimitsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/rate-limits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for API rate limiting configuration.
     * @param id A UUID string identifying this api rate limit.
     * @param requestBody
     * @returns APIRateLimit
     * @throws ApiError
     */
    public static apiSettingsRateLimitsPartialUpdate(
        id: string,
        requestBody?: PatchedAPIRateLimitRequest,
    ): CancelablePromise<APIRateLimit> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/rate-limits/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Test if a URL pattern matches the rate limit.
     * @param id A UUID string identifying this api rate limit.
     * @param requestBody
     * @returns APIRateLimit
     * @throws ApiError
     */
    public static apiSettingsRateLimitsTestPatternCreate(
        id: string,
        requestBody: APIRateLimitRequest,
    ): CancelablePromise<APIRateLimit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/rate-limits/{id}/test_pattern/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for health check management.
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksList(): CancelablePromise<Array<HealthCheck>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/health-checks/',
        });
    }
    /**
     * ViewSet for health check management.
     * @param requestBody
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksCreate(
        requestBody: HealthCheckRequest,
    ): CancelablePromise<HealthCheck> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/health-checks/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Run health checks for multiple components.
     * @param requestBody
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksBulkCheckCreate(
        requestBody: HealthCheckRequest,
    ): CancelablePromise<HealthCheck> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/health-checks/bulk_check/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get system health overview.
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksOverviewRetrieve(): CancelablePromise<HealthCheck> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/health-checks/overview/',
        });
    }
    /**
     * ViewSet for health check management.
     * @param id A UUID string identifying this health check.
     * @param requestBody
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksUpdate(
        id: string,
        requestBody: HealthCheckRequest,
    ): CancelablePromise<HealthCheck> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/settings/health-checks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for health check management.
     * @param id A UUID string identifying this health check.
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksRetrieve(
        id: string,
    ): CancelablePromise<HealthCheck> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/health-checks/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for health check management.
     * @param id A UUID string identifying this health check.
     * @returns void
     * @throws ApiError
     */
    public static apiSettingsHealthChecksDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/settings/health-checks/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for health check management.
     * @param id A UUID string identifying this health check.
     * @param requestBody
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksPartialUpdate(
        id: string,
        requestBody?: PatchedHealthCheckRequest,
    ): CancelablePromise<HealthCheck> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/settings/health-checks/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Manually run a health check.
     * @param id A UUID string identifying this health check.
     * @param requestBody
     * @returns HealthCheck
     * @throws ApiError
     */
    public static apiSettingsHealthChecksRunCheckCreate(
        id: string,
        requestBody: HealthCheckRequest,
    ): CancelablePromise<HealthCheck> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/settings/health-checks/{id}/run_check/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Simple API health check endpoint.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiSettingsHealthRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/health/',
        });
    }
    /**
     * Get overall system status.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiSettingsSystemStatusRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/settings/system-status/',
        });
    }
    /**
     * @returns ProductCategory
     * @throws ApiError
     */
    public static apiProductsCategoriesList(): CancelablePromise<Array<ProductCategory>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/categories/',
        });
    }
    /**
     * @param requestBody
     * @returns ProductCategory
     * @throws ApiError
     */
    public static apiProductsCategoriesCreate(
        requestBody: ProductCategoryRequest,
    ): CancelablePromise<ProductCategory> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/categories/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this product category.
     * @param requestBody
     * @returns ProductCategory
     * @throws ApiError
     */
    public static apiProductsCategoriesUpdate(
        id: string,
        requestBody: ProductCategoryRequest,
    ): CancelablePromise<ProductCategory> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/categories/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this product category.
     * @returns ProductCategory
     * @throws ApiError
     */
    public static apiProductsCategoriesRetrieve(
        id: string,
    ): CancelablePromise<ProductCategory> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/categories/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this product category.
     * @returns void
     * @throws ApiError
     */
    public static apiProductsCategoriesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/categories/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this product category.
     * @param requestBody
     * @returns ProductCategory
     * @throws ApiError
     */
    public static apiProductsCategoriesPartialUpdate(
        id: string,
        requestBody?: PatchedProductCategoryRequest,
    ): CancelablePromise<ProductCategory> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/products/categories/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsList(): CancelablePromise<Array<Product>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/',
        });
    }
    /**
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsCreate(
        requestBody: ProductRequest,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/products/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get products by category.
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsByCategoryRetrieve(): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/by_category/',
        });
    }
    /**
     * Get featured products.
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsFeaturedRetrieve(): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/featured/',
        });
    }
    /**
     * @param id A UUID string identifying this product.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsUpdate(
        id: string,
        requestBody: ProductRequest,
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
     * @param id A UUID string identifying this product.
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsRetrieve(
        id: string,
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
     * @param id A UUID string identifying this product.
     * @returns void
     * @throws ApiError
     */
    public static apiProductsProductsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/products/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this product.
     * @param requestBody
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsPartialUpdate(
        id: string,
        requestBody?: PatchedProductRequest,
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
     * Get active promotions for a specific product.
     * @param id A UUID string identifying this product.
     * @returns Product
     * @throws ApiError
     */
    public static apiProductsProductsPromotionsRetrieve(
        id: string,
    ): CancelablePromise<Product> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/products/{id}/promotions/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsList(): CancelablePromise<Array<Promotion>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/',
        });
    }
    /**
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsCreate(
        requestBody: PromotionRequest,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/promotions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all active promotions.
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
     * Get promotions eligible for the current user.
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsEligibleRetrieve(): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/promotions/eligible/',
        });
    }
    /**
     * @param id A UUID string identifying this promotion.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsUpdate(
        id: string,
        requestBody: PromotionRequest,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this promotion.
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsRetrieve(
        id: string,
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
     * @param id A UUID string identifying this promotion.
     * @returns void
     * @throws ApiError
     */
    public static apiProductsPromotionsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this promotion.
     * @param requestBody
     * @returns Promotion
     * @throws ApiError
     */
    public static apiProductsPromotionsPartialUpdate(
        id: string,
        requestBody?: PatchedPromotionRequest,
    ): CancelablePromise<Promotion> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/products/promotions/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns ProductRecommendation
     * @throws ApiError
     */
    public static apiProductsRecommendationsList(): CancelablePromise<Array<ProductRecommendation>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/recommendations/',
        });
    }
    /**
     * @param requestBody
     * @returns ProductRecommendation
     * @throws ApiError
     */
    public static apiProductsRecommendationsCreate(
        requestBody: ProductRecommendationRequest,
    ): CancelablePromise<ProductRecommendation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/recommendations/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Generate recommendations for a customer based on their profile and transaction history.
     * @param requestBody
     * @returns ProductRecommendation
     * @throws ApiError
     */
    public static apiProductsRecommendationsGenerateCreate(
        requestBody: ProductRecommendationRequest,
    ): CancelablePromise<ProductRecommendation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/recommendations/generate/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this product recommendation.
     * @param requestBody
     * @returns ProductRecommendation
     * @throws ApiError
     */
    public static apiProductsRecommendationsUpdate(
        id: string,
        requestBody: ProductRecommendationRequest,
    ): CancelablePromise<ProductRecommendation> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/products/recommendations/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this product recommendation.
     * @returns ProductRecommendation
     * @throws ApiError
     */
    public static apiProductsRecommendationsRetrieve(
        id: string,
    ): CancelablePromise<ProductRecommendation> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/recommendations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this product recommendation.
     * @returns void
     * @throws ApiError
     */
    public static apiProductsRecommendationsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/products/recommendations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this product recommendation.
     * @param requestBody
     * @returns ProductRecommendation
     * @throws ApiError
     */
    public static apiProductsRecommendationsPartialUpdate(
        id: string,
        requestBody?: PatchedProductRecommendationRequest,
    ): CancelablePromise<ProductRecommendation> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/products/recommendations/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handle product enrollment requests.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiProductsEnrollCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/enroll/',
        });
    }
    /**
     * Compare multiple products.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiProductsCompareCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/products/compare/',
        });
    }
    /**
     * Get promotion usage analytics.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiProductsAnalyticsPromotionsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/products/analytics/promotions/',
        });
    }
    /**
     * ViewSet for managing service requests.
     *
     * Provides CRUD operations for service requests with role-based access control.
     * Cashiers can create and manage requests, managers can approve/reject, etc.
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsList(): CancelablePromise<Array<ServiceRequest>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/requests/',
        });
    }
    /**
     * ViewSet for managing service requests.
     *
     * Provides CRUD operations for service requests with role-based access control.
     * Cashiers can create and manage requests, managers can approve/reject, etc.
     * @param requestBody
     * @returns ServiceRequestCreate
     * @throws ApiError
     */
    public static apiServicesRequestsCreate(
        requestBody: ServiceRequestCreateRequest,
    ): CancelablePromise<ServiceRequestCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing service requests.
     *
     * Provides CRUD operations for service requests with role-based access control.
     * Cashiers can create and manage requests, managers can approve/reject, etc.
     * @param id A UUID string identifying this service request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesRequestsUpdate(
        id: string,
        requestBody?: ServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
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
     * ViewSet for managing service requests.
     *
     * Provides CRUD operations for service requests with role-based access control.
     * Cashiers can create and manage requests, managers can approve/reject, etc.
     * @param id A UUID string identifying this service request.
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsRetrieve(
        id: string,
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
     * ViewSet for managing service requests.
     *
     * Provides CRUD operations for service requests with role-based access control.
     * Cashiers can create and manage requests, managers can approve/reject, etc.
     * @param id A UUID string identifying this service request.
     * @returns void
     * @throws ApiError
     */
    public static apiServicesRequestsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/services/requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for managing service requests.
     *
     * Provides CRUD operations for service requests with role-based access control.
     * Cashiers can create and manage requests, managers can approve/reject, etc.
     * @param id A UUID string identifying this service request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesRequestsPartialUpdate(
        id: string,
        requestBody?: PatchedServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
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
     * Approve Service Request
     * Approve a pending service request. Requires manager or higher role.
     * @param id A UUID string identifying this service request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsApproveCreate(
        id: string,
        requestBody: ServiceRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Cancel Request
     * Cancel a service request. Can be done by request creator or manager+.
     * @param id A UUID string identifying this service request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsCancelCreate(
        id: string,
        requestBody: ServiceRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/cancel/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Complete Fulfillment
     * Mark request as fulfilled. Requires cashier or higher role.
     * @param id A UUID string identifying this service request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsCompleteFulfillmentCreate(
        id: string,
        requestBody: ServiceRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/complete_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject Service Request
     * Reject a pending service request with optional reason. Requires manager or higher role.
     * @param id A UUID string identifying this service request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsRejectCreate(
        id: string,
        requestBody?: {
            /**
             * Reason for rejection
             */
            reason?: string;
        },
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Start Fulfillment
     * Mark request as in progress. Requires cashier or higher role.
     * @param id A UUID string identifying this service request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesRequestsStartFulfillmentCreate(
        id: string,
        requestBody: ServiceRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/requests/{id}/start_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for checkbook requests.
     * @returns CheckbookRequest
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsList(): CancelablePromise<Array<CheckbookRequest>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/checkbook-requests/',
        });
    }
    /**
     * ViewSet for checkbook requests.
     * @param requestBody
     * @returns ServiceRequestCreate
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsCreate(
        requestBody: ServiceRequestCreateRequest,
    ): CancelablePromise<ServiceRequestCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/checkbook-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for checkbook requests.
     * @param id A UUID string identifying this checkbook request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsUpdate(
        id: string,
        requestBody?: ServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/services/checkbook-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for checkbook requests.
     * @param id A UUID string identifying this checkbook request.
     * @returns CheckbookRequest
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsRetrieve(
        id: string,
    ): CancelablePromise<CheckbookRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/checkbook-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for checkbook requests.
     * @param id A UUID string identifying this checkbook request.
     * @returns void
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/services/checkbook-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for checkbook requests.
     * @param id A UUID string identifying this checkbook request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsPartialUpdate(
        id: string,
        requestBody?: PatchedServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/services/checkbook-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve Service Request
     * Approve a pending service request. Requires manager or higher role.
     * @param id A UUID string identifying this checkbook request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsApproveCreate(
        id: string,
        requestBody: CheckbookRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/checkbook-requests/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Cancel Request
     * Cancel a service request. Can be done by request creator or manager+.
     * @param id A UUID string identifying this checkbook request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsCancelCreate(
        id: string,
        requestBody: CheckbookRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/checkbook-requests/{id}/cancel/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Complete Fulfillment
     * Mark request as fulfilled. Requires cashier or higher role.
     * @param id A UUID string identifying this checkbook request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsCompleteFulfillmentCreate(
        id: string,
        requestBody: CheckbookRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/checkbook-requests/{id}/complete_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject Service Request
     * Reject a pending service request with optional reason. Requires manager or higher role.
     * @param id A UUID string identifying this checkbook request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsRejectCreate(
        id: string,
        requestBody?: {
            /**
             * Reason for rejection
             */
            reason?: string;
        },
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/checkbook-requests/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Start Fulfillment
     * Mark request as in progress. Requires cashier or higher role.
     * @param id A UUID string identifying this checkbook request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesCheckbookRequestsStartFulfillmentCreate(
        id: string,
        requestBody: CheckbookRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/checkbook-requests/{id}/start_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for statement requests.
     * @returns StatementRequest
     * @throws ApiError
     */
    public static apiServicesStatementRequestsList(): CancelablePromise<Array<StatementRequest>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/statement-requests/',
        });
    }
    /**
     * ViewSet for statement requests.
     * @param requestBody
     * @returns ServiceRequestCreate
     * @throws ApiError
     */
    public static apiServicesStatementRequestsCreate(
        requestBody: ServiceRequestCreateRequest,
    ): CancelablePromise<ServiceRequestCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/statement-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for statement requests.
     * @param id A UUID string identifying this statement request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesStatementRequestsUpdate(
        id: string,
        requestBody?: ServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/services/statement-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for statement requests.
     * @param id A UUID string identifying this statement request.
     * @returns StatementRequest
     * @throws ApiError
     */
    public static apiServicesStatementRequestsRetrieve(
        id: string,
    ): CancelablePromise<StatementRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/statement-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for statement requests.
     * @param id A UUID string identifying this statement request.
     * @returns void
     * @throws ApiError
     */
    public static apiServicesStatementRequestsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/services/statement-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for statement requests.
     * @param id A UUID string identifying this statement request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesStatementRequestsPartialUpdate(
        id: string,
        requestBody?: PatchedServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/services/statement-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve Service Request
     * Approve a pending service request. Requires manager or higher role.
     * @param id A UUID string identifying this statement request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesStatementRequestsApproveCreate(
        id: string,
        requestBody: StatementRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/statement-requests/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Cancel Request
     * Cancel a service request. Can be done by request creator or manager+.
     * @param id A UUID string identifying this statement request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesStatementRequestsCancelCreate(
        id: string,
        requestBody: StatementRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/statement-requests/{id}/cancel/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Complete Fulfillment
     * Mark request as fulfilled. Requires cashier or higher role.
     * @param id A UUID string identifying this statement request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesStatementRequestsCompleteFulfillmentCreate(
        id: string,
        requestBody: StatementRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/statement-requests/{id}/complete_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject Service Request
     * Reject a pending service request with optional reason. Requires manager or higher role.
     * @param id A UUID string identifying this statement request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesStatementRequestsRejectCreate(
        id: string,
        requestBody?: {
            /**
             * Reason for rejection
             */
            reason?: string;
        },
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/statement-requests/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Start Fulfillment
     * Mark request as in progress. Requires cashier or higher role.
     * @param id A UUID string identifying this statement request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesStatementRequestsStartFulfillmentCreate(
        id: string,
        requestBody: StatementRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/statement-requests/{id}/start_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for loan information requests.
     * @returns LoanInfoRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsList(): CancelablePromise<Array<LoanInfoRequest>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/loan-info-requests/',
        });
    }
    /**
     * ViewSet for loan information requests.
     * @param requestBody
     * @returns ServiceRequestCreate
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsCreate(
        requestBody: ServiceRequestCreateRequest,
    ): CancelablePromise<ServiceRequestCreate> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for loan information requests.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsUpdate(
        id: string,
        requestBody?: ServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/services/loan-info-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for loan information requests.
     * @param id A UUID string identifying this loan info request.
     * @returns LoanInfoRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsRetrieve(
        id: string,
    ): CancelablePromise<LoanInfoRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/loan-info-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for loan information requests.
     * @param id A UUID string identifying this loan info request.
     * @returns void
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/services/loan-info-requests/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for loan information requests.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns ServiceRequestUpdate
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsPartialUpdate(
        id: string,
        requestBody?: PatchedServiceRequestUpdateRequest,
    ): CancelablePromise<ServiceRequestUpdate> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/services/loan-info-requests/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve Service Request
     * Approve a pending service request. Requires manager or higher role.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsApproveCreate(
        id: string,
        requestBody: LoanInfoRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Cancel Request
     * Cancel a service request. Can be done by request creator or manager+.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsCancelCreate(
        id: string,
        requestBody: LoanInfoRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/{id}/cancel/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Complete Fulfillment
     * Mark request as fulfilled. Requires cashier or higher role.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsCompleteFulfillmentCreate(
        id: string,
        requestBody: LoanInfoRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/{id}/complete_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Deliver Information
     * Mark loan information as delivered with optional notes.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns LoanInfoRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsDeliverInfoCreate(
        id: string,
        requestBody?: {
            /**
             * Delivery notes
             */
            notes?: string;
        },
    ): CancelablePromise<LoanInfoRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/{id}/deliver_info/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject Service Request
     * Reject a pending service request with optional reason. Requires manager or higher role.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsRejectCreate(
        id: string,
        requestBody?: {
            /**
             * Reason for rejection
             */
            reason?: string;
        },
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Start Fulfillment
     * Mark request as in progress. Requires cashier or higher role.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns ServiceRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsStartFulfillmentCreate(
        id: string,
        requestBody: LoanInfoRequestRequest,
    ): CancelablePromise<ServiceRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/{id}/start_fulfillment/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify Authorization
     * Verify member authorization for loan information access. Requires manager or higher.
     * @param id A UUID string identifying this loan info request.
     * @param requestBody
     * @returns LoanInfoRequest
     * @throws ApiError
     */
    public static apiServicesLoanInfoRequestsVerifyAuthorizationCreate(
        id: string,
        requestBody: LoanInfoRequestRequest,
    ): CancelablePromise<LoanInfoRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/services/loan-info-requests/{id}/verify_authorization/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Service Request Statistics
     * Get statistics about service requests.
     * @returns any
     * @throws ApiError
     */
    public static apiServicesStatsList(): CancelablePromise<Array<{
        total_requests?: number;
        pending_requests?: number;
        approved_requests?: number;
        fulfilled_requests?: number;
        rejected_requests?: number;
        requests_by_type?: {
            checkbook?: number;
            statement?: number;
            loan_info?: number;
        };
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/services/stats/',
        });
    }
    /**
     * @param page A page number within the paginated result set.
     * @returns PaginatedPerformanceMetricList
     * @throws ApiError
     */
    public static apiPerformanceMetricsList(
        page?: number,
    ): CancelablePromise<PaginatedPerformanceMetricList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/metrics/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * @param requestBody
     * @returns PerformanceMetric
     * @throws ApiError
     */
    public static apiPerformanceMetricsCreate(
        requestBody: PerformanceMetricRequest,
    ): CancelablePromise<PerformanceMetric> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/metrics/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get performance metrics summary.
     * @returns PerformanceMetric
     * @throws ApiError
     */
    public static apiPerformanceMetricsSummaryRetrieve(): CancelablePromise<PerformanceMetric> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/metrics/summary/',
        });
    }
    /**
     * @param id A UUID string identifying this performance metric.
     * @param requestBody
     * @returns PerformanceMetric
     * @throws ApiError
     */
    public static apiPerformanceMetricsUpdate(
        id: string,
        requestBody: PerformanceMetricRequest,
    ): CancelablePromise<PerformanceMetric> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/performance/metrics/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this performance metric.
     * @returns PerformanceMetric
     * @throws ApiError
     */
    public static apiPerformanceMetricsRetrieve(
        id: string,
    ): CancelablePromise<PerformanceMetric> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/metrics/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this performance metric.
     * @returns void
     * @throws ApiError
     */
    public static apiPerformanceMetricsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/performance/metrics/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this performance metric.
     * @param requestBody
     * @returns PerformanceMetric
     * @throws ApiError
     */
    public static apiPerformanceMetricsPartialUpdate(
        id: string,
        requestBody?: PatchedPerformanceMetricRequest,
    ): CancelablePromise<PerformanceMetric> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/performance/metrics/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns SystemHealth
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthList(): CancelablePromise<Array<SystemHealth>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/system-health/',
        });
    }
    /**
     * @param requestBody
     * @returns SystemHealth
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthCreate(
        requestBody: SystemHealthRequest,
    ): CancelablePromise<SystemHealth> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/system-health/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get system health summary.
     * @returns SystemHealth
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthSummaryRetrieve(): CancelablePromise<SystemHealth> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/system-health/summary/',
        });
    }
    /**
     * @param id A UUID string identifying this system health.
     * @param requestBody
     * @returns SystemHealth
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthUpdate(
        id: string,
        requestBody: SystemHealthRequest,
    ): CancelablePromise<SystemHealth> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/performance/system-health/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this system health.
     * @returns SystemHealth
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthRetrieve(
        id: string,
    ): CancelablePromise<SystemHealth> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/system-health/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this system health.
     * @returns void
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/performance/system-health/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this system health.
     * @param requestBody
     * @returns SystemHealth
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthPartialUpdate(
        id: string,
        requestBody?: PatchedSystemHealthRequest,
    ): CancelablePromise<SystemHealth> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/performance/system-health/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Manually trigger health check for a component.
     * @param id A UUID string identifying this system health.
     * @param requestBody
     * @returns SystemHealth
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthCheckHealthCreate(
        id: string,
        requestBody: SystemHealthRequest,
    ): CancelablePromise<SystemHealth> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/system-health/{id}/check_health/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns DashboardWidget
     * @throws ApiError
     */
    public static apiPerformanceDashboardWidgetsList(): CancelablePromise<Array<DashboardWidget>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/dashboard-widgets/',
        });
    }
    /**
     * @param requestBody
     * @returns DashboardWidget
     * @throws ApiError
     */
    public static apiPerformanceDashboardWidgetsCreate(
        requestBody: DashboardWidgetRequest,
    ): CancelablePromise<DashboardWidget> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/dashboard-widgets/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns DashboardWidget
     * @throws ApiError
     */
    public static apiPerformanceDashboardWidgetsUpdate(
        id: string,
        requestBody: DashboardWidgetRequest,
    ): CancelablePromise<DashboardWidget> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/performance/dashboard-widgets/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id
     * @returns DashboardWidget
     * @throws ApiError
     */
    public static apiPerformanceDashboardWidgetsRetrieve(
        id: string,
    ): CancelablePromise<DashboardWidget> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/dashboard-widgets/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static apiPerformanceDashboardWidgetsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/performance/dashboard-widgets/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns DashboardWidget
     * @throws ApiError
     */
    public static apiPerformanceDashboardWidgetsPartialUpdate(
        id: string,
        requestBody?: PatchedDashboardWidgetRequest,
    ): CancelablePromise<DashboardWidget> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/performance/dashboard-widgets/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PerformanceAlert
     * @throws ApiError
     */
    public static apiPerformanceAlertsList(): CancelablePromise<Array<PerformanceAlert>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/alerts/',
        });
    }
    /**
     * @param requestBody
     * @returns PerformanceAlert
     * @throws ApiError
     */
    public static apiPerformanceAlertsCreate(
        requestBody: PerformanceAlertRequest,
    ): CancelablePromise<PerformanceAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/alerts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this performance alert.
     * @param requestBody
     * @returns PerformanceAlert
     * @throws ApiError
     */
    public static apiPerformanceAlertsUpdate(
        id: string,
        requestBody: PerformanceAlertRequest,
    ): CancelablePromise<PerformanceAlert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/performance/alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this performance alert.
     * @returns PerformanceAlert
     * @throws ApiError
     */
    public static apiPerformanceAlertsRetrieve(
        id: string,
    ): CancelablePromise<PerformanceAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/alerts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this performance alert.
     * @returns void
     * @throws ApiError
     */
    public static apiPerformanceAlertsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/performance/alerts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this performance alert.
     * @param requestBody
     * @returns PerformanceAlert
     * @throws ApiError
     */
    public static apiPerformanceAlertsPartialUpdate(
        id: string,
        requestBody?: PatchedPerformanceAlertRequest,
    ): CancelablePromise<PerformanceAlert> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/performance/alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Acknowledge an alert.
     * @param id A UUID string identifying this performance alert.
     * @param requestBody
     * @returns PerformanceAlert
     * @throws ApiError
     */
    public static apiPerformanceAlertsAcknowledgeCreate(
        id: string,
        requestBody: PerformanceAlertRequest,
    ): CancelablePromise<PerformanceAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/alerts/{id}/acknowledge/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Resolve an alert.
     * @param id A UUID string identifying this performance alert.
     * @param requestBody
     * @returns PerformanceAlert
     * @throws ApiError
     */
    public static apiPerformanceAlertsResolveCreate(
        id: string,
        requestBody: PerformanceAlertRequest,
    ): CancelablePromise<PerformanceAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/alerts/{id}/resolve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns PerformanceRecommendation
     * @throws ApiError
     */
    public static apiPerformanceRecommendationsList(): CancelablePromise<Array<PerformanceRecommendation>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/recommendations/',
        });
    }
    /**
     * @param requestBody
     * @returns PerformanceRecommendation
     * @throws ApiError
     */
    public static apiPerformanceRecommendationsCreate(
        requestBody: PerformanceRecommendationRequest,
    ): CancelablePromise<PerformanceRecommendation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/recommendations/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this performance recommendation.
     * @param requestBody
     * @returns PerformanceRecommendation
     * @throws ApiError
     */
    public static apiPerformanceRecommendationsUpdate(
        id: string,
        requestBody: PerformanceRecommendationRequest,
    ): CancelablePromise<PerformanceRecommendation> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/performance/recommendations/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this performance recommendation.
     * @returns PerformanceRecommendation
     * @throws ApiError
     */
    public static apiPerformanceRecommendationsRetrieve(
        id: string,
    ): CancelablePromise<PerformanceRecommendation> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/recommendations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this performance recommendation.
     * @returns void
     * @throws ApiError
     */
    public static apiPerformanceRecommendationsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/performance/recommendations/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this performance recommendation.
     * @param requestBody
     * @returns PerformanceRecommendation
     * @throws ApiError
     */
    public static apiPerformanceRecommendationsPartialUpdate(
        id: string,
        requestBody?: PatchedPerformanceRecommendationRequest,
    ): CancelablePromise<PerformanceRecommendation> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/performance/recommendations/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mark recommendation as implemented.
     * @param id A UUID string identifying this performance recommendation.
     * @param requestBody
     * @returns PerformanceRecommendation
     * @throws ApiError
     */
    public static apiPerformanceRecommendationsImplementCreate(
        id: string,
        requestBody: PerformanceRecommendationRequest,
    ): CancelablePromise<PerformanceRecommendation> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/performance/recommendations/{id}/implement/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get transaction volume data for charts.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiPerformanceTransactionVolumeRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/transaction-volume/',
        });
    }
    /**
     * Get performance data formatted for charts.
     * @returns any No response body
     * @throws ApiError
     */
    public static apiPerformanceChartDataRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/chart-data/',
        });
    }
    /**
     * Get comprehensive dashboard data.
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
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsList(): CancelablePromise<Array<MessagingMessageThread>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/threads/',
        });
    }
    /**
     * @param requestBody
     * @returns CreateMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsCreate(
        requestBody: CreateMessageThreadRequest,
    ): CancelablePromise<CreateMessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/threads/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message thread.
     * @param requestBody
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsUpdate(
        id: string,
        requestBody: MessagingMessageThreadRequest,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messaging/threads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message thread.
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsRetrieve(
        id: string,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/threads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message thread.
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingThreadsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/threads/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message thread.
     * @param requestBody
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsPartialUpdate(
        id: string,
        requestBody?: PatchedMessagingMessageThreadRequest,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/threads/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Add a participant to a group chat
     * @param id A UUID string identifying this message thread.
     * @param requestBody
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsAddParticipantCreate(
        id: string,
        requestBody: MessagingMessageThreadRequest,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/threads/{id}/add_participant/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Demote an admin to regular participant
     * @param id A UUID string identifying this message thread.
     * @param requestBody
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsDemoteAdminCreate(
        id: string,
        requestBody: MessagingMessageThreadRequest,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/threads/{id}/demote_admin/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message thread.
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsMessagesRetrieve(
        id: string,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/threads/{id}/messages/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Promote a participant to admin
     * @param id A UUID string identifying this message thread.
     * @param requestBody
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsPromoteAdminCreate(
        id: string,
        requestBody: MessagingMessageThreadRequest,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/threads/{id}/promote_admin/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove a participant from a group chat
     * @param id A UUID string identifying this message thread.
     * @param requestBody
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsRemoveParticipantCreate(
        id: string,
        requestBody: MessagingMessageThreadRequest,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/threads/{id}/remove_participant/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update group information (name, description)
     * @param id A UUID string identifying this message thread.
     * @param requestBody
     * @returns MessagingMessageThread
     * @throws ApiError
     */
    public static apiMessagingThreadsUpdateGroupPartialUpdate(
        id: string,
        requestBody?: PatchedMessagingMessageThreadRequest,
    ): CancelablePromise<MessagingMessageThread> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/threads/{id}/update_group/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesList(): CancelablePromise<Array<MessagingMessage>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/messages/',
        });
    }
    /**
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesCreate(
        requestBody: MessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload media files for messages (photos, videos, documents, voice notes)
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesUploadMediaCreate(
        requestBody: MessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/messages/upload_media/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message.
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesUpdate(
        id: string,
        requestBody: MessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messaging/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message.
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesRetrieve(
        id: string,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message.
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingMessagesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message.
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesPartialUpdate(
        id: string,
        requestBody?: PatchedMessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Add a reaction to a message
     * @param id A UUID string identifying this message.
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesAddReactionCreate(
        id: string,
        requestBody: MessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/messages/{id}/add_reaction/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Forward a message to another thread
     * @param id A UUID string identifying this message.
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesForwardMessageCreate(
        id: string,
        requestBody: MessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/messages/{id}/forward_message/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Remove a reaction from a message
     * @param id A UUID string identifying this message.
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesRemoveReactionCreate(
        id: string,
        requestBody: MessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/messages/{id}/remove_reaction/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Star/favorite a message
     * @param id A UUID string identifying this message.
     * @param requestBody
     * @returns MessagingMessage
     * @throws ApiError
     */
    public static apiMessagingMessagesStarMessageCreate(
        id: string,
        requestBody: MessagingMessageRequest,
    ): CancelablePromise<MessagingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/messages/{id}/star_message/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EncryptionKey
     * @throws ApiError
     */
    public static apiMessagingEncryptionKeysList(): CancelablePromise<Array<EncryptionKey>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/encryption-keys/',
        });
    }
    /**
     * @param requestBody
     * @returns EncryptionKey
     * @throws ApiError
     */
    public static apiMessagingEncryptionKeysCreate(
        requestBody: EncryptionKeyRequest,
    ): CancelablePromise<EncryptionKey> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/encryption-keys/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns EncryptionKey
     * @throws ApiError
     */
    public static apiMessagingEncryptionKeysUserKeyRetrieve(): CancelablePromise<EncryptionKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/encryption-keys/user_key/',
        });
    }
    /**
     * @param id A unique integer value identifying this encryption key.
     * @param requestBody
     * @returns EncryptionKey
     * @throws ApiError
     */
    public static apiMessagingEncryptionKeysUpdate(
        id: number,
        requestBody: EncryptionKeyRequest,
    ): CancelablePromise<EncryptionKey> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messaging/encryption-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this encryption key.
     * @returns EncryptionKey
     * @throws ApiError
     */
    public static apiMessagingEncryptionKeysRetrieve(
        id: number,
    ): CancelablePromise<EncryptionKey> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/encryption-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this encryption key.
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingEncryptionKeysDestroy(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/encryption-keys/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this encryption key.
     * @param requestBody
     * @returns EncryptionKey
     * @throws ApiError
     */
    public static apiMessagingEncryptionKeysPartialUpdate(
        id: number,
        requestBody?: PatchedEncryptionKeyRequest,
    ): CancelablePromise<EncryptionKey> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/encryption-keys/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns CallLog
     * @throws ApiError
     */
    public static apiMessagingCallLogsList(): CancelablePromise<Array<CallLog>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/call-logs/',
        });
    }
    /**
     * @param requestBody
     * @returns CreateCallLog
     * @throws ApiError
     */
    public static apiMessagingCallLogsCreate(
        requestBody: CreateCallLogRequest,
    ): CancelablePromise<CreateCallLog> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/call-logs/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this call log.
     * @param requestBody
     * @returns CallLog
     * @throws ApiError
     */
    public static apiMessagingCallLogsUpdate(
        id: string,
        requestBody: CallLogRequest,
    ): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messaging/call-logs/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this call log.
     * @returns CallLog
     * @throws ApiError
     */
    public static apiMessagingCallLogsRetrieve(
        id: string,
    ): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/call-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this call log.
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingCallLogsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/call-logs/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this call log.
     * @param requestBody
     * @returns CallLog
     * @throws ApiError
     */
    public static apiMessagingCallLogsPartialUpdate(
        id: string,
        requestBody?: PatchedCallLogRequest,
    ): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/call-logs/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this call log.
     * @param requestBody
     * @returns CallLog
     * @throws ApiError
     */
    public static apiMessagingCallLogsEndCallCreate(
        id: string,
        requestBody: CallLogRequest,
    ): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/call-logs/{id}/end_call/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this call log.
     * @param requestBody
     * @returns CallLog
     * @throws ApiError
     */
    public static apiMessagingCallLogsStartCallCreate(
        id: string,
        requestBody: CallLogRequest,
    ): CancelablePromise<CallLog> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/call-logs/{id}/start_call/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns Device
     * @throws ApiError
     */
    public static apiMessagingDevicesList(): CancelablePromise<Array<Device>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/devices/',
        });
    }
    /**
     * @param requestBody
     * @returns Device
     * @throws ApiError
     */
    public static apiMessagingDevicesCreate(
        requestBody: DeviceRequest,
    ): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/devices/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get synchronization data for the current device
     * @returns Device
     * @throws ApiError
     */
    public static apiMessagingDevicesSyncDataRetrieve(): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/devices/sync_data/',
        });
    }
    /**
     * @param id A UUID string identifying this device.
     * @param requestBody
     * @returns Device
     * @throws ApiError
     */
    public static apiMessagingDevicesUpdate(
        id: string,
        requestBody: DeviceRequest,
    ): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messaging/devices/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this device.
     * @returns Device
     * @throws ApiError
     */
    public static apiMessagingDevicesRetrieve(
        id: string,
    ): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/devices/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this device.
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingDevicesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/devices/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this device.
     * @param requestBody
     * @returns Device
     * @throws ApiError
     */
    public static apiMessagingDevicesPartialUpdate(
        id: string,
        requestBody?: PatchedDeviceRequest,
    ): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/devices/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update device's last seen timestamp
     * @param id A UUID string identifying this device.
     * @param requestBody
     * @returns Device
     * @throws ApiError
     */
    public static apiMessagingDevicesUpdateLastSeenCreate(
        id: string,
        requestBody: DeviceRequest,
    ): CancelablePromise<Device> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/devices/{id}/update_last_seen/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MessageReadStatus
     * @throws ApiError
     */
    public static apiMessagingReadStatusesList(): CancelablePromise<Array<MessageReadStatus>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/read-statuses/',
        });
    }
    /**
     * @param requestBody
     * @returns MessageReadStatus
     * @throws ApiError
     */
    public static apiMessagingReadStatusesCreate(
        requestBody: MessageReadStatusRequest,
    ): CancelablePromise<MessageReadStatus> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/read-statuses/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message read status.
     * @param requestBody
     * @returns MessageReadStatus
     * @throws ApiError
     */
    public static apiMessagingReadStatusesUpdate(
        id: string,
        requestBody: MessageReadStatusRequest,
    ): CancelablePromise<MessageReadStatus> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messaging/read-statuses/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message read status.
     * @returns MessageReadStatus
     * @throws ApiError
     */
    public static apiMessagingReadStatusesRetrieve(
        id: string,
    ): CancelablePromise<MessageReadStatus> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/read-statuses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message read status.
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingReadStatusesDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/read-statuses/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message read status.
     * @param requestBody
     * @returns MessageReadStatus
     * @throws ApiError
     */
    public static apiMessagingReadStatusesPartialUpdate(
        id: string,
        requestBody?: PatchedMessageReadStatusRequest,
    ): CancelablePromise<MessageReadStatus> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/read-statuses/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns MessageBackup
     * @throws ApiError
     */
    public static apiMessagingBackupsList(): CancelablePromise<Array<MessageBackup>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/backups/',
        });
    }
    /**
     * @param requestBody
     * @returns MessageBackup
     * @throws ApiError
     */
    public static apiMessagingBackupsCreate(
        requestBody?: MessageBackupRequest,
    ): CancelablePromise<MessageBackup> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/backups/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message backup.
     * @param requestBody
     * @returns MessageBackup
     * @throws ApiError
     */
    public static apiMessagingBackupsUpdate(
        id: string,
        requestBody?: MessageBackupRequest,
    ): CancelablePromise<MessageBackup> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messaging/backups/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A UUID string identifying this message backup.
     * @returns MessageBackup
     * @throws ApiError
     */
    public static apiMessagingBackupsRetrieve(
        id: string,
    ): CancelablePromise<MessageBackup> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/backups/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message backup.
     * @returns void
     * @throws ApiError
     */
    public static apiMessagingBackupsDestroy(
        id: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/messaging/backups/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A UUID string identifying this message backup.
     * @param requestBody
     * @returns MessageBackup
     * @throws ApiError
     */
    public static apiMessagingBackupsPartialUpdate(
        id: string,
        requestBody?: PatchedMessageBackupRequest,
    ): CancelablePromise<MessageBackup> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messaging/backups/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Restore messages from backup
     * @param id A UUID string identifying this message backup.
     * @param requestBody
     * @returns MessageBackup
     * @throws ApiError
     */
    public static apiMessagingBackupsRestoreCreate(
        id: string,
        requestBody?: MessageBackupRequest,
    ): CancelablePromise<MessageBackup> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/backups/{id}/restore/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns User
     * @throws ApiError
     */
    public static apiMessagingStaffUsersList(): CancelablePromise<Array<User>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/staff-users/',
        });
    }
    /**
     * OpenApi3 schema for this API. Format can be selected via content negotiation.
     *
     * - YAML: application/vnd.oai.openapi
     * - JSON: application/vnd.oai.openapi+json
     * @param format
     * @param lang
     * @returns any
     * @throws ApiError
     */
    public static apiSchemaRetrieve(
        format?: 'json' | 'yaml',
        lang?: 'af' | 'ar' | 'ar-dz' | 'ast' | 'az' | 'be' | 'bg' | 'bn' | 'br' | 'bs' | 'ca' | 'ckb' | 'cs' | 'cy' | 'da' | 'de' | 'dsb' | 'el' | 'en' | 'en-au' | 'en-gb' | 'eo' | 'es' | 'es-ar' | 'es-co' | 'es-mx' | 'es-ni' | 'es-ve' | 'et' | 'eu' | 'fa' | 'fi' | 'fr' | 'fy' | 'ga' | 'gd' | 'gl' | 'he' | 'hi' | 'hr' | 'hsb' | 'hu' | 'hy' | 'ia' | 'id' | 'ig' | 'io' | 'is' | 'it' | 'ja' | 'ka' | 'kab' | 'kk' | 'km' | 'kn' | 'ko' | 'ky' | 'lb' | 'lt' | 'lv' | 'mk' | 'ml' | 'mn' | 'mr' | 'ms' | 'my' | 'nb' | 'ne' | 'nl' | 'nn' | 'os' | 'pa' | 'pl' | 'pt' | 'pt-br' | 'ro' | 'ru' | 'sk' | 'sl' | 'sq' | 'sr' | 'sr-latn' | 'sv' | 'sw' | 'ta' | 'te' | 'tg' | 'th' | 'tk' | 'tr' | 'tt' | 'udm' | 'uk' | 'ur' | 'uz' | 'vi' | 'zh-hans' | 'zh-hant',
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/schema/',
            query: {
                'format': format,
                'lang': lang,
            },
        });
    }
}
