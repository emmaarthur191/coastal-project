/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { DiscountTypeEnum } from './DiscountTypeEnum';
import type { EligibilityTypeEnum } from './EligibilityTypeEnum';
export type Promotion = {
    readonly id: string;
    readonly product_name: string;
    readonly discount_display: string;
    readonly is_eligible: string;
    name: string;
    description: string;
    discount_type: DiscountTypeEnum;
    discount_value: string;
    max_discount?: string | null;
    eligibility_type?: EligibilityTypeEnum;
    eligibility_criteria?: any;
    start_date: string;
    end_date: string;
    is_active?: boolean;
    max_uses?: number | null;
    readonly uses_count: number;
    per_customer_limit?: number;
    readonly created_at: string;
    readonly updated_at: string;
    product: string;
    created_by?: string | null;
};

