/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SuperuserOperationRequest } from '../models/SuperuserOperationRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SuperuserOperationsService {
    /**
     * Superuser Operations
     * Perform privileged operations available only to superusers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersSuperuserOperationsCreate(
        requestBody: SuperuserOperationRequest,
    ): CancelablePromise<{
        message?: string;
        operation_id?: string;
        /**
         * Operation-specific data
         */
        data?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/superuser/operations/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Superuser Operations
     * Perform privileged operations available only to superusers.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersSuperuserOperationsCreate(
        requestBody: SuperuserOperationRequest,
    ): CancelablePromise<{
        message?: string;
        operation_id?: string;
        /**
         * Operation-specific data
         */
        data?: Record<string, any>;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/superuser/operations/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
