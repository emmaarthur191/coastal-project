/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Enable2FARequest } from '../models/Enable2FARequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class SecurityService {
    /**
     * Enable 2FA
     * Enable two-factor authentication for the authenticated user.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersEnable2FaCreate(
        requestBody: Enable2FARequest,
    ): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/enable-2fa/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Enable 2FA
     * Enable two-factor authentication for the authenticated user.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersEnable2FaCreate(
        requestBody: Enable2FARequest,
    ): CancelablePromise<{
        message?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/enable-2fa/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
