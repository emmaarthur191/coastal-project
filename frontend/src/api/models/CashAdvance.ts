/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CashAdvanceStatusEnum } from './CashAdvanceStatusEnum';
/**
 * Serializer for cash advance requests.
 */
export type CashAdvance = {
    readonly id: number;
    readonly user: number;
    readonly user_name: string;
    amount: string;
    reason: string;
    status?: CashAdvanceStatusEnum;
    readonly approved_by: number | null;
    readonly approved_by_name: string;
    repayment_date?: string | null;
    readonly repaid_at: string | null;
    notes?: string;
    readonly created_at: string;
    readonly updated_at: string;
};

