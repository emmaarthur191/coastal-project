/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class StaffManagementService {
    /**
     * Approve and print a staff registration
     * Approve a staff member, generate staff ID, and return a welcome letter.
     * @param id The ID of the user to approve.
     * @returns any
     * @throws ApiError
     */
    public static apiUsersStaffManagementApproveAndPrintCreate(
        id: number,
    ): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/staff-management/{id}/approve-and-print/',
            path: {
                'id': id,
            },
            responseType: 'blob',
        });
    }

    /**
     * List all staff members
     * @returns any
     * @throws ApiError
     */
    public static apiUsersStaffManagementList(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff-management/',
        });
    }
}
