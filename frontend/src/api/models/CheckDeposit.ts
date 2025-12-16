/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CheckDepositStatusEnum } from './CheckDepositStatusEnum';
/**
 * Serializer for check deposits.
 */
export type CheckDeposit = {
    readonly id: number;
    account: number;
    readonly account_number: string;
    amount: string;
    check_number: string;
    bank_name: string;
    routing_number?: string;
    front_image?: string | null;
    back_image?: string | null;
    status?: CheckDepositStatusEnum;
    rejection_reason?: string;
    readonly processed_by: number | null;
    readonly processed_by_name: string;
    readonly created_at: string;
    readonly processed_at: string | null;
    readonly cleared_at: string | null;
};

