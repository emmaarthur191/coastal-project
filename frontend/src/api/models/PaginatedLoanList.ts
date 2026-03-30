/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Loan } from './Loan';
export type PaginatedLoanList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<Loan>;
};
