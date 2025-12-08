/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckDepositStatusEnum } from './CheckDepositStatusEnum';
/**
 * Serializer for CheckDeposit model.
 */
export type CheckDeposit = {
    readonly id: string;
    transaction: string;
    readonly transaction_amount: number | null;
    status?: CheckDepositStatusEnum;
    processed_at?: string | null;
    processed_by?: string | null;
    readonly processed_by_name: string | null;
    extracted_amount?: string | null;
    extracted_account_number?: string;
    extracted_routing_number?: string;
    extracted_payee?: string;
    extracted_date?: string | null;
    confidence_score?: string | null;
    validation_errors?: any;
    fraud_flags?: any;
    readonly created_at: string;
};

