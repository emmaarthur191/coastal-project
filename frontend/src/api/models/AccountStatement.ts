/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountStatementStatusEnum } from './AccountStatementStatusEnum';
/**
 * Serializer for auto-generated account statements.
 */
export type AccountStatement = {
    readonly id: number;
    account: number;
    readonly account_number: string;
    readonly account_type_display: string;
    requested_by: number;
    readonly requested_by_name: string;
    start_date: string;
    end_date: string;
    status?: AccountStatementStatusEnum;
    readonly status_display: string;
    pdf_file?: string | null;
    readonly download_url: string;
    readonly transaction_count: number;
    readonly opening_balance: string;
    readonly closing_balance: string;
    readonly created_at: string;
    readonly generated_at: string | null;
};
