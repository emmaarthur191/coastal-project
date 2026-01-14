/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountOpeningRequest } from '../models/AccountOpeningRequest';
import type { PaginatedAccountOpeningRequestList } from '../models/PaginatedAccountOpeningRequestList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AccountOpeningsService {
    /**
     * List all account opening requests
     * ViewSet for handling account opening requests.
     * @param accountType * `daily_susu` - Daily Susu
     * * `shares` - Shares
     * * `monthly_contribution` - Monthly Contribution
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending Review
     * * `approved` - Approved
     * * `rejected` - Rejected
     * * `completed` - Completed
     * @returns PaginatedAccountOpeningRequestList
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsList(
        accountType?: 'daily_susu' | 'monthly_contribution' | 'shares',
        ordering?: string,
        page?: number,
        status?: 'approved' | 'completed' | 'pending' | 'rejected',
    ): CancelablePromise<PaginatedAccountOpeningRequestList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-openings/',
            query: {
                'account_type': accountType,
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * Submit a new account opening request
     * ViewSet for handling account opening requests.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsCreate(
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve a specific opening request
     * ViewSet for handling account opening requests.
     * @param id A unique integer value identifying this Account Opening Request.
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsRetrieve(
        id: number,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/banking/account-openings/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve an account opening request
     * Stage 1: Approve an account opening request and create client account.
     * @param id A unique integer value identifying this Account Opening Request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsApproveCreate(
        id: number,
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Stage 2: Approve and dispatch login credentials to the client.
     * @param id A unique integer value identifying this Account Opening Request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsDispatchCredentialsCreate(
        id: number,
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/{id}/dispatch-credentials/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject an account opening request
     * Reject an account opening request.
     * @param id A unique integer value identifying this Account Opening Request.
     * @param requestBody
     * @returns AccountOpeningRequest
     * @throws ApiError
     */
    public static apiBankingAccountOpeningsRejectCreate(
        id: number,
        requestBody: AccountOpeningRequest,
    ): CancelablePromise<AccountOpeningRequest> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/banking/account-openings/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
