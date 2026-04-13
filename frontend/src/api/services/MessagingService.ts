/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BlockedUser } from '../models/BlockedUser';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MessagingService {
    /**
     * ViewSet for managing blocked users.
     * @returns BlockedUser
     * @throws ApiError
     */
    public static messagingBlockedUsersList(): CancelablePromise<Array<BlockedUser>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/blocked-users/',
        });
    }
    /**
     * ViewSet for managing blocked users.
     * @param requestBody
     * @returns BlockedUser
     * @throws ApiError
     */
    public static messagingBlockedUsersCreate(
        requestBody: BlockedUser,
    ): CancelablePromise<BlockedUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/blocked-users/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Unblock a user by their ID.
     * @param requestBody
     * @returns BlockedUser
     * @throws ApiError
     */
    public static messagingBlockedUsersUnblockCreate(
        requestBody: BlockedUser,
    ): CancelablePromise<BlockedUser> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/blocked-users/unblock/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get current user's message preferences.
     * @returns any No response body
     * @throws ApiError
     */
    public static messagingPreferencesRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messaging/preferences/',
        });
    }
    /**
     * Update user's message preferences.
     * @returns any No response body
     * @throws ApiError
     */
    public static messagingPreferencesCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messaging/preferences/',
        });
    }
}
