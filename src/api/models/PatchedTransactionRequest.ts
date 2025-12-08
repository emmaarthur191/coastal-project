/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { Category996Enum } from './Category996Enum';
import type { StatusC7fEnum } from './StatusC7fEnum';
import type { TypeEnum } from './TypeEnum';
export type PatchedTransactionRequest = {
    account?: string;
    type?: TypeEnum;
    amount?: string;
    cashier?: string | null;
    related_account?: string | null;
    description?: string;
    category?: Category996Enum;
    tags?: any;
    status?: StatusC7fEnum;
};

