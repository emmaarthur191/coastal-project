/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { OTPRequestRequest } from '../models/OTPRequestRequest';
import type { OTPVerifyRequest } from '../models/OTPVerifyRequest';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AuthenticationService {
    /**
     * User Login
     * Authenticate user with email and password to obtain JWT tokens. Available to all valid user accounts. Progressive rate limiting with delays and account lockouts applied.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersAuthLoginCreate(
        requestBody?: {
            /**
             * User email address
             */
            email: string;
            password: string;
        },
    ): CancelablePromise<{
        refresh?: string;
        access?: string;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: 'customer' | 'cashier' | 'mobile_banker' | 'manager' | 'operations_manager';
            is_active?: boolean;
            is_staff?: boolean;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/auth/login/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User Logout
     * Invalidate the refresh token to log out the authenticated user. Rate limiting applied to prevent abuse.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersAuthLogoutCreate(
        requestBody?: {
            refresh: string;
        },
    ): CancelablePromise<{
        detail?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/auth/logout/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Check Authentication Status
     * Returns the authenticated user's information if logged in, or authenticated: false if not. Rate limiting applied to prevent abuse.
     * @returns any
     * @throws ApiError
     */
    public static usersAuthCheckRetrieve(): CancelablePromise<{
        authenticated?: boolean;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: 'customer' | 'cashier' | 'mobile_banker' | 'manager' | 'operations_manager';
            is_active?: boolean;
            is_staff?: boolean;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/users/auth/check/',
        });
    }
    /**
     * User Registration
     * Create a new user account with email, password, and basic information. Rate limiting applied to prevent abuse.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersAuthRegisterCreate(
        requestBody?: {
            email: string;
            first_name: string;
            last_name: string;
            password: string;
            password_confirm: string;
        },
    ): CancelablePromise<{
        detail?: string;
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
            url: '/users/auth/register/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send OTP
     * Send OTP code to phone number. In test mode, OTP is returned in response for testing.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersSendOtpCreate(
        requestBody: OTPRequestRequest,
    ): CancelablePromise<{
        message?: string;
        expires_in?: number;
        test_mode?: boolean;
        /**
         * Only in test mode
         */
        otp_code?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/send-otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify OTP
     * Verify OTP code for phone number verification.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersVerifyOtpCreate(
        requestBody: OTPVerifyRequest,
    ): CancelablePromise<{
        message?: string;
        verified?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/users/verify-otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User Login
     * Authenticate user with email and password to obtain JWT tokens. Available to all valid user accounts. Progressive rate limiting with delays and account lockouts applied.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersAuthLoginCreate(
        requestBody?: {
            /**
             * User email address
             */
            email: string;
            password: string;
        },
    ): CancelablePromise<{
        refresh?: string;
        access?: string;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: 'customer' | 'cashier' | 'mobile_banker' | 'manager' | 'operations_manager';
            is_active?: boolean;
            is_staff?: boolean;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/login/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * User Logout
     * Invalidate the refresh token to log out the authenticated user. Rate limiting applied to prevent abuse.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersAuthLogoutCreate(
        requestBody?: {
            refresh: string;
        },
    ): CancelablePromise<{
        detail?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/logout/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Check Authentication Status
     * Returns the authenticated user's information if logged in, or authenticated: false if not. Rate limiting applied to prevent abuse.
     * @returns any
     * @throws ApiError
     */
    public static apiUsersAuthCheckRetrieve(): CancelablePromise<{
        authenticated?: boolean;
        user?: {
            id?: string;
            email?: string;
            first_name?: string;
            last_name?: string;
            role?: 'customer' | 'cashier' | 'mobile_banker' | 'manager' | 'operations_manager';
            is_active?: boolean;
            is_staff?: boolean;
        };
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/auth/check/',
        });
    }
    /**
     * User Registration
     * Create a new user account with email, password, and basic information. Rate limiting applied to prevent abuse.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersAuthRegisterCreate(
        requestBody?: {
            email: string;
            first_name: string;
            last_name: string;
            password: string;
            password_confirm: string;
        },
    ): CancelablePromise<{
        detail?: string;
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
            url: '/api/users/auth/register/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send OTP
     * Send OTP code to phone number. In test mode, OTP is returned in response for testing.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersSendOtpCreate(
        requestBody: OTPRequestRequest,
    ): CancelablePromise<{
        message?: string;
        expires_in?: number;
        test_mode?: boolean;
        /**
         * Only in test mode
         */
        otp_code?: string;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/send-otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify OTP
     * Verify OTP code for phone number verification.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static apiUsersVerifyOtpCreate(
        requestBody: OTPVerifyRequest,
    ): CancelablePromise<{
        message?: string;
        verified?: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/verify-otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
