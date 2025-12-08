/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TokenRefresh } from '../models/TokenRefresh';
import type { TokenRefreshRequest } from '../models/TokenRefreshRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Takes a refresh type JSON web token and returns an access type JSON web
     * token if the refresh token is valid.
     * @param requestBody
     * @returns TokenRefresh
     * @throws ApiError
     */
    public static usersAuthRefreshCreate(
        requestBody: TokenRefreshRequest,
    ): CancelablePromise<TokenRefresh> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/auth/refresh/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * POST: Request password reset by sending email with reset token.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersAuthPasswordResetCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/auth/password-reset/',
        });
    }
    /**
     * POST: Confirm password reset with token.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersAuthPasswordResetConfirmCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/auth/password-reset-confirm/',
        });
    }
    /**
     * GET: Retrieve profile.
     * PATCH: Update general profile details.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersProfileRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/profile/',
        });
    }
    /**
     * GET: Retrieve profile.
     * PATCH: Update general profile details.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersProfilePartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/users/profile/',
        });
    }
    /**
     * PATCH: Update notification preferences (notify_email, notify_sms, notify_push).
     * @returns any No response body
     * @throws ApiError
     */
    public static usersNotificationsPartialUpdate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/users/notifications/',
        });
    }
    /**
     * POST: Change user password.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersChangePasswordCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/change-password/',
        });
    }
}
