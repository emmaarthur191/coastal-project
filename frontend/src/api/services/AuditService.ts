/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuditService {
    /**
     * Retrieve audit logs and summary events for the specified time range.
     * @returns any No response body
     * @throws ApiError
     */
    public static auditDashboardRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/audit/dashboard/',
        });
    }
}
