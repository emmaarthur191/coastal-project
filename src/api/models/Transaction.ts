/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Category996Enum } from './Category996Enum';
import type { StatusC7fEnum } from './StatusC7fEnum';
import type { TypeEnum } from './TypeEnum';
export type Transaction = {
    readonly id: string;
    account: string;
    readonly account_number: string;
    type: TypeEnum;
    amount: string;
    readonly timestamp: string;
    cashier?: string | null;
    readonly cashier_email: string;
    related_account?: string | null;
    readonly related_account_number: string;
    description?: string;
    category?: Category996Enum;
    tags?: any;
    status?: StatusC7fEnum;
    readonly reference_number: string;
};

