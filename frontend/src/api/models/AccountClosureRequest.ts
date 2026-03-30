/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ClosureReasonEnum } from './ClosureReasonEnum';
import type { StatusE5aEnum } from './StatusE5aEnum';
/**
 * Serializer for account closure requests.
 */
export type AccountClosureRequest = {
    readonly id: number;
    readonly account: number;
    account_id: number;
    closure_reason: ClosureReasonEnum;
    other_reason?: string;
    phone_number: string;
    otp_verified?: boolean;
    readonly status: StatusE5aEnum;
    readonly processed_by: number | null;
    readonly submitted_by: number | null;
    readonly rejection_reason: string;
    readonly notes: string;
    readonly final_balance: string;
    readonly created_at: string;
    readonly updated_at: string;
    readonly closed_at: string | null;
};

