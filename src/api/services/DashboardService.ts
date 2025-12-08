/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleBasedDashboard } from '../models/RoleBasedDashboard';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DashboardService {
    /**
     * Member Dashboard
     * Returns dashboard data including account balances, recent transactions, and loan information for authenticated members.
     * @returns RoleBasedDashboard
     * @throws ApiError
     */
    public static usersMemberDashboardRetrieve(): CancelablePromise<RoleBasedDashboard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/member-dashboard/',
        });
    }
    /**
     * Member Dashboard
     * Returns dashboard data including account balances, recent transactions, and loan information for authenticated members.
     * @returns RoleBasedDashboard
     * @throws ApiError
     */
    public static apiUsersMemberDashboardRetrieve(): CancelablePromise<RoleBasedDashboard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/member-dashboard/',
        });
    }
}
