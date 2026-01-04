/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Account } from '../models/Account';
import type { PaginatedAccountList } from '../models/PaginatedAccountList';
import type { PatchedAccount } from '../models/PatchedAccount';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AccountsService {
    /**
     * List all bank accounts
     * @param accountType * `daily_susu` - Daily Savings
     * * `member_savings` - Member Savings
     * * `youth_savings` - Youth Savings
     * * `shares` - Shares
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAccountList
     * @throws ApiError
     */
    public static apiAccountsList(
        accountType?: 'daily_susu' | 'member_savings' | 'shares' | 'youth_savings',
        isActive?: boolean,
        ordering?: string,
        page?: number,
    ): CancelablePromise<PaginatedAccountList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/',
            query: {
                'account_type': accountType,
                'is_active': isActive,
                'ordering': ordering,
                'page': page,
            },
        });
    }
    /**
     * Create a new bank account
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsCreate(
        requestBody: Account,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve account details
     * @param id A unique integer value identifying this account.
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsRetrieve(
        id: number,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Update account information
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsUpdate(
        id: number,
        requestBody: Account,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Partially update account information
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static apiAccountsPartialUpdate(
        id: number,
        requestBody?: PatchedAccount,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/accounts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
