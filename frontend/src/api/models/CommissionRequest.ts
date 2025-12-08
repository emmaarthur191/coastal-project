/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CommissionTypeEnum } from './CommissionTypeEnum';
export type CommissionRequest = {
    transaction?: string | null;
    commission_type: CommissionTypeEnum;
    amount: string;
    percentage?: string | null;
    base_amount: string;
    earned_by: string;
    description?: string;
};

