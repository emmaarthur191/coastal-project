/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Account } from '../models/Account';
import type { BankingMessage } from '../models/BankingMessage';
import type { FraudAlert } from '../models/FraudAlert';
import type { Loan } from '../models/Loan';
import type { PaginatedAccountList } from '../models/PaginatedAccountList';
import type { PaginatedBankingMessageList } from '../models/PaginatedBankingMessageList';
import type { PaginatedFraudAlertList } from '../models/PaginatedFraudAlertList';
import type { PaginatedLoanList } from '../models/PaginatedLoanList';
import type { PaginatedTransactionList } from '../models/PaginatedTransactionList';
import type { PaginatedUserList } from '../models/PaginatedUserList';
import type { PatchedAccount } from '../models/PatchedAccount';
import type { PatchedBankingMessage } from '../models/PatchedBankingMessage';
import type { PatchedFraudAlert } from '../models/PatchedFraudAlert';
import type { PatchedLoan } from '../models/PatchedLoan';
import type { PatchedUser } from '../models/PatchedUser';
import type { Transaction } from '../models/Transaction';
import type { User } from '../models/User';
import type { UserRegistration } from '../models/UserRegistration';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class ApiService {
    /**
     * @param accountType * `savings` - Savings
     * * `checking` - Checking
     * * `business` - Business
     * @param isActive
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedAccountList
     * @throws ApiError
     */
    public static apiAccountsList(
        accountType?: 'business' | 'checking' | 'savings',
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
    /**
     * @param isResolved
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param severity * `low` - Low
     * * `medium` - Medium
     * * `high` - High
     * * `critical` - Critical
     * @returns PaginatedFraudAlertList
     * @throws ApiError
     */
    public static apiFraudAlertsList(
        isResolved?: boolean,
        ordering?: string,
        page?: number,
        severity?: 'critical' | 'high' | 'low' | 'medium',
    ): CancelablePromise<PaginatedFraudAlertList> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud-alerts/',
            query: {
                'is_resolved': isResolved,
                'ordering': ordering,
                'page': page,
                'severity': severity,
            },
        });
    }
    /**
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsCreate(
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/fraud-alerts/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsRetrieve(
        id: number,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/fraud-alerts/{id}/',
            path: {
                'id': id,
            },
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsUpdate(
        id: number,
        requestBody: FraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/fraud-alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param id A unique integer value identifying this fraud alert.
     * @param requestBody
     * @returns FraudAlert
     * @throws ApiError
     */
    public static apiFraudAlertsPartialUpdate(
        id: number,
        requestBody?: PatchedFraudAlert,
    ): CancelablePromise<FraudAlert> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/fraud-alerts/{id}/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
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
    public static apiLoansList(
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
    public static apiLoansCreate(
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
    public static apiLoansRetrieve(
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
    public static apiLoansUpdate(
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
    public static apiLoansPartialUpdate(
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
     * @param id A unique integer value identifying this loan.
     * @param requestBody
     * @returns Loan
     * @throws ApiError
     */
    public static apiLoansApproveCreate(
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
     * @param isRead
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @returns PaginatedBankingMessageList
     * @throws ApiError
     */
    public static apiMessagesList(
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
    public static apiMessagesCreate(
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
    public static apiMessagesRetrieve(
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
    public static apiMessagesUpdate(
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
    public static apiMessagesPartialUpdate(
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
    public static apiMessagesMarkReadCreate(
        id: number,
        requestBody: BankingMessage,
    ): CancelablePromise<BankingMessage> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/messages/{id}/mark_read/',
            path: {
                'id': id,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static apiPerformanceSystemHealthRetrieve(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/performance/system-health/',
        });
    }
    /**
     * @param ordering Which field to use when ordering the results.
     * @param page A page number within the paginated result set.
     * @param status * `pending` - Pending
     * * `completed` - Completed
     * * `failed` - Failed
     * * `cancelled` - Cancelled
     * @param transactionType * `deposit` - Deposit
     * * `withdrawal` - Withdrawal
     * * `transfer` - Transfer
     * * `payment` - Payment
     * * `fee` - Fee
     * @returns PaginatedTransactionList
     * @throws ApiError
     */
    public static apiTransactionsList(
        ordering?: string,
        page?: number,
        status?: 'cancelled' | 'completed' | 'failed' | 'pending',
        transactionType?: 'deposit' | 'fee' | 'payment' | 'transfer' | 'withdrawal',
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
     * @param requestBody
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsCreate(
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
     * @param id A unique integer value identifying this transaction.
     * @returns Transaction
     * @throws ApiError
     */
    public static apiTransactionsRetrieve(
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
     * @param page A page number within the paginated result set.
     * @returns PaginatedUserList
     * @throws ApiError
     */
    public static apiUsersListList(
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
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersLoginCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/login/',
        });
    }
    /**
     * @returns any No response body
     * @throws ApiError
     */
    public static apiUsersLogoutCreate(): CancelablePromise<any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/logout/',
        });
    }
    /**
     * @returns User
     * @throws ApiError
     */
    public static apiUsersMeRetrieve(): CancelablePromise<User> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/users/me/',
        });
    }
    /**
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static apiUsersMeUpdate(
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
     * @param requestBody
     * @returns User
     * @throws ApiError
     */
    public static apiUsersMePartialUpdate(
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
     * @param requestBody
     * @returns UserRegistration
     * @throws ApiError
     */
    public static apiUsersRegisterCreate(
        requestBody: UserRegistration,
    ): CancelablePromise<UserRegistration> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/users/register/',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
