/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CashAdvanceStatusEnum } from './CashAdvanceStatusEnum';
import type { SeverityEnum } from './SeverityEnum';
/**
 * Serializer for CashAdvance model.
 */
export type PatchedCashAdvanceRequest = {
    account?: string;
    amount?: string;
    purpose?: string;
    priority?: SeverityEnum;
    status?: CashAdvanceStatusEnum;
    requested_by?: string;
    requested_at?: string;
    request_notes?: string;
    approved_by?: string | null;
    approved_at?: string | null;
    approval_notes?: string;
    disbursed_by?: string | null;
    disbursed_at?: string | null;
    disbursement_transaction?: string | null;
    repayment_due_date?: string | null;
    interest_rate?: string;
    outstanding_balance?: string;
    daily_limit?: string | null;
    monthly_limit?: string | null;
};

