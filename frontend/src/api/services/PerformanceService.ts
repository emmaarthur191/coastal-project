/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PerformanceService {
    /**
     * Return recent system performance alerts.
     * @returns any No response body
     * @throws ApiError
     */
    public static performanceAlertsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/alerts/',
        });
    }
    /**
     * Return labels and datasets for performance charts.
     * @returns any No response body
     * @throws ApiError
     */
    public static performanceChartRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/chart/',
        });
    }
    /**
     * Return system-level performance health and resource utilization metrics in a consolidated format.
     * @returns any No response body
     * @throws ApiError
     */
    public static performanceDashboardDataRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/dashboard-data/',
        });
    }
    /**
     * Return detailed performance metrics over time.
     * @returns any No response body
     * @throws ApiError
     */
    public static performanceMetricsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/metrics/',
        });
    }
    /**
     * Return system recommendations based on performance analytics.
     * @returns any No response body
     * @throws ApiError
     */
    public static performanceRecommendationsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/recommendations/',
        });
    }
    /**
     * Return a detailed system health report including database connectivity and service status.
     * @returns any No response body
     * @throws ApiError
     */
    public static performanceSystemHealthRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/system-health/',
        });
    }
    /**
     * Return transaction volume aggregated by period.
     * @returns any No response body
     * @throws ApiError
     */
    public static performanceVolumeRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/volume/',
        });
    }
}
