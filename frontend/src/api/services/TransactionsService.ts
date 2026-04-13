/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PaginatedTransactionList } from '../models/PaginatedTransactionList';
import type { Transaction } from '../models/Transaction';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TransactionsService {
    /**
     * Mixin to provide idempotency for ViewSet actions.
     * Expects 'X-Idempotency-Key' header in the request.
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending_approval` - Pending Approval
     * * `completed` - Completed
     * * `failed` - Failed
     * * `cancelled` - Cancelled
     * @param transactionType * `deposit` - Deposit
     * * `withdrawal` - Withdrawal
     * * `transfer` - Transfer
     * * `payment` - Payment
     * * `repayment` - Loan Repayment
     * * `fee` - Fee
     * @returns PaginatedTransactionList
     * @throws ApiError
     */
    public static transactionsList(
        ordering?: string,
        page?: number,
        status?: 'cancelled' | 'completed' | 'failed' | 'pending_approval',
        transactionType?: 'deposit' | 'fee' | 'payment' | 'repayment' | 'transfer' | 'withdrawal',
    ): CancelablePromise<PaginatedTransactionList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/',
            query: {
                'ordering': ordering,
                'page': page,
                'status': status,
                'transaction_type': transactionType,
            },
        });
    }
    /**
     * Mixin to provide idempotency for ViewSet actions.
     * Expects 'X-Idempotency-Key' header in the request.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static transactionsCreate(
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Mixin to provide idempotency for ViewSet actions.
     * Expects 'X-Idempotency-Key' header in the request.
     * @param id A unique integer value identifying this transaction.
     * @returns Transaction
     * @throws ApiError
     */
    public static transactionsRetrieve(
        id: number,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * Approve a transaction (Maker-Checker Phase 2).
     * @param id A unique integer value identifying this transaction.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static transactionsApproveCreate(
        id: number,
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a transaction (Maker-Checker Phase 2).
     * @param id A unique integer value identifying this transaction.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static transactionsRejectCreate(
        id: number,
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reverse a completed transaction.
     * @param id A unique integer value identifying this transaction.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static transactionsReverseCreate(
        id: number,
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/{id}/reverse/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Process a deposit or withdrawal from cashier dashboard.
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static transactionsProcessCreate(
        requestBody: Transaction,
    ): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/transactions/process/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Search transactions with filters for cashier dashboard.
     * @returns Transaction
     * @throws ApiError
     */
    public static transactionsSearchRetrieve(): CancelablePromise<Transaction> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/transactions/search/',
        });
    }
}
