/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BankingMessage } from '../models/BankingMessage';
import type { PaginatedBankingMessageList } from '../models/PaginatedBankingMessageList';
import type { PatchedBankingMessage } from '../models/PatchedBankingMessage';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class MessagesService {
    /**
     * @param isRead
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedBankingMessageList
     * @throws ApiError
     */
    public static messagesList(
        isRead?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedBankingMessageList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messages/',
            query: {
                'is_read': isRead,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static messagesCreate(
        requestBody: BankingMessage,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messages/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this banking message.
     * @returns BankingMessage
     * @throws ApiError
     */
    public static messagesRetrieve(
        id: number,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/messages/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this banking message.
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static messagesUpdate(
        id: number,
        requestBody: BankingMessage,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this banking message.
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static messagesPartialUpdate(
        id: number,
        requestBody?: PatchedBankingMessage,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/messages/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this banking message.
     * @param requestBody
     * @returns BankingMessage
     * @throws ApiError
     */
    public static messagesMarkReadCreate(
        id: number,
        requestBody: BankingMessage,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messages/{id}/mark-read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
