/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProductTypeEnum } from './ProductTypeEnum';
export type Product = {
    readonly id: string;
    readonly category_name: string;
    readonly active_promotions: string;
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
    readonly created_at: string;
    readonly updated_at: string;
    category: string;
    created_by?: string | null;
};

