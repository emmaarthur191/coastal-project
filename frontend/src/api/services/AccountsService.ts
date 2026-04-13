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
     * API viewset designed to list, create, retrieve, and update core bank accounts.
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
    public static accountsList(
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
     * API viewset designed to list, create, retrieve, and update core bank accounts.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static accountsCreate(
        requestBody?: Account,
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
     * API viewset designed to list, create, retrieve, and update core bank accounts.
     * @param id A unique integer value identifying this account.
     * @returns Account
     * @throws ApiError
     */
    public static accountsRetrieve(
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
     * API viewset designed to list, create, retrieve, and update core bank accounts.
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static accountsUpdate(
        id: number,
        requestBody?: Account,
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
     * API viewset designed to list, create, retrieve, and update core bank accounts.
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static accountsPartialUpdate(
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
    /**
     * Freeze an account to prevent further transactions.
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static accountsFreezeCreate(
        id: number,
        requestBody?: Account,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounts/{id}/freeze/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Unfreeze an account to restore access.
     * @param id A unique integer value identifying this account.
     * @param requestBody
     * @returns Account
     * @throws ApiError
     */
    public static accountsUnfreezeCreate(
        id: number,
        requestBody?: Account,
    ): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/accounts/{id}/unfreeze/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve the account balance summary for the logged-in user.
     *
     * Returns a detailed breakdown by account type and a combined total balance.
     * @returns any No response body
     * @throws ApiError
     */
    public static accountsBalanceRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/balance/',
        });
    }
    /**
     * GET /api/accounts/manager/overview/
     *
     * Returns manager dashboard overview metrics.
     * @returns any No response body
     * @throws ApiError
     */
    public static accountsManagerOverviewRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/manager/overview/',
        });
    }
    /**
     * Get summary statistics for all accounts.
     * @returns Account
     * @throws ApiError
     */
    public static accountsSummaryRetrieve(): CancelablePromise<Account> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/accounts/summary/',
        });
    }
}
