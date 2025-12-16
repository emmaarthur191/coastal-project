/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ReasonEnum } from './ReasonEnum';
import type { RefundStatusEnum } from './RefundStatusEnum';
export type Refund = {
    readonly id: number;
    readonly user: number;
    transaction?: number | null;
    amount: string;
    reason: ReasonEnum;
    description?: string;
    readonly status: RefundStatusEnum;
    readonly admin_notes: string;
    readonly processed_by: number | null;
    readonly processed_at: string | null;
    readonly created_at: string;
    readonly updated_at: string;
};

