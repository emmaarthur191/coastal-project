/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StaffManagementService {
    /**
     * List Staff IDs
     * Get a list of all staff IDs with advanced filtering and searching. Only accessible by managers and operations managers.
     * @param employmentDateFrom Filter by employment date from
     * @param employmentDateTo Filter by employment date to
     * @param page Page number for pagination
     * @param pageSize Number of items per page
     * @param role Filter by role
     * @param search Search by name, email, or staff ID
     * @param status Filter by status
     * @returns any
     * @throws ApiError
     */
    public static usersStaffIdsRetrieve(
        employmentDateFrom?: string,
        employmentDateTo?: string,
        page?: number,
        pageSize?: number,
        role?: 'administrator' | 'cashier' | 'manager' | 'mobile_banker' | 'operations_manager',
        search?: string,
        status?: 'active' | 'inactive',
    ): CancelablePromise<{
        count?: number;
        next?: string | null;
        previous?: string | null;
        results?: Array<{
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
            staff_id?: string;
            employment_date?: string;
            is_active?: boolean;
            date_joined?: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/staff-ids/',
            query: {
                'employment_date_from': employmentDateFrom,
                'employment_date_to': employmentDateTo,
                'page': page,
                'page_size': pageSize,
                'role': role,
                'search': search,
                'status': status,
            },
        });
    }
    /**
     * List Staff IDs
     * Get a list of all staff IDs with advanced filtering and searching. Only accessible by managers and operations managers.
     * @param employmentDateFrom Filter by employment date from
     * @param employmentDateTo Filter by employment date to
     * @param page Page number for pagination
     * @param pageSize Number of items per page
     * @param role Filter by role
     * @param search Search by name, email, or staff ID
     * @param status Filter by status
     * @returns any
     * @throws ApiError
     */
    public static apiUsersStaffIdsRetrieve(
        employmentDateFrom?: string,
        employmentDateTo?: string,
        page?: number,
        pageSize?: number,
        role?: 'administrator' | 'cashier' | 'manager' | 'mobile_banker' | 'operations_manager',
        search?: string,
        status?: 'active' | 'inactive',
    ): CancelablePromise<{
        count?: number;
        next?: string | null;
        previous?: string | null;
        results?: Array<{
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
            staff_id?: string;
            employment_date?: string;
            is_active?: boolean;
            date_joined?: string;
        }>;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff-ids/',
            query: {
                'employment_date_from': employmentDateFrom,
                'employment_date_to': employmentDateTo,
                'page': page,
                'page_size': pageSize,
                'role': role,
                'search': search,
                'status': status,
            },
        });
    }
}
