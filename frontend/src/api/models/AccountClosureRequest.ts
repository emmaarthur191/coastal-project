/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClosureReasonEnum } from './ClosureReasonEnum';
import type { Status669Enum } from './Status669Enum';
/**
 * Serializer for account closure requests.
 */
export type AccountClosureRequest = {
    readonly id: number;
    readonly account: number;
    account_id: number;
    readonly account_number: string;
    readonly customer_name: string;
    closure_reason: ClosureReasonEnum;
    other_reason?: string;
    readonly phone_number: string;
    otp_verified?: boolean;
    readonly status: Status669Enum;
    readonly processed_by: number | null;
    readonly submitted_by: number | null;
    readonly rejection_reason: string;
    readonly notes: string;
    readonly final_balance: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly closed_at: string | null;
};

