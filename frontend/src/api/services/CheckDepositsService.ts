/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckDeposit } from '../models/CheckDeposit';
import type { PaginatedCheckDepositList } from '../models/PaginatedCheckDepositList';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CheckDepositsService {
    /**
     * ViewSet for managing check deposits.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedCheckDepositList
     * @throws ApiError
     */
    public static checkDepositsList(
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedCheckDepositList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/check-deposits/',
            query: {
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * ViewSet for managing check deposits.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static checkDepositsCreate(
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * ViewSet for managing check deposits.
     * @param id
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static checkDepositsRetrieve(
        id: string,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/check-deposits/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve a check deposit and credit the account.
     * @param id
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static checkDepositsApproveCreate(
        id: string,
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a check deposit.
     * @param id
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static checkDepositsRejectCreate(
        id: string,
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Process a check deposit from the cashier dashboard.
     * @param requestBody
     * @returns CheckDeposit
     * @throws ApiError
     */
    public static checkDepositsProcessCheckDepositCreate(
        requestBody: CheckDeposit,
    ): CancelablePromise<CheckDeposit> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/check-deposits/process-check-deposit/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
