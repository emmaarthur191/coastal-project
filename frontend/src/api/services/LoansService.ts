/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Loan } from '../models/Loan';
import type { PaginatedLoanList } from '../models/PaginatedLoanList';
import type { PatchedLoan } from '../models/PatchedLoan';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LoansService {
    /**
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending
     * * `approved` - Approved
     * * `active` - Active
     * * `paid_off` - Paid Off
     * * `defaulted` - Defaulted
     * * `rejected` - Rejected
     * @returns PaginatedLoanList
     * @throws ApiError
     */
    public static loansList(
        ordering?: string,
        page?: number,
        status?: 'active' | 'approved' | 'defaulted' | 'paid_off' | 'pending' | 'rejected',
    ): CancelablePromise<PaginatedLoanList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loans/',
            query: {
                'ordering': ordering,
                'page': page,
                'status': status,
            },
        });
    }
    /**
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static loansCreate(
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loans/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @returns Loan
     * @throws ApiError
     */
    public static loansRetrieve(
        id: number,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loans/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static loansUpdate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/loans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static loansPartialUpdate(
        id: number,
        requestBody?: PatchedLoan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/loans/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Approve a loan application and initiate disbursement.
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static loansApproveCreate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loans/{id}/approve/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reject a loan application.
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static loansRejectCreate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loans/{id}/reject/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Allow customers or staff to initiate a loan repayment.
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static loansRepayCreate(
        id: number,
        requestBody: Loan,
    ): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/loans/{id}/repay/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all pending loan applications filtered by role authority.
     * @returns Loan
     * @throws ApiError
     */
    public static loansPendingRetrieve(): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loans/pending/',
        });
    }
    /**
     * Search loans by member name, email or ID using HMAC hashes.
     * @returns Loan
     * @throws ApiError
     */
    public static loansSearchRetrieve(): CancelablePromise<Loan> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/loans/search/',
        });
    }
}
