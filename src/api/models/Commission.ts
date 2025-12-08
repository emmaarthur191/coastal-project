/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommissionTypeEnum } from './CommissionTypeEnum';
export type Commission = {
    readonly id: string;
    transaction?: string | null;
    readonly transaction_id: string;
    commission_type: CommissionTypeEnum;
    amount: string;
    percentage?: string | null;
    base_amount: string;
    earned_by: string;
    readonly earned_by_name: string;
    readonly created_at: string;
    description?: string;
};

