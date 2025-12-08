/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductTypeEnum } from './ProductTypeEnum';
export type ProductRequest = {
    name: string;
    description: string;
    product_type: ProductTypeEnum;
    base_price?: string;
    monthly_fee?: string;
    annual_fee?: string;
    interest_rate?: string | null;
    min_age?: number;
    min_balance?: string;
    membership_required?: boolean;
    is_active?: boolean;
    is_featured?: boolean;
    available_online?: boolean;
    available_in_branch?: boolean;
    category: string;
    created_by?: string | null;
};

