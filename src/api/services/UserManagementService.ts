/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DeactivateRequest } from '../models/DeactivateRequest';
import type { ReactivateRequest } from '../models/ReactivateRequest';
import type { UserCreationRequest } from '../models/UserCreationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserManagementService {
    /**
     * Create New User
     * Create a new user account. Only accessible by managers and operations managers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersCreateCreate(
        requestBody: UserCreationRequest,
    ): CancelablePromise<{
        message?: string;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/create/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List Staff Members
     * Get a list of all staff members. Only accessible by managers and operations managers.
     * @returns any
     * @throws ApiError
     */
    public static usersStaffRetrieve(): CancelablePromise<Array<{
        id?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        role?: string;
        is_active?: boolean;
        date_joined?: string;
        staff_id?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/staff/',
        });
    }
    /**
     * List Members
     * Get a list of all members. Accessible by staff users.
     * @returns any
     * @throws ApiError
     */
    public static usersMembersRetrieve(): CancelablePromise<Array<{
        id?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        is_active?: boolean;
        date_joined?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/members/',
        });
    }
    /**
     * Deactivate Staff
     * Deactivate a staff member. Only accessible by operations managers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersDeactivateStaffCreate(
        requestBody: DeactivateRequest,
    ): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/deactivate-staff/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reactivate Staff
     * Reactivate a deactivated staff member. Only accessible by operations managers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersReactivateStaffCreate(
        requestBody: ReactivateRequest,
    ): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/reactivate-staff/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create New User
     * Create a new user account. Only accessible by managers and operations managers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersCreateCreate(
        requestBody: UserCreationRequest,
    ): CancelablePromise<{
        message?: string;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: string;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/create/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List Staff Members
     * Get a list of all staff members. Only accessible by managers and operations managers.
     * @returns any
     * @throws ApiError
     */
    public static apiUsersStaffRetrieve(): CancelablePromise<Array<{
        id?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        role?: string;
        is_active?: boolean;
        date_joined?: string;
        staff_id?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff/',
        });
    }
    /**
     * List Members
     * Get a list of all members. Accessible by staff users.
     * @returns any
     * @throws ApiError
     */
    public static apiUsersMembersRetrieve(): CancelablePromise<Array<{
        id?: string;
        email?: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        is_active?: boolean;
        date_joined?: string;
    }>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/members/',
        });
    }
    /**
     * Deactivate Staff
     * Deactivate a staff member. Only accessible by operations managers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersDeactivateStaffCreate(
        requestBody: DeactivateRequest,
    ): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/deactivate-staff/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reactivate Staff
     * Reactivate a deactivated staff member. Only accessible by operations managers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersReactivateStaffCreate(
        requestBody: ReactivateRequest,
    ): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/reactivate-staff/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
