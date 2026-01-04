/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountOpeningRequestAccountTypeEnum } from './AccountOpeningRequestAccountTypeEnum';
import type { CardTypeEnum } from './CardTypeEnum';
import type { IdTypeEnum } from './IdTypeEnum';
import type { StatusE5aEnum } from './StatusE5aEnum';
/**
 * Serializer for account opening requests.
 */
export type AccountOpeningRequest = {
    readonly id: number;
    account_type?: AccountOpeningRequestAccountTypeEnum;
    card_type?: CardTypeEnum;
    id_type?: IdTypeEnum;
    id_number?: string;
    first_name: string;
    last_name: string;
    date_of_birth: string;
    nationality?: string;
    address?: string;
    phone_number: string;
    email?: string | null;
    /**
     * Base64 encoded photo or file path
     */
    photo?: string | null;
    readonly status: StatusE5aEnum;
    readonly processed_by: number | null;
    readonly submitted_by: number | null;
    readonly created_account: number | null;
    readonly rejection_reason: string;
    readonly notes: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly approved_at: string | null;
};

