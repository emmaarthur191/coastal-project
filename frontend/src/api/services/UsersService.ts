/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChangePassword } from '../models/ChangePassword';
import type { Login } from '../models/Login';
import type { OTPRequest } from '../models/OTPRequest';
import type { OTPVerify } from '../models/OTPVerify';
import type { PaginatedUserList } from '../models/PaginatedUserList';
import type { PasswordResetRequest } from '../models/PasswordResetRequest';
import type { PatchedUser } from '../models/PatchedUser';
import type { StaffCreation } from '../models/StaffCreation';
import type { TokenRefresh } from '../models/TokenRefresh';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersService {
    /**
     * Handle password change requests for the authenticated user, validating old password and updating security tokens.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersAuthChangePasswordCreate(
        requestBody: ChangePassword,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/change-password/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Implicitly check if the user is authenticated via JWT cookies without triggering a 401 response.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersAuthCheckRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/auth/check/',
        });
    }
    /**
     * Authenticate user credentials and return JWT tokens and user details.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersAuthLoginCreate(
        requestBody: Login,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/login/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve a log of recent login and failed login activities for security auditing.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersAuthLoginAttemptsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/auth/login-attempts/',
        });
    }
    /**
     * Handle user logout, invalidating JWT tokens and clearing authentication cookies.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersAuthLogoutCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/logout/',
        });
    }
    /**
     * Handle request for a password reset token.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersAuthPasswordResetCreate(
        requestBody: PasswordResetRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/password-reset/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handle the confirmation of a new password using a reset token.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersAuthPasswordResetConfirmCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/password-reset/confirm/',
        });
    }
    /**
     * Exchange a valid refresh token for a new access token.
     * @param requestBody
     * @returns TokenRefresh
     * @throws ApiError
     */
    public static usersAuthRefreshCreate(
        requestBody: TokenRefresh,
    ): CancelablePromise<TokenRefresh> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/auth/refresh/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handle administrative creation of staff users via secure invitation flow.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersCreateStaffCreate(
        requestBody: StaffCreation,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/create-staff/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Return a fresh CSRF token for frontend security.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersCsrfRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/csrf/',
        });
    }
    /**
     * Admin-only view to list all registered users.
     * @param page A page number within the paginated result set.
     * @returns PaginatedUserList
     * @throws ApiError
     */
    public static usersListList(
        page?: number,
    ): CancelablePromise<PaginatedUserList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/list/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Endpoint for retrieving and updating user profile details.
     * @returns User
     * @throws ApiError
     */
    public static usersMeRetrieve(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/',
        });
    }
    /**
     * Endpoint for retrieving and updating user profile details.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersMeUpdate(
        requestBody: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Endpoint for retrieving and updating user profile details.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersMePartialUpdate(
        requestBody?: PatchedUser,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/me/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve a summary of account balances and recent transactions for the member dashboard.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersMemberDashboardRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/member-dashboard/',
        });
    }
    /**
     * Generate and send a 6-digit OTP to the provided phone number for security verification.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersSendOtpCreate(
        requestBody: OTPRequest,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/send-otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Identify and return active user sessions based on recent login activity within the last 24 hours.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersSessionsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/sessions/',
        });
    }
    /**
     * Terminate a specific user session, invalidating all associated JWT tokens.
     * @param id
     * @returns any
     * @throws ApiError
     */
    public static usersSessionsTerminateCreate(
        id: number,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/sessions/{id}/terminate/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Retrieve a list of staff members with optional filtering by role and status.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersStaffRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff/',
        });
    }
    /**
     * Handle invitation verification and account activation without OTP.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersStaffEnrollCreate(
        requestBody: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/staff-enroll/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve a list of staff members with their formal staff ID strings and status.
     * @returns any No response body
     * @throws ApiError
     */
    public static usersStaffIdsRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff-ids/',
        });
    }
    /**
     * ViewSet for Manager-level staff management actions.
     * @param page A page number within the paginated result set.
     * @returns PaginatedUserList
     * @throws ApiError
     */
    public static usersStaffManagementList(
        page?: number,
    ): CancelablePromise<PaginatedUserList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff-management/',
            query: {
                'page': page,
            },
        });
    }
    /**
     * Handle administrative creation of staff users via secure invitation flow.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersStaffManagementCreate(
        requestBody: StaffCreation,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/staff-management/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for Manager-level staff management actions.
     * @param id A unique integer value identifying this user.
     * @returns User
     * @throws ApiError
     */
    public static usersStaffManagementRetrieve(
        id: number,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/staff-management/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * ViewSet for Manager-level staff management actions.
     * @param id A unique integer value identifying this user.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersStaffManagementUpdate(
        id: number,
        requestBody: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/users/staff-management/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for Manager-level staff management actions.
     * @param id A unique integer value identifying this user.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersStaffManagementPartialUpdate(
        id: number,
        requestBody?: PatchedUser,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/users/staff-management/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for Manager-level staff management actions.
     * @param id A unique integer value identifying this user.
     * @returns void
     * @throws ApiError
     */
    public static usersStaffManagementDestroy(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/users/staff-management/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve a staff member, generate staff ID, and return a welcome letter.
     * @param id A unique integer value identifying this user.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersStaffManagementApproveAndPrintCreate(
        id: number,
        requestBody: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/staff-management/{id}/approve-and-print/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Handle invitation verification and account activation without OTP.
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static usersStaffManagementVerifyInvitationCreate(
        requestBody: User,
    ): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/staff-management/verify-invitation/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify the provided OTP against the database and return verification status.
     * @param requestBody
     * @returns any
     * @throws ApiError
     */
    public static usersVerifyOtpCreate(
        requestBody: OTPVerify,
    ): CancelablePromise<Record<string, any>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/verify-otp/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
