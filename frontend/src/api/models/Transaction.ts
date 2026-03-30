/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TransactionStatusEnum } from './TransactionStatusEnum';
import type { TransactionTypeEnum } from './TransactionTypeEnum';
export type Transaction = {
    readonly id: number;
    from_account?: number | null;
    to_account?: number | null;
    amount: string;
    transaction_type: TransactionTypeEnum;
    description?: string;
    status?: TransactionStatusEnum;
    readonly timestamp: string;
    readonly processed_at: string | null;
};

