/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LoanStatusEnum } from './LoanStatusEnum';
export type Loan = {
    readonly id: number;
    readonly user: number;
    amount: string;
    interest_rate: string;
    term_months: number;
    readonly outstanding_balance: string;
    status?: LoanStatusEnum;
    readonly approved_at: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

