/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountTypeEnum } from './AccountTypeEnum';
export type PatchedAccount = {
    readonly id?: number;
    readonly user?: number;
    account_number?: string;
    account_type?: AccountTypeEnum;
    balance?: string;
    is_active?: boolean;
    readonly created_at?: string;
    readonly updated_at?: string;
};

