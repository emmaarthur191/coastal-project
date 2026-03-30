/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountAccountTypeEnum } from './AccountAccountTypeEnum';
export type Account = {
    readonly id: number;
    readonly user: number;
    account_number: string;
    account_type?: AccountAccountTypeEnum;
    readonly account_type_display: string;
    balance?: string;
    readonly calculated_balance: string;
    is_active?: boolean;
    readonly created_at: string;
    readonly updated_at: string;
};

