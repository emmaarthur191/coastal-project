/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AccountOpeningRequestAccountTypeEnum } from './AccountOpeningRequestAccountTypeEnum';
import type { CardTypeEnum } from './CardTypeEnum';
import type { Status669Enum } from './Status669Enum';
/**
 * Serializer for account opening requests.
 */
export type AccountOpeningRequest = {
    readonly id: number;
    account_type?: AccountOpeningRequestAccountTypeEnum;
    card_type?: CardTypeEnum;
    id_type: string;
    id_number: string;
    first_name: string;
    last_name: string;
    readonly date_of_birth: string;
    readonly address: string;
    phone_number: string;
    email: string;
    readonly occupation: string;
    readonly work_address: string;
    readonly position: string;
    readonly digital_address: string;
    readonly location: string;
    readonly next_of_kin_data: string;
    readonly photo: string;
    readonly status: Status669Enum;
    readonly full_name: string;
    readonly processed_by: number | null;
    readonly submitted_by: number | null;
    readonly created_account: number | null;
    /**
     * Manager who approved the dispatch of login credentials
     */
    readonly credentials_approved_by: number | null;
    readonly credentials_sent_at: string | null;
    readonly rejection_reason: string;
    readonly notes: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly approved_at: string | null;
};

