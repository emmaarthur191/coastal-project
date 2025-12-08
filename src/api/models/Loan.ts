/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoanStatusEnum } from './LoanStatusEnum';
/**
 * Serializer for Loan model.
 */
export type Loan = {
    readonly id: string;
    account: string;
    readonly account_number: string;
    readonly borrower_name: string;
    principal_amount: string;
    interest_rate: string;
    term_months: number;
    outstanding_balance: string;
    status?: LoanStatusEnum;
    disbursement_date: string;
    maturity_date: string;
    total_paid?: string;
    readonly application_date: string;
    readonly purpose: string;
};

