/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BankingMessage } from './BankingMessage';
export type PaginatedBankingMessageList = {
    count: number;
    next?: string | null;
    previous?: string | null;
    results: Array<BankingMessage>;
};

