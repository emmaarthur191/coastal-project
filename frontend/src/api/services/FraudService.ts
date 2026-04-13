/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FraudAlert } from '../models/FraudAlert';
import type { FraudRule } from '../models/FraudRule';
import type { PaginatedFraudAlertList } from '../models/PaginatedFraudAlertList';
import type { PaginatedFraudRuleList } from '../models/PaginatedFraudRuleList';
import type { PatchedFraudAlert } from '../models/PatchedFraudAlert';
import type { PatchedFraudRule } from '../models/PatchedFraudRule';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FraudService {
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
    public static fraudAlertsList2(
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
    public static fraudAlertsCreate2(
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
    public static fraudAlertsRetrieve2(
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
    public static fraudAlertsUpdate2(
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
    public static fraudAlertsPartialUpdate2(
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
     * Mark a fraud alert as resolved.
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static fraudAlertsResolveCreate2(
        id: number,
        requestBody: FraudAlert,
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
     * Get fraud alert statistics for dashboard.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static fraudAlertsDashboardStatsRetrieve2(): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/alerts/dashboard-stats/',
        });
    }
    /**
     * Trigger an automated fraud detection sweep (Mock/Placeholder).
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static fraudAlertsRunCheckCreate2(
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/alerts/run_check/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param ruleType * `transaction_amount` - Transaction Amount
     * * `velocity` - Velocity
     * * `geographic` - Geographic
     * * `time_based` - Time Based
     * * `account_activity` - Account Activity
     * @param severity * `low` - Low
     * * `medium` - Medium
     * * `high` - High
     * * `critical` - Critical
     * @returns PaginatedFraudRuleList
     * @throws ApiError
     */
    public static fraudRulesList(
        isActive?: boolean,
        ordering?: string,
        page?: number,
        ruleType?: 'account_activity' | 'geographic' | 'time_based' | 'transaction_amount' | 'velocity',
        severity?: 'critical' | 'high' | 'low' | 'medium',
    ): CancelablePromise<PaginatedFraudRuleList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/rules/',
            query: {
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
                'rule_type': ruleType,
                'severity': severity,
            },
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static fraudRulesCreate(
        requestBody: FraudRule,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/rules/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing fraud detection rules.
     * @param id A unique integer value identifying this Fraud Rule.
     * @returns FraudRule
     * @throws ApiError
     */
    public static fraudRulesRetrieve(
        id: number,
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
     * @param id A unique integer value identifying this Fraud Rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static fraudRulesUpdate(
        id: number,
        requestBody: FraudRule,
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
     * @param id A unique integer value identifying this Fraud Rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static fraudRulesPartialUpdate(
        id: number,
        requestBody?: PatchedFraudRule,
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
     * ViewSet for managing fraud detection rules.
     * @param id A unique integer value identifying this Fraud Rule.
     * @returns void
     * @throws ApiError
     */
    public static fraudRulesDestroy(
        id: number,
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
     * Toggle the active status of a fraud rule.
     * @param id A unique integer value identifying this Fraud Rule.
     * @param requestBody
     * @returns FraudRule
     * @throws ApiError
     */
    public static fraudRulesToggleActiveCreate(
        id: number,
        requestBody: FraudRule,
    ): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud/rules/{id}/toggle_active/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all active fraud rules.
     * @returns FraudRule
     * @throws ApiError
     */
    public static fraudRulesActiveRulesRetrieve(): CancelablePromise<FraudRule> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud/rules/active_rules/',
        });
    }
}
