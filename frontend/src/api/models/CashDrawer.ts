/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CashDrawerDenomination } from './CashDrawerDenomination';
import type { CashDrawerStatusEnum } from './CashDrawerStatusEnum';
/**
 * Serializer for cash drawer management.
 */
export type CashDrawer = {
    readonly id: number;
    readonly cashier: number;
    readonly cashier_name: string;
    drawer_number: string;
    opening_balance: string;
    current_balance: string;
    closing_balance?: string | null;
    expected_balance?: string | null;
    readonly variance: string;
    status?: CashDrawerStatusEnum;
    readonly opened_at: string;
    readonly closed_at: string | null;
    notes?: string;
    readonly denominations: Array<CashDrawerDenomination>;
    opening_denominations?: Array<Record<string, any>>;
    closing_denominations?: Array<Record<string, any>>;
};

