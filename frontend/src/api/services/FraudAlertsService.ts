/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { FraudAlert } from '../models/FraudAlert';
import type { PaginatedFraudAlertList } from '../models/PaginatedFraudAlertList';
import type { PatchedFraudAlert } from '../models/PatchedFraudAlert';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class FraudAlertsService {
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
    public static fraudAlertsList(
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
    public static fraudAlertsCreate(
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
    public static fraudAlertsRetrieve(
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
    public static fraudAlertsUpdate(
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
    public static fraudAlertsPartialUpdate(
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
     * Mark a fraud alert as resolved.
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static fraudAlertsResolveCreate(
        id: number,
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud-alerts/{id}/resolve/',
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
    public static fraudAlertsDashboardStatsRetrieve(): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud-alerts/dashboard-stats/',
        });
    }
    /**
     * Trigger an automated fraud detection sweep (Mock/Placeholder).
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static fraudAlertsRunCheckCreate(
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud-alerts/run_check/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
