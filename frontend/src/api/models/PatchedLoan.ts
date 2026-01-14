/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoanStatusEnum } from './LoanStatusEnum';
export type PatchedLoan = {
    readonly id?: number;
    readonly user?: number;
    readonly borrower_name?: string;
    readonly borrower_email?: string;
    amount?: string;
    interest_rate?: string;
    term_months?: number;
    /**
     * Purpose of the loan
     */
    purpose?: string | null;
    readonly outstanding_balance?: string;
    status?: LoanStatusEnum;
    readonly approved_at?: string | null;
    readonly created_at?: string;
    readonly updated_at?: string;
};
